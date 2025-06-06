/**
 * Prompt 配置管理
 * 
 * 集中管理所有 prompt 相关的配置参数，便于调优和维护
 * 参考：https://www.atlassian.com/blog/announcements/best-practices-for-generating-ai-prompts
 */

/**
 * 图片分析配置
 */
export const IMAGE_ANALYSIS_CONFIG = {
  // 描述长度限制
  MAX_DESCRIPTION_LENGTH: 100,
  MIN_DESCRIPTION_LENGTH: 50,
  
  // 最大颜色数量
  MAX_COLORS: 5,
  
  // 最大物体数量  
  MAX_OBJECTS: 10,
  
  // 最大主题数量
  MAX_THEMES: 5,
  
  // 最大关键词数量
  MAX_KEYWORDS: 8,
  
  // 置信度阈值
  MIN_CONFIDENCE_SCORE: 0.7,
} as const;

/**
 * 布局设计配置
 */
export const LAYOUT_DESIGN_CONFIG = {
  // 支持的画布比例
  SUPPORTED_ASPECT_RATIOS: ['1:1', '4:3', '16:9', '3:4', '9:16'] as const,
  
  // 最大图片数量
  MAX_IMAGES: 12,
  MIN_IMAGES: 2,
  
  // 遮罩形状选项
  MASK_SHAPES: [
    'circle',
    'rounded-rect', 
    'polygon',
    'ellipse',
    'hexagon',
    'diamond',
    'star',
    'heart'
  ] as const,
  
  // 默认缩放范围
  DEFAULT_SCALE_RANGE: { min: 1.0, max: 1.3 },
  
  // 默认旋转范围（度）
  DEFAULT_ROTATION_RANGE: { min: -15, max: 15 },
  
  // 最小置信度
  MIN_CONFIDENCE_SCORE: 0.8,
} as const;

/**
 * 配色方案配置
 */
export const COLOR_SCHEME_CONFIG = {
  // 主色调数量
  PRIMARY_COLORS_COUNT: { min: 2, max: 3 },
  
  // 辅助色数量  
  SECONDARY_COLORS_COUNT: { min: 2, max: 4 },
  
  // 强调色数量
  ACCENT_COLORS_COUNT: { min: 1, max: 2 },
  
  // 分析的主要颜色数量
  MAX_DOMINANT_COLORS: 8,
  
  // 支持的情绪类型
  SUPPORTED_MOODS: [
    '温暖', '冷淡', '活泼', '沉稳', 
    '优雅', '活力', '宁静', '激情'
  ] as const,
  
  // 最小置信度
  MIN_CONFIDENCE_SCORE: 0.75,
} as const;

/**
 * AI 模型配置
 */
export const AI_MODEL_CONFIG = {
  // 最大 prompt 长度
  MAX_PROMPT_LENGTH: 4000,
  
  // 最大输出 token 数
  MAX_OUTPUT_TOKENS: 2048,
  
  // 温度设置（创意度）
  TEMPERATURE: {
    CONSERVATIVE: 0.7,   // 保守，更稳定的输出
    BALANCED: 1.0,       // 平衡
    CREATIVE: 1.2,       // 创意，更多样化的输出
  },
  
  // 重试配置
  RETRY_CONFIG: {
    MAX_ATTEMPTS: 3,
    BACKOFF_DELAY: 1000, // 毫秒
  },
} as const;

/**
 * 响应验证配置
 */
export const RESPONSE_VALIDATION_CONFIG = {
  // JSON 响应最小长度
  MIN_RESPONSE_LENGTH: 50,
  
  // 必需字段验证
  REQUIRED_FIELDS: {
    IMAGE_ANALYSIS: ['description', 'colors', 'style', 'confidence_score'],
    LAYOUT_SUGGESTION: ['layout_type', 'suggestions', 'confidence_score'],
    COLOR_SCHEME: ['primary_colors', 'background_color', 'confidence_score'],
  },
  
  // 数组字段最小长度
  MIN_ARRAY_LENGTHS: {
    colors: 1,
    objects: 0,
    themes: 1,
    keywords: 1,
    suggestions: 1,
    primary_colors: 1,
  },
} as const;

/**
 * 缓存配置
 */
export const PROMPT_CACHE_CONFIG = {
  // 缓存过期时间（小时）
  CACHE_EXPIRY_HOURS: 24,
  
  // 缓存键前缀
  CACHE_KEY_PREFIX: 'prompt_template_',
  
  // 是否启用缓存
  ENABLE_CACHE: true,
  
  // 最大缓存大小
  MAX_CACHE_SIZE: 1000,
} as const;

/**
 * 调试配置
 */
export const DEBUG_CONFIG = {
  // 是否显示详细日志
  VERBOSE_LOGGING: process.env.NODE_ENV === 'development',
  
  // 是否保存原始响应用于调试
  SAVE_RAW_RESPONSES: process.env.NODE_ENV === 'development',
  
  // 是否启用性能监控
  ENABLE_PERFORMANCE_MONITORING: true,
  
  // 响应时间警告阈值（毫秒）
  RESPONSE_TIME_WARNING_THRESHOLD: 10000,
} as const;

/**
 * 获取当前配置摘要
 */
export function getPromptConfigSummary() {
  return {
    imageAnalysis: {
      maxDescriptionLength: IMAGE_ANALYSIS_CONFIG.MAX_DESCRIPTION_LENGTH,
      maxColors: IMAGE_ANALYSIS_CONFIG.MAX_COLORS,
      minConfidence: IMAGE_ANALYSIS_CONFIG.MIN_CONFIDENCE_SCORE,
    },
    layoutDesign: {
      supportedRatios: LAYOUT_DESIGN_CONFIG.SUPPORTED_ASPECT_RATIOS.length,
      maxImages: LAYOUT_DESIGN_CONFIG.MAX_IMAGES,
      maskShapes: LAYOUT_DESIGN_CONFIG.MASK_SHAPES.length,
    },
    colorScheme: {
      supportedMoods: COLOR_SCHEME_CONFIG.SUPPORTED_MOODS.length,
      maxDominantColors: COLOR_SCHEME_CONFIG.MAX_DOMINANT_COLORS,
    },
    aiModel: {
      maxPromptLength: AI_MODEL_CONFIG.MAX_PROMPT_LENGTH,
      temperature: AI_MODEL_CONFIG.TEMPERATURE.BALANCED,
    },
    version: '1.0.0'
  };
} 