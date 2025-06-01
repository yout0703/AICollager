import { getDb } from "@/models/db";
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

// 创建或更新当日AI使用统计
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
  const db = getDb();
  const date = params.date || new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();
  
  // 数值安全化处理函数
  const safeNumber = (value: any, defaultValue: number = 0): number => {
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
      return defaultValue;
    }
    return value;
  };

  // 安全的小数格式化（保留4位小数，符合数据库DECIMAL(10,4)格式）
  const safeDecimal = (value: any, defaultValue: number = 0, precision: number = 4): number => {
    const num = safeNumber(value, defaultValue);
    return Math.round(num * Math.pow(10, precision)) / Math.pow(10, precision);
  };

  // 先尝试查找当日记录
  const existingRes = await db.query(
    `SELECT * FROM ac_ai_usage_stats 
     WHERE date = $1 
     LIMIT 1`,
    [date]
  );
  
  if (existingRes.rowCount && existingRes.rowCount > 0) {
    // 更新现有记录
    const existing = existingRes.rows[0];
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
    
    const updateRes = await db.query(
      `UPDATE ac_ai_usage_stats 
       SET 
         total_requests = $1,
         successful_requests = $2,
         failed_requests = $3,
         cached_requests = $4,
         image_analysis_count = $5,
         layout_suggestion_count = $6,
         icon_recommendation_count = $7,
         estimated_cost = $8,
         avg_response_time = $9,
         total_processing_time = $10,
         metadata = $11,
         updated_at = $12
       WHERE id = $13
       RETURNING *`,
      [
        newTotalRequests,
        newSuccessful,
        newFailed,
        newCached,
        newImageAnalysis,
        newLayoutSuggestion,
        newIconRecommendation,
        newCost,
        newAvgTime,
        newTotalTime,
        JSON.stringify({ ...existing.metadata, ...params.metadata }),
        now,
        existing.id
      ]
    );
    
    return formatAIUsageStats(updateRes.rows[0]);
    
  } else {
    // 创建新记录
    const totalRequests = safeNumber(params.increment_requests);
    const responseTime = safeDecimal(params.add_response_time, 0, 2);
    const avgResponseTime = totalRequests > 0 ? safeDecimal(responseTime / totalRequests, 0, 2) : 0;
    const cost = safeDecimal(params.add_cost);
    
    const createRes = await db.query(
      `INSERT INTO ac_ai_usage_stats 
        (uuid, date, total_requests, successful_requests, failed_requests, cached_requests,
         image_analysis_count, layout_suggestion_count, icon_recommendation_count, 
         estimated_cost, cost_currency, avg_response_time, total_processing_time, metadata, created_at, updated_at) 
        VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *`,
      [
        uuidv4(),
        date,
        totalRequests,
        safeNumber(params.increment_successful),
        safeNumber(params.increment_failed),
        safeNumber(params.increment_cached),
        safeNumber(params.increment_image_analysis),
        safeNumber(params.increment_layout_suggestion),
        safeNumber(params.increment_icon_recommendation),
        cost,
        'USD',
        avgResponseTime,
        responseTime,
        JSON.stringify(params.metadata || {}),
        now,
        now
      ]
    );
    
    return formatAIUsageStats(createRes.rows[0]);
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
}): Promise<boolean> {
  try {
    const incrementData: any = {
      increment_requests: 1,
      add_response_time: params.response_time,
      metadata: params.metadata
    };
    
    if (params.success) {
      incrementData.increment_successful = 1;
    } else {
      incrementData.increment_failed = 1;
    }
    
    if (params.cached) {
      incrementData.increment_cached = 1;
    }
    
    // 按类型增加计数
    switch (params.type) {
      case 'image_analysis':
        incrementData.increment_image_analysis = 1;
        break;
      case 'layout_suggestion':
        incrementData.increment_layout_suggestion = 1;
        break;
      case 'icon_recommendation':
        incrementData.increment_icon_recommendation = 1;
        break;
    }
    
    if (params.estimated_cost) {
      incrementData.add_cost = params.estimated_cost;
    }
    
    await createOrUpdateDailyAIStats(incrementData);
    return true;
    
  } catch (error) {
    console.error('Failed to record AI request:', error);
    return false;
  }
}

// 获取指定日期范围的统计
export async function getAIStatsInRange(
  startDate: string,
  endDate: string
): Promise<AIUsageStats[]> {
  const db = getDb();
  
  const res = await db.query(
    `SELECT * FROM ac_ai_usage_stats 
     WHERE date >= $1 AND date <= $2 
     ORDER BY date ASC`,
    [startDate, endDate]
  );
  
  return res.rows.map(formatAIUsageStats);
}

// 获取今日统计
export async function getTodayAIStats(): Promise<AIUsageStats | null> {
  const today = new Date().toISOString().split('T')[0];
  const stats = await getAIStatsInRange(today, today);
  return stats.length > 0 ? stats[0] : null;
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
  const db = getDb();
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = new Date().toISOString().split('T')[0];
  
  const res = await db.query(`
    SELECT 
      SUM(total_requests) as total_requests,
      SUM(successful_requests) as successful_requests,
      SUM(failed_requests) as failed_requests,
      SUM(cached_requests) as cached_requests,
      SUM(estimated_cost) as total_cost,
      AVG(avg_response_time) as avg_response_time,
      COUNT(*) as active_days,
      MAX(total_requests) as peak_count,
      (SELECT date FROM ac_ai_usage_stats 
       WHERE date >= $1 AND date <= $2 
       ORDER BY total_requests DESC LIMIT 1) as peak_date
    FROM ac_ai_usage_stats 
    WHERE date >= $1 AND date <= $2
  `, [startDate, endDate]);
  
  const row = res.rows[0];
  const totalRequests = parseInt(row.total_requests || '0');
  const successfulRequests = parseInt(row.successful_requests || '0');
  const cachedRequests = parseInt(row.cached_requests || '0');
  const activeDays = parseInt(row.active_days || '1');
  
  return {
    total_requests: totalRequests,
    successful_requests: successfulRequests,
    failed_requests: parseInt(row.failed_requests || '0'),
    cached_requests: cachedRequests,
    success_rate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
    cache_hit_rate: totalRequests > 0 ? (cachedRequests / totalRequests) * 100 : 0,
    total_cost: parseFloat(row.total_cost || '0'),
    avg_daily_requests: totalRequests / Math.max(activeDays, 1),
    avg_response_time: parseFloat(row.avg_response_time || '0'),
    peak_usage_date: row.peak_date || '',
    peak_usage_count: parseInt(row.peak_count || '0')
  };
}

// 清理旧统计数据
export async function cleanupOldAIStats(keepDays: number = 90): Promise<number> {
  const db = getDb();
  const cutoffDate = new Date(Date.now() - keepDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const res = await db.query(
    `DELETE FROM ac_ai_usage_stats WHERE date < $1`,
    [cutoffDate]
  );
  
  return res.rowCount || 0;
}

// 格式化统计数据
function formatAIUsageStats(row: any): AIUsageStats {
  return {
    id: row.id,
    uuid: row.uuid || '',
    date: row.date,
    stat_type: 'daily', // 固定为daily，因为表中没有这个字段
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
    metadata: row.metadata || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at || row.created_at
  };
} 