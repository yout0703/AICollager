import { pgTable, serial, uuid, varchar, integer, text, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { relations } from 'drizzle-orm'
import { users } from './users'

// 积分交易记录表
export const creditTransactions = pgTable('ac_credit_transactions', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().unique().notNull(),
  userId: uuid('user_id').references(() => users.uuid, { onDelete: 'cascade' }).notNull(),
  
  // 交易信息
  amount: integer('amount').notNull(), // 正数为获得，负数为消耗
  balanceAfter: integer('balance_after').notNull(), // 交易后余额
  transactionType: varchar('transaction_type', { length: 50 }).notNull(), // 'register', 'invite', 'collage', 'download', 'purchase', 'admin_adjust'
  
  // 描述和关联
  title: varchar('title', { length: 255 }),
  description: text('description'),
  relatedEntityType: varchar('related_entity_type', { length: 50 }), // 关联实体类型 'collage', 'order', 'invitation'
  relatedEntityId: uuid('related_entity_id'), // 关联实体ID
  
  // 元数据
  metadata: jsonb('metadata').default({}), // 额外信息，如AI使用详情等
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// 邀请记录表
export const invitations = pgTable('ac_invitations', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().unique().notNull(),
  
  // 邀请关系
  inviterId: uuid('inviter_id').references(() => users.uuid, { onDelete: 'cascade' }).notNull(),
  inviteeId: uuid('invitee_id').references(() => users.uuid, { onDelete: 'set null' }),
  inviteCode: varchar('invite_code', { length: 20 }).unique().notNull(),
  
  // 邀请信息
  email: varchar('email', { length: 255 }),
  invitationMethod: varchar('invitation_method', { length: 20 }).default('link').notNull(),
  
  // 奖励信息
  inviterReward: integer('inviter_reward').default(20).notNull(),
  inviteeReward: integer('invitee_reward').default(20).notNull(),
  
  // 状态追踪
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  clickedAt: timestamp('clicked_at', { withTimezone: true }),
  registeredAt: timestamp('registered_at', { withTimezone: true }),
  rewardGivenAt: timestamp('reward_given_at', { withTimezone: true }),
  
  // 元数据
  metadata: jsonb('metadata').default({}),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
})

// 关系定义
export const creditTransactionsRelations = relations(creditTransactions, ({ one }) => ({
  user: one(users, {
    fields: [creditTransactions.userId],
    references: [users.uuid],
  }),
}))

export const invitationsRelations = relations(invitations, ({ one }) => ({
  inviter: one(users, {
    fields: [invitations.inviterId],
    references: [users.uuid],
  }),
  invitee: one(users, {
    fields: [invitations.inviteeId],
    references: [users.uuid],
  }),
}))

// Zod Schemas
export const insertCreditTransactionSchema = createInsertSchema(creditTransactions)
export const selectCreditTransactionSchema = createSelectSchema(creditTransactions)
export const insertInvitationSchema = createInsertSchema(invitations)
export const selectInvitationSchema = createSelectSchema(invitations)

// TypeScript 类型
export type CreditTransaction = typeof creditTransactions.$inferSelect
export type NewCreditTransaction = typeof creditTransactions.$inferInsert
export type Invitation = typeof invitations.$inferSelect
export type NewInvitation = typeof invitations.$inferInsert 