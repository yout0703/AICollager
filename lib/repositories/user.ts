// 临时兼容层：重新导出 db/queries/users.ts 中的函数
// TODO: 后续需要按照repository模式重构这些函数

import { UserQueries, UserSessionQueries } from '@/db/queries/users'

// 用户查询函数
export const findUserByEmail = UserQueries.findByEmail
export const findUserByClerkId = UserQueries.findByClerkId
export const findUserByUuid = UserQueries.findByUuid
export const findUserByInviteCode = UserQueries.findByInviteCode
export const createUser = UserQueries.create
export const updateUser = UserQueries.update
export const updateUserCredits = UserQueries.updateCredits
export const addUserCredits = UserQueries.addCredits
export const deductUserCredits = UserQueries.deductCredits
export const updateUserLastLogin = UserQueries.updateLastLogin
export const getUserStats = UserQueries.getStats
export const deleteUser = UserQueries.delete
export const getUserList = UserQueries.getList

// 用户会话查询函数
export const findSessionBySessionId = UserSessionQueries.findBySessionId
export const createUserSession = UserSessionQueries.create
export const updateSessionActivity = UserSessionQueries.updateActivity
export const incrementTrialUsage = UserSessionQueries.incrementTrialUsage
export const deleteExpiredSessions = UserSessionQueries.deleteExpired 