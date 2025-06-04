import { db } from '../client'
import { users, userSessions } from '../schema/users'
import { eq, and, desc, sql } from 'drizzle-orm'
import type { User, NewUser, UserSession, NewUserSession } from '../schema/users'

/**
 * 用户查询类 - 替代原有的 UserModel
 */
export class UserQueries {
  
  /**
   * 根据 Clerk User ID 查找用户
   */
  static async findByClerkId(clerkUserId: string): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1)
    
    return result[0] || null
  }

  /**
   * 根据 UUID 查找用户
   */
  static async findByUuid(uuid: string): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.uuid, uuid))
      .limit(1)
    
    return result[0] || null
  }

  /**
   * 根据邮箱查找用户
   */
  static async findByEmail(email: string): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
    
    return result[0] || null
  }

  /**
   * 根据邀请码查找用户
   */
  static async findByInviteCode(inviteCode: string): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.inviteCode, inviteCode))
      .limit(1)
    
    return result[0] || null
  }

  /**
   * 创建新用户
   */
  static async create(userData: NewUser): Promise<User> {
    const result = await db
      .insert(users)
      .values(userData)
      .returning()
    
    return result[0]
  }

  /**
   * 更新用户信息
   */
  static async update(uuid: string, userData: Partial<User>): Promise<User | null> {
    const result = await db
      .update(users)
      .set({ 
        ...userData, 
        updatedAt: new Date() 
      })
      .where(eq(users.uuid, uuid))
      .returning()
    
    return result[0] || null
  }

  /**
   * 更新用户积分
   */
  static async updateCredits(uuid: string, credits: number): Promise<User | null> {
    const result = await db
      .update(users)
      .set({ 
        credits,
        updatedAt: new Date()
      })
      .where(eq(users.uuid, uuid))
      .returning()
    
    return result[0] || null
  }

  /**
   * 增加用户积分
   */
  static async addCredits(uuid: string, amount: number): Promise<User | null> {
    const result = await db
      .update(users)
      .set({ 
        credits: sql`${users.credits} + ${amount}`,
        totalEarnedCredits: sql`${users.totalEarnedCredits} + ${amount}`,
        updatedAt: new Date()
      })
      .where(eq(users.uuid, uuid))
      .returning()
    
    return result[0] || null
  }

  /**
   * 扣除用户积分
   */
  static async deductCredits(uuid: string, amount: number): Promise<User | null> {
    const result = await db
      .update(users)
      .set({ 
        credits: sql`${users.credits} - ${amount}`,
        totalUsedCredits: sql`${users.totalUsedCredits} + ${amount}`,
        updatedAt: new Date()
      })
      .where(and(
        eq(users.uuid, uuid),
        sql`${users.credits} >= ${amount}`  // 确保余额充足
      ))
      .returning()
    
    return result[0] || null
  }

  /**
   * 更新最后登录时间
   */
  static async updateLastLogin(uuid: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        lastLoginAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.uuid, uuid))
  }

  /**
   * 获取用户统计信息
   */
  static async getStats(uuid: string) {
    const user = await this.findByUuid(uuid)
    if (!user) return null

    return {
      totalCredits: user.credits,
      totalEarned: user.totalEarnedCredits,
      totalUsed: user.totalUsedCredits,
      dailyAiUsage: user.dailyAiUsage,
      totalAiUsage: user.totalAiUsage,
      lastLogin: user.lastLoginAt,
      createdAt: user.createdAt,
    }
  }

  /**
   * 删除用户 (软删除)
   */
  static async delete(uuid: string): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ 
        status: 'deleted',
        updatedAt: new Date()
      })
      .where(eq(users.uuid, uuid))
      .returning()
    
    return result.length > 0
  }

  /**
   * 获取用户列表 (分页)
   */
  static async getList(page = 1, limit = 20) {
    const offset = (page - 1) * limit
    
    const result = await db
      .select()
      .from(users)
      .where(eq(users.status, 'active'))
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset)
    
    return result
  }
}

/**
 * 用户会话查询类
 */
export class UserSessionQueries {
  
  /**
   * 根据 Session ID 查找会话
   */
  static async findBySessionId(sessionId: string): Promise<UserSession | null> {
    const result = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.sessionId, sessionId))
      .limit(1)
    
    return result[0] || null
  }

  /**
   * 创建新会话
   */
  static async create(sessionData: NewUserSession): Promise<UserSession> {
    const result = await db
      .insert(userSessions)
      .values(sessionData)
      .returning()
    
    return result[0]
  }

  /**
   * 更新会话活跃时间
   */
  static async updateActivity(sessionId: string): Promise<void> {
    await db
      .update(userSessions)
      .set({ lastActivityAt: new Date() })
      .where(eq(userSessions.sessionId, sessionId))
  }

  /**
   * 增加试用次数
   */
  static async incrementTrialUsage(sessionId: string): Promise<UserSession | null> {
    const result = await db
      .update(userSessions)
      .set({ 
        trialUsageCount: sql`${userSessions.trialUsageCount} + 1`,
        lastActivityAt: new Date()
      })
      .where(eq(userSessions.sessionId, sessionId))
      .returning()
    
    return result[0] || null
  }

  /**
   * 删除过期会话
   */
  static async deleteExpired(): Promise<number> {
    const result = await db
      .delete(userSessions)
      .where(sql`${userSessions.expiresAt} < NOW()`)
      .returning()
    
    return result.length
  }
} 