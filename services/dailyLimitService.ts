import { getAIConfig } from '../lib/ai-config';
import { checkUserDailyAILimit, incrementUserDailyAIUsage } from './userService';
import { getTodayAIStats } from '../lib/repositories/aiUsageStats';
import { db } from '../db/client';

// 全局限制检查结果类型
export interface LimitCheckResult {
  allowed: boolean;
  reason?: string;
  user_limit?: {
    current: number;
    max: number;
    remaining: number;
  };
  global_limit?: {
    current: number;
    max: number;
    remaining: number;
  };
}

// 检查用户AI使用限制
export async function checkUserAILimit(userId: string): Promise<LimitCheckResult> {
  try {
    const config = getAIConfig();
    
    // userId 可能是 Clerk ID，需要先获取用户的数据库 UUID
    const { getUserInfo } = await import('./userService');
    const user = await getUserInfo(userId, 'clerk_id');
    
    if (!user) {
      return {
        allowed: false,
        reason: '用户不存在',
        user_limit: {
          current: 0,
          max: config.limits.userDailyLimit,
          remaining: 0
        }
      };
    }
    
    // 检查用户每日限制（使用数据库 UUID）
    const userCheck = await checkUserDailyAILimit(user.uuid);
    
    if (!userCheck.canUse) {
      return {
        allowed: false,
        reason: userCheck.message,
        user_limit: {
          current: userCheck.currentUsage,
          max: userCheck.dailyLimit,
          remaining: Math.max(0, userCheck.dailyLimit - userCheck.currentUsage)
        }
      };
    }
    
    return {
      allowed: true,
      user_limit: {
        current: userCheck.currentUsage,
        max: userCheck.dailyLimit,
        remaining: userCheck.dailyLimit - userCheck.currentUsage
      }
    };
    
  } catch (error) {
    console.error('Check user AI limit failed:', error);
    return {
      allowed: false,
      reason: '检查用户限制时发生错误'
    };
  }
}

// 检查全站AI使用限制
export async function checkGlobalAILimit(): Promise<LimitCheckResult> {
  try {
    const config = getAIConfig();
    
    // 获取今日全站使用统计
    const todayStats = await getTodayAIStats();
    const currentUsage = todayStats?.totalRequests || 0;
    const maxUsage = config.limits.globalDailyLimit;
    
    if (currentUsage >= maxUsage) {
      return {
        allowed: false,
        reason: `系统每日AI使用次数已达上限 (${maxUsage}次)`,
        global_limit: {
          current: currentUsage,
          max: maxUsage,
          remaining: 0
        }
      };
    }
    
    return {
      allowed: true,
      global_limit: {
        current: currentUsage,
        max: maxUsage,
        remaining: maxUsage - currentUsage
      }
    };
    
  } catch (error) {
    console.error('Check global AI limit failed:', error);
    return {
      allowed: false,
      reason: '检查系统限制时发生错误'
    };
  }
}

// 综合检查AI使用限制（用户+全站）
export async function checkAllAILimits(userId: string): Promise<LimitCheckResult> {
  try {
    // 同时检查用户和全站限制
    const [userResult, globalResult] = await Promise.all([
      checkUserAILimit(userId),
      checkGlobalAILimit()
    ]);
    
    // 如果用户限制不通过
    if (!userResult.allowed) {
      return {
        ...userResult,
        global_limit: globalResult.global_limit
      };
    }
    
    // 如果全站限制不通过
    if (!globalResult.allowed) {
      return {
        ...globalResult,
        user_limit: userResult.user_limit
      };
    }
    
    // 都通过
    return {
      allowed: true,
      user_limit: userResult.user_limit,
      global_limit: globalResult.global_limit
    };
    
  } catch (error) {
    console.error('Check all AI limits failed:', error);
    return {
      allowed: false,
      reason: '检查AI使用限制时发生错误'
    };
  }
}

// 消费AI使用次数（更新用户计数）
export async function consumeAIUsage(userId: string): Promise<{
  success: boolean;
  message?: string;
  remaining_usage?: number;
}> {
  try {
    // 先检查是否可以使用
    const limitCheck = await checkAllAILimits(userId);
    
    if (!limitCheck.allowed) {
      return {
        success: false,
        message: limitCheck.reason
      };
    }
    
    // 获取用户的数据库 UUID
    const { getUserInfo, incrementUserDailyAIUsage } = await import('./userService');
    const user = await getUserInfo(userId, 'clerk_id');
    
    if (!user) {
      return {
        success: false,
        message: '用户不存在'
      };
    }
    
    // 增加用户AI使用次数（使用数据库 UUID）
    const incrementSuccess = await incrementUserDailyAIUsage(user.uuid);
    
    if (!incrementSuccess) {
      return {
        success: false,
        message: '更新用户AI使用次数失败'
      };
    }
    
    const remainingUsage = limitCheck.user_limit ? limitCheck.user_limit.remaining - 1 : 0;
    
    return {
      success: true,
      remaining_usage: Math.max(0, remainingUsage)
    };
    
  } catch (error) {
    console.error('Consume AI usage failed:', error);
    return {
      success: false,
      message: '消费AI使用次数时发生错误'
    };
  }
}

// 检查未登录用户试用限制
export async function checkSessionTrialLimit(sessionId: string): Promise<LimitCheckResult> {
  try {
    const config = getAIConfig();
    
    // 使用用户服务中的会话限制检查
    const { checkSessionTrialLimit: checkLimit } = await import('./userService');
    const sessionCheck = await checkLimit(sessionId);
    
    if (!sessionCheck.canUse) {
      return {
        allowed: false,
        reason: sessionCheck.message,
        user_limit: {
          current: sessionCheck.currentUsage,
          max: sessionCheck.trialLimit,
          remaining: Math.max(0, sessionCheck.trialLimit - sessionCheck.currentUsage)
        }
      };
    }
    
    // 还需要检查全站限制
    const globalCheck = await checkGlobalAILimit();
    if (!globalCheck.allowed) {
      return {
        ...globalCheck,
        user_limit: {
          current: sessionCheck.currentUsage,
          max: sessionCheck.trialLimit,
          remaining: sessionCheck.trialLimit - sessionCheck.currentUsage
        }
      };
    }
    
    return {
      allowed: true,
      user_limit: {
        current: sessionCheck.currentUsage,
        max: sessionCheck.trialLimit,
        remaining: sessionCheck.trialLimit - sessionCheck.currentUsage
      },
      global_limit: globalCheck.global_limit
    };
    
  } catch (error) {
    console.error('Check session trial limit failed:', error);
    return {
      allowed: false,
      reason: '检查试用限制时发生错误'
    };
  }
}

// 消费试用次数
export async function consumeTrialUsage(sessionId: string): Promise<{
  success: boolean;
  message?: string;
  remaining_usage?: number;
}> {
  try {
    // 先检查是否可以使用
    const limitCheck = await checkSessionTrialLimit(sessionId);
    
    if (!limitCheck.allowed) {
      return {
        success: false,
        message: limitCheck.reason
      };
    }
    
    // 增加会话试用使用次数
    const { incrementSessionTrialUsageCount } = await import('./userService');
    const incrementSuccess = await incrementSessionTrialUsageCount(sessionId);
    
    if (!incrementSuccess) {
      return {
        success: false,
        message: '更新试用使用次数失败'
      };
    }
    
    const remainingUsage = limitCheck.user_limit ? limitCheck.user_limit.remaining - 1 : 0;
    
    return {
      success: true,
      remaining_usage: Math.max(0, remainingUsage)
    };
    
  } catch (error) {
    console.error('Consume trial usage failed:', error);
    return {
      success: false,
      message: '消费试用次数时发生错误'
    };
  }
}

// 获取使用限制信息（用于前端显示）
export async function getUsageLimitInfo(userId?: string, sessionId?: string): Promise<{
  type: 'user' | 'trial' | 'anonymous';
  current_usage: number;
  max_usage: number;
  remaining_usage: number;
  global_current: number;
  global_max: number;
  global_remaining: number;
  can_use: boolean;
  message?: string;
}> {
  try {
    const config = getAIConfig();
    
    // 获取全站限制信息
    const globalCheck = await checkGlobalAILimit();
    
    if (userId) {
      // 已登录用户
      const userCheck = await checkUserAILimit(userId);
      
      return {
        type: 'user',
        current_usage: userCheck.user_limit?.current || 0,
        max_usage: userCheck.user_limit?.max || config.limits.userDailyLimit,
        remaining_usage: userCheck.user_limit?.remaining || 0,
        global_current: globalCheck.global_limit?.current || 0,
        global_max: globalCheck.global_limit?.max || config.limits.globalDailyLimit,
        global_remaining: globalCheck.global_limit?.remaining || 0,
        can_use: userCheck.allowed && globalCheck.allowed,
        message: !userCheck.allowed ? userCheck.reason : !globalCheck.allowed ? globalCheck.reason : undefined
      };
      
    } else if (sessionId) {
      // 试用用户
      const sessionCheck = await checkSessionTrialLimit(sessionId);
      
      return {
        type: 'trial',
        current_usage: sessionCheck.user_limit?.current || 0,
        max_usage: sessionCheck.user_limit?.max || config.freeTrial.usageLimit,
        remaining_usage: sessionCheck.user_limit?.remaining || 0,
        global_current: globalCheck.global_limit?.current || 0,
        global_max: globalCheck.global_limit?.max || config.limits.globalDailyLimit,
        global_remaining: globalCheck.global_limit?.remaining || 0,
        can_use: sessionCheck.allowed && globalCheck.allowed,
        message: !sessionCheck.allowed ? sessionCheck.reason : !globalCheck.allowed ? globalCheck.reason : undefined
      };
      
    } else {
      // 匿名用户
      return {
        type: 'anonymous',
        current_usage: 0,
        max_usage: 0,
        remaining_usage: 0,
        global_current: globalCheck.global_limit?.current || 0,
        global_max: globalCheck.global_limit?.max || config.limits.globalDailyLimit,
        global_remaining: globalCheck.global_limit?.remaining || 0,
        can_use: false,
        message: '请登录或使用试用功能'
      };
    }
    
  } catch (error) {
    console.error('Get usage limit info failed:', error);
    return {
      type: 'anonymous',
      current_usage: 0,
      max_usage: 0,
      remaining_usage: 0,
      global_current: 0,
      global_max: 0,
      global_remaining: 0,
      can_use: false,
      message: '获取使用限制信息失败'
    };
  }
}

// 重置每日限制（cron job使用）
export async function resetDailyLimits(): Promise<{
  success: boolean;
  users_reset: number;
  message?: string;
}> {
  try {
    // 这个功能在用户模型中实现，这里只是一个调用接口
    // 实际重置逻辑应该是将所有用户的 daily_ai_usage 设为 0
    // 并更新 last_ai_usage_date 为今天
    
    // 注意：真正的重置应该在数据库层面通过定时任务或 cron job 执行
    console.log('Daily limits reset should be handled by database cron job');
    
    return {
      success: true,
      users_reset: 0,
      message: '每日限制重置应由数据库定时任务处理'
    };
    
  } catch (error) {
    console.error('Reset daily limits failed:', error);
    return {
      success: false,
      users_reset: 0,
      message: '重置每日限制失败'
    };
  }
} 