import { pgTable, serial, uuid, varchar, text, integer, timestamp, jsonb, decimal, date, boolean } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { relations } from 'drizzle-orm'
import { users } from './users'

// AI分析缓存表
export const aiAnalysisCache = pgTable('ac_ai_analysis_cache', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().unique().notNull(),
  
  // 缓存键值
  cacheType: varchar('cache_type', { length: 50 }).notNull(), // 'image_analysis', 'layout_suggestion', 'icon_recommendation'
  inputHash: varchar('input_hash', { length: 64 }).unique().notNull(), // 输入内容的hash
  
  // 分析结果
  analysisResult: jsonb('analysis_result').notNull(),
  confidenceScore: decimal('confidence_score', { precision: 3, scale: 2 }), // 0.00-1.00
  
  // 使用统计
  useCount: integer('use_count').default(1).notNull(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }).defaultNow().notNull(),
  
  // 缓存管理
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  isValid: boolean('is_valid').default(true).notNull(),
  
  // 元数据
  metadata: jsonb('metadata').default({}),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// AI使用统计表
export const aiUsageStats = pgTable('ac_ai_usage_stats', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().unique().notNull(),
  date: date('date').notNull(),
  
  // 使用次数统计
  totalRequests: integer('total_requests').default(0).notNull(),
  successfulRequests: integer('successful_requests').default(0).notNull(),
  failedRequests: integer('failed_requests').default(0).notNull(),
  cachedRequests: integer('cached_requests').default(0).notNull(),
  
  // 分类统计
  imageAnalysisCount: integer('image_analysis_count').default(0).notNull(),
  layoutSuggestionCount: integer('layout_suggestion_count').default(0).notNull(),
  iconRecommendationCount: integer('icon_recommendation_count').default(0).notNull(),
  
  // 成本统计
  estimatedCost: decimal('estimated_cost', { precision: 10, scale: 4 }).default('0').notNull(),
  costCurrency: varchar('cost_currency', { length: 3 }).default('USD').notNull(),
  
  // 性能统计
  avgResponseTime: decimal('avg_response_time', { precision: 10, scale: 2 }).default('0').notNull(),
  totalProcessingTime: decimal('total_processing_time', { precision: 15, scale: 2 }).default('0').notNull(),
  
  // 元数据
  metadata: jsonb('metadata').default({}),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// 每日限制表
export const dailyLimits = pgTable('ac_daily_limits', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().unique().notNull(),
  
  // 限制对象
  userId: uuid('user_id').references(() => users.uuid, { onDelete: 'cascade' }),
  sessionId: varchar('session_id', { length: 255 }),
  
  // 限制信息
  limitDate: date('limit_date').notNull(),
  limitType: varchar('limit_type', { length: 20 }).notNull(), // 'user', 'session', 'global'
  
  // 使用计数
  aiAnalysisCount: integer('ai_analysis_count').default(0).notNull(),
  layoutGenerationCount: integer('layout_generation_count').default(0).notNull(),
  iconRecommendationCount: integer('icon_recommendation_count').default(0).notNull(),
  totalUsageCount: integer('total_usage_count').default(0).notNull(),
  
  // 限制配置
  maxDailyUsage: integer('max_daily_usage').default(10).notNull(),
  isBlocked: boolean('is_blocked').default(false).notNull(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// 关系定义
export const dailyLimitsRelations = relations(dailyLimits, ({ one }) => ({
  user: one(users, {
    fields: [dailyLimits.userId],
    references: [users.uuid],
  }),
}))

// Zod Schemas
export const insertAiAnalysisCacheSchema = createInsertSchema(aiAnalysisCache)
export const selectAiAnalysisCacheSchema = createSelectSchema(aiAnalysisCache)
export const insertAiUsageStatsSchema = createInsertSchema(aiUsageStats)
export const selectAiUsageStatsSchema = createSelectSchema(aiUsageStats)
export const insertDailyLimitsSchema = createInsertSchema(dailyLimits)
export const selectDailyLimitsSchema = createSelectSchema(dailyLimits)

// TypeScript 类型
export type AiAnalysisCache = typeof aiAnalysisCache.$inferSelect
export type NewAiAnalysisCache = typeof aiAnalysisCache.$inferInsert
export type AiUsageStats = typeof aiUsageStats.$inferSelect
export type NewAiUsageStats = typeof aiUsageStats.$inferInsert
export type DailyLimits = typeof dailyLimits.$inferSelect
export type NewDailyLimits = typeof dailyLimits.$inferInsert 