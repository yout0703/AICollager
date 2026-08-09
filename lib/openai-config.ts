// OpenAI 配置：图像生成(gpt-image-2) + Prompt 智能编排
// 与 lib/ai-config.ts(Gemini 时代遗留) 分离；P5 清理 Gemini 后，此处为唯一 AI 配置入口。
//
// gpt-image-2 规格参考（developers.openai.com）：
//   size:    1024x1024 | 1536x1024 | 1024x1536 | auto
//   quality: low | medium | high | auto
//   接口:    images.generate(文生图) / images.edit(图生图, 多图 image[])

/** gpt-image-2 支持的输出尺寸枚举 */
export type ImageSize = '1024x1024' | '1536x1024' | '1024x1536' | 'auto';
/** gpt-image-2 支持的质量档位（auto 由模型自选，出图成本不固定，故计费档位只用前三者） */
export type ImageQuality = 'low' | 'medium' | 'high';

export interface OpenAIConfig {
  /** API 基础 URL；留空走 OpenAI 官方，填中转站地址则全量代理（如 https://api.onehop.ai/v1） */
  baseURL?: string;
  /** 图像生成模型，默认 gpt-image-2（需完成 API 组织验证） */
  imageModel: string;
  /** Prompt 智能编排模型（vision-capable），根据参考图/风格生成最优提示词 */
  orchestratorModel: string;
  /** 是否启用智能编排；关闭则直接拼接 prompt 作为降级 fallback */
  orchestratorEnabled: boolean;
  /** 宽高比 → gpt-image-2 size 枚举 */
  sizes: Record<string, ImageSize>;
  defaultSize: ImageSize;
  defaultQuality: ImageQuality;
  /** 单次出图请求超时（图像生成较慢） */
  timeout: number;
  retryAttempts: number;
  /** 单次生成/编辑的参考图上限 */
  maxReferenceImages: number;
  /** 积分档位：按 quality 计费（生成与编辑同价） */
  credits: Record<ImageQuality, number>;
  limits: { userDailyLimit: number };
}

export const OPENAI_CONFIG: OpenAIConfig = {
  baseURL: process.env.OPENAI_BASE_URL || undefined,
  imageModel: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2',
  orchestratorModel: process.env.OPENAI_ORCHESTRATOR_MODEL || 'gpt-4o',
  orchestratorEnabled: process.env.OPENAI_ORCHESTRATOR_ENABLED !== 'false',
  sizes: {
    '1:1': '1024x1024',
    '4:3': '1536x1024',
    '3:4': '1024x1536',
    '16:9': '1536x1024',
    '9:16': '1024x1536',
  } satisfies Record<string, ImageSize>,
  defaultSize: '1024x1024',
  defaultQuality: 'high',
  timeout: 120000,
  retryAttempts: 2,
  maxReferenceImages: 10,
  credits: { low: 3, medium: 6, high: 12 },
  limits: {
    userDailyLimit: parseInt(process.env.OPENAI_USER_DAILY_LIMIT || '30'),
  },
};

/** 宽高比(1:1 等) → gpt-image-2 size 枚举 */
export function resolveSize(aspectRatio?: string): ImageSize {
  if (!aspectRatio) return OPENAI_CONFIG.defaultSize;
  return OPENAI_CONFIG.sizes[aspectRatio] ?? OPENAI_CONFIG.defaultSize;
}

/** 按 quality 取积分扣减档位 */
export function creditsForQuality(quality: ImageQuality): number {
  return OPENAI_CONFIG.credits[quality] ?? OPENAI_CONFIG.credits.high;
}

/** OpenAI 出图前置条件：API Key 已配置 */
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/** 把外部传入的字符串解析为合法 quality；非法或缺省返回 undefined */
export function parseQuality(s?: string | null): ImageQuality | undefined {
  if (s === 'low' || s === 'medium' || s === 'high') return s;
  return undefined;
}
