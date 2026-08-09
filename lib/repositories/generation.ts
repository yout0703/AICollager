/**
 * @file generation.ts
 * @description Generation Repository - AI 图像作品 + 轮次的持久化操作
 */

import { db } from '@/db/client'
import { generations, generationTurns } from '@/db/schema/generations'
import type {
  Generation,
  NewGeneration,
  GenerationTurn,
  NewGenerationTurn,
} from '@/db/schema/generations'
import { eq, and, desc, asc, sql, count, isNull } from 'drizzle-orm'

export interface GenerationQueryOptions {
  page?: number
  limit?: number
}

export class GenerationRepository {
  // ---- 作品（generation）----

  static async create(data: NewGeneration): Promise<Generation> {
    const [row] = await db.insert(generations).values(data).returning()
    if (!row) throw new Error('创建作品失败')
    return row
  }

  /** 按 uuid 获取作品；传 userId 则校验归属，不匹配返回 null */
  static async findByUuid(
    uuid: string,
    userId?: string
  ): Promise<Generation | null> {
    const conds = [eq(generations.uuid, uuid), isNull(generations.deletedAt)]
    if (userId) conds.push(eq(generations.userId, userId))
    const [row] = await db
      .select()
      .from(generations)
      .where(and(...conds))
      .limit(1)
    return row || null
  }

  static async update(
    uuid: string,
    data: Partial<Generation>
  ): Promise<Generation> {
    const [row] = await db
      .update(generations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(generations.uuid, uuid))
      .returning()
    if (!row) throw new Error('作品不存在或更新失败')
    return row
  }

  static async softDelete(uuid: string, userId?: string): Promise<boolean> {
    try {
      const conds = [
        eq(generations.uuid, uuid),
        isNull(generations.deletedAt),
      ]
      if (userId) conds.push(eq(generations.userId, userId))
      const [row] = await db
        .update(generations)
        .set({ deletedAt: new Date(), status: 'deleted', updatedAt: new Date() })
        .where(and(...conds))
        .returning()
      return !!row
    } catch {
      return false
    }
  }

  static async findByUser(
    userId: string,
    options: GenerationQueryOptions = {}
  ): Promise<Generation[]> {
    const { page = 1, limit = 10 } = options
    const offset = (page - 1) * limit
    return await db
      .select()
      .from(generations)
      .where(and(eq(generations.userId, userId), isNull(generations.deletedAt)))
      .orderBy(desc(generations.createdAt))
      .limit(limit)
      .offset(offset)
  }

  static async findBySessionId(sessionId: string): Promise<Generation[]> {
    return await db
      .select()
      .from(generations)
      .where(and(eq(generations.sessionId, sessionId), isNull(generations.deletedAt)))
      .orderBy(desc(generations.createdAt))
  }

  static async incrementViewCount(uuid: string): Promise<boolean> {
    try {
      const [row] = await db
        .update(generations)
        .set({ viewCount: sql`${generations.viewCount} + 1`, updatedAt: new Date() })
        .where(eq(generations.uuid, uuid))
        .returning()
      return !!row
    } catch {
      return false
    }
  }

  static async incrementDownloadCount(uuid: string): Promise<boolean> {
    try {
      const [row] = await db
        .update(generations)
        .set({
          downloadCount: sql`${generations.downloadCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(generations.uuid, uuid))
        .returning()
      return !!row
    } catch {
      return false
    }
  }

  static async getUserGenerationCount(userId: string): Promise<number> {
    const [row] = await db
      .select({ count: count() })
      .from(generations)
      .where(and(eq(generations.userId, userId), isNull(generations.deletedAt)))
    return row?.count || 0
  }

  // ---- 轮次（turn）----

  static async addTurn(data: NewGenerationTurn): Promise<GenerationTurn> {
    const [row] = await db.insert(generationTurns).values(data).returning()
    if (!row) throw new Error('创建轮次失败')
    return row
  }

  /** 获取作品的全部轮次（按 turnIndex 升序，0=首生成在前） */
  static async getTurns(generationUuid: string): Promise<GenerationTurn[]> {
    return await db
      .select()
      .from(generationTurns)
      .where(eq(generationTurns.generationId, generationUuid))
      .orderBy(asc(generationTurns.turnIndex))
  }

  static async getLatestTurn(generationUuid: string): Promise<GenerationTurn | null> {
    const [row] = await db
      .select()
      .from(generationTurns)
      .where(eq(generationTurns.generationId, generationUuid))
      .orderBy(desc(generationTurns.turnIndex))
      .limit(1)
    return row || null
  }

  /** 按轮次序号获取（回退到指定历史版本用） */
  static async getTurnByIndex(
    generationUuid: string,
    turnIndex: number
  ): Promise<GenerationTurn | null> {
    const [row] = await db
      .select()
      .from(generationTurns)
      .where(
        and(
          eq(generationTurns.generationId, generationUuid),
          eq(generationTurns.turnIndex, turnIndex)
        )
      )
      .limit(1)
    return row || null
  }
}

export type { Generation, NewGeneration, GenerationTurn, NewGenerationTurn }
