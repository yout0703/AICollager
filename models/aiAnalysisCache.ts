import { DatabaseAdapter } from "@/lib/database-adapter";
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

// 生成缓存键
export function generateCacheKey(inputData: any): string {
  const dataString = JSON.stringify(inputData, Object.keys(inputData).sort());
  return crypto.createHash('sha256').update(dataString).digest('hex');
}

// 格式化缓存数据
function formatAIAnalysisCache(row: any): AIAnalysisCache {
  return {
    id: row.id,
    uuid: row.uuid,
    cache_key: row.cache_key,
    cache_type: row.cache_type,
    ai_model: row.ai_model,
    model_version: row.model_version,
    input_data: typeof row.input_data === 'string' ? JSON.parse(row.input_data) : row.input_data,
    analysis_result: typeof row.analysis_result === 'string' ? JSON.parse(row.analysis_result) : row.analysis_result,
    confidence_score: row.confidence_score,
    use_count: row.use_count,
    last_used_at: row.last_used_at,
    expires_at: row.expires_at,
    created_at: row.created_at
  };
}

// 创建AI分析缓存
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
  const dbAdapter = new DatabaseAdapter(true);
  
  const now = new Date().toISOString();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (params.expires_days || 30));
  
  const cacheData = {
    uuid: uuidv4(),
    cache_key: params.cache_key,
    cache_type: params.cache_type,
    ai_model: params.ai_model,
    model_version: params.model_version || null,
    input_data: JSON.stringify(params.input_data || {}),
    analysis_result: JSON.stringify(params.analysis_result),
    confidence_score: params.confidence_score || null,
    use_count: 1,
    last_used_at: now,
    expires_at: expiresAt.toISOString(),
    created_at: now
  };

  // 首先尝试查找现有缓存
  const existing = await findAIAnalysisCacheInternal(params.cache_key, params.cache_type);
  
  if (existing) {
    // 更新现有缓存
    const result = await dbAdapter.update('ac_ai_analysis_cache', {
      analysis_result: cacheData.analysis_result,
      confidence_score: cacheData.confidence_score,
      use_count: existing.use_count + 1,
      last_used_at: now,
      expires_at: cacheData.expires_at
    }, { id: existing.id });
    
    if (!result.data || result.data.length === 0) {
      throw new Error('Failed to update AI analysis cache');
    }
    
    return formatAIAnalysisCache(result.data[0]);
  } else {
    // 创建新缓存
    const result = await dbAdapter.insert('ac_ai_analysis_cache', cacheData);
    
    if (!result.data || result.data.length === 0) {
      throw new Error('Failed to create AI analysis cache');
    }

    return formatAIAnalysisCache(result.data[0]);
  }
}

// 内部查找缓存方法（不更新使用计数）
async function findAIAnalysisCacheInternal(
  cacheKey: string, 
  cacheType: AIAnalysisCache['cache_type']
): Promise<AIAnalysisCache | undefined> {
  const dbAdapter = new DatabaseAdapter(true);
  
  // 使用统一的查询方法
  const result = await dbAdapter.select('ac_ai_analysis_cache', {
    where: { 
      cache_key: cacheKey, 
      cache_type: cacheType 
    },
    limit: 1
  });
  
  if (!result.data || result.data.length === 0) {
    return undefined;
  }

  const cache = result.data[0];
  
  // 检查是否过期
  if (new Date(cache.expires_at) <= new Date()) {
    return undefined;
  }

  return formatAIAnalysisCache(cache);
}

// 查找缓存（会更新使用计数）
export async function findAIAnalysisCache(
  cacheKey: string, 
  cacheType: AIAnalysisCache['cache_type']
): Promise<AIAnalysisCache | undefined> {
  const dbAdapter = new DatabaseAdapter(true);
  
  const cache = await findAIAnalysisCacheInternal(cacheKey, cacheType);
  
  if (!cache) {
    return undefined;
  }

  // 更新使用计数和最后使用时间
  await dbAdapter.update('ac_ai_analysis_cache', {
    use_count: cache.use_count + 1,
    last_used_at: new Date().toISOString()
  }, { id: cache.id });

  return {
    ...cache,
    use_count: cache.use_count + 1,
    last_used_at: new Date().toISOString()
  };
}

// 批量查找缓存
export async function findMultipleAIAnalysisCache(
  cacheKeys: string[], 
  cacheType: AIAnalysisCache['cache_type']
): Promise<Record<string, AIAnalysisCache>> {
  const dbAdapter = new DatabaseAdapter(true);
  
  if (cacheKeys.length === 0) {
    return {};
  }
  
  const result: Record<string, AIAnalysisCache> = {};
  
  // 对于 Supabase，我们需要逐个查询，因为它不支持 IN 查询的复杂操作
  // 对于 PostgreSQL，我们可以使用原始 SQL
  if (dbAdapter.getDbType() === 'postgresql') {
    const placeholders = cacheKeys.map((_, index) => `$${index + 2}`).join(',');
    
    const res = await dbAdapter.rawQuery(
      `SELECT * FROM ac_ai_analysis_cache 
       WHERE cache_type = $1 AND cache_key IN (${placeholders}) AND expires_at > NOW()`,
      [cacheType, ...cacheKeys]
    );
    
    if (res.rows) {
      for (const row of res.rows) {
        const cache = formatAIAnalysisCache(row);
        result[cache.cache_key] = cache;
      }
    
      // 批量更新使用计数
      if (res.rows.length > 0) {
        const ids = res.rows.map(row => row.id);
        const idPlaceholders = ids.map((_, index) => `$${index + 1}`).join(',');
        
        await dbAdapter.rawQuery(
          `UPDATE ac_ai_analysis_cache 
           SET use_count = use_count + 1, last_used_at = NOW() 
           WHERE id IN (${idPlaceholders})`,
          ids
        );
      }
    }
  } else {
    // Supabase: 逐个查询
    for (const cacheKey of cacheKeys) {
      const cache = await findAIAnalysisCache(cacheKey, cacheType);
      if (cache) {
        result[cacheKey] = cache;
      }
    }
  }
  
  return result;
}

// 删除过期缓存
export async function cleanupExpiredAICache(): Promise<number> {
  const dbAdapter = new DatabaseAdapter(true);
  
  if (dbAdapter.getDbType() === 'postgresql') {
    const res = await dbAdapter.rawQuery(
      `DELETE FROM ac_ai_analysis_cache WHERE expires_at <= NOW()`
    );
    return res.rows?.length || 0;
  } else {
    // Supabase: 查询过期的缓存然后删除
    const expiredResult = await dbAdapter.select('ac_ai_analysis_cache', {
      select: 'id',
      where: {} // 我们需要手动过滤过期的
    });
    
    if (!expiredResult.data) return 0;
    
    const now = new Date();
    const expiredIds = expiredResult.data
      .filter(cache => new Date(cache.expires_at) <= now)
      .map(cache => cache.id);
    
    let deletedCount = 0;
    for (const id of expiredIds) {
      const deleteResult = await dbAdapter.delete('ac_ai_analysis_cache', { id });
      if (deleteResult.data && deleteResult.data.length > 0) {
        deletedCount++;
      }
    }
    
    return deletedCount;
  }
}

// 获取缓存统计
export async function getAICacheStats(): Promise<{
  total: number;
  by_type: Record<string, number>;
  by_model: Record<string, number>;
  hit_rate: number;
  total_saves: number;
}> {
  const dbAdapter = new DatabaseAdapter(true);
  
  if (dbAdapter.getDbType() === 'postgresql') {
    const [totalRes, typeRes, modelRes, usageRes] = await Promise.all([
      dbAdapter.rawQuery(`SELECT COUNT(*) as total FROM ac_ai_analysis_cache WHERE expires_at > NOW()`),
      dbAdapter.rawQuery(`
        SELECT cache_type, COUNT(*) as count 
        FROM ac_ai_analysis_cache 
        WHERE expires_at > NOW() 
        GROUP BY cache_type
      `),
      dbAdapter.rawQuery(`
        SELECT ai_model, COUNT(*) as count 
        FROM ac_ai_analysis_cache 
        WHERE expires_at > NOW() 
        GROUP BY ai_model
      `),
      dbAdapter.rawQuery(`
        SELECT 
          COUNT(*) as cached_items,
          SUM(use_count) as total_uses,
          SUM(use_count - 1) as total_saves
        FROM ac_ai_analysis_cache 
        WHERE expires_at > NOW()
      `)
    ]);
    
    const total = parseInt(totalRes.rows?.[0]?.total || '0');
    
    const byType: Record<string, number> = {};
    if (typeRes.rows) {
      for (const row of typeRes.rows) {
        byType[row.cache_type] = parseInt(row.count);
      }
    }
    
    const byModel: Record<string, number> = {};
    if (modelRes.rows) {
      for (const row of modelRes.rows) {
        byModel[row.ai_model] = parseInt(row.count);
      }
    }
    
    const usageRow = usageRes.rows?.[0];
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
  } else {
    // Supabase: 使用表操作方法
    const allCaches = await dbAdapter.select('ac_ai_analysis_cache');
    
    if (!allCaches.data) {
      return {
        total: 0,
        by_type: {},
        by_model: {},
        hit_rate: 0,
        total_saves: 0
      };
    }
    
    const now = new Date();
    const validCaches = allCaches.data.filter(cache => new Date(cache.expires_at) > now);
    
    const total = validCaches.length;
    const byType: Record<string, number> = {};
    const byModel: Record<string, number> = {};
    let totalUses = 0;
    let totalSaves = 0;
    
    for (const cache of validCaches) {
      // 按类型统计
      byType[cache.cache_type] = (byType[cache.cache_type] || 0) + 1;
      
      // 按模型统计
      byModel[cache.ai_model] = (byModel[cache.ai_model] || 0) + 1;
      
      // 使用统计
      totalUses += cache.use_count;
      totalSaves += Math.max(0, cache.use_count - 1);
    }
    
    const hitRate = total > 0 ? (totalSaves / (totalSaves + total)) * 100 : 0;
    
    return {
      total,
      by_type: byType,
      by_model: byModel,
      hit_rate: Math.round(hitRate * 100) / 100,
      total_saves: totalSaves
    };
  }
}

// 清理低频缓存
export async function cleanupLowUsageCache(minUsageCount: number = 1): Promise<number> {
  const dbAdapter = new DatabaseAdapter(true);
  
  if (dbAdapter.getDbType() === 'postgresql') {
    const res = await dbAdapter.rawQuery(
      `DELETE FROM ac_ai_analysis_cache 
       WHERE use_count <= $1 AND created_at < NOW() - INTERVAL '7 days'`,
      [minUsageCount]
    );
    return res.rows?.length || 0;
  } else {
    // Supabase: 查询低频缓存然后删除
    const allCaches = await dbAdapter.select('ac_ai_analysis_cache');
    
    if (!allCaches.data) return 0;
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const lowUsageCaches = allCaches.data.filter(cache => 
      cache.use_count <= minUsageCount && 
      new Date(cache.created_at) < sevenDaysAgo
    );
    
    let deletedCount = 0;
    for (const cache of lowUsageCaches) {
      const deleteResult = await dbAdapter.delete('ac_ai_analysis_cache', { id: cache.id });
      if (deleteResult.data && deleteResult.data.length > 0) {
        deletedCount++;
      }
    }
    
    return deletedCount;
  }
} 