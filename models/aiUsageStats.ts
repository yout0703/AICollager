import { DatabaseAdapter } from "@/lib/database-adapter";
import { v4 as uuidv4 } from 'uuid';

export interface AIUsageStats {
  id: number;
  uuid: string;
  date: string; // YYYY-MM-DD格式
  stat_type: 'daily' | 'weekly' | 'monthly';
  
  // 使用次数统计
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  cached_requests: number;
  
  // 分类统计
  image_analysis_count: number;
  layout_suggestion_count: number;
  icon_recommendation_count: number;
  
  // 成本统计
  estimated_cost: number; // 美元
  cost_currency: string;
  
  // 性能统计
  avg_response_time: number; // 毫秒
  total_processing_time: number; // 毫秒
  
  // 元数据
  metadata?: Record<string, any>;
  
  created_at: string;
  updated_at: string;
}

// 格式化统计数据
function formatAIUsageStats(row: any): AIUsageStats {
  return {
    id: row.id,
    uuid: row.uuid,
    date: row.date,
    stat_type: row.stat_type,
    total_requests: row.total_requests || 0,
    successful_requests: row.successful_requests || 0,
    failed_requests: row.failed_requests || 0,
    cached_requests: row.cached_requests || 0,
    image_analysis_count: row.image_analysis_count || 0,
    layout_suggestion_count: row.layout_suggestion_count || 0,
    icon_recommendation_count: row.icon_recommendation_count || 0,
    estimated_cost: parseFloat(row.estimated_cost || '0'),
    cost_currency: row.cost_currency || 'USD',
    avg_response_time: parseFloat(row.avg_response_time || '0'),
    total_processing_time: parseFloat(row.total_processing_time || '0'),
    metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata || '{}') : (row.metadata || {}),
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

// 安全的数字格式化
const safeNumber = (value: any, defaultValue: number = 0): number => {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  const num = Number(value);
  if (isNaN(num)) {
    return defaultValue;
  }
  return value;
};

// 安全的小数格式化（保留4位小数，符合数据库DECIMAL(10,4)格式）
const safeDecimal = (value: any, defaultValue: number = 0, precision: number = 4): number => {
  const num = safeNumber(value, defaultValue);
  return Math.round(num * Math.pow(10, precision)) / Math.pow(10, precision);
};

// 创建或更新每日AI统计
export async function createOrUpdateDailyAIStats(params: {
  date?: string;
  increment_requests?: number;
  increment_successful?: number;
  increment_failed?: number;
  increment_cached?: number;
  increment_image_analysis?: number;
  increment_layout_suggestion?: number;
  increment_icon_recommendation?: number;
  add_cost?: number;
  add_response_time?: number;
  metadata?: Record<string, any>;
}): Promise<AIUsageStats> {
  const dbAdapter = new DatabaseAdapter(true);
  const date = params.date || new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();

  // 查找现有记录
  const existingResult = await dbAdapter.select('ac_ai_usage_stats', {
    where: { date },
    limit: 1
  });
  
  if (existingResult.data && existingResult.data.length > 0) {
    // 更新现有记录
    const existing = existingResult.data[0];
    const newTotalRequests = safeNumber(existing.total_requests) + safeNumber(params.increment_requests);
    const newSuccessful = safeNumber(existing.successful_requests) + safeNumber(params.increment_successful);
    const newFailed = safeNumber(existing.failed_requests) + safeNumber(params.increment_failed);
    const newCached = safeNumber(existing.cached_requests) + safeNumber(params.increment_cached);
    const newImageAnalysis = safeNumber(existing.image_analysis_count) + safeNumber(params.increment_image_analysis);
    const newLayoutSuggestion = safeNumber(existing.layout_suggestion_count) + safeNumber(params.increment_layout_suggestion);
    const newIconRecommendation = safeNumber(existing.icon_recommendation_count) + safeNumber(params.increment_icon_recommendation);
    const newCost = safeDecimal(existing.estimated_cost) + safeDecimal(params.add_cost);
    const newTotalTime = safeDecimal(existing.total_processing_time, 0, 2) + safeDecimal(params.add_response_time, 0, 2);
    const newAvgTime = newTotalRequests > 0 ? safeDecimal(newTotalTime / newTotalRequests, 0, 2) : 0;
    
    const updateResult = await dbAdapter.update('ac_ai_usage_stats', {
      total_requests: newTotalRequests,
      successful_requests: newSuccessful,
      failed_requests: newFailed,
      cached_requests: newCached,
      image_analysis_count: newImageAnalysis,
      layout_suggestion_count: newLayoutSuggestion,
      icon_recommendation_count: newIconRecommendation,
      estimated_cost: newCost,
      avg_response_time: newAvgTime,
      total_processing_time: newTotalTime,
      metadata: JSON.stringify({ ...existing.metadata, ...params.metadata }),
      updated_at: now
    }, { id: existing.id });
    
    if (!updateResult.data || updateResult.data.length === 0) {
      throw new Error('Failed to update AI usage stats');
    }
    
    return formatAIUsageStats(updateResult.data[0]);
  } else {
    // 创建新记录
    const totalRequests = safeNumber(params.increment_requests);
    const responseTime = safeDecimal(params.add_response_time, 0, 2);
    const avgResponseTime = totalRequests > 0 ? safeDecimal(responseTime / totalRequests, 0, 2) : 0;
    const cost = safeDecimal(params.add_cost);
    
    const createResult = await dbAdapter.insert('ac_ai_usage_stats', {
      uuid: uuidv4(),
      date,
      stat_type: 'daily',
      total_requests: totalRequests,
      successful_requests: safeNumber(params.increment_successful),
      failed_requests: safeNumber(params.increment_failed),
      cached_requests: safeNumber(params.increment_cached),
      image_analysis_count: safeNumber(params.increment_image_analysis),
      layout_suggestion_count: safeNumber(params.increment_layout_suggestion),
      icon_recommendation_count: safeNumber(params.increment_icon_recommendation),
      estimated_cost: cost,
      cost_currency: 'USD',
      avg_response_time: avgResponseTime,
      total_processing_time: responseTime,
      metadata: JSON.stringify(params.metadata || {}),
      created_at: now,
      updated_at: now
    });
    
    if (!createResult.data || createResult.data.length === 0) {
      throw new Error('Failed to create AI usage stats');
    }
    
    return formatAIUsageStats(createResult.data[0]);
  }
}

// 记录AI请求
export async function recordAIRequest(params: {
  type: 'image_analysis' | 'layout_suggestion' | 'icon_recommendation';
  success: boolean;
  cached: boolean;
  response_time: number;
  estimated_cost?: number;
  metadata?: Record<string, any>;
}): Promise<void> {
  const incrementParams: any = {
    increment_requests: 1,
    add_response_time: params.response_time,
    add_cost: params.estimated_cost || 0,
    metadata: params.metadata
  };

  if (params.success) {
    incrementParams.increment_successful = 1;
  } else {
    incrementParams.increment_failed = 1;
  }

  if (params.cached) {
    incrementParams.increment_cached = 1;
  }

  // 根据类型增加对应计数
  switch (params.type) {
    case 'image_analysis':
      incrementParams.increment_image_analysis = 1;
      break;
    case 'layout_suggestion':
      incrementParams.increment_layout_suggestion = 1;
      break;
    case 'icon_recommendation':
      incrementParams.increment_icon_recommendation = 1;
      break;
  }

  await createOrUpdateDailyAIStats(incrementParams);
}

// 获取指定日期范围的统计
export async function getAIStatsInRange(
  startDate: string,
  endDate: string
): Promise<AIUsageStats[]> {
  const dbAdapter = new DatabaseAdapter(true);
  
  if (dbAdapter.getDbType() === 'postgresql') {
    const res = await dbAdapter.rawQuery(
      `SELECT * FROM ac_ai_usage_stats 
       WHERE date >= $1 AND date <= $2 
       ORDER BY date ASC`,
      [startDate, endDate]
    );
    
    return res.rows?.map(formatAIUsageStats) || [];
  } else {
    // Supabase: 使用表操作方法
    const result = await dbAdapter.select('ac_ai_usage_stats', {
      orderBy: 'date ASC'
    });
    
    if (!result.data) return [];
    
    // 手动过滤日期范围
    return result.data
      .filter(row => row.date >= startDate && row.date <= endDate)
      .map(formatAIUsageStats);
  }
}

// 获取今日统计
export async function getTodayAIStats(): Promise<AIUsageStats | null> {
  const today = new Date().toISOString().split('T')[0];
  const dbAdapter = new DatabaseAdapter(true);
  
  const result = await dbAdapter.select('ac_ai_usage_stats', {
    where: { date: today },
    limit: 1
  });
  
  if (!result.data || result.data.length === 0) {
    return null;
  }
  
  return formatAIUsageStats(result.data[0]);
}

// 获取全局统计摘要
export async function getGlobalAIStatsSummary(days: number = 30): Promise<{
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
}> {
  const dbAdapter = new DatabaseAdapter(true);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];
  
  if (dbAdapter.getDbType() === 'postgresql') {
    const res = await dbAdapter.rawQuery(`
      SELECT 
        SUM(total_requests) as total_requests,
        SUM(successful_requests) as successful_requests,
        SUM(failed_requests) as failed_requests,
        SUM(cached_requests) as cached_requests,
        SUM(estimated_cost) as total_cost,
        AVG(avg_response_time) as avg_response_time,
        COUNT(*) as days_count
      FROM ac_ai_usage_stats 
      WHERE date >= $1
    `, [startDateStr]);
    
    const peakRes = await dbAdapter.rawQuery(`
      SELECT date, total_requests 
      FROM ac_ai_usage_stats 
      WHERE date >= $1 
      ORDER BY total_requests DESC 
      LIMIT 1
    `, [startDateStr]);
    
    const summary = res.rows?.[0];
    const peak = peakRes.rows?.[0];
    
    if (!summary) {
      return {
        total_requests: 0,
        successful_requests: 0,
        failed_requests: 0,
        cached_requests: 0,
        success_rate: 0,
        cache_hit_rate: 0,
        total_cost: 0,
        avg_daily_requests: 0,
        avg_response_time: 0,
        peak_usage_date: '',
        peak_usage_count: 0
      };
    }
    
    const totalRequests = parseInt(summary.total_requests || '0');
    const successfulRequests = parseInt(summary.successful_requests || '0');
    const cachedRequests = parseInt(summary.cached_requests || '0');
    const daysCount = parseInt(summary.days_count || '1');
    
    return {
      total_requests: totalRequests,
      successful_requests: successfulRequests,
      failed_requests: parseInt(summary.failed_requests || '0'),
      cached_requests: cachedRequests,
      success_rate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
      cache_hit_rate: totalRequests > 0 ? (cachedRequests / totalRequests) * 100 : 0,
      total_cost: parseFloat(summary.total_cost || '0'),
      avg_daily_requests: totalRequests / daysCount,
      avg_response_time: parseFloat(summary.avg_response_time || '0'),
      peak_usage_date: peak?.date || '',
      peak_usage_count: parseInt(peak?.total_requests || '0')
    };
  } else {
    // Supabase: 使用表操作方法
    const result = await dbAdapter.select('ac_ai_usage_stats');
    
    if (!result.data) {
      return {
        total_requests: 0,
        successful_requests: 0,
        failed_requests: 0,
        cached_requests: 0,
        success_rate: 0,
        cache_hit_rate: 0,
        total_cost: 0,
        avg_daily_requests: 0,
        avg_response_time: 0,
        peak_usage_date: '',
        peak_usage_count: 0
      };
    }
    
    // 手动过滤和计算
    const filteredData = result.data.filter(row => row.date >= startDateStr);
    
    let totalRequests = 0;
    let successfulRequests = 0;
    let failedRequests = 0;
    let cachedRequests = 0;
    let totalCost = 0;
    let totalResponseTime = 0;
    let peakUsageDate = '';
    let peakUsageCount = 0;
    
    for (const row of filteredData) {
      totalRequests += row.total_requests || 0;
      successfulRequests += row.successful_requests || 0;
      failedRequests += row.failed_requests || 0;
      cachedRequests += row.cached_requests || 0;
      totalCost += parseFloat(row.estimated_cost || '0');
      totalResponseTime += parseFloat(row.avg_response_time || '0');
      
      if ((row.total_requests || 0) > peakUsageCount) {
        peakUsageCount = row.total_requests || 0;
        peakUsageDate = row.date;
      }
    }
    
    const daysCount = filteredData.length || 1;
    
    return {
      total_requests: totalRequests,
      successful_requests: successfulRequests,
      failed_requests: failedRequests,
      cached_requests: cachedRequests,
      success_rate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
      cache_hit_rate: totalRequests > 0 ? (cachedRequests / totalRequests) * 100 : 0,
      total_cost: totalCost,
      avg_daily_requests: totalRequests / daysCount,
      avg_response_time: totalResponseTime / daysCount,
      peak_usage_date: peakUsageDate,
      peak_usage_count: peakUsageCount
    };
  }
}

// 清理旧统计数据
export async function cleanupOldAIStats(keepDays: number = 90): Promise<number> {
  const dbAdapter = new DatabaseAdapter(true);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - keepDays);
  const cutoffDateStr = cutoffDate.toISOString().split('T')[0];
  
  if (dbAdapter.getDbType() === 'postgresql') {
    const res = await dbAdapter.rawQuery(
      `DELETE FROM ac_ai_usage_stats WHERE date < $1`,
      [cutoffDateStr]
    );
    return res.rows?.length || 0;
  } else {
    // Supabase: 查询旧记录然后删除
    const oldRecords = await dbAdapter.select('ac_ai_usage_stats');
    
    if (!oldRecords.data) return 0;
    
    const toDelete = oldRecords.data.filter(row => row.date < cutoffDateStr);
    
    let deletedCount = 0;
    for (const record of toDelete) {
      const deleteResult = await dbAdapter.delete('ac_ai_usage_stats', { id: record.id });
      if (deleteResult.data && deleteResult.data.length > 0) {
        deletedCount++;
      }
    }
    
    return deletedCount;
  }
} 