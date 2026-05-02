import { checkUserAILimit } from '@/lib/services/dailyLimitService';
import { consumeCredits } from '@/lib/services/creditService';
import { getUserInfo, checkSessionTrialLimit as checkSessionLimit } from '@/lib/services/userService';
import { AI_CONFIG } from '@/lib/ai-config';

export interface ValidationResult {
  canUse: boolean;
  message?: string;
  remainingCredits?: number;
  remainingUsage?: number;
}

export class CollageValidationService {
  /**
   * 验证用户身份和使用限制
   * @param userId 内部用户UUID（不是Clerk ID）
   */
  async validateUserAndLimits(userId?: string, sessionId?: string): Promise<ValidationResult> {
    if (userId) {
      // 登录用户：检查积分和每日限制
      const user = await getUserInfo(userId); // 使用内部 UUID 查询
      if (!user) {
        return { canUse: false, message: '用户不存在' };
      }

      if (user.credits < AI_CONFIG.credits.collage) {
        return { canUse: false, message: '积分不足，请邀请朋友获取积分' };
      }

      // checkUserAILimit 需要 Clerk ID，但这里需要重新设计
      // 暂时保留旧逻辑，但这个函数需要更新为接受内部 UUID
      const limitCheck = await checkUserAILimit(user.clerkUserId);
      if (!limitCheck.allowed) {
        return { canUse: false, message: limitCheck.reason || '今日AI使用次数已达上限' };
      }

      return {
        canUse: true,
        remainingCredits: user.credits,
        remainingUsage: limitCheck.user_limit?.remaining
      };
    } else {
      // 未登录用户：检查试用次数
      if (!sessionId) {
        return { canUse: false, message: '缺少会话信息' };
      }

      const sessionCheck = await checkSessionLimit(sessionId);
      if (!sessionCheck.canUse) {
        return { canUse: false, message: sessionCheck.message || '试用次数已用完，请注册登录继续使用' };
      }

      return {
        canUse: true,
        remainingUsage: sessionCheck.trialLimit - sessionCheck.currentUsage
      };
    }
  }

  /**
   * 扣除用户积分
   */
  async consumeUserCredits(userId: string, relatedEntityId: string): Promise<void> {
    console.log('💰 扣除用户积分...');
    // request.user_id 现在应该是内部 UUID
    await consumeCredits({
      userId: userId, // 直接使用内部 UUID
      amount: AI_CONFIG.credits.collage,
      purpose: 'collage',
      relatedEntityId: relatedEntityId
    });
    console.log('✅ 积分扣除完成:', { amount: AI_CONFIG.credits.collage });
  }
}

export const collageValidationService = new CollageValidationService();
