import { pgTable, serial, uuid, varchar, integer, boolean, timestamp, text, inet } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// 用户主表
export const users = pgTable('ac_users', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().unique().notNull(),
  clerkUserId: varchar('clerk_user_id', { length: 255 }).unique().notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  username: varchar('username', { length: 100 }),
  displayName: varchar('display_name', { length: 255 }),
  avatarUrl: text('avatar_url'),
  
  // 积分相关
  credits: integer('credits').default(50).notNull(),
  totalEarnedCredits: integer('total_earned_credits').default(50).notNull(),
  totalUsedCredits: integer('total_used_credits').default(0).notNull(),
  
  // 邀请相关
  inviteCode: varchar('invite_code', { length: 20 }).unique().notNull(),
  invitedByCode: varchar('invited_by_code', { length: 20 }),
  invitedByUserId: uuid('invited_by_user_id'),
  
  // AI使用限制
  dailyAiUsage: integer('daily_ai_usage').default(0).notNull(),
  lastAiUsageDate: timestamp('last_ai_usage_date', { mode: 'date' }),
  totalAiUsage: integer('total_ai_usage').default(0).notNull(),
  
  // 用户设置
  language: varchar('language', { length: 10 }).default('zh-CN').notNull(),
  timezone: varchar('timezone', { length: 50 }).default('Asia/Shanghai').notNull(),
  emailNotifications: boolean('email_notifications').default(true).notNull(),
  
  // 状态和时间
  status: varchar('status', { length: 20 }).default('active').notNull(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// 用户会话表（追踪未登录用户的试用次数）
export const userSessions = pgTable('ac_user_sessions', {
  id: serial('id').primaryKey(),
  sessionId: varchar('session_id', { length: 255 }).unique().notNull(),
  userId: uuid('user_id').references(() => users.uuid, { onDelete: 'cascade' }),
  trialUsageCount: integer('trial_usage_count').default(0).notNull(),
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
})

// 用户关系定义
export const usersRelations = relations(users, ({ many, one }) => ({
  sessions: many(userSessions),
  invitedBy: one(users, {
    fields: [users.invitedByUserId],
    references: [users.uuid],
  }),
}))

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.uuid],
  }),
}))

// 导出推断的 TypeScript 类型
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type UserSession = typeof userSessions.$inferSelect
export type NewUserSession = typeof userSessions.$inferInsert 