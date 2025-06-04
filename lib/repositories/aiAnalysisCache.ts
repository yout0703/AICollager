import { db } from '../../db/client'
import { aiAnalysisCache, type AiAnalysisCache, type NewAiAnalysisCache } from '../../db/schema/ai'
import { eq, and, lt, desc, sql, count, inArray } from 'drizzle-orm'
import { createHash } from 'crypto'

// 生成缓存键
export function generateCacheKey(input: any): string {
  const inputString = typeof input === 'string' ? input : JSON.stringify(input)
  return createHash('sha256').update(inputString).digest('hex')
}

// 查找单个AI分析缓存
export async function findAIAnalysisCache(
  inputHash: string, 
  cacheType?: string
): Promise<AiAnalysisCache | null> {
  try {
    const conditions = [
      eq(aiAnalysisCache.inputHash, inputHash),
      eq(aiAnalysisCache.isValid, true),
      sql`${aiAnalysisCache.expiresAt} > NOW()`
    ]
    
    if (cacheType) {
      conditions.push(eq(aiAnalysisCache.cacheType, cacheType))
    }
    
    const [cache] = await db
      .select()
      .from(aiAnalysisCache)
      .where(and(...conditions))
      .orderBy(desc(aiAnalysisCache.lastUsedAt))
      .limit(1)
    
    if (cache) {
      // 更新使用计数和最后使用时间
      await db
        .update(aiAnalysisCache)
        .set({
          useCount: sql`${aiAnalysisCache.useCount} + 1`,
          lastUsedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(aiAnalysisCache.uuid, cache.uuid))
    }
    
    return cache || null
  } catch (error) {
    console.error('查找AI分析缓存失败:', error)
    return null
  }
}

// 批量查找AI分析缓存
export async function findMultipleAIAnalysisCache(
  inputHashes: string[], 
  cacheType: string
): Promise<Record<string, AiAnalysisCache>> {
  try {
    if (inputHashes.length === 0) return {}
    
    const caches = await db
      .select()
      .from(aiAnalysisCache)
      .where(and(
        inArray(aiAnalysisCache.inputHash, inputHashes),
        eq(aiAnalysisCache.cacheType, cacheType),
        eq(aiAnalysisCache.isValid, true),
        sql`${aiAnalysisCache.expiresAt} > NOW()`
      ))
      .orderBy(desc(aiAnalysisCache.lastUsedAt))
    
    // 批量更新使用计数
    if (caches.length > 0) {
      const cacheIds = caches.map((c: AiAnalysisCache) => c.uuid)
      await db
        .update(aiAnalysisCache)
        .set({
          useCount: sql`${aiAnalysisCache.useCount} + 1`,
          lastUsedAt: new Date(),
          updatedAt: new Date()
        })
        .where(inArray(aiAnalysisCache.uuid, cacheIds))
    }
    
    // 转换为哈希映射
    const result: Record<string, AiAnalysisCache> = {}
    caches.forEach((cache: AiAnalysisCache) => {
      result[cache.inputHash] = cache
    })
    
    return result
  } catch (error) {
    console.error('批量查找AI分析缓存失败:', error)
    return {}
  }
}

// 创建AI分析缓存
export async function createAIAnalysisCache(data: {
  cacheKey: string
  cacheType: 'image_analysis' | 'layout_suggestion' | 'icon_recommendation'
  aiModel: string
  modelVersion?: string
  inputData: any
  analysisResult: any
  confidenceScore?: number
  expiresInDays?: number
  metadata?: any
}): Promise<AiAnalysisCache> {
  try {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + (data.expiresInDays || 30))
    
    const newCache: NewAiAnalysisCache = {
      inputHash: data.cacheKey,
      cacheType: data.cacheType,
      analysisResult: data.analysisResult,
      confidenceScore: data.confidenceScore?.toString(),
      expiresAt,
      metadata: data.metadata || {}
    }
    
    const [cache] = await db
      .insert(aiAnalysisCache)
      .values(newCache)
      .returning()
    
    return cache
  } catch (error) {
    console.error('创建AI分析缓存失败:', error)
    throw error
  }
}

// 清理过期缓存
export async function cleanupExpiredAICache(): Promise<number> {
  try {
    const deletedCaches = await db
      .delete(aiAnalysisCache)
      .where(lt(aiAnalysisCache.expiresAt, new Date()))
      .returning()
    
    return deletedCaches.length
  } catch (error) {
    console.error('清理过期AI缓存失败:', error)
    return 0
  }
}

// 清理低使用率缓存
export async function cleanupLowUsageCache(minUsageCount: number = 1): Promise<number> {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 7)
    
    const deletedCaches = await db
      .delete(aiAnalysisCache)
      .where(and(
        lt(aiAnalysisCache.useCount, minUsageCount),
        lt(aiAnalysisCache.createdAt, cutoffDate)
      ))
      .returning()
    
    return deletedCaches.length
  } catch (error) {
    console.error('清理低使用率AI缓存失败:', error)
    return 0
  }
}

// 获取AI缓存统计
export async function getAICacheStats(): Promise<{
  total: number
  byType: Record<string, number>
  hitRate: number
  totalSaves: number
}> {
  try {
    // 总缓存数量
    const [totalResult] = await db
      .select({ count: count() })
      .from(aiAnalysisCache)
      .where(eq(aiAnalysisCache.isValid, true))
    
    // 按类型统计
    const typeStats = await db
      .select({
        type: aiAnalysisCache.cacheType,
        count: count()
      })
      .from(aiAnalysisCache)
      .where(eq(aiAnalysisCache.isValid, true))
      .groupBy(aiAnalysisCache.cacheType)
    
    // 使用统计
    const [usageResult] = await db
      .select({
        totalUse: sql<number>`SUM(${aiAnalysisCache.useCount})`
      })
      .from(aiAnalysisCache)
      .where(eq(aiAnalysisCache.isValid, true))
    
    const byType: Record<string, number> = {}
    typeStats.forEach((stat: { type: string; count: number }) => {
      byType[stat.type] = stat.count
    })
    
    const total = totalResult.count
    const totalUse = usageResult.totalUse || 0
    const hitRate = total > 0 ? (totalUse - total) / totalUse * 100 : 0
    
    return {
      total,
      byType,
      hitRate: Math.max(0, hitRate),
      totalSaves: totalUse - total
    }
  } catch (error) {
    console.error('获取AI缓存统计失败:', error)
    return {
      total: 0,
      byType: {},
      hitRate: 0,
      totalSaves: 0
    }
  }
}

// 别名导出以保持兼容性
export const getAnalysisCache = findAIAnalysisCache
export const getCacheByHash = findAIAnalysisCache
export const createAnalysisCache = createAIAnalysisCache
export const deleteExpiredCache = cleanupExpiredAICache
export const cleanupExpiredCache = cleanupExpiredAICache 