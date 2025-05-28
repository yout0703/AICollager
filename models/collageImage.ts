import { Pool } from 'pg';
import { CollageImage } from '@/types/collage';
import { getDb } from './db';

export class CollageImageModel {
  private db: Pool;

  constructor() {
    this.db = getDb();
  }

  /**
   * 添加图片到拼图
   */
  async create(data: {
    collage_id: string;
    image_index: number;
    element_id?: string;
    original_url: string;
    processed_url?: string;
    file_name?: string;
    file_size?: number;
    mime_type?: string;
    original_dimensions?: { width: number; height: number };
    processed_dimensions?: { width: number; height: number };
    ai_analysis?: Record<string, any>;
    dominant_colors?: string[];
    content_tags?: string[];
  }): Promise<CollageImage> {
    const query = `
      INSERT INTO ac_collage_images (
        collage_id, image_index, element_id, original_url, processed_url,
        file_name, file_size, mime_type, original_dimensions, processed_dimensions,
        ai_analysis, dominant_colors, content_tags, processing_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const values = [
      data.collage_id,
      data.image_index,
      data.element_id || null,
      data.original_url,
      data.processed_url || null,
      data.file_name || null,
      data.file_size || null,
      data.mime_type || null,
      data.original_dimensions ? JSON.stringify(data.original_dimensions) : null,
      data.processed_dimensions ? JSON.stringify(data.processed_dimensions) : null,
      data.ai_analysis ? JSON.stringify(data.ai_analysis) : null,
      data.dominant_colors || null,
      data.content_tags || null,
      'uploaded'
    ];

    try {
      const result = await this.db.query(query, values);
      return this.formatImageResult(result.rows[0]);
    } catch (error) {
      console.error('添加拼图图片失败:', error);
      throw new Error('添加拼图图片失败');
    }
  }

  /**
   * 批量添加图片
   */
  async createBatch(images: Array<{
    collage_id: string;
    image_index: number;
    element_id?: string;
    original_url: string;
    processed_url?: string;
    file_name?: string;
    file_size?: number;
    mime_type?: string;
    original_dimensions?: { width: number; height: number };
    processed_dimensions?: { width: number; height: number };
    ai_analysis?: Record<string, any>;
    dominant_colors?: string[];
    content_tags?: string[];
  }>): Promise<CollageImage[]> {
    if (images.length === 0) return [];

    const query = `
      INSERT INTO ac_collage_images (
        collage_id, image_index, element_id, original_url, processed_url,
        file_name, file_size, mime_type, original_dimensions, processed_dimensions,
        ai_analysis, dominant_colors, content_tags, processing_status
      ) VALUES ${images.map((_, i) => {
        const baseIndex = i * 14;
        return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, 
                $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8}, 
                $${baseIndex + 9}, $${baseIndex + 10}, $${baseIndex + 11}, $${baseIndex + 12}, 
                $${baseIndex + 13}, $${baseIndex + 14})`;
      }).join(', ')}
      RETURNING *
    `;

    const values: any[] = [];
    images.forEach(image => {
      values.push(
        image.collage_id,
        image.image_index,
        image.element_id || null,
        image.original_url,
        image.processed_url || null,
        image.file_name || null,
        image.file_size || null,
        image.mime_type || null,
        image.original_dimensions ? JSON.stringify(image.original_dimensions) : null,
        image.processed_dimensions ? JSON.stringify(image.processed_dimensions) : null,
        image.ai_analysis ? JSON.stringify(image.ai_analysis) : null,
        image.dominant_colors || null,
        image.content_tags || null,
        'uploaded'
      );
    });

    try {
      const result = await this.db.query(query, values);
      return result.rows.map(this.formatImageResult);
    } catch (error) {
      console.error('批量添加拼图图片失败:', error);
      throw new Error('批量添加拼图图片失败');
    }
  }

  /**
   * 根据拼图ID获取所有图片
   */
  async findByCollageId(collageId: string): Promise<CollageImage[]> {
    const query = `
      SELECT * FROM ac_collage_images 
      WHERE collage_id = $1
      ORDER BY image_index ASC
    `;

    try {
      const result = await this.db.query(query, [collageId]);
      return result.rows.map(this.formatImageResult);
    } catch (error) {
      console.error('查询拼图图片失败:', error);
      throw new Error('查询拼图图片失败');
    }
  }

  /**
   * 根据ID获取图片
   */
  async findById(id: string): Promise<CollageImage | null> {
    const query = `
      SELECT * FROM ac_collage_images 
      WHERE uuid = $1
    `;

    try {
      const result = await this.db.query(query, [id]);
      if (result.rows.length === 0) {
        return null;
      }
      return this.formatImageResult(result.rows[0]);
    } catch (error) {
      console.error('查询图片失败:', error);
      throw new Error('查询图片失败');
    }
  }

  /**
   * 更新图片处理状态
   */
  async updateProcessingStatus(
    id: string, 
    status: 'uploaded' | 'processing' | 'completed' | 'failed',
    additionalData?: {
      processed_url?: string;
      processed_dimensions?: { width: number; height: number };
      ai_analysis?: Record<string, any>;
      dominant_colors?: string[];
      content_tags?: string[];
    }
  ): Promise<void> {
    const updateFields = ['processing_status = $2'];
    const values: any[] = [id, status];
    let paramCount = 3;

    if (additionalData?.processed_url !== undefined) {
      updateFields.push(`processed_url = $${paramCount++}`);
      values.push(additionalData.processed_url);
    }

    if (additionalData?.processed_dimensions !== undefined) {
      updateFields.push(`processed_dimensions = $${paramCount++}`);
      values.push(JSON.stringify(additionalData.processed_dimensions));
    }

    if (additionalData?.ai_analysis !== undefined) {
      updateFields.push(`ai_analysis = $${paramCount++}`);
      values.push(JSON.stringify(additionalData.ai_analysis));
    }

    if (additionalData?.dominant_colors !== undefined) {
      updateFields.push(`dominant_colors = $${paramCount++}`);
      values.push(additionalData.dominant_colors);
    }

    if (additionalData?.content_tags !== undefined) {
      updateFields.push(`content_tags = $${paramCount++}`);
      values.push(additionalData.content_tags);
    }

    const query = `
      UPDATE ac_collage_images 
      SET ${updateFields.join(', ')}
      WHERE uuid = $1
    `;

    try {
      await this.db.query(query, values);
    } catch (error) {
      console.error('更新图片处理状态失败:', error);
      throw new Error('更新图片处理状态失败');
    }
  }

  /**
   * 更新图片AI分析结果
   */
  async updateAIAnalysis(
    id: string,
    aiAnalysis: Record<string, any>,
    dominantColors?: string[],
    contentTags?: string[]
  ): Promise<void> {
    const query = `
      UPDATE ac_collage_images 
      SET ai_analysis = $2, dominant_colors = $3, content_tags = $4
      WHERE uuid = $1
    `;

    try {
      await this.db.query(query, [
        id,
        JSON.stringify(aiAnalysis),
        dominantColors,
        contentTags
      ]);
    } catch (error) {
      console.error('更新图片AI分析结果失败:', error);
      throw new Error('更新图片AI分析结果失败');
    }
  }

  /**
   * 删除拼图的所有图片
   */
  async deleteByCollageId(collageId: string): Promise<void> {
    const query = `
      DELETE FROM ac_collage_images 
      WHERE collage_id = $1
    `;

    try {
      await this.db.query(query, [collageId]);
    } catch (error) {
      console.error('删除拼图图片失败:', error);
      throw new Error('删除拼图图片失败');
    }
  }

  /**
   * 删除指定图片
   */
  async deleteById(id: string): Promise<void> {
    const query = `
      DELETE FROM ac_collage_images 
      WHERE uuid = $1
    `;

    try {
      await this.db.query(query, [id]);
    } catch (error) {
      console.error('删除图片失败:', error);
      throw new Error('删除图片失败');
    }
  }

  /**
   * 获取处理失败的图片
   */
  async getFailedImages(limit = 100): Promise<CollageImage[]> {
    const query = `
      SELECT * FROM ac_collage_images 
      WHERE processing_status = 'failed'
      ORDER BY created_at DESC
      LIMIT $1
    `;

    try {
      const result = await this.db.query(query, [limit]);
      return result.rows.map(this.formatImageResult);
    } catch (error) {
      console.error('查询处理失败的图片失败:', error);
      throw new Error('查询处理失败的图片失败');
    }
  }

  /**
   * 获取待处理的图片
   */
  async getPendingImages(limit = 50): Promise<CollageImage[]> {
    const query = `
      SELECT * FROM ac_collage_images 
      WHERE processing_status IN ('uploaded', 'processing')
      ORDER BY created_at ASC
      LIMIT $1
    `;

    try {
      const result = await this.db.query(query, [limit]);
      return result.rows.map(this.formatImageResult);
    } catch (error) {
      console.error('查询待处理图片失败:', error);
      throw new Error('查询待处理图片失败');
    }
  }

  /**
   * 获取图片统计信息
   */
  async getImageStats(): Promise<{
    totalImages: number;
    uploadedImages: number;
    processingImages: number;
    completedImages: number;
    failedImages: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total_images,
        COUNT(CASE WHEN processing_status = 'uploaded' THEN 1 END) as uploaded_images,
        COUNT(CASE WHEN processing_status = 'processing' THEN 1 END) as processing_images,
        COUNT(CASE WHEN processing_status = 'completed' THEN 1 END) as completed_images,
        COUNT(CASE WHEN processing_status = 'failed' THEN 1 END) as failed_images
      FROM ac_collage_images
    `;

    try {
      const result = await this.db.query(query);
      const row = result.rows[0];
      
      return {
        totalImages: parseInt(row.total_images),
        uploadedImages: parseInt(row.uploaded_images),
        processingImages: parseInt(row.processing_images),
        completedImages: parseInt(row.completed_images),
        failedImages: parseInt(row.failed_images)
      };
    } catch (error) {
      console.error('获取图片统计信息失败:', error);
      throw new Error('获取图片统计信息失败');
    }
  }

  /**
   * 清理过期的上传图片（超过24小时未处理的）
   */
  async cleanupExpiredImages(): Promise<number> {
    const query = `
      DELETE FROM ac_collage_images 
      WHERE processing_status = 'uploaded' 
        AND uploaded_at < NOW() - INTERVAL '24 hours'
      RETURNING uuid
    `;

    try {
      const result = await this.db.query(query);
      return result.rows.length;
    } catch (error) {
      console.error('清理过期图片失败:', error);
      throw new Error('清理过期图片失败');
    }
  }

  /**
   * 格式化图片查询结果
   */
  private formatImageResult(row: any): CollageImage {
    return {
      id: row.id,
      uuid: row.uuid,
      collage_id: row.collage_id,
      image_index: row.image_index,
      element_id: row.element_id,
      original_url: row.original_url,
      processed_url: row.processed_url,
      file_name: row.file_name,
      file_size: row.file_size,
      mime_type: row.mime_type,
      original_dimensions: row.original_dimensions,
      processed_dimensions: row.processed_dimensions,
      ai_analysis: row.ai_analysis,
      dominant_colors: row.dominant_colors,
      content_tags: row.content_tags,
      processing_status: row.processing_status,
      uploaded_at: row.uploaded_at?.toISOString() || new Date().toISOString(),
      created_at: row.created_at?.toISOString() || new Date().toISOString()
    };
  }
}

export const collageImageModel = new CollageImageModel(); 