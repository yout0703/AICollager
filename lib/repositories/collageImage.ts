import { db } from '../../db/client'
import { collageImages, type CollageImage as DbCollageImage, type NewCollageImage } from '../../db/schema/collages'
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

// 兼容性类型定义
export interface CollageImage {
  id: number
  uuid: string
  collage_id: string
  image_index: number
  original_url: string
  processed_url?: string
  thumbnail_url?: string
  file_name?: string
  file_size?: number
  mime_type?: string
  width?: number
  height?: number
  format?: string
  ai_analysis?: Record<string, any>
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

// 数据库模型转业务模型
function transformDbImageToImage(dbImage: DbCollageImage): CollageImage {
  return {
    id: dbImage.id,
    uuid: dbImage.uuid,
    collage_id: dbImage.collageId,
    image_index: dbImage.imageIndex,
    original_url: dbImage.originalUrl,
    processed_url: dbImage.processedUrl || undefined,
    thumbnail_url: dbImage.thumbnailUrl || undefined,
    file_name: dbImage.fileName || undefined,
    file_size: dbImage.fileSize || undefined,
    mime_type: dbImage.mimeType || undefined,
    width: dbImage.width || undefined,
    height: dbImage.height || undefined,
    format: dbImage.format || undefined,
    ai_analysis: dbImage.aiAnalysis as any,
    metadata: dbImage.metadata as any,
    created_at: dbImage.createdAt.toISOString(),
    updated_at: dbImage.updatedAt.toISOString()
  }
}

// 兼容性模型接口
export const collageImageModel = {
  async create(data: Partial<CollageImage>): Promise<CollageImage> {
    const dbImage = await createCollageImage({
      collageId: data.collage_id!,
      imageIndex: data.image_index!,
      originalUrl: data.original_url!,
      fileName: data.file_name,
      fileSize: data.file_size,
      mimeType: data.mime_type,
      processedUrl: data.processed_url,
      thumbnailUrl: data.thumbnail_url,
      width: data.width,
      height: data.height,
      format: data.format,
      aiAnalysis: data.ai_analysis,
      metadata: data.metadata
    })
    
    return transformDbImageToImage(dbImage)
  },
  
  async findById(uuid: string): Promise<CollageImage | null> {
    const dbImage = await findCollageImageById(uuid)
    return dbImage ? transformDbImageToImage(dbImage) : null
  },
  
  async findByCollageId(collageId: string): Promise<CollageImage[]> {
    const dbImages = await findCollageImagesByCollageId(collageId)
    return dbImages.map(transformDbImageToImage)
  },
  
  async update(uuid: string, data: Partial<CollageImage>): Promise<CollageImage | null> {
    const updateData = {
      processedUrl: data.processed_url,
      thumbnailUrl: data.thumbnail_url,
      fileName: data.file_name,
      fileSize: data.file_size,
      mimeType: data.mime_type,
      width: data.width,
      height: data.height,
      format: data.format,
      aiAnalysis: data.ai_analysis,
      metadata: data.metadata
    }
    
    const dbImage = await updateCollageImage(uuid, updateData)
    return dbImage ? transformDbImageToImage(dbImage) : null
  },
  
  async delete(uuid: string): Promise<boolean> {
    return deleteCollageImage(uuid)
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
    const dbImage = await updateCollageImage(uuid, {})
    return dbImage ? { id: dbImage.id, uuid: dbImage.uuid } : null
  }

  static async delete(uuid: string): Promise<boolean> {
    return deleteCollageImage(uuid)
  }
}

// 导出兼容的函数
export const getCollageImages = CollageImageRepository.findByCollageId 