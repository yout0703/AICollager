import { AIUsageStats } from '@/db/schema';
import {
  recordAIRequest,
  getTodayAIStats,
  getAIUsageByUser,
  getAIUsageStats,
  cleanupOldAIStats
} from '@/lib/repositories/aiUsageStats';

// AI统计服务
export class AIStatsService {
  
  // 记录AI请求统计
  static async recordRequest(params: {
    type: 'image_analysis' | 'layout_suggestion' | 'icon_recommendation';
    success: boolean;
    cached: boolean;
    responseTime: number;
    estimatedCost?: number;
    metadata?: Record<string, any>;
  }): Promise<boolean> {
    try {
      await recordAIRequest({
        operationType: params.type,
        aiModel: 'gemini-2.5-flash-preview-05-20',
        success: params.success,
        processingTimeMs: params.responseTime,
        estimatedCost: params.estimatedCost,
        metadata: params.metadata
      });
      return true;
    } catch (error) {
      console.error('Record AI request failed:', error);
      return false;
    }
  }
  
  // 获取今日统计
  static async getTodayStatistics(): Promise<{
    success: boolean;
    stats?: AIUsageStats;
    summary?: {
      total_requests: number;
      success_rate: number;
      cache_hit_rate: number;
      avg_response_time: number;
      estimated_cost: number;
    };
  }> {
    try {
      const todayStats = await getTodayAIStats();
      
      if (!todayStats) {
        return {
          success: true,
          summary: {
            total_requests: 0,
            success_rate: 0,
            cache_hit_rate: 0,
            avg_response_time: 0,
            estimated_cost: 0
          }
        };
      }
      
      const successRate = (todayStats.totalRequests || 0) > 0 
        ? ((todayStats.successfulRequests || 0) / (todayStats.totalRequests || 1)) * 100 
        : 0;
      
      const cacheHitRate = (todayStats.totalRequests || 0) > 0 
        ? ((todayStats.cachedRequests || 0) / (todayStats.totalRequests || 1)) * 100 
        : 0;
      
      return {
        success: true,
        stats: todayStats,
        summary: {
          total_requests: todayStats.totalRequests || 0,
          success_rate: Math.round(successRate * 100) / 100,
          cache_hit_rate: Math.round(cacheHitRate * 100) / 100,
          avg_response_time: Number(todayStats.avgResponseTime || 0),
          estimated_cost: Number(todayStats.estimatedCost || 0)
        }
      };
      
    } catch (error) {
      console.error('Get today statistics failed:', error);
      return {
        success: false
      };
    }
  }
  
  // 获取历史统计
  static async getHistoryStatistics(params: {
    startDate: string;
    endDate: string;
    statType?: 'daily' | 'weekly' | 'monthly';
  }): Promise<{
    success: boolean;
    stats?: AIUsageStats[];
    aggregated?: {
      total_requests: number;
      total_successful: number;
      total_failed: number;
      total_cached: number;
      total_cost: number;
      avg_response_time: number;
      success_rate: number;
      cache_hit_rate: number;
      peak_day: string;
      peak_requests: number;
    };
  }> {
    try {
      const stats = await getAIUsageByUser(params.startDate, params.endDate);
      
      if (stats.length === 0) {
        return {
          success: true,
          stats: [],
          aggregated: {
            total_requests: 0,
            total_successful: 0,
            total_failed: 0,
            total_cached: 0,
            total_cost: 0,
            avg_response_time: 0,
            success_rate: 0,
            cache_hit_rate: 0,
            peak_day: '',
            peak_requests: 0
          }
        };
      }
      
      // 聚合统计
      const totalRequests = stats.reduce((sum, s) => sum + s.totalRequests, 0);
      const totalSuccessful = stats.reduce((sum, s) => sum + s.successfulRequests, 0);
      const totalFailed = stats.reduce((sum, s) => sum + s.failedRequests, 0);
      const totalCached = stats.reduce((sum, s) => sum + s.cachedRequests, 0);
      const totalCost = stats.reduce((sum, s) => sum + Number(s.estimatedCost), 0);
      const avgResponseTime = stats.reduce((sum, s) => sum + Number(s.avgResponseTime), 0) / stats.length;
      
      // 找到峰值日期
      const peakDay = stats.reduce((peak, current) => 
        current.totalRequests > peak.totalRequests ? current : peak
      );
      
      const successRate = totalRequests > 0 ? (totalSuccessful / totalRequests) * 100 : 0;
      const cacheHitRate = totalRequests > 0 ? (totalCached / totalRequests) * 100 : 0;
      
      return {
        success: true,
        stats,
        aggregated: {
          total_requests: totalRequests,
          total_successful: totalSuccessful,
          total_failed: totalFailed,
          total_cached: totalCached,
          total_cost: Math.round(totalCost * 100) / 100,
          avg_response_time: Math.round(avgResponseTime),
          success_rate: Math.round(successRate * 100) / 100,
          cache_hit_rate: Math.round(cacheHitRate * 100) / 100,
          peak_day: peakDay.date,
          peak_requests: peakDay.totalRequests
        }
      };
      
    } catch (error) {
      console.error('Get history statistics failed:', error);
      return {
        success: false
      };
    }
  }
  
  // 获取全局统计摘要
  static async getGlobalSummary(days: number = 30): Promise<{
    success: boolean;
    summary?: {
      totalRequests: number;
      successfulRequests: number;
      failedRequests: number;
      cachedRequests: number;
      success_rate: number;
      cache_hit_rate: number;
      totalCost: number;
      avgDailyRequests: number;
      avgResponseTime: number;
      peakUsageDate: string;
      peakUsageCount: number;
      costPerRequest: number;
      efficiencyScore: number;
    };
  }> {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];
      
      const stats = await getAIUsageByUser(startDate, endDate);
      
      if (stats.length === 0) {
        return {
          success: true,
          summary: {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            cachedRequests: 0,
            success_rate: 0,
            cache_hit_rate: 0,
            totalCost: 0,
            avgDailyRequests: 0,
            avgResponseTime: 0,
            peakUsageDate: '',
            peakUsageCount: 0,
            costPerRequest: 0,
            efficiencyScore: 0
          }
        };
      }
      
      // 计算聚合数据
      const totalRequests = stats.reduce((sum, s) => sum + s.totalRequests, 0);
      const successfulRequests = stats.reduce((sum, s) => sum + s.successfulRequests, 0);
      const failedRequests = stats.reduce((sum, s) => sum + s.failedRequests, 0);
      const cachedRequests = stats.reduce((sum, s) => sum + s.cachedRequests, 0);
      const totalCost = stats.reduce((sum, s) => sum + Number(s.estimatedCost), 0);
      const avgResponseTime = stats.reduce((sum, s) => sum + Number(s.avgResponseTime), 0) / stats.length;
      
      // 找到峰值日期
      const peakDay = stats.reduce((peak, current) => 
        current.totalRequests > peak.totalRequests ? current : peak
      );
      
      const success_rate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;
      const cache_hit_rate = totalRequests > 0 ? (cachedRequests / totalRequests) * 100 : 0;
      const avgDailyRequests = totalRequests / Math.max(days, 1);
      
      // 计算额外指标
      const costPerRequest = totalRequests > 0 
        ? totalCost / totalRequests 
        : 0;
      
      // 效率分数（基于成功率、缓存命中率和响应时间）
      const successWeight = success_rate * 0.4;
      const cacheWeight = cache_hit_rate * 0.3;
      const speedWeight = avgResponseTime > 0 
        ? Math.max(0, (10000 - avgResponseTime) / 100) * 0.3 
        : 0;
      
      const efficiencyScore = Math.min(100, successWeight + cacheWeight + speedWeight);
      
      return {
        success: true,
        summary: {
          totalRequests,
          successfulRequests,
          failedRequests,
          cachedRequests,
          success_rate: Math.round(success_rate * 100) / 100,
          cache_hit_rate: Math.round(cache_hit_rate * 100) / 100,
          totalCost: Math.round(totalCost * 100) / 100,
          avgDailyRequests: Math.round(avgDailyRequests * 100) / 100,
          avgResponseTime: Math.round(avgResponseTime),
          peakUsageDate: peakDay.date,
          peakUsageCount: peakDay.totalRequests,
          costPerRequest: Math.round(costPerRequest * 100) / 100,
          efficiencyScore: Math.round(efficiencyScore * 100) / 100
        }
      };
      
    } catch (error) {
      console.error('Get global summary failed:', error);
      return {
        success: false
      };
    }
  }
  
  // 获取成本分析
  static async getCostAnalysis(days: number = 30): Promise<{
    success: boolean;
    analysis?: {
      total_cost: number;
      cost_by_type: Record<string, number>;
      daily_average: number;
      projected_monthly: number;
      cost_trend: 'increasing' | 'stable' | 'decreasing';
      recommendations: string[];
    };
  }> {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];
      
      const historyResult = await this.getHistoryStatistics({
        startDate,
        endDate,
        statType: 'daily'
      });
      
      if (!historyResult.success || !historyResult.stats) {
        return { success: false };
      }
      
      const stats = historyResult.stats;
      const totalCost = stats.reduce((sum, s) => sum + Number(s.estimatedCost), 0);
      
      // 按类型分组成本
      const costByType: Record<string, number> = {};
      stats.forEach(stat => {
        // 假设成本按类型平均分配（实际应该有更精确的统计）
        const typeCount = stat.imageAnalysisCount + stat.layoutSuggestionCount + stat.iconRecommendationCount;
        if (typeCount > 0) {
          const costPerType = Number(stat.estimatedCost) / typeCount;
          costByType['image_analysis'] = (costByType['image_analysis'] || 0) + (costPerType * stat.imageAnalysisCount);
          costByType['layout_suggestion'] = (costByType['layout_suggestion'] || 0) + (costPerType * stat.layoutSuggestionCount);
          costByType['icon_recommendation'] = (costByType['icon_recommendation'] || 0) + (costPerType * stat.iconRecommendationCount);
        }
      });
      
      const dailyAverage = totalCost / Math.max(days, 1);
      const projectedMonthly = dailyAverage * 30;
      
      // 趋势分析（比较前半期和后半期）
      const midPoint = Math.floor(stats.length / 2);
      const firstHalfCost = stats.slice(0, midPoint).reduce((sum, s) => sum + Number(s.estimatedCost), 0);
      const secondHalfCost = stats.slice(midPoint).reduce((sum, s) => sum + Number(s.estimatedCost), 0);
      
      let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
      const firstHalfAvg = firstHalfCost / Math.max(midPoint, 1);
      const secondHalfAvg = secondHalfCost / Math.max(stats.length - midPoint, 1);
      
      if (secondHalfAvg > firstHalfAvg * 1.1) {
        trend = 'increasing';
      } else if (secondHalfAvg < firstHalfAvg * 0.9) {
        trend = 'decreasing';
      }
      
      // 生成建议
      const recommendations: string[] = [];
      
      if (trend === 'increasing') {
        recommendations.push('成本呈上升趋势，建议优化缓存策略');
      }
      
      if (projectedMonthly > 100) {
        recommendations.push('月度成本较高，考虑设置更严格的使用限制');
      }
      
      const cacheHitRate = historyResult.aggregated?.cache_hit_rate || 0;
      if (cacheHitRate < 50) {
        recommendations.push('缓存命中率较低，增加缓存时间可以降低成本');
      }
      
      if (recommendations.length === 0) {
        recommendations.push('成本控制良好，继续保持当前策略');
      }
      
      return {
        success: true,
        analysis: {
          total_cost: Math.round(totalCost * 100) / 100,
          cost_by_type: Object.fromEntries(
            Object.entries(costByType).map(([k, v]) => [k, Math.round(v * 100) / 100])
          ),
          daily_average: Math.round(dailyAverage * 100) / 100,
          projected_monthly: Math.round(projectedMonthly * 100) / 100,
          cost_trend: trend,
          recommendations
        }
      };
      
    } catch (error) {
      console.error('Get cost analysis failed:', error);
      return {
        success: false
      };
    }
  }
  
  // 清理旧统计数据
  static async cleanupOldStatistics(keepDays: number = 90): Promise<{
    success: boolean;
    cleanedCount: number;
    message?: string;
  }> {
    try {
      const cleanedCount = await cleanupOldAIStats(keepDays);
      return {
        success: true,
        cleanedCount: cleanedCount,
        message: `清理了 ${cleanedCount} 条旧统计记录`
      };
    } catch (error) {
      console.error('Cleanup old statistics failed:', error);
      return {
        success: false,
        cleanedCount: 0,
        message: '清理旧统计记录失败'
      };
    }
  }
  
  // 生成统计报告
  static async generateReport(params: {
    startDate: string;
    endDate: string;
    includeDetails?: boolean;
  }): Promise<{
    success: boolean;
    report?: {
      period: string;
      overview: any;
      performance: any;
      costAnalysis: any;
      recommendations: string[];
      generatedAt: string;
    };
  }> {
    try {
      const [historyResult, globalResult, costResult] = await Promise.all([
        this.getHistoryStatistics({
          startDate: params.startDate,
          endDate: params.endDate
        }),
        this.getGlobalSummary(30),
        this.getCostAnalysis(30)
      ]);
      
      if (!historyResult.success) {
        return { success: false };
      }
      
      const recommendations: string[] = [];
      
      // 基于数据生成建议
      if (historyResult.aggregated) {
        const { success_rate, cache_hit_rate, avg_response_time } = historyResult.aggregated;
        
        if (success_rate < 95) {
          recommendations.push(`成功率 ${success_rate}% 需要提升，检查AI服务稳定性`);
        }
        
        if (cache_hit_rate < 60) {
          recommendations.push(`缓存命中率 ${cache_hit_rate}% 偏低，优化缓存策略`);
        }
        
        if (avg_response_time > 5000) {
          recommendations.push(`平均响应时间 ${avg_response_time}ms 较慢，需要优化`);
        }
      }
      
      // 添加成本建议
      if (costResult.success && costResult.analysis) {
        recommendations.push(...costResult.analysis.recommendations);
      }
      
      if (recommendations.length === 0) {
        recommendations.push('系统运行良好，继续保持当前配置');
      }
      
      return {
        success: true,
        report: {
          period: `${params.startDate} 至 ${params.endDate}`,
          overview: historyResult.aggregated,
          performance: globalResult.summary,
          costAnalysis: costResult.analysis,
          recommendations: [...new Set(recommendations)], // 去重
          generatedAt: new Date().toISOString()
        }
      };
      
    } catch (error) {
      console.error('Generate report failed:', error);
      return {
        success: false
      };
    }
  }
} 