import { Invitation, CreateInvitationRequest } from "@/types/credits";
import {
  createInvitation,
  findInvitationByCode,
  completeInvitation,
  markInvitationClicked,
  markInvitationRewardGiven,
  getUserInvitations,
  getUserInvitationStats,
  isInvitationValid
} from "@/models/invitation";
import { addUserCredits } from "@/models/credits";

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
    
    const invitation = await createInvitation({
      inviter_id: inviterId,
      email,
      invitation_method: method,
      inviter_reward: customReward?.inviterReward || 20,
      invitee_reward: customReward?.inviteeReward || 20
    });
    
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
    
    const invitation = await findInvitationByCode(inviteCode);
    
    return {
      valid: true,
      invitation
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
    
    const invitation = completionResult.invitation;
    
    // 给邀请人发放奖励
    const inviterRewardResult = await addUserCredits(
      invitation.inviter_id,
      invitation.inviter_reward,
      'invite',
      '邀请奖励',
      `成功邀请用户获得奖励`,
      'invitation',
      invitation.uuid
    );
    
    // 给被邀请人发放奖励
    const inviteeRewardResult = await addUserCredits(
      inviteeId,
      invitation.invitee_reward,
      'invite',
      '邀请奖励',
      `通过邀请码 ${inviteCode} 获得奖励`,
      'invitation',
      invitation.uuid
    );
    
    // 标记奖励已发放
    if (inviterRewardResult.success && inviteeRewardResult.success) {
      await markInvitationRewardGiven(inviteCode);
    }
    
    return {
      success: true,
      inviterReward: invitation.inviter_reward,
      inviteeReward: invitation.invitee_reward
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
    
    const [invitations, stats] = await Promise.all([
      getUserInvitations(userId, limit, offset),
      getUserInvitationStats(userId)
    ]);
    
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
    const invitation = await findInvitationByCode(inviteCode);
    
    if (!invitation) {
      return {
        success: false,
        message: '邀请不存在或已过期'
      };
    }
    
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
    const stats = await getUserInvitationStats(userId);
    
    // 设置邀请限制（可以根据用户等级调整）
    const maxInvites = 100; // 最大邀请数限制
    
    return {
      canCreate: stats.total < maxInvites,
      currentInvites: stats.total,
      maxInvites,
      reason: stats.total >= maxInvites ? '已达到最大邀请数限制' : undefined
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