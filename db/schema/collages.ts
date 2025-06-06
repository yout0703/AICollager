import { pgTable, serial, uuid, varchar, text, integer, timestamp, jsonb, decimal } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { relations } from 'drizzle-orm'
import { users } from './users'

// 拼图表
export const collages = pgTable('ac_collages', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().unique().notNull(),
  
  // 归属关系
  userId: uuid('user_id').references(() => users.uuid, { onDelete: 'cascade' }),
  sessionId: varchar('session_id', { length: 255 }),
  
  // 基本信息
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  
  // 拼图配置
  canvasConfig: jsonb('canvas_config').notNull().default({}),
  elements: jsonb('elements').default([]),
  
  // 图片信息
  previewUrl: varchar('preview_url', { length: 500 }),
  fullImageUrl: varchar('full_image_url', { length: 500 }),
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
  
  // 状态管理
  status: varchar('status', { length: 20 }).default('draft').notNull(),
  generationStatus: varchar('generation_status', { length: 20 }).default('pending').notNull(),
  visibility: varchar('visibility', { length: 20 }).default('private').notNull(),
  
  // 统计信息
  viewCount: integer('view_count').default(0).notNull(),
  downloadCount: integer('download_count').default(0).notNull(),
  likeCount: integer('like_count').default(0).notNull(),
  isFeatured: integer('is_featured').default(0).notNull(), // 0=false, 1=true
  
  // AI处理信息
  aiProcessingTime: integer('ai_processing_time'),
  aiModel: varchar('ai_model', { length: 50 }),
  aiCost: decimal('ai_cost', { precision: 10, scale: 4 }).default('0'),
  creditsUsed: integer('credits_used').default(0).notNull(),
  
  // 模板和版本信息
  templateId: varchar('template_id', { length: 100 }),
  generatedStyle: varchar('generated_style', { length: 100 }),
  userPreferences: jsonb('user_preferences').default({}),
  version: integer('version').default(1).notNull(),
  parentCollageId: uuid('parent_collage_id'),
  
  // 时间记录
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  lastEditedAt: timestamp('last_edited_at', { withTimezone: true }),
  
  // 元数据
  metadata: jsonb('metadata').default({}),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

// 拼图图片表
export const collageImages = pgTable('ac_collage_images', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().unique().notNull(),
  
  // 关联拼图
  collageId: uuid('collage_id').references(() => collages.uuid, { onDelete: 'cascade' }).notNull(),
  
  // 图片信息
  imageIndex: integer('image_index').notNull(),
  originalUrl: varchar('original_url', { length: 500 }).notNull(),
  processedUrl: varchar('processed_url', { length: 500 }),
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
  
  // 文件信息
  fileName: varchar('file_name', { length: 255 }),
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 100 }),
  
  // 图片属性
  width: integer('width'),
  height: integer('height'),
  format: varchar('format', { length: 10 }),
  
  // AI分析结果
  aiAnalysis: jsonb('ai_analysis').default({}),
  
  // 元数据
  metadata: jsonb('metadata').default({}),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// 关系定义
export const collagesRelations = relations(collages, ({ one, many }) => ({
  user: one(users, {
    fields: [collages.userId],
    references: [users.uuid],
  }),
  images: many(collageImages),
}))

export const collageImagesRelations = relations(collageImages, ({ one }) => ({
  collage: one(collages, {
    fields: [collageImages.collageId],
    references: [collages.uuid],
  }),
}))

// Zod Schemas (暂时保留，如果后续需要API验证可以启用)
// export const insertCollageSchema = createInsertSchema(collages)
// export const selectCollageSchema = createSelectSchema(collages)
// export const insertCollageImageSchema = createInsertSchema(collageImages)
// export const selectCollageImageSchema = createSelectSchema(collageImages)

// TypeScript 类型
export type Collage = typeof collages.$inferSelect
export type NewCollage = typeof collages.$inferInsert
export type CollageImage = typeof collageImages.$inferSelect
export type NewCollageImage = typeof collageImages.$inferInsert 