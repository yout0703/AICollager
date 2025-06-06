/**
 * AI使用统计数据访问层
 * 
 * 提供AI使用统计的数据库操作功能：
 * - AI请求记录和统计
 * - 按日期聚合的使用数据
 * - 成本和性能指标跟踪
 * - 历史数据管理
 */

import { db } from '@/db/client'
import { aiUsageStats, type AIUsageStats, type NewAIUsageStats } from '@/db/schema/ai'
import { eq, and, gte, lte, desc, sql, count, sum, avg } from 'drizzle-orm'

// 统一的操作类型定义
export type AIOperationType = 'image_analysis' | 'layout_suggestion' | 'icon_recommendation' | 'collage_generation'

// 兼容性类型定义
export interface AIUsageStatsModel {
  id: number;
  uuid: string;
  userId?: string;
  sessionId?: string;
  operationType: AIOperationType;
  aiModel: string;
  processingTimeMs: number;
  tokensUsed?: number;
  creditsConsumed: number;
  success: boolean;
  errorMessage?: string;
  metadata: any;
  createdAt: string;
  // 统计字段
  date?: string;
  total_requests?: number;
  successful_requests?: number;
  failed_requests?: number;
  cached_requests?: number;
  avg_response_time?: number;
  estimated_cost?: number;
  total_cost?: number;
}

// 记录AI使用统计
export async function recordAIRequest(data: {
  operationType: AIOperationType
  aiModel: string
  processingTimeMs: number
  success: boolean
  estimatedCost?: number
  metadata?: any
}): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    // 查找今天的统计记录
    let [todayStats] = await db
      .select()
      .from(aiUsageStats)
      .where(eq(aiUsageStats.date, today))
      .limit(1)
    
    if (!todayStats) {
      // 创建今天的统计记录
      const newStats: NewAIUsageStats = {
        date: today,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        cachedRequests: 0,
        imageAnalysisCount: 0,
        layoutSuggestionCount: 0,
        iconRecommendationCount: 0,
        estimatedCost: '0',
        avgResponseTime: '0',
        totalProcessingTime: '0'
      }
      
      const [createdStats] = await db
        .insert(aiUsageStats)
        .values(newStats)
        .returning()
      
      todayStats = createdStats
    }
    
    // 计算新的平均响应时间
    const newTotalRequests = todayStats.totalRequests + 1
    const newTotalProcessingTime = Number(todayStats.totalProcessingTime) + data.processingTimeMs
    const newAvgResponseTime = newTotalProcessingTime / newTotalRequests
    
    // 准备更新数据
    const updateData: Partial<NewAIUsageStats> = {
      totalRequests: newTotalRequests,
      totalProcessingTime: newTotalProcessingTime.toString(),
      avgResponseTime: newAvgResponseTime.toString(),
      updatedAt: new Date()
    }
    
    if (data.success) {
      updateData.successfulRequests = todayStats.successfulRequests + 1
    } else {
      updateData.failedRequests = todayStats.failedRequests + 1
    }
    
    // 按操作类型统计
    switch (data.operationType) {
      case 'image_analysis':
        updateData.imageAnalysisCount = todayStats.imageAnalysisCount + 1
        break
      case 'layout_suggestion':
        updateData.layoutSuggestionCount = todayStats.layoutSuggestionCount + 1
        break
      case 'icon_recommendation':
        updateData.iconRecommendationCount = todayStats.iconRecommendationCount + 1
        break
    }
    
    // 更新成本
    if (data.estimatedCost) {
      const newCost = Number(todayStats.estimatedCost) + data.estimatedCost
      updateData.estimatedCost = newCost.toString()
    }
    
    await db
      .update(aiUsageStats)
      .set(updateData)
      .where(eq(aiUsageStats.uuid, todayStats.uuid))
      
  } catch (error) {
    console.error('记录AI使用统计失败:', error)
  }
}

// 获取今天的AI统计
export async function getTodayAIStats(): Promise<AIUsageStats | null> {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    const [stats] = await db
      .select()
      .from(aiUsageStats)
      .where(eq(aiUsageStats.date, today))
      .limit(1)
    
    return stats || null
  } catch (error) {
    console.error('获取今日AI统计失败:', error)
    return null
  }
}

// 按时间范围获取AI使用统计
export async function getAIUsageByUser(startDate: string, endDate?: string): Promise<AIUsageStats[]> {
  try {
    const conditions = [gte(aiUsageStats.date, startDate)]
    
    if (endDate) {
      conditions.push(lte(aiUsageStats.date, endDate))
    }
    
    return await db
      .select()
      .from(aiUsageStats)
      .where(and(...conditions))
      .orderBy(desc(aiUsageStats.date))
  } catch (error) {
    console.error('获取AI使用统计失败:', error)
    return []
  }
}

// 获取AI使用统计汇总
export async function getAIUsageStats(params: {
  startDate?: string
  endDate?: string
  operationType?: string
}): Promise<{
  stats: AIUsageStats[]
  total: number
  summary: {
    totalRequests: number
    successfulRequests: number
    failedRequests: number
    avgProcessingTime: number
    totalCost: number
    successRate: number
  }
}> {
  try {
    const conditions = []
    
    if (params.startDate) {
      conditions.push(gte(aiUsageStats.date, params.startDate))
    }
    if (params.endDate) {
      conditions.push(lte(aiUsageStats.date, params.endDate))
    }
    
    // 获取详细统计
    const stats = await db
      .select()
      .from(aiUsageStats)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(aiUsageStats.date))
    
    // 计算汇总信息
    const [summaryResult] = await db
      .select({
        totalRequests: sum(aiUsageStats.totalRequests),
        successfulRequests: sum(aiUsageStats.successfulRequests),
        failedRequests: sum(aiUsageStats.failedRequests),
        avgProcessingTime: avg(aiUsageStats.avgResponseTime),
        totalCost: sum(aiUsageStats.estimatedCost)
      })
      .from(aiUsageStats)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
    
    const totalRequests = Number(summaryResult.totalRequests || 0)
    const successfulRequests = Number(summaryResult.successfulRequests || 0)
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0
    
    return {
      stats,
      total: stats.length,
      summary: {
        totalRequests,
        successfulRequests,
        failedRequests: Number(summaryResult.failedRequests || 0),
        avgProcessingTime: Number(summaryResult.avgProcessingTime || 0),
        totalCost: Number(summaryResult.totalCost || 0),
        successRate
      }
    }
  } catch (error) {
    console.error('获取AI使用统计汇总失败:', error)
    return {
      stats: [],
      total: 0,
      summary: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        avgProcessingTime: 0,
        totalCost: 0,
        successRate: 0
      }
    }
  }
}

// 清理旧的AI统计数据
export async function cleanupOldAIStats(keepDays: number = 90): Promise<number> {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - keepDays)
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0]
    
    // 先查询要删除的记录数量
    const countResult = await db
      .select({ count: count() })
      .from(aiUsageStats)
      .where(sql`${aiUsageStats.date} < ${cutoffDateStr}`)
    
    const recordCount = countResult[0]?.count || 0
    
    // 执行删除操作
    await db
      .delete(aiUsageStats)
      .where(sql`${aiUsageStats.date} < ${cutoffDateStr}`)
    
    return Number(recordCount)
  } catch (error) {
    console.error('清理旧AI统计失败:', error)
    return 0
  }
}

/**
 * 向后兼容的Repository类
 * 
 * 为了保持与现有代码的兼容性，提供传统的类式接口
 */
export class AiUsageStatsRepository {
  static async create(data: Partial<AIUsageStatsModel>): Promise<AIUsageStatsModel> {
    await recordAIRequest({
      operationType: data.operationType || 'image_analysis',
      aiModel: data.aiModel || 'gemini-1.5-flash',
      processingTimeMs: data.processingTimeMs || 0,
      success: data.success ?? true,
      estimatedCost: data.creditsConsumed || 1,
      metadata: data.metadata || {}
    })
    
    return {
      id: Math.floor(Math.random() * 1000),
      uuid: crypto.randomUUID(),
      operationType: data.operationType || 'image_analysis',
      aiModel: data.aiModel || 'gemini-1.5-flash',
      processingTimeMs: data.processingTimeMs || 0,
      creditsConsumed: data.creditsConsumed || 1,
      success: data.success ?? true,
      metadata: data.metadata || {},
      createdAt: new Date().toISOString(),
      ...data
          } as AIUsageStatsModel
  }

  static async getStatsForUser(userId: string, options?: {
    fromDate?: string
    toDate?: string
    operationType?: string
  }): Promise<{
    totalUsage: number
    totalCreditsUsed: number
    avgProcessingTime: number
    successRate: number
  }> {
    const stats = await getAIUsageStats({
      startDate: options?.fromDate,
      endDate: options?.toDate
    })
    
    return {
      totalUsage: stats.summary.totalRequests,
      totalCreditsUsed: stats.summary.totalCost,
      avgProcessingTime: stats.summary.avgProcessingTime,
      successRate: stats.summary.successRate
    }
  }

  static async getGlobalStats(options?: {
    fromDate?: string
    toDate?: string
  }): Promise<{
    totalRequests: number
    totalCreditsConsumed: number
    avgProcessingTime: number
    mostUsedModel: string
  }> {
    const stats = await getAIUsageStats({
      startDate: options?.fromDate,
      endDate: options?.toDate
    })
    
    return {
      totalRequests: stats.summary.totalRequests,
      totalCreditsConsumed: stats.summary.totalCost,
      avgProcessingTime: stats.summary.avgProcessingTime,
      mostUsedModel: 'gemini-1.5-flash'
    }
  }
}

/**
 * 兼容性函数导出
 * 
 * 为了保持与现有代码的兼容性，导出传统的函数别名
 */
export const recordAiUsage = AiUsageStatsRepository.create
export const getUserAiStats = AiUsageStatsRepository.getStatsForUser
export const getGlobalAiStats = AiUsageStatsRepository.getGlobalStats 