import { Invitation, CreateInvitationRequest } from "@/types/credits";
import { Invitation as InvitationModel } from "@/db/schema/credits";
import {
  createInvitation,
  findInvitationByCode,
  completeInvitation,
  markInvitationClicked,
  markInvitationRewardGiven,
  getUserInvitations,
  getUserInvitationStats,
  isInvitationValid,
  cleanupExpiredInvitations
} from "@/lib/repositories/invitation";
import { addUserCredits } from "@/lib/repositories/credits";

// 类型转换工具函数
function convertInvitationModelToInvitation(invitationModel: InvitationModel): Invitation {
  return {
    id: invitationModel.id,
    uuid: invitationModel.uuid,
    inviter_id: invitationModel.inviterId,
    invitee_id: invitationModel.inviteeId || '',
    invite_code: invitationModel.inviteCode,
    email: invitationModel.email || '',
    invitation_method: (invitationModel.invitationMethod as 'link' | 'email' | 'social') || 'link',
    inviter_reward: invitationModel.inviterReward,
    invitee_reward: invitationModel.inviteeReward,
    status: invitationModel.status as 'pending' | 'completed' | 'expired',
    clicked_at: invitationModel.clickedAt ? invitationModel.clickedAt.toISOString() : undefined,
    registered_at: invitationModel.registeredAt ? invitationModel.registeredAt.toISOString() : undefined,
    reward_given_at: invitationModel.rewardGivenAt ? invitationModel.rewardGivenAt.toISOString() : undefined,
    metadata: (invitationModel.metadata as Record<string, any>) || {},
    created_at: invitationModel.createdAt.toISOString(),
    updated_at: invitationModel.updatedAt.toISOString(),
    expires_at: invitationModel.expiresAt.toISOString()
  };
}

// 生成邀请链接
export async function generateInviteLink(params: {
  inviterId: string;
  email?: string;
  method?: 'link' | 'email' | 'social';
  customReward?: { inviterReward: number; inviteeReward: number };
}): Promise<{
  success: boolean;
  invitation?: Invitation;
  inviteUrl?: string;
  message?: string;
}> {
  try {
    const { inviterId, email, method = 'link', customReward } = params;
    
    // inviterId 可能是 Clerk ID，需要转换为数据库 UUID
    const { getUserInfo } = await import('@/lib/services/userService');
    const user = await getUserInfo(inviterId, 'clerk_id');
    
    if (!user) {
      return {
        success: false,
        message: '用户不存在'
      };
    }
    
    const invitationModel = await createInvitation({
      inviterId: user.uuid, // 使用数据库 UUID
      inviterReward: customReward?.inviterReward || 20,
      inviteeReward: customReward?.inviteeReward || 20
    });
    
    const invitation = convertInvitationModelToInvitation(invitationModel);
    
    // 生成邀请链接
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.aicollager.com';
    const inviteUrl = `${baseUrl}/invite/${invitation.invite_code}`;
    
    return {
      success: true,
      invitation,
      inviteUrl,
    };
    
  } catch (error) {
    console.error('Generate invite link failed:', error);
    return {
      success: false,
      message: '生成邀请链接失败'
    };
  }
}

// 验证邀请码
export async function validateInviteCode(inviteCode: string): Promise<{
  valid: boolean;
  invitation?: Invitation;
  message?: string;
}> {
  try {
    const isValid = await isInvitationValid(inviteCode);
    
    if (!isValid) {
      return {
        valid: false,
        message: '邀请码无效或已过期'
      };
    }
    
    const invitationModel = await findInvitationByCode(inviteCode);
    
    return {
      valid: true,
      invitation: invitationModel ? convertInvitationModelToInvitation(invitationModel) : undefined
    };
    
  } catch (error) {
    console.error('Validate invite code failed:', error);
    return {
      valid: false,
      message: '验证邀请码失败'
    };
  }
}

// 处理邀请点击
export async function handleInviteClick(inviteCode: string): Promise<{
  success: boolean;
  invitation?: Invitation;
  message?: string;
}> {
  try {
    // 验证邀请码
    const validation = await validateInviteCode(inviteCode);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.message
      };
    }
    
    // 标记为已点击
    await markInvitationClicked(inviteCode);
    
    return {
      success: true,
      invitation: validation.invitation
    };
    
  } catch (error) {
    console.error('Handle invite click failed:', error);
    return {
      success: false,
      message: '处理邀请点击失败'
    };
  }
}

// 处理邀请完成（用户注册后）
export async function processInviteCompletion(inviteCode: string, inviteeId: string): Promise<{
  success: boolean;
  inviterReward: number;
  inviteeReward: number;
  message?: string;
}> {
  try {
    // 完成邀请
    const completionResult = await completeInvitation(inviteCode, inviteeId);
    
    if (!completionResult.success || !completionResult.invitation) {
      return {
        success: false,
        inviterReward: 0,
        inviteeReward: 0,
        message: '邀请完成失败'
      };
    }
    
    const invitationModel = completionResult.invitation;
    
    // 给邀请人发放奖励
    const inviterRewardResult = await addUserCredits(
      invitationModel.inviterId,
      invitationModel.inviterReward,
      'invite',
      '邀请奖励',
      `成功邀请用户获得奖励`,
      'invitation',
      invitationModel.uuid
    );
    
    // 给被邀请人发放奖励
    const inviteeRewardResult = await addUserCredits(
      inviteeId,
      invitationModel.inviteeReward,
      'invite',
      '邀请奖励',
      `通过邀请码 ${inviteCode} 获得奖励`,
      'invitation',
      invitationModel.uuid
    );
    
    // 标记奖励已发放
    if (inviterRewardResult.success && inviteeRewardResult.success) {
      await markInvitationRewardGiven(inviteCode, inviteeId);
    }
    
    return {
      success: true,
      inviterReward: invitationModel.inviterReward,
      inviteeReward: invitationModel.inviteeReward
    };
    
  } catch (error) {
    console.error('Process invite completion failed:', error);
    return {
      success: false,
      inviterReward: 0,
      inviteeReward: 0,
      message: '处理邀请完成失败'
    };
  }
}

// 获取用户的邀请历史
export async function getUserInviteHistory(
  userId: string,
  options: {
    limit?: number;
    offset?: number;
  } = {}
): Promise<{
  invitations: Invitation[];
  stats: {
    total: number;
    completed: number;
    pending: number;
    totalRewards: number;
  };
  success: boolean;
}> {
  try {
    const { limit = 20, offset = 0 } = options;
    
    // userId 可能是 Clerk ID，需要转换为数据库 UUID
    const { getUserInfo } = await import('@/lib/services/userService');
    const user = await getUserInfo(userId, 'clerk_id');
    
    if (!user) {
      return {
        invitations: [],
        stats: {
          total: 0,
          completed: 0,
          pending: 0,
          totalRewards: 0
        },
        success: false
      };
    }
    
    const [invitationModels, statsResult] = await Promise.all([
      getUserInvitations(user.uuid),
      getUserInvitationStats(user.uuid)
    ]);
    
    // 转换类型
    const invitations = invitationModels.map(convertInvitationModelToInvitation);
    
    // 转换统计数据
    const stats = {
      total: statsResult.totalInvitations,
      completed: statsResult.completedInvitations,
      pending: statsResult.totalInvitations - statsResult.completedInvitations,
      totalRewards: statsResult.totalRewardsEarned
    };
    
    return {
      invitations,
      stats,
      success: true
    };
    
  } catch (error) {
    console.error('Get user invite history failed:', error);
    return {
      invitations: [],
      stats: {
        total: 0,
        completed: 0,
        pending: 0,
        totalRewards: 0
      },
      success: false
    };
  }
}

// 获取邀请详情（包含邀请人信息）
export async function getInviteDetails(inviteCode: string): Promise<{
  success: boolean;
  invitation?: Invitation;
  inviterName?: string;
  message?: string;
}> {
  try {
    const invitationModel = await findInvitationByCode(inviteCode);
    
    if (!invitationModel) {
      return {
        success: false,
        message: '邀请不存在或已过期'
      };
    }
    
    const invitation = convertInvitationModelToInvitation(invitationModel);
    
    // TODO: 如果需要显示邀请人信息，可以在这里查询用户表
    // const inviter = await findUserByUuid(invitation.inviter_id);
    
    return {
      success: true,
      invitation,
      // inviterName: inviter?.display_name || inviter?.username
    };
    
  } catch (error) {
    console.error('Get invite details failed:', error);
    return {
      success: false,
      message: '获取邀请详情失败'
    };
  }
}

// 检查用户是否可以创建邀请
export async function checkCanCreateInvite(userId: string): Promise<{
  canCreate: boolean;
  reason?: string;
  currentInvites?: number;
  maxInvites?: number;
}> {
  try {
    // userId 可能是 Clerk ID，需要转换为数据库 UUID
    const { getUserInfo } = await import('@/lib/services/userService');
    const user = await getUserInfo(userId, 'clerk_id');
    
    if (!user) {
      return {
        canCreate: false,
        reason: '用户不存在'
      };
    }
    
    const stats = await getUserInvitationStats(user.uuid);
    
    // 设置邀请限制（可以根据用户等级调整）
    const maxInvites = 100; // 最大邀请数限制
    
    return {
      canCreate: stats.totalInvitations < maxInvites,
      currentInvites: stats.totalInvitations,
      maxInvites,
      reason: stats.totalInvitations >= maxInvites ? '已达到最大邀请数限制' : undefined
    };
    
  } catch (error) {
    console.error('Check can create invite failed:', error);
    return {
      canCreate: false,
      reason: '检查失败'
    };
  }
}

// 生成分享文案
export function generateShareText(invitation: Invitation): {
  title: string;
  description: string;
  shortUrl: string;
} {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.aicollager.com';
  const shortUrl = `${baseUrl}/i/${invitation.invite_code}`;
  
  return {
    title: '🎨 AI Collager - 智能拼图工具',
    description: `我在使用 AI Collager 制作拼图，效果很棒！使用我的邀请码注册，我们都能获得 ${invitation.invitee_reward} 积分奖励哦！`,
    shortUrl
  };
} 