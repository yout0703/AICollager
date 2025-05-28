import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAIConfig } from '@/lib/ai-config';
import {
  generateCacheKey,
  findAIAnalysisCache,
  createAIAnalysisCache,
  AIAnalysisCache
} from '@/models/aiAnalysisCache';
import { recordAIRequest } from '@/models/aiUsageStats';

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
  layout_type: 'grid' | 'freeform' | 'masonry' | 'linear' | 'circular';
  grid_rows?: number;
  grid_cols?: number;
  aspect_ratio: string;
  suggestions: Array<{
    image_index: number;
    position: { x: number; y: number; width: number; height: number };
    z_index: number;
    rotation?: number;
    effects?: string[];
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
        type: 'image_analysis',
        success: true,
        cached: true,
        response_time: responseTime
      });
      
      return {
        success: true,
        results: cachedResult.analysis_result.results,
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
        console.error('Failed to parse AI response:', parseError);
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
    
    // 缓存结果
    await createAIAnalysisCache({
      cache_key: cacheKey,
      cache_type: 'image_analysis',
      ai_model: config.models.primary,
      analysis_result: { results },
      confidence_score: results.reduce((sum, r) => sum + r.confidence_score, 0) / results.length,
      expires_days: config.api.cacheDurationDays
    });
    
    // 记录使用统计
    await recordAIRequest({
      type: 'image_analysis',
      success: true,
      cached: false,
      response_time: responseTime,
      estimated_cost: images.length * 0.01 // 估算成本
    });
    
    return {
      success: true,
      results,
      cached: false,
      response_time: responseTime
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Image analysis failed:', error);
    
    // 记录失败统计
    await recordAIRequest({
      type: 'image_analysis',
      success: false,
      cached,
      response_time: responseTime
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
    
    // 生成缓存键
    const cacheKey = generateCacheKey({
      images: params.images,
      preferences: params.preferences,
      type: 'layout_suggestion'
    });
    
    // 检查缓存
    const cachedResult = await findAIAnalysisCache(cacheKey, 'layout_suggestion');
    if (cachedResult) {
      cached = true;
      const responseTime = Date.now() - startTime;
      
      await recordAIRequest({
        type: 'layout_suggestion',
        success: true,
        cached: true,
        response_time: responseTime
      });
      
      return {
        success: true,
        suggestion: cachedResult.analysis_result.suggestion,
        cached: true,
        response_time: responseTime
      };
    }
    
    // 调用Gemini API
    const model = genAI.getGenerativeModel({ model: config.models.primary });
    
    const prompt = `基于以下图片分析结果，为拼图布局提供建议，以JSON格式返回：

图片分析：
${JSON.stringify(params.images, null, 2)}

用户偏好：
${JSON.stringify(params.preferences, null, 2)}

请返回布局建议，格式如下：
{
  "layout_type": "grid/freeform/masonry/linear/circular",
  "grid_rows": 2,
  "grid_cols": 2,
  "aspect_ratio": "1:1",
  "suggestions": [
    {
      "image_index": 0,
      "position": {"x": 0, "y": 0, "width": 50, "height": 50},
      "z_index": 1,
      "rotation": 0,
      "effects": ["shadow", "border"]
    }
  ],
  "overall_theme": "主题描述",
  "color_scheme": ["#FF0000", "#00FF00"],
  "confidence_score": 0.85,
  "reasoning": "布局建议的理由"
}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    let suggestion: LayoutSuggestion;
    
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        suggestion = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('无法解析AI响应');
      }
    } catch (parseError) {
      console.error('Failed to parse layout suggestion:', parseError);
      // 创建默认布局建议
      suggestion = {
        layout_type: 'grid',
        grid_rows: 2,
        grid_cols: 2,
        aspect_ratio: params.preferences?.aspect_ratio || '1:1',
        suggestions: params.images.map((_, index) => ({
          image_index: index,
          position: { x: (index % 2) * 50, y: Math.floor(index / 2) * 50, width: 50, height: 50 },
          z_index: 1
        })),
        overall_theme: '自动布局',
        color_scheme: ['#FFFFFF', '#000000'],
        confidence_score: 0.5,
        reasoning: '默认网格布局'
      };
    }
    
    const responseTime = Date.now() - startTime;
    
    // 缓存结果
    await createAIAnalysisCache({
      cache_key: cacheKey,
      cache_type: 'layout_suggestion',
      ai_model: config.models.primary,
      analysis_result: { suggestion },
      confidence_score: suggestion.confidence_score,
      expires_days: config.api.cacheDurationDays
    });
    
    // 记录使用统计
    await recordAIRequest({
      type: 'layout_suggestion',
      success: true,
      cached: false,
      response_time: responseTime,
      estimated_cost: 0.005 // 估算成本
    });
    
    return {
      success: true,
      suggestion,
      cached: false,
      response_time: responseTime
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Layout suggestion failed:', error);
    
    await recordAIRequest({
      type: 'layout_suggestion',
      success: false,
      cached,
      response_time: responseTime
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
        type: 'icon_recommendation',
        success: true,
        cached: true,
        response_time: responseTime
      });
      
      return {
        success: true,
        colorScheme: cachedResult.analysis_result.colorScheme,
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
      console.error('Failed to parse color scheme:', parseError);
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
    
    // 缓存结果
    await createAIAnalysisCache({
      cache_key: cacheKey,
      cache_type: 'icon_recommendation',
      ai_model: config.models.primary,
      analysis_result: { colorScheme },
      confidence_score: colorScheme.confidence_score,
      expires_days: config.api.cacheDurationDays
    });
    
    // 记录使用统计
    await recordAIRequest({
      type: 'icon_recommendation',
      success: true,
      cached: false,
      response_time: responseTime,
      estimated_cost: 0.003 // 估算成本
    });
    
    return {
      success: true,
      colorScheme,
      cached: false,
      response_time: responseTime
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Color scheme generation failed:', error);
    
    await recordAIRequest({
      type: 'icon_recommendation',
      success: false,
      cached,
      response_time: responseTime
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
    console.error('Complete analysis failed:', error);
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