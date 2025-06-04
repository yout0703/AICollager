// Session Repository - 基于 Drizzle ORM 的实现
import { db } from '@/db/client'
import { userSessions } from '@/db/schema/users'
import { eq, lt, sql } from 'drizzle-orm'
import type { UserSession, NewUserSession } from '@/db/schema/users'

export class SessionRepository {
  static async create(data: Partial<NewUserSession>): Promise<UserSession> {
    const sessionData: NewUserSession = {
      sessionId: data.sessionId || crypto.randomUUID(),
      userId: data.userId || null,
      trialUsageCount: data.trialUsageCount || 0,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      expiresAt: data.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后过期
      ...data
    };

    const [session] = await db
      .insert(userSessions)
      .values(sessionData)
      .returning();

    if (!session) {
      throw new Error('Failed to create session');
    }

    return session;
  }

  static async findBySessionId(sessionId: string): Promise<UserSession | null> {
    const [session] = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.sessionId, sessionId))
      .limit(1);

    return session || null;
  }

  static async updateActivity(sessionId: string): Promise<boolean> {
    const result = await db
      .update(userSessions)
      .set({ 
        lastActivityAt: new Date()
      })
      .where(eq(userSessions.sessionId, sessionId))
      .returning();

    return result.length > 0;
  }

  static async incrementTrialUsage(sessionId: string): Promise<{ success: boolean; newCount: number }> {
    const [updated] = await db
      .update(userSessions)
      .set({ 
        trialUsageCount: sql`${userSessions.trialUsageCount} + 1`,
        lastActivityAt: new Date()
      })
      .where(eq(userSessions.sessionId, sessionId))
      .returning();

    if (updated) {
      return { success: true, newCount: updated.trialUsageCount };
    } else {
      return { success: false, newCount: 0 };
    }
  }

  static async cleanupExpired(): Promise<number> {
    const result = await db
      .delete(userSessions)
      .where(lt(userSessions.expiresAt, new Date()))
      .returning();

    return result.length;
  }

  // 根据用户ID查找所有会话
  static async findByUserId(userId: string): Promise<UserSession[]> {
    return await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.userId, userId));
  }
}

// 导出兼容的函数
export const createSession = SessionRepository.create
export const getSessionById = SessionRepository.findBySessionId
export const updateSessionActivity = SessionRepository.updateActivity
export const incrementSessionTrialUsage = SessionRepository.incrementTrialUsage
export const cleanupExpiredSessions = SessionRepository.cleanupExpired

// userService 需要的别名
export const findBySessionId = SessionRepository.findBySessionId
export const updateActivity = SessionRepository.updateActivity
export const incrementTrialUsage = SessionRepository.incrementTrialUsage

// 新增的函数
export const findSessionsByUserId = SessionRepository.findByUserId 