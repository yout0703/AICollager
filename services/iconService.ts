import {
  findIconById,
  findIconsByIds,
  findIconsByCategory,
  searchIcons,
  updateIconUsage,
  updateMultipleIconUsage,
  getPopularIcons,
  getIconStats,
  createIcon,
  IconModel,
  IconCategoryModel
} from '@/lib/repositories/icons';

import {
  getAllIconCategories,
  getTopLevelCategories,
  getCategoryTree,
  searchIconCategories,
  updateCategoryUsage,
  updateCategoryIconCount,
  getCategoryStats
} from '@/lib/repositories/icons';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAIConfig } from '@/lib/ai-config';
import { generateCacheKey, findAIAnalysisCache, createAIAnalysisCache } from '@/lib/repositories/aiAnalysisCache';
import { recordAIRequest } from '@/lib/repositories/aiUsageStats';
import { Icon, IconCategory, IconSearchRequest, IconRecommendationRequest } from '@/types/icons';

// 初始化Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// 类型转换工具函数
function convertIconModelToIcon(iconModel: IconModel): Icon {
  return {
    id: iconModel.id,
    uuid: iconModel.uuid,
    icon_id: iconModel.iconId,
    icon_name: iconModel.iconName,
    category_id: iconModel.categoryId,
    svg_content: iconModel.svgContent,
    style: iconModel.style,
    size_variants: [iconModel.size],
    color_variants: ['currentColor'],
    tags: iconModel.tags,
    ai_keywords: iconModel.keywords || iconModel.aiTags,
    semantic_meaning: '',
    ai_description: '',
    popularity_score: iconModel.popularityScore,
    usage_count: iconModel.usageCount,
    last_used_at: iconModel.updatedAt,
    is_active: true,
    is_premium: false,
    source: '',
    version: '1.0.0',
    license: 'MIT',
    metadata: iconModel.metadata,
    created_at: iconModel.createdAt,
    updated_at: iconModel.updatedAt
  };
}

function convertIconCategoryModelToIconCategory(categoryModel: IconCategoryModel): IconCategory {
  return {
    id: categoryModel.id,
    uuid: categoryModel.uuid,
    category_id: categoryModel.categoryId,
    category_name: categoryModel.categoryName,
    parent_category_id: categoryModel.parentCategoryId,
    description: categoryModel.description,
    ai_description: categoryModel.aiDescription,
    ai_keywords: categoryModel.aiKeywords,
    display_order: categoryModel.displayOrder,
    icon_color: categoryModel.iconColor,
    is_active: categoryModel.isActive,
    icon_count: categoryModel.iconCount,
    usage_count: categoryModel.usageCount,
    created_at: categoryModel.createdAt,
    updated_at: categoryModel.updatedAt
  };
}

export class IconService {
  
  // 获取Icon分类列表
  static async getCategories(options: {
    include_count?: boolean;
    tree_structure?: boolean;
  } = {}): Promise<IconCategory[] | (IconCategory & { children: IconCategory[] })[]> {
    try {
      if (options.tree_structure) {
        const tree = await getCategoryTree();
        return tree.map((item: any) => ({
          ...convertIconCategoryModelToIconCategory(item),
          children: item.children?.map((child: IconCategoryModel) => convertIconCategoryModelToIconCategory(child)) || []
        }));
      } else {
        const categories = await getTopLevelCategories({ include_count: options.include_count });
        return categories.map(convertIconCategoryModelToIconCategory);
      }
    } catch (error) {
      console.error('Get categories failed:', error);
      return [];
    }
  }
  
  // 搜索Icons
  static async searchIcons(request: IconSearchRequest): Promise<{
    success: boolean;
    icons?: Icon[];
    total?: number;
    suggestions?: string[];
    categories?: IconCategory[];
    error?: string;
  }> {
    try {
      const searchResult = await searchIcons({
        query: request.query,
        category_id: request.category_id,
        style: request.style,
        tags: request.tags,
        is_premium: request.is_premium,
        limit: request.limit || 20,
        offset: request.offset || 0
      });
      
      // 获取相关分类信息
      let categories: IconCategory[] = [];
      if (request.query || request.tags) {
        const categoryModels = await searchIconCategories({
          query: request.query,
          ai_keywords: request.tags,
          limit: 10
        });
        categories = categoryModels.map(convertIconCategoryModelToIconCategory);
      }
      
      return {
        success: true,
        icons: searchResult.icons.map(convertIconModelToIcon),
        total: searchResult.total,
        suggestions: searchResult.suggestions,
        categories
      };
      
    } catch (error) {
      console.error('Search icons failed:', error);
      return {
        success: false,
        error: '搜索图标失败'
      };
    }
  }
  
  // 按分类获取Icons
  static async getIconsByCategory(categoryId: string, options: {
    style?: Icon['style'];
    is_premium?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<{
    success: boolean;
    icons?: Icon[];
    total?: number;
    category?: IconCategory;
    error?: string;
  }> {
    try {
      const result = await findIconsByCategory(categoryId, options);
      
      // 更新分类使用统计
      await updateCategoryUsage(categoryId);
      
      // 获取分类信息
      const { findIconCategoryById } = await import('@/lib/repositories/icons');
      const categoryModel = await findIconCategoryById(categoryId);
      const category = categoryModel ? convertIconCategoryModelToIconCategory(categoryModel) : undefined;
      
      return {
        success: true,
        icons: result.icons.map(convertIconModelToIcon),
        total: result.total,
        category
      };
      
    } catch (error) {
      console.error('Get icons by category failed:', error);
      return {
        success: false,
        error: '获取分类图标失败'
      };
    }
  }
  
  // 获取受欢迎的Icons
  static async getPopularIcons(params: {
    category_id?: string;
    limit?: number;
    days?: number;
  } = {}): Promise<{
    success: boolean;
    icons?: Icon[];
    error?: string;
  }> {
    try {
      const iconModels = await getPopularIcons(params);
      
      return {
        success: true,
        icons: iconModels.map(convertIconModelToIcon)
      };
      
    } catch (error) {
      console.error('Get popular icons failed:', error);
      return {
        success: false,
        error: '获取热门图标失败'
      };
    }
  }
  
  // AI智能推荐Icons
  static async recommendIcons(request: IconRecommendationRequest): Promise<{
    success: boolean;
    recommendations?: Array<{
      icon: Icon;
      score: number;
      reason: string;
    }>;
    performance?: {
      response_time: number;
      cached: boolean;
    };
    error?: string;
  }> {
    const startTime = Date.now();
    let cached = false;
    
    try {
      const config = getAIConfig();
      
      // 生成缓存键
      const cacheKey = generateCacheKey({
        context: request.context,
        theme: request.theme,
        mood: request.mood,
        color_palette: request.color_palette,
        type: 'icon_recommendation'
      });
      
      // 检查缓存
      const cachedResult = await findAIAnalysisCache(cacheKey, 'icon_recommendation');
      if (cachedResult) {
        cached = true;
        const responseTime = Date.now() - startTime;
        
        await recordAIRequest({
          operationType: 'icon_recommendation',
          aiModel: config.models.primary,
          processingTimeMs: responseTime,
          success: true,
          estimatedCost: 0
        });
        
        return {
          success: true,
          recommendations: (cachedResult.analysisResult as any).recommendations,
          performance: {
            response_time: responseTime,
            cached: true
          }
        };
      }
      
      // 获取可用的Icons（排除已使用的）
      let availableIcons: Icon[];
      
      if (request.existing_icons && request.existing_icons.length > 0) {
        // 搜索相关Icons，但排除已使用的
        const searchResult = await searchIcons({
          query: request.context,
          limit: 100
        });
        
        availableIcons = searchResult.icons
          .map(convertIconModelToIcon)
          .filter(icon => !request.existing_icons!.includes(icon.icon_id));
      } else {
        // 基于上下文搜索相关Icons
        const searchResult = await searchIcons({
          query: request.context,
          limit: 50
        });
        availableIcons = searchResult.icons.map(convertIconModelToIcon);
      }
      
      if (availableIcons.length === 0) {
        return {
          success: false,
          error: '没有找到相关的图标'
        };
      }
      
      // 调用AI进行智能推荐
      const aiRecommendations = await this.generateAIRecommendations({
        context: request.context,
        theme: request.theme,
        mood: request.mood,
        color_palette: request.color_palette,
        available_icons: availableIcons.slice(0, 30), // 限制AI分析的数量
        limit: request.limit || 6
      });
      
      if (!aiRecommendations.success) {
        // 如果AI推荐失败，使用规则推荐
        return this.generateRuleBasedRecommendations(availableIcons, request);
      }
      
      const responseTime = Date.now() - startTime;
      
      // 缓存结果
      await createAIAnalysisCache({
        cacheKey: cacheKey,
        cacheType: 'icon_recommendation',
        aiModel: config.models.primary,
        inputData: {
          context: request.context,
          theme: request.theme,
          mood: request.mood,
          color_palette: request.color_palette
        },
        analysisResult: { recommendations: aiRecommendations.recommendations },
        confidenceScore: aiRecommendations.confidence_score,
        expiresInDays: config.api.cacheDurationDays
      });
      
      // 记录使用统计
      await recordAIRequest({
        operationType: 'icon_recommendation',
        aiModel: config.models.primary,
        processingTimeMs: responseTime,
        success: true,
        estimatedCost: parseFloat((0.002).toFixed(4)) // 确保是有效数值，保留4位小数
      });
      
      return {
        success: true,
        recommendations: aiRecommendations.recommendations,
        performance: {
          response_time: responseTime,
          cached: false
        }
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('Icon recommendation failed:', error);
      
      await recordAIRequest({
        operationType: 'icon_recommendation',
        aiModel: 'gemini-2.5-flash-preview-05-20',
        processingTimeMs: responseTime,
        success: false,
        estimatedCost: 0
      });
      
      return {
        success: false,
        error: '图标推荐失败'
      };
    }
  }
  
  // AI推荐核心逻辑
  private static async generateAIRecommendations(params: {
    context: string;
    theme?: string;
    mood?: string;
    color_palette?: string[];
    available_icons: Icon[];
    limit: number;
  }): Promise<{
    success: boolean;
    recommendations?: Array<{
      icon: Icon;
      score: number;
      reason: string;
    }>;
    confidence_score?: number;
  }> {
    try {
      const config = getAIConfig();
      const model = genAI.getGenerativeModel({ model: config.models.primary });
      
      // 构建图标信息摘要
      const iconsSummary = params.available_icons.map(icon => ({
        icon_id: icon.icon_id,
        icon_name: icon.icon_name,
        category_id: icon.category_id,
        tags: icon.tags,
        ai_keywords: icon.ai_keywords,
        ai_description: icon.ai_description,
        popularity_score: icon.popularity_score
      }));
      
      const prompt = `作为一个专业的UI设计师，请根据以下拼图上下文为用户推荐最合适的图标。

上下文信息：
- 拼图主题: ${params.context}
- 风格主题: ${params.theme || '无特定要求'}  
- 情绪氛围: ${params.mood || '无特定要求'}
- 色彩搭配: ${params.color_palette ? params.color_palette.join(', ') : '无特定要求'}

可选图标列表：
${JSON.stringify(iconsSummary, null, 2)}

请从以上图标中选择 ${params.limit} 个最合适的图标，并返回JSON格式的推荐结果：

{
  "recommendations": [
    {
      "icon_id": "图标ID",
      "score": 85,
      "reason": "推荐理由，说明为什么这个图标适合当前上下文"
    }
  ],
  "confidence_score": 0.85
}

请确保：
1. 推荐的图标与拼图主题高度相关
2. 考虑图标的受欢迎程度和实用性
3. 推荐理由要具体和有说服力
4. 评分范围为0-100，反映推荐的合适程度`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const aiResult = JSON.parse(jsonMatch[0]);
          
          // 将AI推荐结果映射到实际的Icon对象
          const recommendations = aiResult.recommendations
            .map((rec: any) => {
              const icon = params.available_icons.find(i => i.icon_id === rec.icon_id);
              if (!icon) return null;
              
              return {
                icon,
                score: rec.score || 50,
                reason: rec.reason || '适合当前主题'
              };
            })
            .filter(Boolean)
            .slice(0, params.limit);
          
          return {
            success: true,
            recommendations,
            confidence_score: aiResult.confidence_score || 0.7
          };
        } else {
          throw new Error('无法解析AI响应');
        }
      } catch (parseError) {
        console.error('Failed to parse AI recommendation response:', parseError);
        return { success: false };
      }
      
    } catch (error) {
      console.error('AI recommendation generation failed:', error);
      return { success: false };
    }
  }
  
  // 规则推荐（AI失败时的备选方案）
  private static async generateRuleBasedRecommendations(
    availableIcons: Icon[], 
    request: IconRecommendationRequest
  ): Promise<{
    success: boolean;
    recommendations?: Array<{
      icon: Icon;
      score: number;
      reason: string;
    }>;
  }> {
    try {
      const limit = request.limit || 6;
      
      // 基于关键词匹配和受欢迎程度进行推荐
      const contextKeywords = request.context.toLowerCase().split(/\s+/);
      
      const scoredIcons = availableIcons.map(icon => {
        let score = icon.popularity_score || 0;
        
        // 关键词匹配得分
        const allKeywords = [
          ...icon.tags.map(t => t.toLowerCase()),
          ...icon.ai_keywords.map(k => k.toLowerCase()),
          icon.icon_name.toLowerCase()
        ];
        
        const matchingKeywords = contextKeywords.filter(keyword => 
          allKeywords.some(k => k.includes(keyword) || keyword.includes(k))
        );
        
        score += matchingKeywords.length * 10;
        
        // 主题匹配
        if (request.theme) {
          const themeKeywords = request.theme.toLowerCase().split(/\s+/);
          const themeMatches = themeKeywords.filter(keyword =>
            allKeywords.some(k => k.includes(keyword))
          );
          score += themeMatches.length * 5;
        }
        
        return {
          icon,
          score,
          reason: matchingKeywords.length > 0 
            ? `与主题关键词匹配: ${matchingKeywords.join(', ')}` 
            : '基于受欢迎程度推荐'
        };
      });
      
      // 排序并取前N个
      const recommendations = scoredIcons
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
      
      return {
        success: true,
        recommendations
      };
      
    } catch (error) {
      console.error('Rule-based recommendation failed:', error);
      return { success: false };
    }
  }
  
  // 记录Icon使用
  static async recordIconUsage(iconIds: string | string[]): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      if (typeof iconIds === 'string') {
        await updateIconUsage(iconIds);
      } else {
        await updateMultipleIconUsage(iconIds);
      }
      
      return {
        success: true,
        message: '成功记录图标使用'
      };
      
    } catch (error) {
      console.error('Record icon usage failed:', error);
      return {
        success: false,
        message: '记录图标使用失败'
      };
    }
  }
  
  // 获取Icon详情
  static async getIconDetails(iconId: string): Promise<{
    success: boolean;
    icon?: Icon;
    category?: IconCategory;
    related_icons?: Icon[];
    error?: string;
  }> {
    try {
      const iconModel = await findIconById(iconId);
      
      if (!iconModel) {
        return {
          success: false,
          error: '图标不存在'
        };
      }
      
      const icon = convertIconModelToIcon(iconModel);
      
      // 获取分类信息
      const { findIconCategoryById } = await import('@/lib/repositories/icons');
      const categoryModel = await findIconCategoryById(icon.category_id);
      const category = categoryModel ? convertIconCategoryModelToIconCategory(categoryModel) : undefined;
      
      // 获取相关图标（同分类的热门图标）
      const relatedResult = await findIconsByCategory(icon.category_id, {
        limit: 8
      });
      const relatedIcons = relatedResult.icons
        .map(convertIconModelToIcon)
        .filter(i => i.icon_id !== iconId);
      
      // 更新使用统计
      await updateIconUsage(iconId);
      
      return {
        success: true,
        icon,
        category,
        related_icons: relatedIcons
      };
      
    } catch (error) {
      console.error('Get icon details failed:', error);
      return {
        success: false,
        error: '获取图标详情失败'
      };
    }
  }
  
  // 获取统计信息
  static async getStatistics(): Promise<{
    success: boolean;
    icon_stats?: any;
    category_stats?: any;
    error?: string;
  }> {
    try {
      const [iconStats, categoryStats] = await Promise.all([
        getIconStats(),
        getCategoryStats()
      ]);
      
      return {
        success: true,
        icon_stats: iconStats,
        category_stats: categoryStats
      };
      
    } catch (error) {
      console.error('Get statistics failed:', error);
      return {
        success: false,
        error: '获取统计信息失败'
      };
    }
  }
  
  // 批量导入Icons（管理员功能）
  static async batchImportIcons(icons: Array<{
    icon_id: string;
    icon_name: string;
    category_id: string;
    svg_content: string;
    style?: Icon['style'];
    tags?: string[];
    ai_keywords?: string[];
    source?: string;
  }>): Promise<{
    success: boolean;
    imported_count: number;
    skipped_count: number;
    error_count: number;
    errors?: string[];
  }> {
    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    for (const iconData of icons) {
      try {
        // 检查是否已存在
        const existing = await findIconById(iconData.icon_id);
        if (existing) {
          skippedCount++;
          continue;
        }
        
        // 创建新图标
        await createIcon({
          icon_id: iconData.icon_id,
          icon_name: iconData.icon_name,
          category_id: iconData.category_id,
          svg_content: iconData.svg_content,
          style: iconData.style || 'outline',
          tags: iconData.tags || [],
          ai_keywords: iconData.ai_keywords || [],
          source: iconData.source || 'batch_import'
        });
        
        importedCount++;
        
        // 更新分类中的图标数量
        await updateCategoryIconCount(iconData.category_id);
        
      } catch (error) {
        errorCount++;
        errors.push(`${iconData.icon_id}: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }
    
    return {
      success: errorCount === 0,
      imported_count: importedCount,
      skipped_count: skippedCount,
      error_count: errorCount,
      errors: errors.length > 0 ? errors : undefined
    };
  }
} 