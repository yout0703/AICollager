/**
 * AI Prompt 模板管理系统
 * 
 * 最佳实践：
 * 1. 解耦 prompts 和业务逻辑代码
 * 2. 模块化设计，使用可复用的 snippets
 * 3. 统一的模板管理和版本控制
 * 4. 支持动态参数注入
 * 
 * 参考：https://medium.com/promptlayer/scalable-prompt-management-and-collaboration-fff28af39b9b
 */

import type { ImageAnalysisResult } from '@/lib/services/aiAnalysisService';
import { 
  ImageAnalysisResponseSchema, 
  LayoutSuggestionResponseSchema, 
  ColorSchemeResponseSchema 
} from '@/lib/schemas/aiResponseSchemas';
import { generateOutputFormatPrompt } from '@/lib/utils/schemaToPrompt';

// =============================================================================
// 基础 Prompt Snippets - 可复用的组件
// =============================================================================

/**
 * 通用指令片段
 */
export const COMMON_SNIPPETS = {
  // JSON 输出格式要求
  JSON_FORMAT_INSTRUCTION: `请严格按照JSON格式返回，确保输出有效的JSON对象。只返回JSON内容，不要添加其他说明文字。`,
  
  // 代码块格式
  JSON_BLOCK_FORMAT: (jsonContent: string) => `\`\`\`json\n${jsonContent}\n\`\`\``,
  
  // 简洁回答要求
  CONCISE_RESPONSE: `回答要简洁明确，避免冗余信息。`,
  
  // 中文回答要求
  CHINESE_LANGUAGE: `请用中文回答。`,
  
  // 创意限制
  CREATIVITY_BOUNDS: `在保持创意的同时，确保输出结果实用且符合用户需求。`,
} as const;

/**
 * 设计风格定义片段
 */
export const DESIGN_STYLE_SNIPPETS = {
  MINIMALIST: '简洁的几何形状，大量留白，平衡的布局',
  DYNAMIC_GEOMETRIC: '动感的多边形，变化的角度，视觉冲击力', 
  ARTISTIC_COLLAGE: '有机的形状，艺术性的边界，创意的组合',
  MODERN_CREATIVE: '前卫的设计，独特的形状，现代美学',
  ORGANIC_NATURAL: '自然的曲线，流动的形状，和谐的布局',
} as const;

/**
 * 创意提示片段
 */
export const CREATIVITY_SNIPPETS = [
  '创造独特的遮罩形状，让每张图片都有专属的展示窗口',
  '设计有机的挖洞形状，创造流动的视觉节奏',
  '用几何形状创造精确的图片展示区域', 
  '通过不规则的遮罩边界创造动态美感',
  '让遮罩形状与图片内容产生呼应关系',
] as const;

// =============================================================================
// 图片分析 Prompt 模板
// =============================================================================

/**
 * 图片分析模板配置
 */
export const IMAGE_ANALYSIS_TEMPLATE = {
  // 系统角色定义
  SYSTEM_ROLE: '你是一个专业的图像分析专家，擅长识别图片内容、风格、色彩和主题。',
  
  // 主要指令
  MAIN_INSTRUCTION: '请分析这张图片，提取关键信息并按指定格式返回结果。',
  
  // 分析要求
  ANALYSIS_REQUIREMENTS: [
    '准确描述图片的主要内容和场景',
    '识别图片中的重要物体和元素',  
    '分析图片的色彩构成和主要色调',
    '判断图片的风格类型和情绪氛围',
    '提取相关的主题标签和关键词',
  ],
  
  // 使用 Schema-driven 输出格式
} as const;

/**
 * 生成图片分析完整 prompt
 */
export function generateImageAnalysisPrompt(): string {
  const template = IMAGE_ANALYSIS_TEMPLATE;
  
  // 使用 Schema-driven 方法生成输出格式
  const outputFormatPrompt = generateOutputFormatPrompt(
    ImageAnalysisResponseSchema,
    { title: '输出格式要求', includeExamples: true, includeValidation: true }
  );
  
  return `${template.SYSTEM_ROLE}

${template.MAIN_INSTRUCTION}

分析要求：
${template.ANALYSIS_REQUIREMENTS.map((req, i) => `${i + 1}. ${req}`).join('\n')}

${outputFormatPrompt}

${COMMON_SNIPPETS.JSON_FORMAT_INSTRUCTION}`;
}

// =============================================================================
// 布局建议 Prompt 模板  
// =============================================================================

/**
 * 布局建议模板配置
 */
export const LAYOUT_SUGGESTION_TEMPLATE = {
  // 系统角色
  SYSTEM_ROLE: '你是一个专业的UI/UX设计师，专门设计创新的图片拼贴布局。',
  
  // 核心概念说明
  CONCEPT_EXPLANATION: '遮罩拼图概念：在画布上创建特定形状的"洞"，图片通过这些洞展示，形成有趣的视觉效果。',
  
  // 设计原则
  DESIGN_PRINCIPLES: [
    '每个遮罩区域必须独立，不能重叠',
    '使用 clip-path 精确定义遮罩边界',
    '确保视觉平衡和美观性',
    '考虑图片内容与遮罩形状的匹配',
  ],
  
  // 使用 Schema-driven 输出格式
} as const;

/**
 * 图片数据摘要生成器
 */
export function generateImageSummary(images: ImageAnalysisResult[]): string {
  return images.map((img, idx) => {
    const shortDesc = img.description.slice(0, 30);
    const mainColors = img.colors.slice(0, 2).map(c => c.color).join(',');
    const mainThemes = img.themes.slice(0, 2).join(',');
    return `图${idx}: ${shortDesc}... [${img.style.type}/${img.style.mood}] 色彩:${mainColors} 主题:${mainThemes}`;
  }).join('\n');
}

/**
 * 生成布局建议完整 prompt
 */
export function generateLayoutSuggestionPrompt(params: {
  images: ImageAnalysisResult[];
  aspectRatio: string;
  style: string;
  imageCount: number;
}): string {
  const { images, aspectRatio, style, imageCount } = params;
  const template = LAYOUT_SUGGESTION_TEMPLATE;
  
  // 随机选择设计风格和创意提示
  const styleDescription = DESIGN_STYLE_SNIPPETS[style as keyof typeof DESIGN_STYLE_SNIPPETS] || 
                          DESIGN_STYLE_SNIPPETS.MODERN_CREATIVE;
  const creativityHint = CREATIVITY_SNIPPETS[Math.floor(Math.random() * CREATIVITY_SNIPPETS.length)];
  
  // 使用 Schema-driven 方法生成输出格式
  const outputFormatPrompt = generateOutputFormatPrompt(
    LayoutSuggestionResponseSchema,
    { title: '输出格式要求', includeExamples: true, includeValidation: true }
  );
  
  return `${template.SYSTEM_ROLE}

任务：为${imageCount}张图片设计${style}风格的遮罩拼图布局

${template.CONCEPT_EXPLANATION}

设计要求：
- 画布比例：${aspectRatio}
- 设计风格：${styleDescription}
- 创意方向：${creativityHint}

${template.DESIGN_PRINCIPLES.map((principle, i) => `${i + 1}. ${principle}`).join('\n')}

图片信息摘要：
${generateImageSummary(images)}

重要：请确保返回的 JSON 包含所有必需字段，特别是：
- canvas_background（画布背景配置）
- overall_theme（整体主题）  
- color_scheme（配色方案数组）
- suggestions 中的可选字段 opacity 和 borderRadius

${outputFormatPrompt}

${COMMON_SNIPPETS.JSON_FORMAT_INSTRUCTION}`;
}

// =============================================================================
// 配色方案 Prompt 模板
// =============================================================================

/**
 * 配色方案模板配置
 */
export const COLOR_SCHEME_TEMPLATE = {
  // 系统角色
  SYSTEM_ROLE: '你是一个专业的色彩设计师，专门为数字产品设计协调的配色方案。',
  
  // 主要任务
  MAIN_TASK: '基于图片的主要颜色，生成一个和谐统一的配色方案。',
  
  // 设计原则
  COLOR_PRINCIPLES: [
    '确保颜色搭配和谐，符合色彩理论',
    '考虑颜色的心理效应和情绪表达',
    '保证足够的对比度，确保可读性',
    '适合数字界面使用',
  ],
  
  // 使用 Schema-driven 输出格式
} as const;

/**
 * 生成配色方案完整 prompt
 */
export function generateColorSchemePrompt(
  dominantColors: any[], 
  style?: string, 
  mood?: string
): string {
  const template = COLOR_SCHEME_TEMPLATE;
  
  // 使用 Schema-driven 方法生成输出格式
  const outputFormatPrompt = generateOutputFormatPrompt(
    ColorSchemeResponseSchema,
    { title: '输出格式要求', includeExamples: true, includeValidation: true }
  );
  
  return `${template.SYSTEM_ROLE}

${template.MAIN_TASK}

输入信息：
- 图片主要颜色：${JSON.stringify(dominantColors.slice(0, 8), null, 2)}
- 风格偏好：${style || '无特定要求'}
- 情绪偏好：${mood || '无特定要求'}

设计原则：
${template.COLOR_PRINCIPLES.map((principle, i) => `${i + 1}. ${principle}`).join('\n')}

${outputFormatPrompt}

${COMMON_SNIPPETS.JSON_FORMAT_INSTRUCTION}`;
}

// =============================================================================
// Prompt 工具函数
// =============================================================================

/**
 * 获取随机设计风格
 */
export function getRandomDesignStyle(): keyof typeof DESIGN_STYLE_SNIPPETS {
  const styles = Object.keys(DESIGN_STYLE_SNIPPETS) as (keyof typeof DESIGN_STYLE_SNIPPETS)[];
  return styles[Math.floor(Math.random() * styles.length)];
}

/**
 * 获取随机创意提示
 */
export function getRandomCreativityHint(): string {
  return CREATIVITY_SNIPPETS[Math.floor(Math.random() * CREATIVITY_SNIPPETS.length)];
}

/**
 * Prompt 模板版本信息
 */
export const PROMPT_TEMPLATE_VERSION = {
  version: '1.0.1',
  lastUpdated: '2025-01-15',
  changelog: [
    '1.0.1 - 修复布局建议模板字段不匹配问题，添加缺失字段',
    '1.0.0 - 初始版本，解耦 prompts 到独立模块',
  ],
} as const; 