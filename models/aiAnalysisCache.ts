import { getDb } from "@/models/db";
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export interface AIAnalysisCache {
  id: number;
  uuid: string;
  cache_key: string;
  cache_type: 'image_analysis' | 'layout_suggestion' | 'icon_recommendation';
  ai_model: string;
  model_version?: string;
  input_data?: Record<string, any>;
  analysis_result: Record<string, any>;
  confidence_score?: number;
  use_count: number;
  last_used_at: string;
  expires_at: string;
  created_at: string;
}

// 生成缓存键（基于输入数据的hash）
export function generateCacheKey(inputData: any): string {
  let dataString: string;
  try {
    dataString = JSON.stringify(inputData);
    // 检查序列化结果是否有效
    if (dataString === '[object Object]' || dataString === 'undefined' || dataString === 'null') {
      console.warn('Invalid serialization result, using fallback');
      dataString = JSON.stringify({ fallback: Date.now() });
    }
  } catch (error) {
    console.warn('Failed to serialize input data for cache key, using fallback:', error);
    dataString = JSON.stringify({ fallback: Date.now(), error: 'serialization_failed' });
  }
  return crypto.createHash('sha256').update(dataString).digest('hex');
}

// 创建AI分析缓存 - 使用upsert避免重复键错误
export async function createAIAnalysisCache(params: {
  cache_key: string;
  cache_type: AIAnalysisCache['cache_type'];
  ai_model: string;
  model_version?: string;
  input_data?: Record<string, any>;
  analysis_result: Record<string, any>;
  confidence_score?: number;
  expires_days?: number;
}): Promise<AIAnalysisCache> {
  const db = getDb();
  const uuid = uuidv4();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + (params.expires_days || 30) * 24 * 60 * 60 * 1000).toISOString();

  // 安全序列化 input_data
  let inputDataString: string;
  try {
    const inputData = params.input_data || {};
    inputDataString = JSON.stringify(inputData);
    // 验证序列化结果不是 "[object Object]"
    if (inputDataString === '[object Object]') {
      console.warn('Input data serialization resulted in "[object Object]", using empty object');
      inputDataString = '{}';
    }
  } catch (error) {
    console.warn('Failed to serialize input_data, using empty object:', error);
    inputDataString = '{}';
  }

  // 安全序列化 analysis_result
  let analysisResultString: string;
  try {
    analysisResultString = JSON.stringify(params.analysis_result);
    // 验证序列化结果不是 "[object Object]"
    if (analysisResultString === '[object Object]') {
      throw new Error('Analysis result serialization failed');
    }
  } catch (error) {
    console.error('Failed to serialize analysis_result:', error);
    throw new Error('Invalid analysis_result data');
  }

  // 使用 upsert 操作，避免重复键约束错误
  const res = await db.query(
    `INSERT INTO ac_ai_analysis_cache 
      (uuid, cache_key, cache_type, ai_model, model_version, input_data, analysis_result, confidence_score, expires_at, created_at) 
      VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (cache_key) 
      DO UPDATE SET
        analysis_result = EXCLUDED.analysis_result,
        confidence_score = EXCLUDED.confidence_score,
        ai_model = EXCLUDED.ai_model,
        model_version = EXCLUDED.model_version,
        use_count = ac_ai_analysis_cache.use_count + 1,
        last_used_at = NOW(),
        expires_at = EXCLUDED.expires_at
      RETURNING *`,
    [
      uuid,
      params.cache_key,
      params.cache_type,
      params.ai_model,
      params.model_version,
      inputDataString,
      analysisResultString,
      params.confidence_score,
      expiresAt,
      now
    ]
  );

  if (res.rowCount === 0) {
    throw new Error('Failed to create or update AI analysis cache');
  }

  return formatAIAnalysisCache(res.rows[0]);
}

// 查找缓存
export async function findAIAnalysisCache(
  cacheKey: string, 
  cacheType: AIAnalysisCache['cache_type']
): Promise<AIAnalysisCache | undefined> {
  const db = getDb();
  
  const res = await db.query(
    `SELECT * FROM ac_ai_analysis_cache 
     WHERE cache_key = $1 AND cache_type = $2 AND expires_at > NOW() 
     LIMIT 1`,
    [cacheKey, cacheType]
  );
  
  if (res.rowCount === 0) {
    return undefined;
  }

  // 更新使用计数和最后使用时间
  await db.query(
    `UPDATE ac_ai_analysis_cache 
     SET use_count = use_count + 1, last_used_at = NOW() 
     WHERE id = $1`,
    [res.rows[0].id]
  );

  return formatAIAnalysisCache(res.rows[0]);
}

// 批量查找缓存
export async function findMultipleAIAnalysisCache(
  cacheKeys: string[], 
  cacheType: AIAnalysisCache['cache_type']
): Promise<Record<string, AIAnalysisCache>> {
  const db = getDb();
  
  if (cacheKeys.length === 0) {
    return {};
  }
  
  const placeholders = cacheKeys.map((_, index) => `$${index + 2}`).join(',');
  
  const res = await db.query(
    `SELECT * FROM ac_ai_analysis_cache 
     WHERE cache_type = $1 AND cache_key IN (${placeholders}) AND expires_at > NOW()`,
    [cacheType, ...cacheKeys]
  );
  
  const result: Record<string, AIAnalysisCache> = {};
  
  for (const row of res.rows) {
    const cache = formatAIAnalysisCache(row);
    result[cache.cache_key] = cache;
  }
  
  // 批量更新使用计数
  if (res.rows.length > 0) {
    const ids = res.rows.map(row => row.id);
    const idPlaceholders = ids.map((_, index) => `$${index + 1}`).join(',');
    
    await db.query(
      `UPDATE ac_ai_analysis_cache 
       SET use_count = use_count + 1, last_used_at = NOW() 
       WHERE id IN (${idPlaceholders})`,
      ids
    );
  }
  
  return result;
}

// 删除过期缓存
export async function cleanupExpiredAICache(): Promise<number> {
  const db = getDb();
  
  const res = await db.query(
    `DELETE FROM ac_ai_analysis_cache WHERE expires_at <= NOW()`
  );

  return res.rowCount || 0;
}

// 获取缓存统计
export async function getAICacheStats(): Promise<{
  total: number;
  by_type: Record<string, number>;
  by_model: Record<string, number>;
  hit_rate: number; // 基于use_count计算
  total_saves: number; // 总共节省的API调用次数
}> {
  const db = getDb();
  
  const [totalRes, typeRes, modelRes, usageRes] = await Promise.all([
    db.query(`SELECT COUNT(*) as total FROM ac_ai_analysis_cache WHERE expires_at > NOW()`),
    db.query(`
      SELECT cache_type, COUNT(*) as count 
      FROM ac_ai_analysis_cache 
      WHERE expires_at > NOW() 
      GROUP BY cache_type
    `),
    db.query(`
      SELECT ai_model, COUNT(*) as count 
      FROM ac_ai_analysis_cache 
      WHERE expires_at > NOW() 
      GROUP BY ai_model
    `),
    db.query(`
      SELECT 
        COUNT(*) as cached_items,
        SUM(use_count) as total_uses,
        SUM(use_count - 1) as total_saves
      FROM ac_ai_analysis_cache 
      WHERE expires_at > NOW()
    `)
  ]);
  
  const total = parseInt(totalRes.rows[0]?.total || '0');
  
  const byType: Record<string, number> = {};
  for (const row of typeRes.rows) {
    byType[row.cache_type] = parseInt(row.count);
  }
  
  const byModel: Record<string, number> = {};
  for (const row of modelRes.rows) {
    byModel[row.ai_model] = parseInt(row.count);
  }
  
  const usageRow = usageRes.rows[0];
  const totalUses = parseInt(usageRow?.total_uses || '0');
  const totalSaves = parseInt(usageRow?.total_saves || '0');
  const hitRate = total > 0 ? (totalSaves / (totalSaves + total)) * 100 : 0;
  
  return {
    total,
    by_type: byType,
    by_model: byModel,
    hit_rate: Math.round(hitRate * 100) / 100,
    total_saves: totalSaves
  };
}

// 清理低频缓存（保留空间）
export async function cleanupLowUsageCache(minUsageCount: number = 1): Promise<number> {
  const db = getDb();
  
  const res = await db.query(
    `DELETE FROM ac_ai_analysis_cache 
     WHERE use_count <= $1 AND created_at < NOW() - INTERVAL '7 days'`,
    [minUsageCount]
  );

  return res.rowCount || 0;
}

// 格式化缓存数据
function formatAIAnalysisCache(row: any): AIAnalysisCache {
  // 安全解析 input_data
  let inputData: Record<string, any> | undefined = undefined;
  if (row.input_data) {
    try {
      // 检查是否为 "[object Object]" 这样的无效 JSON
      if (typeof row.input_data === 'string' && row.input_data !== '[object Object]') {
        inputData = JSON.parse(row.input_data);
      } else if (typeof row.input_data === 'object') {
        inputData = row.input_data;
      }
    } catch (error) {
      console.warn('Failed to parse input_data, using undefined:', error);
      inputData = undefined;
    }
  }

  // 安全解析 analysis_result
  let analysisResult: Record<string, any>;
  try {
    if (typeof row.analysis_result === 'string') {
      analysisResult = JSON.parse(row.analysis_result);
    } else {
      analysisResult = row.analysis_result;
    }
  } catch (error) {
    console.error('Failed to parse analysis_result:', error);
    throw new Error('Invalid analysis_result data in cache');
  }

  return {
    id: row.id,
    uuid: row.uuid,
    cache_key: row.cache_key,
    cache_type: row.cache_type,
    ai_model: row.ai_model,
    model_version: row.model_version,
    input_data: inputData,
    analysis_result: analysisResult,
    confidence_score: row.confidence_score,
    use_count: row.use_count || 1,
    last_used_at: row.last_used_at,
    expires_at: row.expires_at,
    created_at: row.created_at
  };
} 