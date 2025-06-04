/**
 * @file collage.ts
 * @description Collage Repository - 基于 Drizzle ORM 的完整实现
 */

import { db } from '@/db/client'
import { collages, collageImages } from '@/db/schema/collages'
import type { 
  Collage as DbCollage, 
  NewCollage as DbNewCollage, 
  CollageImage as DbCollageImage, 
  NewCollageImage as DbNewCollageImage 
} from '@/db/schema/collages'
import { eq, and, desc, sql, count, isNull, inArray } from 'drizzle-orm'

export interface CollageQueryOptions {
  page?: number;
  limit?: number;
  status?: string[];
  visibility?: string[];
  includeFeatured?: boolean;
}

export class CollageRepository {
  static async create(data: DbNewCollage): Promise<DbCollage> {
    const [collage] = await db
      .insert(collages)
      .values({
        ...data,
        title: data.title || `拼图_${Date.now()}`,
      })
      .returning();

    if (!collage) {
      throw new Error('创建拼图失败');
    }
    return collage;
  }

  static async findById(id: string): Promise<DbCollage | null> {
    const [collage] = await db
      .select()
      .from(collages)
      .where(eq(collages.uuid, id))
      .limit(1);
    return collage || null;
  }

  static async findByUuid(uuid: string): Promise<DbCollage | null> {
    return this.findById(uuid);
  }

  static async update(uuid: string, data: Partial<DbCollage>): Promise<DbCollage> {
    const [collage] = await db
      .update(collages)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(collages.uuid, uuid))
      .returning();

    if (!collage) {
      throw new Error('拼图不存在或更新失败');
    }
    return collage;
  }

  static async softDelete(uuid: string): Promise<boolean> {
    try {
      const [result] = await db
        .update(collages)
        .set({
          deletedAt: new Date(),
          status: 'deleted',
          updatedAt: new Date(),
        })
        .where(and(
          eq(collages.uuid, uuid),
          isNull(collages.deletedAt)
        ))
        .returning();
      return !!result;
    } catch {
      return false;
    }
  }

  static async delete(uuid: string): Promise<boolean> {
    try {
      await db.delete(collages).where(eq(collages.uuid, uuid));
      return true;
    } catch {
      return false;
    }
  }

  static async findByUser(userId: string, optionsOrPage?: CollageQueryOptions | number, limit?: number): Promise<DbCollage[]> {
    let options: CollageQueryOptions = {};

    if (typeof optionsOrPage === 'number') {
      options = { page: optionsOrPage, limit };
    } else if (optionsOrPage) {
      options = optionsOrPage;
    }

    const { page = 1, limit: queryLimit = 10, status, visibility } = options;
    const offset = (page - 1) * queryLimit;

    let whereConditions = [
      eq(collages.userId, userId),
      isNull(collages.deletedAt)
    ];

    if (status?.length) {
      whereConditions.push(inArray(collages.status, status));
    }

    if (visibility?.length) {
      whereConditions.push(inArray(collages.visibility, visibility));
    }

    return await db
      .select()
      .from(collages)
      .where(and(...whereConditions))
      .orderBy(desc(collages.createdAt))
      .limit(queryLimit)
      .offset(offset);
  }

  static async findBySessionId(sessionId: string): Promise<DbCollage[]> {
    return await db
      .select()
      .from(collages)
      .where(and(
        eq(collages.sessionId, sessionId),
        isNull(collages.deletedAt)
      ))
      .orderBy(desc(collages.createdAt));
  }

  static async getFeaturedCollages(limit = 12): Promise<DbCollage[]> {
    return await db
      .select()
      .from(collages)
      .where(and(
        eq(collages.visibility, 'public'),
        isNull(collages.deletedAt),
        eq(collages.status, 'completed')
      ))
      .orderBy(desc(collages.likeCount), desc(collages.viewCount), desc(collages.createdAt))
      .limit(limit);
  }

  static async updateStatus(
    collageId: string, 
    status: string, 
    generationStatus?: string, 
    additionalData?: Record<string, any>
  ): Promise<void> {
    const updateData: Partial<DbCollage> = {
      status: status as any,
      updatedAt: new Date(),
      ...additionalData
    };

    if (generationStatus) {
      updateData.generationStatus = generationStatus as any;
    }

    await db
      .update(collages)
      .set(updateData)
      .where(eq(collages.uuid, collageId));
  }

  static async incrementViewCount(uuid: string): Promise<boolean> {
    try {
      const [result] = await db
        .update(collages)
        .set({
          viewCount: sql`${collages.viewCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(collages.uuid, uuid))
        .returning();
      return !!result;
    } catch {
      return false;
    }
  }

  static async incrementDownloadCount(uuid: string): Promise<boolean> {
    try {
      const [result] = await db
        .update(collages)
        .set({
          downloadCount: sql`${collages.downloadCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(collages.uuid, uuid))
        .returning();
      return !!result;
    } catch {
      return false;
    }
  }

  static async getUserCollageCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(collages)
      .where(and(
        eq(collages.userId, userId),
        isNull(collages.deletedAt)
      ));
    return result?.count || 0;
  }

  static async addImages(collageId: string, images: Omit<DbNewCollageImage, 'collageId'>[]): Promise<DbCollageImage[]> {
    const imageData = images.map(img => ({
      ...img,
      collageId,
    }));

    return await db.insert(collageImages).values(imageData).returning();
  }

  static async getImages(collageId: string): Promise<DbCollageImage[]> {
    return await db
      .select()
      .from(collageImages)
      .where(eq(collageImages.collageId, collageId))
      .orderBy(collageImages.imageIndex);
  }

  static async deleteImages(collageId: string): Promise<boolean> {
    try {
      await db
        .delete(collageImages)
        .where(eq(collageImages.collageId, collageId));
      return true;
    } catch (error) {
      console.error('删除拼图图片失败:', error);
      return false;
    }
  }
}

export const collageModel = {
  create: CollageRepository.create,
  findById: CollageRepository.findById,
  findByUuid: CollageRepository.findByUuid,
  update: CollageRepository.update,
  delete: CollageRepository.delete,
  findByUser: CollageRepository.findByUser,
  findBySessionId: CollageRepository.findBySessionId,
  getFeaturedCollages: CollageRepository.getFeaturedCollages,
  updateStatus: CollageRepository.updateStatus,
  incrementViewCount: CollageRepository.incrementViewCount,
  incrementDownloadCount: CollageRepository.incrementDownloadCount,
  softDelete: CollageRepository.softDelete,
  addImages: CollageRepository.addImages,
  getImages: CollageRepository.getImages,
  deleteImages: CollageRepository.deleteImages,
};

export type Collage = DbCollage;
export type NewCollage = DbNewCollage;
export type CollageImage = DbCollageImage;
export type NewCollageImage = DbNewCollageImage;

export const createCollage = CollageRepository.create;
export const getCollageById = CollageRepository.findById;
export const getUserCollages = CollageRepository.findByUser;
export const updateCollageStatus = CollageRepository.updateStatus; 