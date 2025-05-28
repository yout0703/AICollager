import {
  recordAIRequest,
  getTodayAIStats,
  getAIStatsInRange,
  getGlobalAIStatsSummary,
  cleanupOldAIStats,
  AIUsageStats
} from '@/models/aiUsageStats';

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
      return await recordAIRequest({
        type: params.type,
        success: params.success,
        cached: params.cached,
        response_time: params.responseTime,
        estimated_cost: params.estimatedCost,
        metadata: params.metadata
      });
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
      
      const successRate = todayStats.total_requests > 0 
        ? (todayStats.successful_requests / todayStats.total_requests) * 100 
        : 0;
      
      const cacheHitRate = todayStats.total_requests > 0 
        ? (todayStats.cached_requests / todayStats.total_requests) * 100 
        : 0;
      
      return {
        success: true,
        stats: todayStats,
        summary: {
          total_requests: todayStats.total_requests,
          success_rate: Math.round(successRate * 100) / 100,
          cache_hit_rate: Math.round(cacheHitRate * 100) / 100,
          avg_response_time: Math.round(todayStats.avg_response_time),
          estimated_cost: todayStats.estimated_cost
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
      const stats = await getAIStatsInRange(
        params.startDate,
        params.endDate,
        params.statType || 'daily'
      );
      
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
      const totalRequests = stats.reduce((sum, s) => sum + s.total_requests, 0);
      const totalSuccessful = stats.reduce((sum, s) => sum + s.successful_requests, 0);
      const totalFailed = stats.reduce((sum, s) => sum + s.failed_requests, 0);
      const totalCached = stats.reduce((sum, s) => sum + s.cached_requests, 0);
      const totalCost = stats.reduce((sum, s) => sum + s.estimated_cost, 0);
      const avgResponseTime = stats.reduce((sum, s) => sum + s.avg_response_time, 0) / stats.length;
      
      // 找到峰值日期
      const peakDay = stats.reduce((peak, current) => 
        current.total_requests > peak.total_requests ? current : peak
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
          peak_requests: peakDay.total_requests
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
      total_requests: number;
      successful_requests: number;
      failed_requests: number;
      cached_requests: number;
      success_rate: number;
      cache_hit_rate: number;
      total_cost: number;
      avg_daily_requests: number;
      avg_response_time: number;
      peak_usage_date: string;
      peak_usage_count: number;
      cost_per_request: number;
      efficiency_score: number;
    };
  }> {
    try {
      const summary = await getGlobalAIStatsSummary(days);
      
      // 计算额外指标
      const costPerRequest = summary.total_requests > 0 
        ? summary.total_cost / summary.total_requests 
        : 0;
      
      // 效率分数（基于成功率、缓存命中率和响应时间）
      const successWeight = summary.success_rate * 0.4;
      const cacheWeight = summary.cache_hit_rate * 0.3;
      const speedWeight = summary.avg_response_time > 0 
        ? Math.max(0, (10000 - summary.avg_response_time) / 100) * 0.3 
        : 0;
      
      const efficiencyScore = Math.min(100, successWeight + cacheWeight + speedWeight);
      
      return {
        success: true,
        summary: {
          ...summary,
          cost_per_request: Math.round(costPerRequest * 10000) / 10000, // 保留4位小数
          efficiency_score: Math.round(efficiencyScore * 100) / 100
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
      const totalCost = stats.reduce((sum, s) => sum + s.estimated_cost, 0);
      
      // 按类型分组成本
      const costByType: Record<string, number> = {};
      stats.forEach(stat => {
        // 假设成本按类型平均分配（实际应该有更精确的统计）
        const typeCount = stat.image_analysis_count + stat.layout_suggestion_count + stat.icon_recommendation_count;
        if (typeCount > 0) {
          const costPerType = stat.estimated_cost / typeCount;
          costByType['image_analysis'] = (costByType['image_analysis'] || 0) + (costPerType * stat.image_analysis_count);
          costByType['layout_suggestion'] = (costByType['layout_suggestion'] || 0) + (costPerType * stat.layout_suggestion_count);
          costByType['icon_recommendation'] = (costByType['icon_recommendation'] || 0) + (costPerType * stat.icon_recommendation_count);
        }
      });
      
      const dailyAverage = totalCost / Math.max(days, 1);
      const projectedMonthly = dailyAverage * 30;
      
      // 趋势分析（比较前半期和后半期）
      const midPoint = Math.floor(stats.length / 2);
      const firstHalfCost = stats.slice(0, midPoint).reduce((sum, s) => sum + s.estimated_cost, 0);
      const secondHalfCost = stats.slice(midPoint).reduce((sum, s) => sum + s.estimated_cost, 0);
      
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
    cleaned_count: number;
    message?: string;
  }> {
    try {
      const cleanedCount = await cleanupOldAIStats(keepDays);
      return {
        success: true,
        cleaned_count: cleanedCount,
        message: `清理了 ${cleanedCount} 条旧统计记录`
      };
    } catch (error) {
      console.error('Cleanup old statistics failed:', error);
      return {
        success: false,
        cleaned_count: 0,
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
      cost_analysis: any;
      recommendations: string[];
      generated_at: string;
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
          cost_analysis: costResult.analysis,
          recommendations: [...new Set(recommendations)], // 去重
          generated_at: new Date().toISOString()
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