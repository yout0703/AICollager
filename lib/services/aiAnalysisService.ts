import { geminiService } from '@/lib/services/core/geminiService';
import { getAIConfig } from '@/lib/ai-config';
import {
  generateCacheKey,
  findAIAnalysisCache,
  createAIAnalysisCache
} from '@/lib/repositories/aiAnalysisCache';
import { recordAIRequest } from '@/lib/repositories/aiUsageStats';
import { AIImageAnalysis, AILayoutSuggestion } from '@/types/collage';

// 使用标准类型定义
export type ImageAnalysisResult = AIImageAnalysis;
export type LayoutSuggestion = AILayoutSuggestion;

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



// 错误处理类型定义
export interface ProcessingError {
  stage: 'analysis' | 'layout' | 'color';
  error: string;
  fallbackUsed: boolean;
}

// 导入 Prompt 模板管理系统
import {
  generateImageAnalysisPrompt,
  generateLayoutSuggestionPrompt,
  generateColorSchemePrompt,
  getRandomDesignStyle,
  PROMPT_TEMPLATE_VERSION
} from '@/lib/prompts/templates';

// 导入 Schema 验证
import {
  safeValidateImageAnalysis,
  safeValidateLayoutSuggestion,
  safeValidateColorScheme
} from '@/lib/schemas/aiResponseSchemas';

// 导入 Prompt 配置
import {
  DEBUG_CONFIG,
  getPromptConfigSummary
} from '@/lib/prompts/config';

/**
 * 降级处理管理器
 */
class FallbackManager {
  static createFallbackAnalysis(images: Array<{data: Buffer | string; mimeType: string; filename?: string}>): ImageAnalysisResult[] {
    return images.map((_, index) => ({
      description: `图片 ${index + 1} - 基础分析`,
      objects: [],
      colors: [
        { color: '主色调', percentage: 40, hex: '#808080' },
        { color: '辅色调', percentage: 30, hex: '#CCCCCC' },
        { color: '强调色', percentage: 30, hex: '#4A90E2' }
      ],
      style: {
        type: 'photo',
        mood: 'neutral',
        composition: 'balanced'
      },
      themes: ['通用'],
      keywords: ['图片', '内容'],
      confidence_score: 0.5
    }));
  }

  static createDefaultLayout(imageCount: number, aspectRatio: string = '1:1'): LayoutSuggestion {
    const maskShapes = ['circle', 'rounded-rect', 'hexagon', 'diamond'];

    return {
      layout_type: 'mask_collage',
      aspect_ratio: aspectRatio,
      mask_strategy: '网格分割',
      canvas_background: {
        color: '#FFFFFF',
        texture: 'solid',
        style: '简约'
      },
      suggestions: Array.from({ length: imageCount }, (_, index) => {
        const shape = maskShapes[index % maskShapes.length];
        const gridSize = Math.ceil(Math.sqrt(imageCount));
        const row = Math.floor(index / gridSize);
        const col = index % gridSize;

        const canvasSize = 800;
        const cellSize = (canvasSize - 40) / gridSize;
        const margin = 20;

        return {
          imageIndex: index,
          z_index: 1,
          mask_region: {
            shape: shape,
            clip_path: shape === 'circle' ? 'circle(40%)' : 'inset(5% round 10px)',
            position: {
              x: margin + col * cellSize,
              y: margin + row * cellSize,
              width: cellSize - 10,
              height: cellSize - 10
            }
          },
          image_transform: {
            position: { x: 0, y: 0 },
            scale: 1.1,
            rotation: 0
          },
          effects: [],
          opacity: 1.0,
          borderRadius: 0
        };
      }),
      overall_theme: '默认网格布局',
      color_scheme: ['#FFFFFF', '#E5E7EB', '#3B82F6'],
      confidence_score: 0.6,
      reasoning: '使用默认网格布局作为降级方案，确保基本可用性。'
    };
  }

  static createDefaultColorScheme(): ColorScheme {
    return {
      primary_colors: ['#3B82F6', '#1E40AF'],
      secondary_colors: ['#FFFFFF', '#F3F4F6', '#E5E7EB'],
      accent_colors: ['#10B981', '#F59E0B'],
      background_color: '#FFFFFF',
      text_color: '#1F2937',
      scheme_name: '默认配色方案',
      mood: '平衡',
      confidence_score: 0.5
    };
  }
}

/**
 * AI 分析服务 - 业务逻辑层
 * 包含缓存管理、降级处理、统计记录等业务逻辑
 */
export class AIAnalysisService {
  private static instance: AIAnalysisService;

  private constructor() {
    // 输出 Prompt 管理系统信息
    if (DEBUG_CONFIG.VERBOSE_LOGGING) {
      const config = getPromptConfigSummary();
      console.log('🎯 AI分析服务初始化');
      console.log('📋 Prompt模板版本:', PROMPT_TEMPLATE_VERSION.version);
      console.log('⚙️ 配置摘要:', config);
    }
  }

  static getInstance(): AIAnalysisService {
    if (!AIAnalysisService.instance) {
      AIAnalysisService.instance = new AIAnalysisService();
    }
    return AIAnalysisService.instance;
  }

  /**
   * 图片分析 - 包含完整业务逻辑
   */
  async analyzeImages(images: Array<{
    data: Buffer | string;
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

      // 调用 Gemini API
      const results: ImageAnalysisResult[] = [];
                const prompt = generateImageAnalysisPrompt();

      for (const image of images) {
        try {
          const imageData = typeof image.data === 'string' ? image.data : image.data.toString('base64');

          const geminiResponse = await geminiService.analyzeSingleImage({
            data: imageData,
            mimeType: image.mimeType
          }, prompt);

          if (geminiResponse.success) {
            // 增强JSON解析逻辑 + Schema验证
            const parseAnalysisResponse = (text: string): ImageAnalysisResult | null => {
              const extractors = [
                /```json\s*(\{[\s\S]*?\})\s*```/i,
                /```\s*(\{[\s\S]*?\})\s*```/i,
                /\{[\s\S]*\}/,
                /(\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})/
              ];

              for (const regex of extractors) {
                const matches = text.match(regex);
                if (matches) {
                  const jsonStr = matches[1] || matches[0];
                  try {
                    const parsed = JSON.parse(jsonStr);
                    if (parsed && typeof parsed === 'object') {

                      // 使用 Zod Schema 验证
                      const validation = safeValidateImageAnalysis(parsed);
                      if (validation.success) {
                        if (DEBUG_CONFIG.VERBOSE_LOGGING) {
                          console.log('✅ 图片分析 Schema 验证通过');
                        }
                        return validation.data;
                      } else {
                        console.warn('❌ 图片分析 Schema 验证失败:', validation.error.issues);

                        // 降级处理：确保必要字段存在
                        const fallback = {
                          description: parsed.description || '图片分析',
                          objects: parsed.objects || [],
                          colors: parsed.colors || [],
                          style: parsed.style || { type: 'photo', mood: 'neutral', composition: 'balanced' },
                          themes: parsed.themes || ['通用'],
                          keywords: parsed.keywords || ['内容'],
                          confidence_score: parsed.confidence_score || 0.7
                        };

                        if (DEBUG_CONFIG.VERBOSE_LOGGING) {
                          console.log('🔄 使用降级分析结果');
                        }
                        return fallback;
                      }
                    }
                  } catch (parseError) {
                    console.warn('图片分析JSON解析失败:', parseError);
                    continue;
                  }
                }
              }
              return null;
            };

            const parsedResult = parseAnalysisResponse(geminiResponse.text);
            if (parsedResult) {
              results.push(parsedResult);
            } else {
              console.warn('图片分析响应解析失败，原始响应:', geminiResponse.text.substring(0, 200));
              throw new Error(`无法解析图片分析响应。响应长度: ${geminiResponse.text.length}`);
            }
          } else {
            throw new Error(geminiResponse.error || 'Gemini API调用失败');
          }

        } catch (imageError) {
          console.warn(`单张图片分析失败，使用降级分析:`, imageError);
          // 单张图片失败时使用降级分析
          results.push(FallbackManager.createFallbackAnalysis([image])[0]);
        }
      }

      const responseTime = Date.now() - startTime;

      // 缓存结果
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
      }

      // 记录使用统计
      await recordAIRequest({
        operationType: 'image_analysis',
        aiModel: config.models.primary,
        processingTimeMs: responseTime,
        success: true,
        estimatedCost: parseFloat((images.length * 0.01).toFixed(4)),
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

      console.warn('图片分析完全失败，使用降级方案:', error);

      // 完全失败时返回降级分析结果
      const fallbackResults = FallbackManager.createFallbackAnalysis(images);

      const config = getAIConfig();

      // 记录失败统计，但返回成功（因为有降级方案）
      await recordAIRequest({
        operationType: 'image_analysis',
        aiModel: config.models.primary,
        processingTimeMs: responseTime,
        success: true, // 改为true，因为有降级方案
        metadata: {
          cached: false,
          fallback: true,
          error: error instanceof Error ? error.message : '未知错误'
        }
      });

      return {
        success: true, // 改为true
        results: fallbackResults,
        error: `AI分析失败，已使用基础分析: ${error instanceof Error ? error.message : '未知错误'}`,
        response_time: responseTime
      };
    }
  }

  /**
   * 布局建议 - 包含完整业务逻辑
   */
  async suggestLayout(params: {
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

    try {
      const config = getAIConfig();

      // 生成缓存键
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

      // 多样性缓存策略：降低缓存命中率
      const shouldUseCache = Math.random() > 0.3;
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

      try {
        // 生成提示词
        const randomStyle = getRandomDesignStyle();

        const prompt = generateLayoutSuggestionPrompt({
          images: params.images,
          aspectRatio: params.preferences?.aspect_ratio || '1:1',
          style: randomStyle,
          imageCount: params.images.length
        });

        // 调用 Gemini API
        console.log('🤖 发送给Gemini的prompt长度:', prompt.length);
        console.log('📝 Prompt内容预览:', prompt.substring(0, 200) + '...');

        const geminiResponse = await geminiService.generateText({ prompt });

        console.log('📊 Gemini API 响应状态:', {
          success: geminiResponse.success,
          textLength: geminiResponse.text.length,
          processingTime: geminiResponse.processingTime,
          error: geminiResponse.error
        });

        if (!geminiResponse.success) {
          throw new Error(geminiResponse.error || 'Gemini API调用失败');
        }

        if (!geminiResponse.text || geminiResponse.text.trim().length === 0) {
          throw new Error('Gemini返回了空响应，可能是API配额不足或模型配置错误');
        }

        let suggestion: LayoutSuggestion;

        // 增强AI响应解析逻辑 + Schema验证
        const parseAIResponse = (text: string): LayoutSuggestion | null => {
          // 尝试多种JSON提取方法
          const extractors = [
            // 标准的JSON块匹配
            /```json\s*(\{[\s\S]*?\})\s*```/i,
            // 代码块中的JSON
            /```\s*(\{[\s\S]*?\})\s*```/i,
            // 直接的JSON对象
            /\{[\s\S]*\}/,
            // 更宽松的匹配
            /(\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})/g
          ];

          for (const regex of extractors) {
            const matches = text.match(regex);
            if (matches) {
              const jsonStr = matches[1] || matches[0];
              try {
                const parsed = JSON.parse(jsonStr);
                if (parsed && typeof parsed === 'object') {

                  // 使用 Zod Schema 验证
                  const validation = safeValidateLayoutSuggestion(parsed);
                  if (validation.success) {
                    if (DEBUG_CONFIG.VERBOSE_LOGGING) {
                      console.log('✅ 布局建议 Schema 验证通过');
                    }
                    return validation.data;
                  } else {
                    console.warn('❌ 布局建议 Schema 验证失败:', validation.error.issues);

                    // 降级处理：返回原始解析结果（后续会有数据清理）
                    if (DEBUG_CONFIG.VERBOSE_LOGGING) {
                      console.log('🔄 使用降级布局解析');
                    }
                    return parsed;
                  }
                }
              } catch (parseError) {
                console.warn('JSON解析失败:', parseError);
                continue;
              }
            }
          }
          return null;
        };

        const parsedSuggestion = parseAIResponse(geminiResponse.text);

        if (parsedSuggestion) {
          suggestion = parsedSuggestion;

          // 优化suggestion数据，确保必要字段存在
          suggestion.layout_type = suggestion.layout_type || 'mask_collage';
          suggestion.aspect_ratio = suggestion.aspect_ratio || params.preferences?.aspect_ratio || '1:1';
          suggestion.mask_strategy = suggestion.mask_strategy || '智能布局';
          suggestion.confidence_score = suggestion.confidence_score || 0.7;
          suggestion.reasoning = suggestion.reasoning || '基于AI智能分析生成的布局';

          if (suggestion.suggestions) {
            suggestion.suggestions = suggestion.suggestions.map((sugg, index) => {
              const maskRegion = (sugg as any).mask_region || {};
              const imageTransform = (sugg as any).image_transform || {};

              return {
                ...sugg,
                imageIndex: sugg.imageIndex !== undefined ? sugg.imageIndex : index,
                mask_region: {
                  shape: maskRegion.shape || 'rounded-rect',
                  clip_path: maskRegion.clip_path || 'inset(5% round 10px)',
                  position: maskRegion.position || { x: 50, y: 50, width: 200, height: 200 }
                },
                image_transform: {
                  position: imageTransform.position || { x: 0, y: 0 },
                  scale: imageTransform.scale || 1.1,
                  rotation: imageTransform.rotation || (Math.random() * 30 - 15)
                },
                z_index: sugg.z_index || 1,
                effects: sugg.effects || []
              };
            });
          } else {
            // 如果没有suggestions数组，创建默认的
            suggestion.suggestions = [];
          }
        } else {
          // 记录原始响应以便调试
          console.error('AI响应解析失败，原始响应:', geminiResponse.text.substring(0, 500));
          throw new Error(`无法解析AI响应。响应长度: ${geminiResponse.text.length}, 前100字符: ${geminiResponse.text.substring(0, 100)}`);
        }

        const responseTime = Date.now() - startTime;

        // 缓存结果
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
        } catch (cacheError) {
          console.warn('⚠️  布局建议缓存创建失败，但不影响主功能:', cacheError);
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

      } catch (aiError) {
        console.warn('AI布局生成失败，使用默认布局:', aiError);

        // AI失败时使用默认布局
        const defaultSuggestion = FallbackManager.createDefaultLayout(
          params.images.length,
          params.preferences?.aspect_ratio
        );

        const responseTime = Date.now() - startTime;

        await recordAIRequest({
          operationType: 'layout_suggestion',
          aiModel: config.models.primary,
          processingTimeMs: responseTime,
          success: true,
          metadata: {
            cached: false,
            fallback: true,
            error: aiError instanceof Error ? aiError.message : '未知错误'
          }
        });

        return {
          success: true,
          suggestion: defaultSuggestion,
          error: `AI布局失败，已使用默认布局: ${aiError instanceof Error ? aiError.message : '未知错误'}`,
          cached: false,
          response_time: responseTime
        };
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;

      console.warn('布局建议功能完全失败，使用降级方案:', error);

      // 完全失败时使用默认布局
      const fallbackSuggestion = FallbackManager.createDefaultLayout(
        params.images.length,
        params.preferences?.aspect_ratio
      );

      const config = getAIConfig();

      await recordAIRequest({
        operationType: 'layout_suggestion',
        aiModel: config.models.primary,
        processingTimeMs: responseTime,
        success: true,
        metadata: {
          cached: false,
          fallback: true,
          error: error instanceof Error ? error.message : '未知错误'
        }
      });

      return {
        success: true,
        suggestion: fallbackSuggestion,
        error: `布局功能失败，已使用默认方案: ${error instanceof Error ? error.message : '未知错误'}`,
        response_time: responseTime
      };
    }
  }

  /**
   * 配色方案生成 - 包含完整业务逻辑
   */
  async generateColorScheme(params: {
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

    try {
      const config = getAIConfig();

      // 提取图片颜色信息
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
      const cachedResult = await findAIAnalysisCache(cacheKey, 'icon_recommendation');
      if (cachedResult) {
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

      try {
        // 调用 Gemini API
        const prompt = generateColorSchemePrompt(dominantColors, params.style, params.mood);
        const geminiResponse = await geminiService.generateText({ prompt });

        if (!geminiResponse.success) {
          throw new Error(geminiResponse.error || 'Gemini API调用失败');
        }

        let colorScheme: ColorScheme;

        // 增强配色方案响应解析 + Schema验证
        const parseColorResponse = (text: string): ColorScheme | null => {
          const extractors = [
            /```json\s*(\{[\s\S]*?\})\s*```/i,
            /```\s*(\{[\s\S]*?\})\s*```/i,
            /\{[\s\S]*\}/,
            /(\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})/
          ];

          for (const regex of extractors) {
            const matches = text.match(regex);
            if (matches) {
              const jsonStr = matches[1] || matches[0];
              try {
                const parsed = JSON.parse(jsonStr);
                if (parsed && typeof parsed === 'object') {

                  // 使用 Zod Schema 验证
                  const validation = safeValidateColorScheme(parsed);
                  if (validation.success) {
                    if (DEBUG_CONFIG.VERBOSE_LOGGING) {
                      console.log('✅ 配色方案 Schema 验证通过');
                    }
                    return validation.data;
                  } else {
                    console.warn('❌ 配色方案 Schema 验证失败:', validation.error.issues);

                    // 降级处理：确保配色方案必要字段存在
                    const fallback = {
                      primary_colors: parsed.primary_colors || ['#3B82F6'],
                      secondary_colors: parsed.secondary_colors || ['#FFFFFF', '#F3F4F6'],
                      accent_colors: parsed.accent_colors || ['#10B981'],
                      background_color: parsed.background_color || '#FFFFFF',
                      text_color: parsed.text_color || '#1F2937',
                      scheme_name: parsed.scheme_name || '智能配色',
                      mood: parsed.mood || '平衡',
                      confidence_score: parsed.confidence_score || 0.7
                    };

                    if (DEBUG_CONFIG.VERBOSE_LOGGING) {
                      console.log('🔄 使用降级配色方案');
                    }
                    return fallback;
                  }
                }
              } catch (parseError) {
                console.warn('配色方案JSON解析失败:', parseError);
                continue;
              }
            }
          }
          return null;
        };

        const parsedColorScheme = parseColorResponse(geminiResponse.text);
        if (parsedColorScheme) {
          colorScheme = parsedColorScheme;
        } else {
          console.warn('配色方案响应解析失败，原始响应:', geminiResponse.text.substring(0, 200));
          throw new Error(`无法解析配色方案响应。响应长度: ${geminiResponse.text.length}`);
        }

        const responseTime = Date.now() - startTime;

        // 缓存结果
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
        } catch (cacheError) {
          console.warn('⚠️  配色方案缓存创建失败，但不影响主功能:', cacheError);
        }

        // 记录使用统计
        await recordAIRequest({
          operationType: 'icon_recommendation',
          aiModel: config.models.primary,
          processingTimeMs: responseTime,
          success: true,
          estimatedCost: parseFloat((0.003).toFixed(4)),
          metadata: { cached: false }
        });

        return {
          success: true,
          colorScheme,
          cached: false,
          response_time: responseTime
        };

      } catch (aiError) {
        console.warn('AI配色生成失败，使用默认配色:', aiError);

        // AI失败时创建基于图片主色的默认配色
        const primaryColor = dominantColors[0]?.hex || '#3B82F6';
        const defaultColorScheme = {
          primary_colors: [primaryColor],
          secondary_colors: ['#FFFFFF', '#F3F4F6'],
          accent_colors: ['#10B981'],
          background_color: '#FFFFFF',
          text_color: '#1F2937',
          scheme_name: '默认配色',
          mood: '平衡',
          confidence_score: 0.5
        };

        const responseTime = Date.now() - startTime;

        await recordAIRequest({
          operationType: 'icon_recommendation',
          aiModel: config.models.primary,
          processingTimeMs: responseTime,
          success: true,
          metadata: {
            cached: false,
            fallback: true,
            error: aiError instanceof Error ? aiError.message : '未知错误'
          }
        });

        return {
          success: true,
          colorScheme: defaultColorScheme,
          error: `AI配色失败，已使用默认配色: ${aiError instanceof Error ? aiError.message : '未知错误'}`,
          cached: false,
          response_time: responseTime
        };
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;

      console.warn('配色方案功能完全失败，使用降级方案:', error);

      // 完全失败时使用默认配色
      const fallbackColorScheme = FallbackManager.createDefaultColorScheme();

      const config = getAIConfig();

      await recordAIRequest({
        operationType: 'icon_recommendation',
        aiModel: config.models.primary,
        processingTimeMs: responseTime,
        success: true,
        metadata: {
          cached: false,
          fallback: true,
          error: error instanceof Error ? error.message : '未知错误'
        }
      });

      return {
        success: true,
        colorScheme: fallbackColorScheme,
        error: `配色功能失败，已使用默认方案: ${error instanceof Error ? error.message : '未知错误'}`,
        response_time: responseTime
      };
    }
  }

  /**
   * 一键AI分析功能 - 渐进式错误处理
   */
  async performCompleteAnalysis(images: Array<{
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
    warnings?: ProcessingError[];
    performance: {
      total_time: number;
      analysis_time: number;
      layout_time: number;
      color_time: number;
      cached_operations: string[];
    };
  }> {
    const totalStartTime = Date.now();
    const warnings: ProcessingError[] = [];

    let imageAnalysis: ImageAnalysisResult[] | undefined;
    let layoutSuggestion: LayoutSuggestion | undefined;
    let colorScheme: ColorScheme | undefined;

    // 第一阶段：图片分析（最重要，必须成功）
    const analysisStartTime = Date.now();
    try {
      const analysisResult = await this.analyzeImages(images);
      imageAnalysis = analysisResult.results;

      if (analysisResult.error) {
        warnings.push({
          stage: 'analysis',
          error: analysisResult.error,
          fallbackUsed: true
        });
      }
    } catch (error) {
      console.error('图片分析阶段失败:', error);
      imageAnalysis = FallbackManager.createFallbackAnalysis(images);
      warnings.push({
        stage: 'analysis',
        error: error instanceof Error ? error.message : '图片分析失败',
        fallbackUsed: true
      });
    }
    const analysisTime = Date.now() - analysisStartTime;

    // 第二阶段：布局建议（重要，但可降级）
    const layoutStartTime = Date.now();
    try {
      if (imageAnalysis) {
        const layoutResult = await this.suggestLayout({
          images: imageAnalysis,
          preferences
        });
        layoutSuggestion = layoutResult.suggestion;

        if (layoutResult.error) {
          warnings.push({
            stage: 'layout',
            error: layoutResult.error,
            fallbackUsed: true
          });
        }
      }
    } catch (error) {
      console.warn('布局建议阶段失败:', error);
      layoutSuggestion = FallbackManager.createDefaultLayout(
        images.length,
        preferences?.aspect_ratio
      );
      warnings.push({
        stage: 'layout',
        error: error instanceof Error ? error.message : '布局建议失败',
        fallbackUsed: true
      });
    }
    const layoutTime = Date.now() - layoutStartTime;

    // 第三阶段：配色方案（可选，可降级）
    const colorStartTime = Date.now();
    try {
      if (imageAnalysis) {
        const colorResult = await this.generateColorScheme({
          images: imageAnalysis,
          style: preferences?.style,
          mood: preferences?.mood
        });
        colorScheme = colorResult.colorScheme;

        if (colorResult.error) {
          warnings.push({
            stage: 'color',
            error: colorResult.error,
            fallbackUsed: true
          });
        }
      }
    } catch (error) {
      console.warn('配色方案阶段失败:', error);
      colorScheme = FallbackManager.createDefaultColorScheme();
      warnings.push({
        stage: 'color',
        error: error instanceof Error ? error.message : '配色方案失败',
        fallbackUsed: true
      });
    }
    const colorTime = Date.now() - colorStartTime;

    // 统计缓存使用情况
    const cachedOperations: string[] = [];

    const totalSuccess = imageAnalysis !== undefined &&
                        layoutSuggestion !== undefined &&
                        colorScheme !== undefined;

    return {
      success: totalSuccess,
      imageAnalysis,
      layoutSuggestion,
      colorScheme,
      warnings: warnings.length > 0 ? warnings : undefined,
      performance: {
        total_time: Date.now() - totalStartTime,
        analysis_time: analysisTime,
        layout_time: layoutTime,
        color_time: colorTime,
        cached_operations: cachedOperations
      }
    };
  }
}

// 导出单例实例 - 推荐使用方式
export const aiAnalysisService = AIAnalysisService.getInstance();

// 便捷函数导出
export const analyzeImages = (images: Array<{data: Buffer | string; mimeType: string; filename?: string}>) =>
  aiAnalysisService.analyzeImages(images);

export const suggestLayout = (params: Parameters<typeof aiAnalysisService.suggestLayout>[0]) =>
  aiAnalysisService.suggestLayout(params);

export const generateColorScheme = (params: Parameters<typeof aiAnalysisService.generateColorScheme>[0]) =>
  aiAnalysisService.generateColorScheme(params);

export const performCompleteAnalysis = (images: Array<{data: Buffer | string; mimeType: string; filename?: string}>, preferences?: any) =>
  aiAnalysisService.performCompleteAnalysis(images, preferences);
