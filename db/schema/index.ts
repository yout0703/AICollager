// 导出所有表结构
export * from './users'
export * from './credits'
export * from './collages'
export * from './icons'
export * from './ai'

// 重新导出所有关系
import { usersRelations, userSessionsRelations } from './users'
import { creditTransactionsRelations, invitationsRelations } from './credits'
import { collagesRelations, collageImagesRelations } from './collages'
import { iconCategoriesRelations, iconsRelations } from './icons'
import { dailyLimitsRelations } from './ai'

export const relations = {
  usersRelations,
  userSessionsRelations,
  creditTransactionsRelations,
  invitationsRelations,
  collagesRelations,
  collageImagesRelations,
  iconCategoriesRelations,
  iconsRelations,
  dailyLimitsRelations,
} 