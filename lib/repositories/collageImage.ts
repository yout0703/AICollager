import { db } from '@/db/client'
import { collageImages, type CollageImage as DbCollageImage, type NewCollageImage } from '@/db/schema/collages'
import { eq } from 'drizzle-orm'

// 创建拼图图片记录
export async function createCollageImage(data: {
  collageId: string
  imageIndex: number
  originalUrl: string
  fileName?: string
  fileSize?: number
  mimeType?: string
  processedUrl?: string
  thumbnailUrl?: string
  width?: number
  height?: number
  format?: string
  aiAnalysis?: Record<string, any>
  metadata?: Record<string, any>
}): Promise<DbCollageImage> {
  try {
    const newImage: NewCollageImage = {
      collageId: data.collageId,
      imageIndex: data.imageIndex,
      originalUrl: data.originalUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      processedUrl: data.processedUrl,
      thumbnailUrl: data.thumbnailUrl,
      width: data.width,
      height: data.height,
      format: data.format,
      aiAnalysis: data.aiAnalysis || {},
      metadata: data.metadata || {}
    }

    const [image] = await db
      .insert(collageImages)
      .values(newImage)
      .returning()

    return image
  } catch (error) {
    console.error('创建拼图图片失败:', error)
    throw error
  }
}

// 根据ID查找拼图图片
export async function findCollageImageById(uuid: string): Promise<DbCollageImage | null> {
  try {
    const [image] = await db
      .select()
      .from(collageImages)
      .where(eq(collageImages.uuid, uuid))
      .limit(1)

    return image || null
  } catch (error) {
    console.error('查找拼图图片失败:', error)
    return null
  }
}

// 根据拼图ID查找所有图片
export async function findCollageImagesByCollageId(collageId: string): Promise<DbCollageImage[]> {
  try {
    return await db
      .select()
      .from(collageImages)
      .where(eq(collageImages.collageId, collageId))
      .orderBy(collageImages.imageIndex)
  } catch (error) {
    console.error('查找拼图图片列表失败:', error)
    return []
  }
}

// 更新拼图图片
export async function updateCollageImage(
  uuid: string,
  data: Partial<DbCollageImage>
): Promise<DbCollageImage | null> {
  try {
    const [image] = await db
      .update(collageImages)
      .set(data as any)
      .where(eq(collageImages.uuid, uuid))
      .returning()

    return image || null
  } catch (error) {
    console.error('更新拼图图片失败:', error)
    return null
  }
}

// 删除拼图图片
export async function deleteCollageImage(uuid: string): Promise<boolean> {
  try {
    await db
      .delete(collageImages)
      .where(eq(collageImages.uuid, uuid))

    return true
  } catch (error) {
    console.error('删除拼图图片失败:', error)
    return false
  }
}

// 使用数据库模型作为统一接口
export type { CollageImage as DbCollageImage } from '@/db/schema/collages';

// 统一模型接口 - 直接使用数据库模型
export const collageImageModel = {
  async create(data: Partial<DbCollageImage>): Promise<DbCollageImage> {
    return await createCollageImage({
      collageId: data.collageId!,
      imageIndex: data.imageIndex!,
      originalUrl: data.originalUrl!,
      fileName: data.fileName || undefined,
      fileSize: data.fileSize || undefined,
      mimeType: data.mimeType || undefined,
      processedUrl: data.processedUrl || undefined,
      thumbnailUrl: data.thumbnailUrl || undefined,
      width: data.width || undefined,
      height: data.height || undefined,
      format: data.format || undefined,
      aiAnalysis: (data.aiAnalysis as Record<string, any>) || {},
      metadata: (data.metadata as Record<string, any>) || {}
    })
  },

  async findById(uuid: string): Promise<DbCollageImage | null> {
    return await findCollageImageById(uuid)
  },

  async findByCollageId(collageId: string): Promise<DbCollageImage[]> {
    return await findCollageImagesByCollageId(collageId)
  },

  async update(uuid: string, data: Partial<DbCollageImage>): Promise<DbCollageImage | null> {
    return await updateCollageImage(uuid, data)
  },

  async delete(uuid: string): Promise<boolean> {
    return await deleteCollageImage(uuid)
  }
}

// Repository 类
export class CollageImageRepository {
  static async create(data: any): Promise<any> {
    const dbImage = await createCollageImage({
      collageId: data.collageId,
      imageIndex: 0,
      originalUrl: data.imageUrl
    })

    return {
      id: dbImage.id,
      uuid: dbImage.uuid,
      collageId: dbImage.collageId,
      imageUrl: dbImage.originalUrl,
      createdAt: dbImage.createdAt.toISOString(),
      updatedAt: dbImage.createdAt.toISOString()
    }
  }

  static async findByCollageId(collageId: string): Promise<any[]> {
    const dbImages = await findCollageImagesByCollageId(collageId)
    return dbImages.map(dbImage => ({
      id: dbImage.id,
      uuid: dbImage.uuid,
      collageId: dbImage.collageId,
      imageUrl: dbImage.originalUrl
    }))
  }

  static async update(uuid: string, data: any): Promise<any | null> {
    const dbImage = await updateCollageImage(uuid, data)
    return dbImage ? { id: dbImage.id, uuid: dbImage.uuid } : null
  }

  static async delete(uuid: string): Promise<boolean> {
    return deleteCollageImage(uuid)
  }
}

// 导出兼容的函数
export const getCollageImages = CollageImageRepository.findByCollageId
