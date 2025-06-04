import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAIConfig } from '../lib/ai-config';
import {
  generateCacheKey,
  findAIAnalysisCache,
  createAIAnalysisCache
} from '../lib/repositories/aiAnalysisCache';
import { recordAIRequest } from '../lib/repositories/aiUsageStats';
import { AIImageAnalysis, AILayoutSuggestion, CollageElement, CanvasConfig } from '../types/collage';

// 初始化Gemini AI客户端
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// AI分析结果类型定义
export interface ImageAnalysisResult {
  description: string;
  objects: Array<{
    name: string;
    confidence: number;
    position?: { x: number; y: number; width: number; height: number };
  }>;
  colors: Array<{
    color: string;
    percentage: number;
    hex: string;
  }>;
  style: {
    type: string; // 'photo' | 'illustration' | 'graphic' | 'art'
    mood: string; // 'bright' | 'dark' | 'warm' | 'cool' | 'vibrant' | 'muted'
    composition: string; // 'simple' | 'complex' | 'balanced' | 'asymmetric'
  };
  themes: string[];
  keywords: string[];
  confidence_score: number;
}

export interface LayoutSuggestion {
  layout_type: 'mask_collage'; // 只支持遮罩拼图
  mask_strategy: string; // 遮罩布局策略
  aspect_ratio: string;
  canvas_background?: {
    color: string;
    texture: 'solid' | 'gradient' | 'pattern';
    style: string;
  };
  suggestions: Array<{
    image_index: number;
    z_index: number;
    
    // 遮罩拼图专用字段
    mask_region: {
      shape: string;
      clip_path: string;
      position: { x: number; y: number; width: number; height: number };
    };
    image_transform: {
      position: { x: number; y: number };
      scale: number;
      rotation: number;
    };
    
    // 可选效果
    effects?: string[];
    opacity?: number;
    borderRadius?: number;
  }>;
  overall_theme: string;
  color_scheme: string[];
  confidence_score: number;
  reasoning: string;
}

export interface ColorScheme {
  primary_colors: string[];
  secondary_colors: string[];
  accent_colors: string[];
  background_color: string;
  text_color: string;
  scheme_name: string;
  mood: string;
  confidence_score: number;
}

// 图片分析功能
export async function analyzeImages(images: Array<{
  data: Buffer | string; // base64 or file buffer
  mimeType: string;
  filename?: string;
}>): Promise<{
  success: boolean;
  results?: ImageAnalysisResult[];
  error?: string;
  cached?: boolean;
  response_time: number;
}> {
  const startTime = Date.now();
  let cached = false;
  
  try {
    const config = getAIConfig();
    
    // 生成缓存键
    const cacheKey = generateCacheKey({
      images: images.map(img => ({
        data: typeof img.data === 'string' ? img.data : img.data.toString('base64'),
        mimeType: img.mimeType
      })),
      type: 'image_analysis'
    });
    
    // 检查缓存
    const cachedResult = await findAIAnalysisCache(cacheKey, 'image_analysis');
    if (cachedResult) {
      cached = true;
      const responseTime = Date.now() - startTime;
      
      // 记录使用统计
      await recordAIRequest({
        operationType: 'image_analysis',
        aiModel: config.models.primary,
        processingTimeMs: responseTime,
        success: true,
        metadata: { cached: true }
      });
      
      return {
        success: true,
        results: (cachedResult.analysisResult as any).results,
        cached: true,
        response_time: responseTime
      };
    }
    
    // 调用Gemini API
    const model = genAI.getGenerativeModel({ model: config.models.primary });
    
    const results: ImageAnalysisResult[] = [];
    
    for (const image of images) {
      const imagePart = {
        inlineData: {
          data: typeof image.data === 'string' ? image.data : image.data.toString('base64'),
          mimeType: image.mimeType
        }
      };
      
      const prompt = `请分析这张图片，并以JSON格式返回以下信息：
{
  "description": "图片的详细描述",
  "objects": [
    {
      "name": "物体名称",
      "confidence": 0.95
    }
  ],
  "colors": [
    {
      "color": "颜色名称",
      "percentage": 25,
      "hex": "#FF0000"
    }
  ],
  "style": {
    "type": "photo/illustration/graphic/art",
    "mood": "bright/dark/warm/cool/vibrant/muted",
    "composition": "simple/complex/balanced/asymmetric"
  },
  "themes": ["主题1", "主题2"],
  "keywords": ["关键词1", "关键词2"],
  "confidence_score": 0.90
}`;
      
      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();
      
      try {
        // 尝试解析JSON响应
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const analysisResult = JSON.parse(jsonMatch[0]);
          results.push(analysisResult);
        } else {
          throw new Error('无法解析AI响应');
        }
      } catch (parseError) {
        // 如果解析失败，创建一个基本的分析结果
        results.push({
          description: text.substring(0, 200),
          objects: [],
          colors: [],
          style: { type: 'photo', mood: 'neutral', composition: 'balanced' },
          themes: [],
          keywords: [],
          confidence_score: 0.5
        });
      }
    }
    
    const responseTime = Date.now() - startTime;
    
    // 缓存结果 - 添加错误处理
    try {
      await createAIAnalysisCache({
        cacheKey: cacheKey,
        aiModel: config.models.primary,
        inputData: images,
        cacheType: 'image_analysis',
        analysisResult: { results },
        confidenceScore: results.reduce((sum, r) => sum + r.confidence_score, 0) / results.length,
        expiresInDays: config.api.cacheDurationDays
      });
      console.log('✅ 图片分析缓存创建成功');
    } catch (cacheError) {
      console.warn('⚠️  图片分析缓存创建失败，但不影响主功能:', cacheError);
      // 缓存失败不应该影响主功能，继续执行
    }
    
    // 记录使用统计
    await recordAIRequest({
      operationType: 'image_analysis',
      aiModel: config.models.primary,
      processingTimeMs: responseTime,
      success: true,
      estimatedCost: parseFloat((images.length * 0.01).toFixed(4)), // 确保是有效数值，保留4位小数
      metadata: { cached: false }
    });
    
    return {
      success: true,
      results,
      cached: false,
      response_time: responseTime
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    const config = getAIConfig();
    
    // 记录失败统计
    await recordAIRequest({
      operationType: 'image_analysis',
      aiModel: config.models.primary,
      processingTimeMs: responseTime,
      success: false,
      metadata: { cached: true, error: error instanceof Error ? error.message : '未知错误' }
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '图片分析失败',
      response_time: responseTime
    };
  }
}

// 布局建议功能
export async function suggestLayout(params: {
  images: ImageAnalysisResult[];
  preferences?: {
    aspect_ratio?: string;
    style?: string;
    complexity?: 'simple' | 'moderate' | 'complex';
  };
}): Promise<{
  success: boolean;
  suggestion?: LayoutSuggestion;
  error?: string;
  cached?: boolean;
  response_time: number;
}> {
  const startTime = Date.now();
  let cached = false;
  
  try {
    const config = getAIConfig();
    
    // 改进缓存键生成逻辑，避免重复键冲突
    // 使用更稳定的种子生成方式，避免高并发时的冲突
    const stableHash = JSON.stringify({
      images: params.images,
      preferences: params.preferences,
      type: 'layout_suggestion'
    });
    const randomSeed = Math.abs(Buffer.from(stableHash).reduce((a, b) => a + b, 0)) % 10000 + Date.now() % 1000;
    
    const cacheKey = generateCacheKey({
      images: params.images,
      preferences: params.preferences,
      type: 'layout_suggestion',
      randomSeed: randomSeed
    });
    
    // 改进缓存策略：降低缓存命中率以增加布局多样性
    const shouldUseCache = Math.random() > 0.3; // 70%概率跳过缓存
    let cachedResult = null;
    
    if (shouldUseCache) {
      try {
        cachedResult = await findAIAnalysisCache(cacheKey, 'layout_suggestion');
      } catch (error) {
        console.warn('缓存查找失败，继续生成新布局:', error);
        cachedResult = null;
      }
    }
    
    if (cachedResult) {
      cached = true;
      const responseTime = Date.now() - startTime;
      
      await recordAIRequest({
        operationType: 'layout_suggestion',
        aiModel: config.models.primary,
        processingTimeMs: responseTime,
        success: true,
        metadata: { cached: true }
      });
      
      return {
        success: true,
        suggestion: (cachedResult.analysisResult as any).suggestion,
        cached: true,
        response_time: responseTime
      };
    }
    
    // 调用Gemini API，添加temperature和其他配置增加创意性
    const model = genAI.getGenerativeModel({ 
      model: config.models.primary,
      generationConfig: {
        temperature: 1.2, // 增加创意性和随机性
        topK: 40,         // 增加词汇选择的多样性
        topP: 0.95,       // 保持连贯性的同时增加随机性
        maxOutputTokens: 2048,
        candidateCount: 1
      }
    });
    
    // 生成随机提示变化
    const currentTime = new Date();
    const timeContext = `当前时间: ${currentTime.toLocaleString()}`;
    const randomLayoutStyles = [
      '极简主义风格', '动态几何风格', '艺术拼贴风格', '现代创意风格', '有机自然风格',
      '工业设计风格', '波普艺术风格', '建筑美学风格', '街头艺术风格', '数字艺术风格'
    ];
    const randomStyle = randomLayoutStyles[Math.floor(Math.random() * randomLayoutStyles.length)];
    
    const creativityPrompts = [
      '创造独特的遮罩形状，让每张图片都有专属的展示窗口',
      '设计有机的挖洞形状，创造流动的视觉节奏',
      '用几何形状创造精确的图片展示区域',
      '通过不规则的遮罩边界创造动态美感',
      '让遮罩形状与图片内容产生呼应关系'
    ];
    const randomCreativityPrompt = creativityPrompts[Math.floor(Math.random() * creativityPrompts.length)];
    
    const prompt = `${timeContext}
    
请为这批图片设计一个${randomStyle}的遮罩拼图布局。${randomCreativityPrompt}

## 🎨 核心概念理解：
**这不是传统的图层叠加拼图！这是遮罩拼图！**

想象一张${params.preferences?.aspect_ratio || '1:1'}比例的纸（画布），我们要在这张纸上挖出${params.images.length}个洞（遮罩区域），然后把图片放到纸的后面，图片只能从洞里露出来。

## 🎯 遮罩拼图规则：
1. **无图层概念**: 图片之间不能重叠，每张图片都在自己的"洞"里
2. **遮罩边界**: 图片内容必须被遮罩完全包含，超出部分不可见
3. **独立空间**: 每个遮罩区域都是独立的，图片可以在遮罩内移动、旋转、缩放
4. **背景可见**: 画布的背景色或纹理在没有挖洞的地方可见
5. **边界清晰**: 遮罩边界就是图片的可见边界，需要精确定义

图片分析数据：
${JSON.stringify(params.images, null, 2)}

用户偏好设置：
${JSON.stringify(params.preferences, null, 2)}

## 🔧 遮罩设计原则：
**每个遮罩区域必须：**
- 有明确的边界定义（使用clip-path）
- 不与其他遮罩区域重叠
- 形状与内容协调
- 尺寸适合图片展示

## 🎪 遮罩形状库（每张图片一个独立遮罩）：
1. **几何形状**: 圆形、矩形、六角形、菱形、三角形
2. **有机形状**: 水滴、叶片、云朵、花瓣
3. **创意形状**: 心形、星形、箭头、对话框
4. **不规则形状**: 撕纸效果、液体形状、抽象曲线

## 📐 遮罩布局模式：
- **网格分割**: 规则的网格，每个格子一个遮罩
- **自由分布**: 遮罩自由分布在画布上，大小不一
- **放射分布**: 从中心向外放射的遮罩布局
- **流动布局**: 遮罩沿着曲线或路径分布
- **几何切分**: 用几何线条将画布切分成遮罩区域

## 🎯 输出格式要求：
{
  "layout_type": "mask_collage",
  "mask_strategy": "网格分割|自由分布|放射分布|流动布局|几何切分",
  "aspect_ratio": "${params.preferences?.aspect_ratio || '1:1'}",
  "canvas_background": {
    "color": "#FFFFFF",
    "texture": "solid|gradient|pattern",
    "style": "简约|艺术|纹理"
  },
  "suggestions": [
    {
      "image_index": 图片索引,
      "mask_region": {
        "shape": "遮罩形状名称",
        "clip_path": "precise CSS clip-path值定义遮罩边界",
        "position": {"x": X坐标百分比, "y": Y坐标百分比, "width": 宽度百分比, "height": 高度百分比}
      },
      "image_transform": {
        "position": {"x": 图片在遮罩内的X偏移, "y": 图片在遮罩内的Y偏移},
        "scale": 图片缩放比例0.8-1.5,
        "rotation": 图片旋转角度-30到30度
      },
      "effects": {
        "border": "遮罩边框样式",
        "shadow": "遮罩阴影效果",
        "glow": "遮罩发光效果"
      }
    }
  ],
  "overall_theme": "整体遮罩拼图的主题和风格",
  "color_scheme": ["背景主色", "遮罩边框色", "强调色"],
  "confidence_score": 0.85-0.95,
  "reasoning": "详细说明这个遮罩拼图设计的创意理念，解释每个遮罩形状的选择原因，以及它们如何协同工作创造统一的视觉效果"
}

## 🚀 设计要求：
- **确保所有遮罩区域不重叠！**
- **每个clip-path都必须精确有效！**
- **遮罩形状要与${randomStyle}风格协调！**
- **图片变换要在遮罩边界内！**

现在，基于以上遮罩拼图概念，为这${params.images.length}张图片生成一个${randomStyle}的遮罩布局设计：`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    let suggestion: LayoutSuggestion;
    
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        suggestion = JSON.parse(jsonMatch[0]);
        
        // 验证和优化suggestion数据 - 确保遮罩拼图逻辑
        if (suggestion.suggestions) {
          suggestion.suggestions = suggestion.suggestions.map(sugg => {
            // 确保遮罩区域不重叠的逻辑
            const maskRegion = (sugg as any).mask_region || {};
            const imageTransform = (sugg as any).image_transform || {};
            
            return {
              ...sugg,
              // 保留遮罩信息
              mask_region: maskRegion,
              image_transform: imageTransform,
              // 确保在遮罩内的变换
              rotation: imageTransform.rotation || (Math.random() * 30 - 15), // 减少旋转幅度
              z_index: 1, // 遮罩拼图中所有图片层级相同
              effects: sugg.effects || []
            };
          });
        }
      } else {
        throw new Error('无法解析AI响应');
      }
    } catch (parseError) {
      // 创建默认的遮罩拼图布局
      const maskShapes = ['circle', 'rounded-rect', 'hexagon', 'diamond'];
      
      suggestion = {
        layout_type: 'mask_collage',
        aspect_ratio: params.preferences?.aspect_ratio || '1:1',
        mask_strategy: '网格分割',
        canvas_background: {
          color: '#FFFFFF',
          texture: 'solid',
          style: '简约'
        },
        suggestions: params.images.map((_, index) => {
          const shape = maskShapes[index % maskShapes.length];
          const row = Math.floor(index / 2);
          const col = index % 2;
          
          // 计算遮罩区域在画布上的位置（像素）
          const canvasWidth = 800; // 默认画布宽度
          const canvasHeight = 800; // 默认画布高度
          const maskWidth = (canvasWidth - 60) / 2; // 留出边距
          const maskHeight = (canvasHeight - 60) / 2;
          const marginX = 20;
          const marginY = 20;
          
          const maskX = marginX + col * (maskWidth + 20);
          const maskY = marginY + row * (maskHeight + 20);
          
          return {
            image_index: index,
            z_index: 1,
            // 遮罩拼图字段
            mask_region: {
              shape: shape,
              clip_path: shape === 'circle' ? 'circle(50%)' : 'none',
              position: { 
                x: maskX, // 遮罩在画布上的绝对位置（像素）
                y: maskY, 
                width: maskWidth, 
                height: maskHeight 
              }
            },
            image_transform: {
              position: { x: 0, y: 0 }, // 图片在遮罩内的偏移
              scale: 1.2, // 稍微放大以避免边缘空白
              rotation: 0
            },
            effects: []
          };
        }),
        overall_theme: `遮罩${randomStyle}布局`,
        color_scheme: ['#FFFFFF', '#E5E7EB', '#3B82F6'],
        confidence_score: 0.75,
        reasoning: `使用遮罩拼图概念，每张图片都有独立的展示窗口，无图层重叠。采用${randomStyle}的设计理念创造视觉和谐。`
      };
    }
    
    const responseTime = Date.now() - startTime;
    
    // 缓存结果 - 添加错误处理，避免缓存失败影响主功能
    try {
      await createAIAnalysisCache({
        cacheKey: cacheKey,
        aiModel: config.models.primary,
        inputData: params.images,
        cacheType: 'layout_suggestion',
        analysisResult: { suggestion },
        confidenceScore: suggestion.confidence_score,
        expiresInDays: config.api.cacheDurationDays
      });
      console.log('✅ 布局建议缓存创建成功');
    } catch (cacheError) {
      console.warn('⚠️  布局建议缓存创建失败，但不影响主功能:', cacheError);
      // 缓存失败不应该影响主功能，继续执行
    }
    
    // 记录使用统计
    await recordAIRequest({
      operationType: 'layout_suggestion',
      aiModel: config.models.primary,
      processingTimeMs: responseTime,
      success: true,
      estimatedCost: parseFloat((0.005).toFixed(4)),
      metadata: { cached: false }
    });
    
    return {
      success: true,
      suggestion,
      cached: false,
      response_time: responseTime
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    const config = getAIConfig();
    
    await recordAIRequest({
      operationType: 'layout_suggestion',
      aiModel: config.models.primary,
      processingTimeMs: responseTime,
      success: false,
      metadata: { cached, error: error instanceof Error ? error.message : '未知错误' }
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : '布局建议生成失败',
      response_time: responseTime
    };
  }
}

// 配色方案生成功能
export async function generateColorScheme(params: {
  images: ImageAnalysisResult[];
  style?: string;
  mood?: string;
}): Promise<{
  success: boolean;
  colorScheme?: ColorScheme;
  error?: string;
  cached?: boolean;
  response_time: number;
}> {
  const startTime = Date.now();
  let cached = false;
  
  try {
    const config = getAIConfig();
    
    // 提取所有图片的颜色信息
    const allColors = params.images.flatMap(img => img.colors);
    const dominantColors = allColors
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 10);
    
    // 生成缓存键
    const cacheKey = generateCacheKey({
      colors: dominantColors,
      style: params.style,
      mood: params.mood,
      type: 'color_scheme'
    });
    
    // 检查缓存
    const cachedResult = await findAIAnalysisCache(cacheKey, 'icon_recommendation'); // 复用icon_recommendation类型
    if (cachedResult) {
      cached = true;
      const responseTime = Date.now() - startTime;
      
      await recordAIRequest({
        operationType: 'icon_recommendation',
        aiModel: config.models.primary,
        processingTimeMs: responseTime,
        success: true,
        metadata: { cached: true }
      });
      
      return {
        success: true,
        colorScheme: (cachedResult.analysisResult as any).colorScheme,
        cached: true,
        response_time: responseTime
      };
    }
    
    // 调用Gemini API
    const model = genAI.getGenerativeModel({ model: config.models.primary });
    
    const prompt = `基于以下图片的主要颜色，生成一个协调的配色方案，以JSON格式返回：

主要颜色：
${JSON.stringify(dominantColors, null, 2)}

风格偏好：${params.style || '无'}
情绪偏好：${params.mood || '无'}

请返回配色方案，格式如下：
{
  "primary_colors": ["#FF0000", "#00FF00"],
  "secondary_colors": ["#FFFF00", "#0000FF"],
  "accent_colors": ["#FF00FF"],
  "background_color": "#FFFFFF",
  "text_color": "#000000",
  "scheme_name": "方案名称",
  "mood": "温暖/冷淡/活泼/沉稳",
  "confidence_score": 0.85
}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    let colorScheme: ColorScheme;
    
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        colorScheme = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('无法解析AI响应');
      }
    } catch (parseError) {
      // 创建默认配色方案
      const primaryColor = dominantColors[0]?.hex || '#3B82F6';
      colorScheme = {
        primary_colors: [primaryColor],
        secondary_colors: ['#FFFFFF', '#F3F4F6'],
        accent_colors: ['#10B981'],
        background_color: '#FFFFFF',
        text_color: '#1F2937',
        scheme_name: '默认配色',
        mood: '平衡',
        confidence_score: 0.5
      };
    }
    
    const responseTime = Date.now() - startTime;
    
    // 缓存结果 - 添加错误处理
    try {
      await createAIAnalysisCache({
        cacheKey: cacheKey,
        aiModel: config.models.primary,
        inputData: params.images,
        cacheType: 'icon_recommendation',
        analysisResult: { colorScheme },
        confidenceScore: colorScheme.confidence_score,
        expiresInDays: config.api.cacheDurationDays
      });
      console.log('✅ 配色方案缓存创建成功');
    } catch (cacheError) {
      console.warn('⚠️  配色方案缓存创建失败，但不影响主功能:', cacheError);
      // 缓存失败不应该影响主功能，继续执行
    }
    
    // 记录使用统计
    await recordAIRequest({
      operationType: 'icon_recommendation',
      aiModel: config.models.primary,
      processingTimeMs: responseTime,
      success: true,
      estimatedCost: parseFloat((0.003).toFixed(4)), // 确保是有效数值，保留4位小数
      metadata: { cached: false }
    });
    
    return {
      success: true,
      colorScheme,
      cached: false,
      response_time: responseTime
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    const config = getAIConfig();
    
    await recordAIRequest({
      operationType: 'icon_recommendation',
      aiModel: config.models.primary,
      processingTimeMs: responseTime,
      success: false,
      metadata: { cached, error: error instanceof Error ? error.message : '未知错误' }
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '配色方案生成失败',
      response_time: responseTime
    };
  }
}

// 一键AI分析功能（组合所有分析）
export async function performCompleteAnalysis(images: Array<{
  data: Buffer | string;
  mimeType: string;
  filename?: string;
}>, preferences?: {
  aspect_ratio?: string;
  style?: string;
  complexity?: 'simple' | 'moderate' | 'complex';
  mood?: string;
}): Promise<{
  success: boolean;
  imageAnalysis?: ImageAnalysisResult[];
  layoutSuggestion?: LayoutSuggestion;
  colorScheme?: ColorScheme;
  error?: string;
  performance: {
    total_time: number;
    analysis_time: number;
    layout_time: number;
    color_time: number;
    cached_operations: string[];
  };
}> {
  const totalStartTime = Date.now();
  
  try {
    // 1. 图片分析
    const analysisStartTime = Date.now();
    const analysisResult = await analyzeImages(images);
    const analysisTime = Date.now() - analysisStartTime;
    
    if (!analysisResult.success || !analysisResult.results) {
      return {
        success: false,
        error: analysisResult.error || '图片分析失败',
        performance: {
          total_time: Date.now() - totalStartTime,
          analysis_time: analysisTime,
          layout_time: 0,
          color_time: 0,
          cached_operations: []
        }
      };
    }
    
    // 2. 布局建议
    const layoutStartTime = Date.now();
    const layoutResult = await suggestLayout({
      images: analysisResult.results,
      preferences
    });
    const layoutTime = Date.now() - layoutStartTime;
    
    // 3. 配色方案
    const colorStartTime = Date.now();
    const colorResult = await generateColorScheme({
      images: analysisResult.results,
      style: preferences?.style,
      mood: preferences?.mood
    });
    const colorTime = Date.now() - colorStartTime;
    
    const cachedOperations: string[] = [];
    if (analysisResult.cached) cachedOperations.push('image_analysis');
    if (layoutResult.cached) cachedOperations.push('layout_suggestion');
    if (colorResult.cached) cachedOperations.push('color_scheme');
    
    return {
      success: true,
      imageAnalysis: analysisResult.results,
      layoutSuggestion: layoutResult.suggestion,
      colorScheme: colorResult.colorScheme,
      performance: {
        total_time: Date.now() - totalStartTime,
        analysis_time: analysisTime,
        layout_time: layoutTime,
        color_time: colorTime,
        cached_operations: cachedOperations
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '完整分析失败',
      performance: {
        total_time: Date.now() - totalStartTime,
        analysis_time: 0,
        layout_time: 0,
        color_time: 0,
        cached_operations: []
      }
    };
  }
} 