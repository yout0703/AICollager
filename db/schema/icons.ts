import { pgTable, serial, uuid, varchar, text, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { relations } from 'drizzle-orm'

// Icon分类表
export const iconCategories = pgTable('ac_icon_categories', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().unique().notNull(),
  
  // 分类信息
  categoryId: varchar('category_id', { length: 100 }).unique().notNull(),
  categoryName: varchar('category_name', { length: 255 }).notNull(),
  parentCategoryId: varchar('parent_category_id', { length: 100 }),
  
  // 描述信息
  description: text('description'),
  aiDescription: text('ai_description'), // AI理解的描述
  aiKeywords: text('ai_keywords').array(), // AI搜索关键词
  
  // 显示配置
  displayOrder: integer('display_order').default(0).notNull(),
  iconColor: varchar('icon_color', { length: 20 }).default('#666666').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  
  // 统计信息
  iconCount: integer('icon_count').default(0).notNull(),
  usageCount: integer('usage_count').default(0).notNull(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// Icon库表
export const icons = pgTable('ac_icons', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().unique().notNull(),
  
  // Icon基本信息
  iconId: varchar('icon_id', { length: 100 }).unique().notNull(),
  iconName: varchar('icon_name', { length: 255 }).notNull(),
  categoryId: varchar('category_id', { length: 100 }).references(() => iconCategories.categoryId).notNull(),
  
  // 内容和样式
  svgContent: text('svg_content').notNull(),
  style: varchar('style', { length: 50 }).default('outline').notNull(), // 'outline', 'filled', 'duotone', 'color'
  size: varchar('size', { length: 20 }).default('24').notNull(),
  
  // 搜索和分类
  tags: text('tags').array().default([]).notNull(),
  keywords: text('keywords').array().default([]).notNull(),
  aiTags: text('ai_tags').array().default([]).notNull(), // AI生成的标签
  
  // 颜色信息
  primaryColor: varchar('primary_color', { length: 20 }),
  secondaryColor: varchar('secondary_color', { length: 20 }),
  colorPalette: jsonb('color_palette').default([]),
  
  // 使用统计
  usageCount: integer('usage_count').default(0).notNull(),
  popularityScore: integer('popularity_score').default(0).notNull(),
  
  // 质量控制
  qualityScore: integer('quality_score').default(5).notNull(), // 1-10分
  isVerified: boolean('is_verified').default(false).notNull(),
  moderationStatus: varchar('moderation_status', { length: 20 }).default('pending').notNull(),
  
  // 元数据
  metadata: jsonb('metadata').default({}),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// 关系定义
export const iconCategoriesRelations = relations(iconCategories, ({ many }) => ({
  icons: many(icons),
}))

export const iconsRelations = relations(icons, ({ one }) => ({
  category: one(iconCategories, {
    fields: [icons.categoryId],
    references: [iconCategories.categoryId],
  }),
}))

// Zod Schemas
export const insertIconCategorySchema = createInsertSchema(iconCategories)
export const selectIconCategorySchema = createSelectSchema(iconCategories)
export const insertIconSchema = createInsertSchema(icons)
export const selectIconSchema = createSelectSchema(icons)

// TypeScript 类型
export type IconCategory = typeof iconCategories.$inferSelect
export type NewIconCategory = typeof iconCategories.$inferInsert
export type Icon = typeof icons.$inferSelect
export type NewIcon = typeof icons.$inferInsert 