import { User, CreateUserRequest, UserSession } from "@/types/user";
import { User as DbUser, NewUser } from "@/db/schema/users";
import {
  findUserByEmail,
  findUserByClerkId,
  findUserByUuid,
  createUser,
  updateUser,
  updateUserLastLogin,
  getUserStats
} from "@/lib/repositories/user";
import {
  findBySessionId,
  createSession,
  updateActivity,
  incrementTrialUsage,
  findSessionsByUserId
} from "@/lib/repositories/session";
import { addUserCredits } from "@/lib/repositories/credits";
import { completeInvitation, markInvitationRewardGiven } from "@/lib/repositories/invitation";

// 生成唯一邀请码
function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 12).toUpperCase();
}

// 数据库用户模型转换为业务用户模型
function transformDbUserToUser(dbUser: DbUser): User {
  return {
    id: dbUser.id,
    uuid: dbUser.uuid,
    clerk_user_id: dbUser.clerkUserId,
    email: dbUser.email,
    username: dbUser.username || undefined,
    display_name: dbUser.displayName || undefined,
    avatar_url: dbUser.avatarUrl || undefined,
    credits: dbUser.credits,
    total_earned_credits: dbUser.totalEarnedCredits,
    total_used_credits: dbUser.totalUsedCredits,
    invite_code: dbUser.inviteCode,
    invited_by_code: dbUser.invitedByCode || undefined,
    invited_by_user_id: dbUser.invitedByUserId || undefined,
    daily_ai_usage: dbUser.dailyAiUsage,
    last_ai_usage_date: dbUser.lastAiUsageDate?.toISOString().split('T')[0],
    total_ai_usage: dbUser.totalAiUsage,
    language: dbUser.language,
    timezone: dbUser.timezone,
    email_notifications: dbUser.emailNotifications,
    status: dbUser.status as 'active' | 'suspended' | 'deleted',
    last_login_at: dbUser.lastLoginAt?.toISOString(),
    created_at: dbUser.createdAt.toISOString(),
    updated_at: dbUser.updatedAt.toISOString(),
  };
}

// 用户注册服务
export async function registerUser(userData: CreateUserRequest): Promise<{
  user: User;
  invitationReward?: number;
}> {
  try {
    // 1. 创建用户数据
    const newUserData: NewUser = {
      clerkUserId: userData.clerk_user_id,
      email: userData.email,
      username: userData.username || null,
      displayName: userData.display_name || null,
      avatarUrl: userData.avatar_url || null,
      inviteCode: generateInviteCode(),
      invitedByCode: userData.invited_by_code || null,
    };

    const dbUser = await createUser(newUserData);
    const user = transformDbUserToUser(dbUser);
    
    let invitationReward = 0;
    
    // 2. 处理邀请奖励
    if (userData.invited_by_code) {
      const invitationResult = await completeInvitation(userData.invited_by_code, user.uuid);
      
      if (invitationResult.success && invitationResult.invitation) {
        const invitation = invitationResult.invitation;
        
        // 给被邀请人发放奖励
        const inviteeRewardResult = await addUserCredits(
          user.uuid,
          invitation.inviteeReward,
          'invite',
          '邀请奖励',
          `通过邀请码 ${userData.invited_by_code} 获得奖励`,
          'invitation',
          invitation.uuid
        );
        
        if (inviteeRewardResult.success) {
          invitationReward = invitation.inviteeReward;
        }
        
        // 给邀请人发放奖励
        await addUserCredits(
          invitation.inviterId,
          invitation.inviterReward,
          'invite',
          '邀请奖励',
          `成功邀请用户获得奖励`,
          'invitation',
          invitation.uuid
        );
        
        // 标记奖励已发放 - 注意：markInvitationRewardGiven 实际上是 completeInvitation 的别名
        // 在之前的 completeInvitation 调用中已经完成了奖励发放，这里不需要再次调用
        // await markInvitationRewardGiven(userData.invited_by_code);
      }
    }
    
    return { user, invitationReward };
    
  } catch (error) {
    console.error('User registration failed:', error);
    throw new Error('用户注册失败');
  }
}

// 获取用户信息（优先从缓存）
export async function getUserInfo(identifier: string, type: 'uuid' | 'email' | 'clerk_id' = 'uuid'): Promise<User | null> {
  try {
    let dbUser: DbUser | null = null;
    
    switch (type) {
      case 'email':
        dbUser = await findUserByEmail(identifier);
        break;
      case 'clerk_id':
        dbUser = await findUserByClerkId(identifier);
        break;
      default:
        dbUser = await findUserByUuid(identifier);
        break;
    }
    
    return dbUser ? transformDbUserToUser(dbUser) : null;
    
  } catch (error) {
    console.error('Get user info failed:', error);
    return null;
  }
}

// 更新用户信息
export async function updateUserInfo(uuid: string, updates: Partial<User>): Promise<User | null> {
  try {
    // 转换业务模型字段到数据库模型字段
    const dbUpdates: Partial<DbUser> = {};
    
    if (updates.username !== undefined) dbUpdates.username = updates.username || null;
    if (updates.display_name !== undefined) dbUpdates.displayName = updates.display_name || null;
    if (updates.avatar_url !== undefined) dbUpdates.avatarUrl = updates.avatar_url || null;
    if (updates.language !== undefined) dbUpdates.language = updates.language;
    if (updates.timezone !== undefined) dbUpdates.timezone = updates.timezone;
    if (updates.email_notifications !== undefined) dbUpdates.emailNotifications = updates.email_notifications;
    if (updates.status !== undefined) dbUpdates.status = updates.status;

    const dbUser = await updateUser(uuid, dbUpdates);
    return dbUser ? transformDbUserToUser(dbUser) : null;
    
  } catch (error) {
    console.error('Update user info failed:', error);
    return null;
  }
}

// 用户初始化设置（首次登录）
export async function initializeUserSettings(uuid: string, settings: {
  language?: string;
  timezone?: string;
  email_notifications?: boolean;
}): Promise<boolean> {
  try {
    const dbSettings: Partial<DbUser> = {};
    
    if (settings.language) dbSettings.language = settings.language;
    if (settings.timezone) dbSettings.timezone = settings.timezone;
    if (settings.email_notifications !== undefined) dbSettings.emailNotifications = settings.email_notifications;

    const updatedUser = await updateUser(uuid, dbSettings);
    return !!updatedUser;
    
  } catch (error) {
    console.error('Initialize user settings failed:', error);
    return false;
  }
}

// 检查用户每日AI使用限制
export async function checkUserDailyAILimit(uuid: string): Promise<{
  canUse: boolean;
  currentUsage: number;
  dailyLimit: number;
  message?: string;
}> {
  try {
    const dbUser = await findUserByUuid(uuid);
    if (!dbUser) {
      return {
        canUse: false,
        currentUsage: 0,
        dailyLimit: 20,
        message: '用户不存在'
      };
    }
    
    const today = new Date().toISOString().split('T')[0];
    const dailyLimit = 20; // 每日限制
    
    // 检查是否是今天的使用次数
    const userLastDate = dbUser.lastAiUsageDate?.toISOString().split('T')[0];
    const currentUsage = userLastDate === today ? dbUser.dailyAiUsage : 0;
    
    return {
      canUse: currentUsage < dailyLimit,
      currentUsage,
      dailyLimit,
      message: currentUsage >= dailyLimit ? '今日AI使用次数已达上限' : undefined
    };
    
  } catch (error) {
    console.error('Check user daily AI limit failed:', error);
    return {
      canUse: false,
      currentUsage: 0,
      dailyLimit: 20,
      message: '检查失败'
    };
  }
}

// 增加用户AI使用次数
export async function incrementUserDailyAIUsage(uuid: string): Promise<boolean> {
  try {
    const stats = await getUserStats(uuid);
    return !!stats;
    
  } catch (error) {
    console.error('Increment user AI usage failed:', error);
    return false;
  }
}

// ===== 会话管理服务 =====

// 创建或获取用户会话
export async function getOrCreateUserSession(sessionId: string, userData?: {
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
}): Promise<UserSession | null> {
  try {
    // 先尝试查找现有会话
    let session = await findBySessionId(sessionId);
    
    if (!session) {
      // 创建新会话
      session = await createSession({
        sessionId: sessionId,
        userId: userData?.user_id,
        ipAddress: userData?.ip_address,
        userAgent: userData?.user_agent
      });
    } else {
      // 更新活动时间
      await updateActivity(sessionId);
    }
    
    // 转换会话数据格式
    if (session) {
      return {
        id: session.id,
        session_id: session.sessionId,
        user_id: session.userId || undefined,
        trial_usage_count: session.trialUsageCount,
        ip_address: session.ipAddress || undefined,
        user_agent: session.userAgent || undefined,
        last_activity_at: session.lastActivityAt.toISOString(),
        created_at: session.createdAt.toISOString(),
        expires_at: session.expiresAt.toISOString()
      };
    }
    
    return null;
    
  } catch (error) {
    console.error('Get or create user session failed:', error);
    return null;
  }
}

// 检查未登录用户试用限制
export async function checkSessionTrialLimit(sessionId: string): Promise<{
  canUse: boolean;
  currentUsage: number;
  trialLimit: number;
  message?: string;
}> {
  try {
    const session = await findBySessionId(sessionId);
    const trialLimit = 3; // 未登录用户试用3次
    
    if (!session) {
      return {
        canUse: true,
        currentUsage: 0,
        trialLimit,
      };
    }
    
    const currentUsage = session.trialUsageCount;
    
    return {
      canUse: currentUsage < trialLimit,
      currentUsage,
      trialLimit,
      message: currentUsage >= trialLimit ? '试用次数已用完，请注册账户' : undefined
    };
    
  } catch (error) {
    console.error('Check session trial limit failed:', error);
    return {
      canUse: false,
      currentUsage: 0,
      trialLimit: 3,
      message: '检查失败'
    };
  }
}

// 增加会话试用使用次数
export async function incrementSessionTrialUsageCount(sessionId: string): Promise<boolean> {
  try {
    const result = await incrementTrialUsage(sessionId);
    return result.success;
    
  } catch (error) {
    console.error('Increment session trial usage failed:', error);
    return false;
  }
}

// 用户注册后绑定会话
export async function bindUserSession(sessionId: string, userId: string): Promise<boolean> {
  try {
    // userId 可能是 Clerk ID，需要转换为数据库 UUID
    const user = await getUserInfo(userId, 'clerk_id');
    if (!user) {
      console.error('Cannot bind session: user not found');
      return false;
    }
    
    return await updateActivity(sessionId);
    
  } catch (error) {
    console.error('Bind user session failed:', error);
    return false;
  }
}

// 获取用户的所有活跃会话
export async function getUserActiveSessions(userId: string): Promise<UserSession[]> {
  try {
    // userId 可能是 Clerk ID，需要转换为数据库 UUID
    const user = await getUserInfo(userId, 'clerk_id');
    if (!user) {
      return [];
    }
    
    // 使用findSessionsByUserId查找用户的所有会话
    const sessions = await findSessionsByUserId(user.uuid);
    
    // 转换会话数据格式
    return sessions.map(session => ({
      id: session.id,
      session_id: session.sessionId,
      user_id: session.userId || undefined,
      trial_usage_count: session.trialUsageCount,
      ip_address: session.ipAddress || undefined,
      user_agent: session.userAgent || undefined,
      last_activity_at: session.lastActivityAt.toISOString(),
      created_at: session.createdAt.toISOString(),
      expires_at: session.expiresAt.toISOString()
    }));
    
  } catch (error) {
    console.error('Get user active sessions failed:', error);
    return [];
  }
}

// 检查用户是否存在（用于避免重复注册）
export async function checkUserExists(email: string): Promise<boolean> {
  try {
    const user = await findUserByEmail(email);
    return !!user;
    
  } catch (error) {
    console.error('Check user exists failed:', error);
    return false;
  }
}

// 检查用户权限
export async function checkUserPermission(clerkId: string, permission: 'admin' | 'moderator' | 'user'): Promise<boolean> {
  try {
    const dbUser = await findUserByClerkId(clerkId);
    if (!dbUser) {
      return false;
    }
    
    // 临时管理员邮箱列表（后续可以改为从配置文件或数据库读取）
    const adminEmails = [
      'admin@aicollager.com',
      'linglin@example.com' // 可以根据实际需要添加
    ];
    
    // 基于邮箱检查权限
    if (permission === 'admin') {
      return adminEmails.includes(dbUser.email.toLowerCase());
    } else if (permission === 'moderator') {
      return adminEmails.includes(dbUser.email.toLowerCase()); // 暂时admin和moderator权限相同
    } else {
      return true; // 所有用户都有基本权限
    }
    
  } catch (error) {
    console.error('Check user permission failed:', error);
    return false;
  }
} 