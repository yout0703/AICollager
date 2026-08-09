// 导出所有表结构
export * from './users'
export * from './credits'
export * from './generations'
export * from './ai'

// 重新导出所有关系
import { usersRelations, userSessionsRelations } from './users'
import { creditTransactionsRelations, invitationsRelations } from './credits'
import { generationsRelations, generationTurnsRelations } from './generations'
import { dailyLimitsRelations } from './ai'

export const relations = {
  usersRelations,
  userSessionsRelations,
  creditTransactionsRelations,
  invitationsRelations,
  generationsRelations,
  generationTurnsRelations,
  dailyLimitsRelations,
}
