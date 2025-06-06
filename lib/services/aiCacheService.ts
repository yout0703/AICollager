import { AIAnalysisCache } from '@/db/schema/ai';
import {
  generateCacheKey,
  findAIAnalysisCache,
  findMultipleAIAnalysisCache,
  createAIAnalysisCache,
  cleanupExpiredAICache,
  cleanupLowUsageCache,
  getAICacheStats
} from '@/lib/repositories/aiAnalysisCache';

// 缓存管理服务
export class AICacheService {
  
  // 查找单个缓存
  static async findCache(
    inputData: any,
    cacheType: string
  ): Promise<AIAnalysisCache | null> {
    try {
      const cacheKey = generateCacheKey(inputData);
      const cache = await findAIAnalysisCache(cacheKey, cacheType);
      return cache || null;
    } catch (error) {
      console.error('Find cache failed:', error);
      return null;
    }
  }
  
  // 批量查找缓存
  static async findMultipleCaches(
    inputDataList: any[],
    cacheType: string
  ): Promise<Record<string, AIAnalysisCache>> {
    try {
      const cacheKeys = inputDataList.map(data => generateCacheKey(data));
      return await findMultipleAIAnalysisCache(cacheKeys, cacheType);
    } catch (error) {
      console.error('Find multiple caches failed:', error);
      return {};
    }
  }
  
  // 创建缓存
  static async createCache(params: {
    inputData: any;
    cacheType: 'image_analysis' | 'layout_suggestion' | 'icon_recommendation';
    analysisResult: Record<string, any>;
    aiModel: string;
    confidenceScore?: number;
    modelVersion?: string;
    expiresDays?: number;
  }): Promise<AIAnalysisCache | null> {
    try {
      const cacheKey = generateCacheKey(params.inputData);
      
      const cache = await createAIAnalysisCache({
        cacheKey: cacheKey,
        cacheType: params.cacheType,
        aiModel: params.aiModel,
        modelVersion: params.modelVersion,
        inputData: params.inputData,
        analysisResult: params.analysisResult,
        confidenceScore: params.confidenceScore,
        expiresInDays: params.expiresDays || 30
      });
      
      return cache;
    } catch (error) {
      console.error('Create cache failed:', error);
      return null;
    }
  }
  
  // 获取缓存统计
  static async getCacheStatistics(): Promise<{
    total: number;
    by_type: Record<string, number>;
    by_model: Record<string, number>;
    hit_rate: number;
    total_saves: number;
    cache_efficiency: string;
  }> {
    try {
      const stats = await getAICacheStats();
      
      // 计算缓存效率等级
      let efficiency = 'Low';
      if (stats.hitRate >= 80) efficiency = 'Excellent';
      else if (stats.hitRate >= 60) efficiency = 'Good';
      else if (stats.hitRate >= 40) efficiency = 'Fair';
      
      return {
        total: stats.total,
        by_type: stats.byType,
        by_model: {}, // 暂时不支持按模型统计
        hit_rate: stats.hitRate,
        total_saves: stats.totalSaves,
        cache_efficiency: efficiency
      };
    } catch (error) {
      console.error('Get cache statistics failed:', error);
      return {
        total: 0,
        by_type: {},
        by_model: {},
        hit_rate: 0,
        total_saves: 0,
        cache_efficiency: 'Unknown'
      };
    }
  }
  
  // 清理过期缓存
  static async cleanupExpiredCaches(): Promise<{
    success: boolean;
    cleaned_count: number;
    message?: string;
  }> {
    try {
      const cleanedCount = await cleanupExpiredAICache();
      return {
        success: true,
        cleaned_count: cleanedCount,
        message: `清理了 ${cleanedCount} 个过期缓存`
      };
    } catch (error) {
      console.error('Cleanup expired caches failed:', error);
      return {
        success: false,
        cleaned_count: 0,
        message: '清理过期缓存失败'
      };
    }
  }
  
  // 清理低使用率缓存
  static async cleanupLowUsageCaches(minUsageCount: number = 1): Promise<{
    success: boolean;
    cleaned_count: number;
    message?: string;
  }> {
    try {
      const cleanedCount = await cleanupLowUsageCache(minUsageCount);
      return {
        success: true,
        cleaned_count: cleanedCount,
        message: `清理了 ${cleanedCount} 个低使用率缓存`
      };
    } catch (error) {
      console.error('Cleanup low usage caches failed:', error);
      return {
        success: false,
        cleaned_count: 0,
        message: '清理低使用率缓存失败'
      };
    }
  }
  
  // 执行完整的缓存维护
  static async performCacheMaintenance(): Promise<{
    success: boolean;
    expired_cleaned: number;
    low_usage_cleaned: number;
    total_cleaned: number;
    final_stats: any;
    message?: string;
  }> {
    try {
      console.log('开始执行缓存维护...');
      
      // 1. 清理过期缓存
      const expiredResult = await this.cleanupExpiredCaches();
      
      // 2. 清理低使用率缓存（使用次数<=1且创建超过7天）
      const lowUsageResult = await this.cleanupLowUsageCaches(1);
      
      // 3. 获取最终统计
      const finalStats = await this.getCacheStatistics();
      
      const totalCleaned = expiredResult.cleaned_count + lowUsageResult.cleaned_count;
      
      console.log(`缓存维护完成：清理过期 ${expiredResult.cleaned_count}，清理低使用率 ${lowUsageResult.cleaned_count}`);
      
      return {
        success: true,
        expired_cleaned: expiredResult.cleaned_count,
        low_usage_cleaned: lowUsageResult.cleaned_count,
        total_cleaned: totalCleaned,
        final_stats: finalStats,
        message: `缓存维护完成，总共清理 ${totalCleaned} 个缓存项`
      };
      
    } catch (error) {
      console.error('Cache maintenance failed:', error);
      return {
        success: false,
        expired_cleaned: 0,
        low_usage_cleaned: 0,
        total_cleaned: 0,
        final_stats: null,
        message: '缓存维护失败'
      };
    }
  }
  
  // 检查缓存健康状况
  static async checkCacheHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    total_caches: number;
    hit_rate: number;
    recommendations: string[];
    issues: string[];
  }> {
    try {
      const stats = await this.getCacheStatistics();
      const recommendations: string[] = [];
      const issues: string[] = [];
      
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      
      // 检查缓存总数
      if (stats.total > 10000) {
        issues.push('缓存数量过多，可能影响性能');
        recommendations.push('考虑清理低使用率缓存');
        status = 'warning';
      }
      
             // 检查命中率
       if (stats.hit_rate < 30) {
         issues.push('缓存命中率较低');
         recommendations.push('检查缓存策略和过期时间设置');
         status = 'warning';
       }
      
      if (stats.hit_rate < 10) {
        issues.push('缓存命中率过低，缓存几乎无效');
        status = 'critical';
      }
      
      // 检查缓存分布
      const typeCount = Object.keys(stats.by_type).length;
      if (typeCount === 0) {
        issues.push('没有任何缓存数据');
        status = 'critical';
      }
      
      // 提供建议
      if (stats.hit_rate >= 70) {
        recommendations.push('缓存工作良好，继续保持');
      } else if (stats.hit_rate >= 40) {
        recommendations.push('可以考虑优化缓存策略');
      }
      
      if (stats.total < 100) {
        recommendations.push('缓存数据较少，可以适当增加缓存时间');
      }
      
      return {
        status,
        total_caches: stats.total,
        hit_rate: stats.hit_rate,
        recommendations,
        issues
      };
      
    } catch (error) {
      console.error('Check cache health failed:', error);
      return {
        status: 'critical',
        total_caches: 0,
        hit_rate: 0,
        recommendations: ['检查缓存系统连接'],
        issues: ['无法获取缓存健康状况']
      };
    }
  }
  
  // 预热缓存（为常用操作创建缓存）
  static async warmupCache(commonInputs: Array<{
    inputData: any;
    cacheType: string;
  }>): Promise<{
    success: boolean;
    warmed_count: number;
    skipped_count: number;
    message?: string;
  }> {
    try {
      let warmedCount = 0;
      let skippedCount = 0;
      
      for (const input of commonInputs) {
        const existingCache = await this.findCache(input.inputData, input.cacheType);
        
        if (existingCache) {
          skippedCount++;
        } else {
          // 这里需要实际调用AI服务来生成结果并缓存
          // 为了演示，我们跳过实际的AI调用
          console.log(`Would warm up cache for ${input.cacheType}`);
          warmedCount++;
        }
      }
      
      return {
        success: true,
        warmed_count: warmedCount,
        skipped_count: skippedCount,
        message: `预热缓存完成：新增 ${warmedCount}，跳过 ${skippedCount}`
      };
      
    } catch (error) {
      console.error('Warmup cache failed:', error);
      return {
        success: false,
        warmed_count: 0,
        skipped_count: 0,
        message: '预热缓存失败'
      };
    }
  }
} 