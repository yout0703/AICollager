import { db } from '@/db/client'
import { users, userSessions } from '@/db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'
import type { User, NewUser, UserSession, NewUserSession } from '@/db/schema'

export class UserRepository {
  // 创建用户
  static async create(data: Omit<NewUser, 'id' | 'uuid' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const [user] = await db.insert(users).values({
      ...data,
      credits: 50,
      totalEarnedCredits: 50,
      totalUsedCredits: 0,
      dailyAiUsage: 0,
      totalAiUsage: 0,
      status: 'active'
    }).returning()
    
    if (!user) {
      throw new Error('Failed to create user')
    }
    
    return user
  }

  // 根据UUID获取用户
  static async findByUuid(uuid: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.uuid, uuid))
      .limit(1)
    
    return user || null
  }

  // 根据Clerk用户ID获取用户
  static async findByClerkId(clerkUserId: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1)
    
    return user || null
  }

  // 根据邮箱获取用户
  static async findByEmail(email: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
    
    return result[0]
  }

  // 根据邀请码获取用户
  static async findByInviteCode(inviteCode: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.inviteCode, inviteCode))
      .limit(1)
    
    return user || null
  }

  // 更新用户信息
  static async updateUser(uuid: string, data: Partial<NewUser>): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.uuid, uuid))
      .returning()
    
    return result[0]
  }

  // 更新最后登录时间
  static async updateLastLogin(userId: string): Promise<boolean> {
    try {
      await db
        .update(users)
        .set({
          lastLoginAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(users.uuid, userId))
      
      return true
    } catch (error) {
      console.error('Update last login failed:', error)
      return false
    }
  }

  // 获取用户积分余额
  static async getCreditsBalance(uuid: string): Promise<number> {
    const result = await db
      .select({ credits: users.credits })
      .from(users)
      .where(and(eq(users.uuid, uuid), eq(users.status, 'active')))
      .limit(1)

    return result[0]?.credits || 0
  }

  // 原子性更新用户积分
  static async updateCredits(userId: string, amount: number): Promise<{ success: boolean; newBalance: number }> {
    try {
      const [user] = await db
        .update(users)
        .set({
          credits: sql`${users.credits} + ${amount}`,
          totalEarnedCredits: amount > 0 ? sql`${users.totalEarnedCredits} + ${amount}` : users.totalEarnedCredits,
          totalUsedCredits: amount < 0 ? sql`${users.totalUsedCredits} + ${Math.abs(amount)}` : users.totalUsedCredits,
          updatedAt: new Date()
        })
        .where(eq(users.uuid, userId))
        .returning()
      
      if (!user) {
        return { success: false, newBalance: 0 }
      }
      
      return { success: true, newBalance: user.credits }
    } catch (error) {
      console.error('Update user credits failed:', error)
      return { success: false, newBalance: 0 }
    }
  }

  // 软删除用户
  static async softDeleteUser(uuid: string): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ 
        status: 'inactive',
        updatedAt: new Date()
      })
      .where(eq(users.uuid, uuid))
      .returning()
    
    return result.length > 0
  }

  // 检查每日AI使用限制
  static async checkDailyAiUsage(userId: string): Promise<{ canUse: boolean; remaining: number }> {
    const today = new Date()
    
    const [user] = await db
      .select({
        dailyAiUsage: users.dailyAiUsage,
        lastAiUsageDate: users.lastAiUsageDate
      })
      .from(users)
      .where(eq(users.uuid, userId))
      .limit(1)
    
    if (!user) {
      return { canUse: false, remaining: 0 }
    }
    
    // 比较日期 - 如果lastAiUsageDate为null或不是今天，则重置计数
    const isToday = user.lastAiUsageDate && 
      user.lastAiUsageDate.toDateString() === today.toDateString()
    
    const currentUsage = isToday ? user.dailyAiUsage : 0
    const remaining = Math.max(0, 20 - currentUsage)
    
    return {
      canUse: remaining > 0,
      remaining
    }
  }

  // 增加AI使用次数
  static async incrementAiUsage(userId: string): Promise<boolean> {
    try {
      const today = new Date()
      
      await db
        .update(users)
        .set({
          dailyAiUsage: sql`CASE 
            WHEN ${users.lastAiUsageDate}::date = ${today.toISOString().split('T')[0]}::date 
            THEN ${users.dailyAiUsage} + 1 
            ELSE 1 
          END`,
          lastAiUsageDate: today,
          totalAiUsage: sql`${users.totalAiUsage} + 1`,
          updatedAt: new Date()
        })
        .where(eq(users.uuid, userId))
      
      return true
    } catch (error) {
      console.error('Increment AI usage failed:', error)
      return false
    }
  }
}

export class UserSessionRepository {
  // 创建会话
  static async createSession(data: NewUserSession): Promise<UserSession> {
    const result = await db.insert(userSessions).values(data).returning()
    
    if (!result.length) {
      throw new Error('Failed to create user session')
    }
    
    return result[0]
  }

  // 根据session ID获取会话
  static async findBySessionId(sessionId: string): Promise<UserSession | undefined> {
    const result = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.sessionId, sessionId))
      .limit(1)
    
    return result[0]
  }

  // 更新会话活动时间
  static async updateActivity(sessionId: string): Promise<void> {
    await db
      .update(userSessions)
      .set({ lastActivityAt: new Date() })
      .where(eq(userSessions.sessionId, sessionId))
  }

  // 增加试用次数
  static async incrementTrialUsage(sessionId: string): Promise<{ success: boolean; newCount: number }> {
    try {
      const result = await db
        .update(userSessions)
        .set({ 
          trialUsageCount: sql`${userSessions.trialUsageCount} + 1`,
          lastActivityAt: new Date()
        })
        .where(eq(userSessions.sessionId, sessionId))
        .returning()
      
      if (result.length === 0) {
        return { success: false, newCount: 0 }
      }
      
      return { success: true, newCount: result[0].trialUsageCount }
    } catch (error) {
      console.error('Error incrementing trial usage:', error)
      return { success: false, newCount: 0 }
    }
  }

  // 清理过期会话
  static async cleanupExpiredSessions(): Promise<number> {
    const result = await db
      .delete(userSessions)
      .where(sql`${userSessions.expiresAt} < NOW()`)
      .returning()
    
    return result.length
  }
}

// 导出兼容的函数
export const createUser = UserRepository.create
export const findUserByClerkId = UserRepository.findByClerkId
export const findUserByUuid = UserRepository.findByUuid
export const findUserByInviteCode = UserRepository.findByInviteCode
export const updateUserCredits = UserRepository.updateCredits
export const checkDailyAiUsage = UserRepository.checkDailyAiUsage
export const incrementAiUsage = UserRepository.incrementAiUsage
export const updateLastLogin = UserRepository.updateLastLogin 