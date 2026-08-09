import {
  pgTable,
  serial,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  jsonb,
  decimal,
  boolean,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'

// AI 图像作品表：一条记录 = 一条多轮编辑链（首生成 + 后续若干轮调整）
export const generations = pgTable('ac_generations', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().unique().notNull(),

  // 归属
  userId: uuid('user_id').references(() => users.uuid, { onDelete: 'cascade' }),
  sessionId: varchar('session_id', { length: 255 }),

  // 基本信息
  title: varchar('title', { length: 255 }),
  // 用户原始提示词（首轮）
  prompt: text('prompt').notNull(),
  // 经编排层产出的、面向 gpt-image-2 的最终提示词（首轮）
  finalPrompt: text('final_prompt'),

  // 生成参数
  style: varchar('style', { length: 100 }), // 预设风格 key
  scene: varchar('scene', { length: 100 }), // 场景模板 key
  aspectRatio: varchar('aspect_ratio', { length: 20 }).default('1:1').notNull(),
  quality: varchar('quality', { length: 20 }).default('high').notNull(),

  // 当前结果（始终指向最新一轮的输出图）
  imageUrl: varchar('image_url', { length: 500 }),
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }),

  // 状态
  status: varchar('status', { length: 20 }).default('active').notNull(), // active|archived|deleted
  generationStatus: varchar('generation_status', { length: 20 }).default('pending').notNull(), // pending|processing|completed|failed
  visibility: varchar('visibility', { length: 20 }).default('private').notNull(),

  // 轮次计数：0=未出图，1+=已成功的轮次数
  turnCount: integer('turn_count').default(0).notNull(),

  // 统计
  viewCount: integer('view_count').default(0).notNull(),
  downloadCount: integer('download_count').default(0).notNull(),
  likeCount: integer('like_count').default(0).notNull(),
  isFeatured: integer('is_featured').default(0).notNull(), // 0=false, 1=true

  // 成本
  creditsUsed: integer('credits_used').default(0).notNull(),
  aiModel: varchar('ai_model', { length: 50 }),
  aiCost: decimal('ai_cost', { precision: 10, scale: 4 }).default('0'),

  // 元数据
  metadata: jsonb('metadata').default({}),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

// 生成轮次表：每一轮 generate/edit 一行，支撑完整历史时间线与回退
export const generationTurns = pgTable('ac_generation_turns', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().unique().notNull(),

  generationId: uuid('generation_id')
    .references(() => generations.uuid, { onDelete: 'cascade' })
    .notNull(),

  turnIndex: integer('turn_index').notNull(), // 0=首生成, 1+=编辑
  type: varchar('type', { length: 20 }).notNull(), // generate|edit

  // 本轮用户输入
  userPrompt: text('user_prompt').notNull(), // 编辑轮=用户新指令；生成轮=原始提示词
  builtPrompt: text('built_prompt'), // 编排后面向 gpt-image-2 的 prompt

  // 本轮输入参考图 R2 URL 列表（生成轮=用户上传图；编辑轮=上一轮输出图）
  refImageUrls: jsonb('ref_image_urls').default([]),

  // 本轮输出
  imageUrl: varchar('image_url', { length: 500 }).notNull(),
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }),

  // 参数
  size: varchar('size', { length: 20 }),
  quality: varchar('quality', { length: 20 }),
  style: varchar('style', { length: 100 }),

  // 编排
  orchestrated: boolean('orchestrated').default(false).notNull(),

  // 成本/耗时
  durationMs: integer('duration_ms'),
  creditsUsed: integer('credits_used').default(0).notNull(),
  revisedPrompt: text('revised_prompt'), // gpt-image-2 返回的 revised_prompt（若有）

  // 状态
  status: varchar('status', { length: 20 }).default('completed').notNull(), // completed|failed
  errorMessage: text('error_message'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// 关系定义
export const generationsRelations = relations(generations, ({ one, many }) => ({
  user: one(users, {
    fields: [generations.userId],
    references: [users.uuid],
  }),
  turns: many(generationTurns),
}))

export const generationTurnsRelations = relations(generationTurns, ({ one }) => ({
  generation: one(generations, {
    fields: [generationTurns.generationId],
    references: [generations.uuid],
  }),
}))

// TypeScript 类型
export type Generation = typeof generations.$inferSelect
export type NewGeneration = typeof generations.$inferInsert
export type GenerationTurn = typeof generationTurns.$inferSelect
export type NewGenerationTurn = typeof generationTurns.$inferInsert
