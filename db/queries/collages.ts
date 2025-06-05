import { db } from '@/db/client'
import { collages, collageImages } from '@/db/schema/collages'
import { users } from '@/db/schema/users'
import { eq, and, desc, sql, isNull, or } from 'drizzle-orm'
import type { Collage, NewCollage, CollageImage, NewCollageImage } from '@/db/schema/collages'

/**
 * 拼图查询类 - 替代原有的 CollageModel
 */
export class CollageQueries {
  
  /**
   * 根据 UUID 查找拼图
   */
  static async findByUuid(uuid: string): Promise<Collage | null> {
    const result = await db
      .select()
      .from(collages)
      .where(and(
        eq(collages.uuid, uuid),
        isNull(collages.deletedAt)
      ))
      .limit(1)
    
    return result[0] || null
  }

  /**
   * 根据用户 ID 获取拼图列表
   */
  static async findByUserId(userId: string, page = 1, limit = 20): Promise<Collage[]> {
    const offset = (page - 1) * limit
    
    return await db
      .select()
      .from(collages)
      .where(and(
        eq(collages.userId, userId),
        isNull(collages.deletedAt)
      ))
      .orderBy(desc(collages.updatedAt))
      .limit(limit)
      .offset(offset)
  }

  /**
   * 根据会话 ID 获取拼图列表
   */
  static async findBySessionId(sessionId: string): Promise<Collage[]> {
    return await db
      .select()
      .from(collages)
      .where(and(
        eq(collages.sessionId, sessionId),
        isNull(collages.deletedAt)
      ))
      .orderBy(desc(collages.updatedAt))
  }

  /**
   * 创建新拼图
   */
  static async create(collageData: NewCollage): Promise<Collage> {
    const result = await db
      .insert(collages)
      .values(collageData)
      .returning()
    
    return result[0]
  }

  /**
   * 更新拼图信息
   */
  static async update(uuid: string, collageData: Partial<Collage>): Promise<Collage | null> {
    const result = await db
      .update(collages)
      .set({ 
        ...collageData, 
        updatedAt: new Date() 
      })
      .where(eq(collages.uuid, uuid))
      .returning()
    
    return result[0] || null
  }

  /**
   * 更新拼图状态
   */
  static async updateStatus(uuid: string, status: string): Promise<Collage | null> {
    const result = await db
      .update(collages)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(collages.uuid, uuid))
      .returning()
    
    return result[0] || null
  }

  /**
   * 更新生成状态
   */
  static async updateGenerationStatus(uuid: string, generationStatus: string): Promise<Collage | null> {
    const result = await db
      .update(collages)
      .set({ 
        generationStatus,
        updatedAt: new Date()
      })
      .where(eq(collages.uuid, uuid))
      .returning()
    
    return result[0] || null
  }

  /**
   * 增加查看次数
   */
  static async incrementViewCount(uuid: string): Promise<void> {
    await db
      .update(collages)
      .set({ 
        viewCount: sql`${collages.viewCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(collages.uuid, uuid))
  }

  /**
   * 增加下载次数
   */
  static async incrementDownloadCount(uuid: string): Promise<void> {
    await db
      .update(collages)
      .set({ 
        downloadCount: sql`${collages.downloadCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(collages.uuid, uuid))
  }

  /**
   * 增加点赞次数
   */
  static async incrementLikeCount(uuid: string): Promise<void> {
    await db
      .update(collages)
      .set({ 
        likeCount: sql`${collages.likeCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(collages.uuid, uuid))
  }

  /**
   * 软删除拼图
   */
  static async softDelete(uuid: string): Promise<boolean> {
    const result = await db
      .update(collages)
      .set({ 
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(collages.uuid, uuid))
      .returning()
    
    return result.length > 0
  }

  /**
   * 获取公开拼图列表
   */
  static async getPublicCollages(page = 1, limit = 20): Promise<Collage[]> {
    const offset = (page - 1) * limit
    
    return await db
      .select()
      .from(collages)
      .where(and(
        eq(collages.visibility, 'public'),
        eq(collages.status, 'completed'),
        isNull(collages.deletedAt)
      ))
      .orderBy(desc(collages.createdAt))
      .limit(limit)
      .offset(offset)
  }

  /**
   * 搜索拼图
   */
  static async search(query: string, page = 1, limit = 20): Promise<Collage[]> {
    const offset = (page - 1) * limit
    
    return await db
      .select()
      .from(collages)
      .where(and(
        or(
          sql`${collages.title} ILIKE ${`%${query}%`}`,
          sql`${collages.description} ILIKE ${`%${query}%`}`
        ),
        eq(collages.visibility, 'public'),
        isNull(collages.deletedAt)
      ))
      .orderBy(desc(collages.createdAt))
      .limit(limit)
      .offset(offset)
  }

  /**
   * 获取拼图统计信息
   */
  static async getStats(uuid: string) {
    const collage = await this.findByUuid(uuid)
    if (!collage) return null

    return {
      viewCount: collage.viewCount,
      downloadCount: collage.downloadCount,
      likeCount: collage.likeCount,
      status: collage.status,
      generationStatus: collage.generationStatus,
      aiProcessingTime: collage.aiProcessingTime,
      aiCost: collage.aiCost,
      createdAt: collage.createdAt,
      updatedAt: collage.updatedAt,
    }
  }

  /**
   * 获取用户拼图统计
   */
  static async getUserStats(userId: string) {
    const result = await db
      .select({
        totalCollages: sql<number>`COUNT(*)`,
        completedCollages: sql<number>`COUNT(CASE WHEN ${collages.status} = 'completed' THEN 1 END)`,
        totalViews: sql<number>`SUM(${collages.viewCount})`,
        totalDownloads: sql<number>`SUM(${collages.downloadCount})`,
        totalLikes: sql<number>`SUM(${collages.likeCount})`,
      })
      .from(collages)
      .where(and(
        eq(collages.userId, userId),
        isNull(collages.deletedAt)
      ))

    return result[0]
  }
}

/**
 * 拼图图片查询类
 */
export class CollageImageQueries {
  
  /**
   * 根据拼图 ID 获取图片列表
   */
  static async findByCollageId(collageId: string): Promise<CollageImage[]> {
    return await db
      .select()
      .from(collageImages)
      .where(eq(collageImages.collageId, collageId))
      .orderBy(collageImages.imageIndex)
  }

  /**
   * 根据 UUID 查找图片
   */
  static async findByUuid(uuid: string): Promise<CollageImage | null> {
    const result = await db
      .select()
      .from(collageImages)
      .where(eq(collageImages.uuid, uuid))
      .limit(1)
    
    return result[0] || null
  }

  /**
   * 创建拼图图片
   */
  static async create(imageData: NewCollageImage): Promise<CollageImage> {
    const result = await db
      .insert(collageImages)
      .values(imageData)
      .returning()
    
    return result[0]
  }

  /**
   * 批量创建拼图图片
   */
  static async createMany(imagesData: NewCollageImage[]): Promise<CollageImage[]> {
    const result = await db
      .insert(collageImages)
      .values(imagesData)
      .returning()
    
    return result
  }

  /**
   * 更新图片信息
   */
  static async update(uuid: string, imageData: Partial<CollageImage>): Promise<CollageImage | null> {
    const result = await db
      .update(collageImages)
      .set({ 
        ...imageData, 
        updatedAt: new Date() 
      })
      .where(eq(collageImages.uuid, uuid))
      .returning()
    
    return result[0] || null
  }

  /**
   * 删除拼图图片
   */
  static async delete(uuid: string): Promise<boolean> {
    const result = await db
      .delete(collageImages)
      .where(eq(collageImages.uuid, uuid))
      .returning()
    
    return result.length > 0
  }

  /**
   * 根据拼图 ID 删除所有图片
   */
  static async deleteByCollageId(collageId: string): Promise<number> {
    const result = await db
      .delete(collageImages)
      .where(eq(collageImages.collageId, collageId))
      .returning()
    
    return result.length
  }

  /**
   * 获取图片数量
   */
  static async getCountByCollageId(collageId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(collageImages)
      .where(eq(collageImages.collageId, collageId))
    
    return result[0]?.count || 0
  }
} 