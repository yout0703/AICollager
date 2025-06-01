// AI服务配置
export const AI_CONFIG = {
  // 模型配置
  models: {
    primary: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    fallback: process.env.GEMINI_FALLBACK_MODEL || 'gemini-1.5-pro',
  },
  
  // 每日限制
  limits: {
    userDailyLimit: parseInt(process.env.AI_USER_DAILY_LIMIT || '20'),
    globalDailyLimit: parseInt(process.env.AI_GLOBAL_DAILY_LIMIT || '5000'),
  },
  
  // 积分消耗
  credits: {
    collage: parseInt(process.env.CREDITS_COLLAGE_COST || '5'),
    download: parseInt(process.env.CREDITS_DOWNLOAD_COST || '10'),
    premiumTemplate: parseInt(process.env.CREDITS_PREMIUM_TEMPLATE_COST || '15'),
    initialAmount: parseInt(process.env.CREDITS_INITIAL_AMOUNT || '50'),
    inviteReward: parseInt(process.env.CREDITS_INVITE_REWARD || '20'),
  },
  
  // 免费试用
  freeTrial: {
    usageLimit: parseInt(process.env.FREE_TRIAL_USAGE_LIMIT || '3'),
    sessionDurationDays: parseInt(process.env.SESSION_DURATION_DAYS || '30'),
  },
  
  // API配置
  api: {
    timeout: 30000, // 30秒超时
    retryAttempts: 3,
    cacheDurationDays: 30,
  },
  
  // 图片处理配置
  image: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    supportedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    maxDimensions: { width: 4096, height: 4096 },
    thumbnailSize: { width: 300, height: 300 },
    previewSize: { width: 800, height: 600 },
  },
  
  // 拼图配置
  collage: {
    maxImages: 20,
    minImages: 2,
    defaultAspectRatio: '1:1',
    supportedAspectRatios: ['1:1', '4:3', '16:9', '3:4', '9:16'],
    maxCanvasSize: { width: 2048, height: 2048 },
  },
};

// 获取系统配置的辅助函数
export function getAIConfig() {
  return AI_CONFIG;
}

// 检查是否达到每日限制
export function checkDailyLimits(userUsage: number, globalUsage: number): {
  allowed: boolean;
  reason?: string;
} {
  if (userUsage >= AI_CONFIG.limits.userDailyLimit) {
    return {
      allowed: false,
      reason: `用户每日AI使用次数已达上限 (${AI_CONFIG.limits.userDailyLimit}次)`
    };
  }
  
  if (globalUsage >= AI_CONFIG.limits.globalDailyLimit) {
    return {
      allowed: false,
      reason: `系统每日AI使用次数已达上限 (${AI_CONFIG.limits.globalDailyLimit}次)`
    };
  }
  
  return { allowed: true };
}

// 检查积分是否足够
export function checkCreditsRequired(
  userCredits: number, 
  operation: 'collage' | 'download' | 'premiumTemplate'
): {
  sufficient: boolean;
  required: number;
  current: number;
} {
  const required = AI_CONFIG.credits[operation];
  
  return {
    sufficient: userCredits >= required,
    required,
    current: userCredits
  };
}

// 验证图片文件
export function validateImageFile(file: {
  size: number;
  type: string;
  width?: number;
  height?: number;
}): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // 检查文件大小
  if (file.size > AI_CONFIG.image.maxFileSize) {
    errors.push(`文件大小超过限制 (${AI_CONFIG.image.maxFileSize / 1024 / 1024}MB)`);
  }
  
  // 检查文件格式
  if (!AI_CONFIG.image.supportedFormats.includes(file.type)) {
    errors.push(`不支持的文件格式，支持: ${AI_CONFIG.image.supportedFormats.join(', ')}`);
  }
  
  // 检查图片尺寸
  if (file.width && file.height) {
    if (file.width > AI_CONFIG.image.maxDimensions.width || 
        file.height > AI_CONFIG.image.maxDimensions.height) {
      errors.push(`图片尺寸超过限制 (${AI_CONFIG.image.maxDimensions.width}x${AI_CONFIG.image.maxDimensions.height})`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
} 