import { CollageImage } from '@/types/collage';
import { DatabaseAdapter } from '@/lib/database-adapter';

export class CollageImageModel {
  private db: DatabaseAdapter;

  constructor() {
    this.db = new DatabaseAdapter(true); // 使用服务端客户端
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
    const insertData = {
      collage_id: data.collage_id,
      image_index: data.image_index,
      element_id: data.element_id || null,
      original_url: data.original_url,
      processed_url: data.processed_url || null,
      file_name: data.file_name || null,
      file_size: data.file_size || null,
      mime_type: data.mime_type || null,
      original_dimensions: data.original_dimensions ? JSON.stringify(data.original_dimensions) : null,
      processed_dimensions: data.processed_dimensions ? JSON.stringify(data.processed_dimensions) : null,
      ai_analysis: data.ai_analysis ? JSON.stringify(data.ai_analysis) : null,
      dominant_colors: data.dominant_colors || null,
      content_tags: data.content_tags || null,
      processing_status: 'uploaded'
    };

    try {
      const result = await this.db.insert('ac_collage_images', insertData);
      if (result.error) {
        throw new Error(result.error.message || '添加拼图图片失败');
      }
      const insertedData = result.data?.[0] || result.rows?.[0];
      return this.formatImageResult(insertedData);
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

    // 对于批量插入，我们需要逐个插入（Supabase 支持批量，但为了兼容性）
    const results: CollageImage[] = [];
    
    try {
      for (const image of images) {
        const result = await this.create(image);
        results.push(result);
      }
      return results;
    } catch (error) {
      console.error('批量添加拼图图片失败:', error);
      throw new Error('批量添加拼图图片失败');
    }
  }

  /**
   * 根据拼图ID获取所有图片
   */
  async findByCollageId(collageId: string): Promise<CollageImage[]> {
    try {
      const result = await this.db.select('ac_collage_images', {
        where: { collage_id: collageId },
        orderBy: 'image_index ASC'
      });
      
      if (result.error) {
        throw new Error(result.error.message || '查询拼图图片失败');
      }
      
      const rows = result.data || result.rows || [];
      return rows.map(this.formatImageResult);
    } catch (error) {
      console.error('查询拼图图片失败:', error);
      throw new Error('查询拼图图片失败');
    }
  }

  /**
   * 根据ID获取图片
   */
  async findById(id: string): Promise<CollageImage | null> {
    try {
      const result = await this.db.select('ac_collage_images', {
        where: { uuid: id }
      });
      
      if (result.error) {
        throw new Error(result.error.message || '查询图片失败');
      }
      
      const rows = result.data || result.rows || [];
      if (rows.length === 0) {
        return null;
      }
      return this.formatImageResult(rows[0]);
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
    const updateData: Record<string, any> = {
      processing_status: status
    };

    if (additionalData?.processed_url !== undefined) {
      updateData.processed_url = additionalData.processed_url;
    }

    if (additionalData?.processed_dimensions !== undefined) {
      updateData.processed_dimensions = JSON.stringify(additionalData.processed_dimensions);
    }

    if (additionalData?.ai_analysis !== undefined) {
      updateData.ai_analysis = JSON.stringify(additionalData.ai_analysis);
    }

    if (additionalData?.dominant_colors !== undefined) {
      updateData.dominant_colors = additionalData.dominant_colors;
    }

    if (additionalData?.content_tags !== undefined) {
      updateData.content_tags = additionalData.content_tags;
    }

    try {
      await this.db.update('ac_collage_images', updateData, { uuid: id });
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
      await this.db.update('ac_collage_images', {
        ai_analysis: JSON.stringify(aiAnalysis),
        dominant_colors: dominantColors,
        content_tags: contentTags
      }, { uuid: id });
    } catch (error) {
      console.error('更新图片AI分析结果失败:', error);
      throw new Error('更新图片AI分析结果失败');
    }
  }

  /**
   * 删除拼图的所有图片
   */
  async deleteByCollageId(collageId: string): Promise<void> {
    try {
      await this.db.delete('ac_collage_images', { collage_id: collageId });
    } catch (error) {
      console.error('删除拼图图片失败:', error);
      throw new Error('删除拼图图片失败');
    }
  }

  /**
   * 删除指定图片
   */
  async deleteById(id: string): Promise<void> {
    try {
      await this.db.delete('ac_collage_images', { uuid: id });
    } catch (error) {
      console.error('删除图片失败:', error);
      throw new Error('删除图片失败');
    }
  }

  /**
   * 获取处理失败的图片
   */
  async getFailedImages(limit = 100): Promise<CollageImage[]> {
    try {
      const result = await this.db.select('ac_collage_images', {
        where: { processing_status: 'failed' },
        orderBy: 'created_at DESC',
        limit: limit
      });
      
      if (result.error) {
        throw new Error(result.error.message || '查询处理失败的图片失败');
      }
      
      const rows = result.data || result.rows || [];
      return rows.map(this.formatImageResult);
    } catch (error) {
      console.error('查询处理失败的图片失败:', error);
      throw new Error('查询处理失败的图片失败');
    }
  }

  /**
   * 获取待处理的图片
   */
  async getPendingImages(limit = 50): Promise<CollageImage[]> {
    try {
      // 对于复杂的 WHERE 条件，我们使用原始查询
      const query = `
        SELECT * FROM ac_collage_images 
        WHERE processing_status IN ('uploaded', 'processing')
        ORDER BY created_at ASC
        LIMIT $1
      `;
      
      const result = await this.db.rawQuery(query, [limit]);
      
      if (result.error) {
        throw new Error(result.error.message || '查询待处理图片失败');
      }
      
      const rows = result.data || result.rows || [];
      return rows.map(this.formatImageResult);
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
    try {
      // 使用原始查询来获取统计信息
      const query = `
        SELECT 
          COUNT(*) as total_images,
          COUNT(CASE WHEN processing_status = 'uploaded' THEN 1 END) as uploaded_images,
          COUNT(CASE WHEN processing_status = 'processing' THEN 1 END) as processing_images,
          COUNT(CASE WHEN processing_status = 'completed' THEN 1 END) as completed_images,
          COUNT(CASE WHEN processing_status = 'failed' THEN 1 END) as failed_images
        FROM ac_collage_images
      `;
      
      const result = await this.db.rawQuery(query);
      
      if (result.error) {
        throw new Error(result.error.message || '获取图片统计信息失败');
      }
      
      const row = result.data?.[0] || result.rows?.[0];
      
      return {
        totalImages: parseInt(row.total_images) || 0,
        uploadedImages: parseInt(row.uploaded_images) || 0,
        processingImages: parseInt(row.processing_images) || 0,
        completedImages: parseInt(row.completed_images) || 0,
        failedImages: parseInt(row.failed_images) || 0
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
    try {
      // 使用原始查询来删除过期图片
      const query = `
        DELETE FROM ac_collage_images 
        WHERE processing_status = 'uploaded' 
          AND uploaded_at < NOW() - INTERVAL '24 hours'
        RETURNING uuid
      `;
      
      const result = await this.db.rawQuery(query);
      
      if (result.error) {
        throw new Error(result.error.message || '清理过期图片失败');
      }
      
      return result.data?.length || result.rows?.length || 0;
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