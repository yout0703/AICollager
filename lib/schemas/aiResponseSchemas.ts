/**
 * AI 响应 Schema 定义
 * 
 * 基于 Schema-First 架构的最佳实践：
 * 1. 单一数据源定义
 * 2. 自动生成 TypeScript 类型
 * 3. 自动生成 Prompt 描述
 * 4. 运行时验证支持
 * 
 * 参考：https://www.atlassian.com/blog/artificial-intelligence/ultimate-guide-writing-ai-prompts
 */

import { z } from 'zod';

// =============================================================================
// 基础 Schema 组件
// =============================================================================

/**
 * 物体识别 Schema
 */
export const ObjectDetectionSchema = z.object({
  name: z.string().describe("物体名称"),
  confidence: z.number().min(0).max(1).describe("识别置信度（0-1）"),
  position: z.object({
    x: z.number().describe("X坐标"),
    y: z.number().describe("Y坐标"), 
    width: z.number().describe("宽度"),
    height: z.number().describe("高度")
  }).optional().describe("物体位置（可选）")
});

/**
 * 颜色分析 Schema
 */
export const ColorAnalysisSchema = z.object({
  color: z.string().describe("颜色名称"),
  percentage: z.number().min(0).max(100).describe("颜色占比百分比"),
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).describe("十六进制颜色值")
});

/**
 * 风格分析 Schema
 */
export const StyleAnalysisSchema = z.object({
  type: z.enum(['photo', 'illustration', 'graphic', 'art']).describe("图片类型"),
  mood: z.string().describe("情绪氛围"),
  composition: z.enum(['simple', 'complex', 'balanced', 'asymmetric']).describe("构图特点")
});

// =============================================================================
// 主要 AI 响应 Schema
// =============================================================================

/**
 * 图片分析响应 Schema
 */
export const ImageAnalysisResponseSchema = z.object({
  description: z.string()
    .min(50)
    .max(200)
    .describe("图片的详细描述（50-200字）"),
  
  objects: z.array(ObjectDetectionSchema)
    .max(10)
    .describe("图片中识别的物体数组（最多10个）"),
  
  colors: z.array(ColorAnalysisSchema)
    .min(1)
    .max(8)
    .describe("主要颜色分析数组（1-8个）"),
  
  style: StyleAnalysisSchema
    .describe("图片风格分析"),
  
  themes: z.array(z.string())
    .min(1)
    .max(5)
    .describe("主题标签数组（1-5个）"),
  
  keywords: z.array(z.string())
    .min(1)
    .max(10)
    .describe("关键词数组（1-10个）"),
  
  confidence_score: z.number()
    .min(0)
    .max(1)
    .describe("整体分析置信度（0-1）")
});

/**
 * 遮罩区域 Schema
 */
export const MaskRegionSchema = z.object({
  shape: z.enum(['circle', 'rounded-rect', 'polygon', 'ellipse', 'hexagon', 'diamond'])
    .describe("遮罩形状类型"),
  
  clip_path: z.string()
    .describe("CSS clip-path 属性值"),
  
  position: z.object({
    x: z.number().describe("X坐标（像素）"),
    y: z.number().describe("Y坐标（像素）"),
    width: z.number().positive().describe("宽度（像素）"),
    height: z.number().positive().describe("高度（像素）")
  }).describe("遮罩位置和尺寸")
});

/**
 * 图片变换 Schema
 */
export const ImageTransformSchema = z.object({
  position: z.object({
    x: z.number().describe("图片X偏移（像素）"),
    y: z.number().describe("图片Y偏移（像素）")
  }).describe("图片位置偏移"),
  
  scale: z.number()
    .min(0.5)
    .max(3.0)
    .describe("缩放比例（0.5-3.0）"),
  
  rotation: z.number()
    .min(-180)
    .max(180)
    .describe("旋转角度（-180到180度）")
});

/**
 * 画布背景 Schema
 */
export const CanvasBackgroundSchema = z.object({
  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .describe("背景颜色（十六进制）"),
  
  texture: z.enum(['solid', 'gradient', 'pattern'])
    .describe("背景纹理类型"),
  
  style: z.string()
    .describe("背景风格描述")
});

/**
 * 布局建议项 Schema
 */
export const LayoutSuggestionItemSchema = z.object({
      imageIndex: z.number()
    .int()
    .nonnegative()
    .describe("图片索引（从0开始）"),
  
  z_index: z.number()
    .int()
    .positive()
    .describe("层级（正整数）"),
  
  mask_region: MaskRegionSchema
    .describe("遮罩区域定义"),
  
  image_transform: ImageTransformSchema
    .describe("图片变换参数"),
  
  effects: z.array(z.string())
    .default([])
    .describe("特效数组"),
  
  opacity: z.number()
    .min(0)
    .max(1)
    .optional()
    .describe("透明度（0-1，可选）"),
  
  borderRadius: z.number()
    .nonnegative()
    .optional()
    .describe("圆角半径（像素，可选）")
});

/**
 * 布局建议响应 Schema
 */
export const LayoutSuggestionResponseSchema = z.object({
  layout_type: z.literal('mask_collage')
    .describe("布局类型（固定为mask_collage）"),
  
  mask_strategy: z.string()
    .describe("遮罩布局策略描述"),
  
  aspect_ratio: z.string()
    .regex(/^\d+:\d+$/)
    .describe("画布宽高比（如1:1、4:3）"),
  
  canvas_background: CanvasBackgroundSchema
    .describe("画布背景配置"),
  
  suggestions: z.array(LayoutSuggestionItemSchema)
    .min(1)
    .max(20)
    .describe("布局建议数组（1-20个）"),
  
  overall_theme: z.string()
    .describe("整体主题描述"),
  
  color_scheme: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/))
    .min(1)
    .max(10)
    .describe("配色方案数组（1-10个颜色）"),
  
  confidence_score: z.number()
    .min(0)
    .max(1)
    .describe("设计置信度（0-1）"),
  
  reasoning: z.string()
    .describe("设计理念说明")
});

/**
 * 配色方案响应 Schema
 */
export const ColorSchemeResponseSchema = z.object({
  primary_colors: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/))
    .min(1)
    .max(3)
    .describe("主色调数组（1-3个）"),
  
  secondary_colors: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/))
    .min(1)
    .max(4)
    .describe("辅助色数组（1-4个）"),
  
  accent_colors: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/))
    .min(1)
    .max(2)
    .describe("强调色数组（1-2个）"),
  
  background_color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .describe("背景色"),
  
  text_color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .describe("文字色"),
  
  scheme_name: z.string()
    .describe("配色方案名称"),
  
  mood: z.string()
    .describe("配色情绪描述"),
  
  confidence_score: z.number()
    .min(0)
    .max(1)
    .describe("配色置信度（0-1）")
});

// =============================================================================
// 类型导出
// =============================================================================

export type ImageAnalysisResponse = z.infer<typeof ImageAnalysisResponseSchema>;
export type LayoutSuggestionResponse = z.infer<typeof LayoutSuggestionResponseSchema>;
export type ColorSchemeResponse = z.infer<typeof ColorSchemeResponseSchema>;

// 向后兼容的类型别名
export type AIImageAnalysis = ImageAnalysisResponse;
export type AILayoutSuggestion = LayoutSuggestionResponse;
export type ColorScheme = ColorSchemeResponse;

// =============================================================================
// Schema 工具函数
// =============================================================================

/**
 * 验证 AI 响应数据
 */
export function validateImageAnalysis(data: unknown): ImageAnalysisResponse {
  return ImageAnalysisResponseSchema.parse(data);
}

export function validateLayoutSuggestion(data: unknown): LayoutSuggestionResponse {
  return LayoutSuggestionResponseSchema.parse(data);
}

export function validateColorScheme(data: unknown): ColorSchemeResponse {
  return ColorSchemeResponseSchema.parse(data);
}

/**
 * 安全验证（返回结果而不抛出异常）
 */
export function safeValidateImageAnalysis(data: unknown) {
  return ImageAnalysisResponseSchema.safeParse(data);
}

export function safeValidateLayoutSuggestion(data: unknown) {
  return LayoutSuggestionResponseSchema.safeParse(data);
}

export function safeValidateColorScheme(data: unknown) {
  return ColorSchemeResponseSchema.safeParse(data);
}

// =============================================================================
// Schema 版本信息
// =============================================================================

export const SCHEMA_VERSION = {
  version: '1.0.0',
  lastUpdated: '2025-01-15',
  description: 'AI响应结构的统一Schema定义',
  changelog: [
    '1.0.0 - 初始版本，基于Zod的Schema-First架构',
  ],
} as const; 