import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { users, userSessions } from '@/db/schema'

// 基础的 Drizzle-Zod schemas
export const insertUserSchema = createInsertSchema(users)
export const selectUserSchema = createSelectSchema(users)
export const insertUserSessionSchema = createInsertSchema(userSessions)
export const selectUserSessionSchema = createSelectSchema(userSessions)

// 扩展的业务验证 schemas
export const createUserSchema = z.object({
  clerkUserId: z.string().min(1),
  email: z.string().email(),
  username: z.string().min(2).max(50).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  displayName: z.string().min(1).max(255).optional(),
  avatarUrl: z.string().url().optional(),
  language: z.string().min(2).max(10).optional(),
  timezone: z.string().min(1).max(50).optional(),
})

export const updateUserSchema = z.object({
  username: z.string().min(2).max(50).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  displayName: z.string().min(1).max(255).optional(),
  avatarUrl: z.string().url().optional(),
  language: z.string().min(2).max(10).optional(),
  timezone: z.string().min(1).max(50).optional(),
})

export const userPreferencesSchema = z.object({
  language: z.string().min(2).max(10),
  timezone: z.string().min(1).max(50),
  emailNotifications: z.boolean(),
})

// API 请求/响应 schemas
export const userProfileResponseSchema = z.object({
  uuid: z.string().uuid(),
  email: z.string().email(),
  username: z.string().nullable(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  credits: z.number(),
  language: z.string(),
  timezone: z.string(),
  createdAt: z.date(),
})

export const userStatsResponseSchema = z.object({
  totalCollages: z.number(),
  totalCreditsEarned: z.number(),
  totalCreditsUsed: z.number(),
  totalAiUsage: z.number(),
  joinedAt: z.string(),
})

// 导出类型
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type UserPreferences = z.infer<typeof userPreferencesSchema>
export type UserProfileResponse = z.infer<typeof userProfileResponseSchema>
export type UserStatsResponse = z.infer<typeof userStatsResponseSchema> 