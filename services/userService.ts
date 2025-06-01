import { User, CreateUserRequest, UserSession } from "@/types/user";
import {
  createUser,
  findUserByEmail,
  findUserByUuid,
  findUserByClerkId,
  findUserByInviteCode,
  updateUser,
  updateUserCredits,
  incrementUserAIUsage
} from "@/models/user";
import {
  createUserSession,
  findUserSession,
  updateSessionActivity,
  incrementSessionTrialUsage,
  bindSessionToUser,
  getUserSessions
} from "@/models/session";
import { addUserCredits } from "@/models/credits";
import { completeInvitation, markInvitationRewardGiven } from "@/models/invitation";

// 用户注册服务
export async function registerUser(userData: CreateUserRequest): Promise<{
  user: User;
  invitationReward?: number;
}> {
  try {
    // 1. 创建用户
    const user = await createUser(userData);
    
    let invitationReward = 0;
    
    // 2. 处理邀请奖励
    if (userData.invited_by_code) {
      const invitationResult = await completeInvitation(userData.invited_by_code, user.uuid);
      
      if (invitationResult.success && invitationResult.invitation) {
        const invitation = invitationResult.invitation;
        
        // 给被邀请人发放奖励
        const inviteeRewardResult = await addUserCredits(
          user.uuid,
          invitation.invitee_reward,
          'invite',
          '邀请奖励',
          `通过邀请码 ${userData.invited_by_code} 获得奖励`,
          'invitation',
          invitation.uuid
        );
        
        if (inviteeRewardResult.success) {
          invitationReward = invitation.invitee_reward;
        }
        
        // 给邀请人发放奖励
        await addUserCredits(
          invitation.inviter_id,
          invitation.inviter_reward,
          'invite',
          '邀请奖励',
          `成功邀请用户获得奖励`,
          'invitation',
          invitation.uuid
        );
        
        // 标记奖励已发放
        await markInvitationRewardGiven(userData.invited_by_code);
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
    let user: User | undefined;
    
    switch (type) {
      case 'email':
        user = await findUserByEmail(identifier);
        break;
      case 'clerk_id':
        user = await findUserByClerkId(identifier);
        break;
      default:
        user = await findUserByUuid(identifier);
        break;
    }
    
    return user || null;
    
  } catch (error) {
    console.error('Get user info failed:', error);
    return null;
  }
}

// 更新用户信息
export async function updateUserInfo(uuid: string, updates: Partial<User>): Promise<User | null> {
  try {
    const user = await updateUser(uuid, updates);
    return user || null;
    
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
    const updatedUser = await updateUser(uuid, settings);
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
    const user = await findUserByUuid(uuid);
    if (!user) {
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
    const currentUsage = user.last_ai_usage_date === today ? user.daily_ai_usage : 0;
    
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
    return await incrementUserAIUsage(uuid);
    
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
    let session = await findUserSession(sessionId);
    
    if (!session) {
      // 创建新会话
      session = await createUserSession({
        session_id: sessionId,
        ...userData
      });
    } else {
      // 更新活动时间
      await updateSessionActivity(sessionId);
    }
    
    return session;
    
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
    const session = await findUserSession(sessionId);
    const trialLimit = 3; // 未登录用户试用3次
    
    if (!session) {
      return {
        canUse: true,
        currentUsage: 0,
        trialLimit,
      };
    }
    
    const currentUsage = session.trial_usage_count;
    
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
    return await incrementSessionTrialUsage(sessionId);
    
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
    
    return await bindSessionToUser(sessionId, user.uuid);
    
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
    
    return await getUserSessions(user.uuid);
    
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
    const user = await findUserByClerkId(clerkId);
    if (!user) {
      return false;
    }
    
    // 临时管理员邮箱列表（后续可以改为从配置文件或数据库读取）
    const adminEmails = [
      'admin@aicollager.com',
      'linglin@example.com' // 可以根据实际需要添加
    ];
    
    // 基于邮箱检查权限
    if (permission === 'admin') {
      return adminEmails.includes(user.email.toLowerCase());
    } else if (permission === 'moderator') {
      return adminEmails.includes(user.email.toLowerCase()); // 暂时admin和moderator权限相同
    } else {
      return true; // 所有用户都有基本权限
    }
    
  } catch (error) {
    console.error('Check user permission failed:', error);
    return false;
  }
} 