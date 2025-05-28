import { Pool } from 'pg';
import { Collage, CreateCollageRequest, UpdateCollageRequest, CanvasConfig, CollageElement } from '@/types/collage';
import { getDb } from './db';

export class CollageModel {
  private db: Pool;

  constructor() {
    this.db = getDb();
  }

  /**
   * 创建新拼图
   */
  async create(data: CreateCollageRequest & {
    canvas_config: CanvasConfig;
    elements: CollageElement[];
    metadata?: Record<string, any>;
  }): Promise<Collage> {
    const query = `
      INSERT INTO ac_collages (
        user_id, session_id, title, description, 
        canvas_config, elements, metadata,
        template_id, user_preferences, credits_used,
        status, generation_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      data.user_id || null,
      data.session_id || null,
      data.title || null,
      data.description || null,
      JSON.stringify(data.canvas_config),
      JSON.stringify(data.elements),
      JSON.stringify(data.metadata || {}),
      data.template_id || null,
      JSON.stringify(data.user_preferences || {}),
      5, // 默认消耗5积分
      'draft',
      'pending'
    ];

    try {
      const result = await this.db.query(query, values);
      return this.formatCollageResult(result.rows[0]);
    } catch (error) {
      console.error('创建拼图失败:', error);
      throw new Error('创建拼图失败');
    }
  }

  /**
   * 根据ID获取拼图
   */
  async findById(id: string): Promise<Collage | null> {
    const query = `
      SELECT * FROM ac_collages 
      WHERE uuid = $1 AND status != 'deleted'
    `;

    try {
      const result = await this.db.query(query, [id]);
      if (result.rows.length === 0) {
        return null;
      }
      return this.formatCollageResult(result.rows[0]);
    } catch (error) {
      console.error('查询拼图失败:', error);
      throw new Error('查询拼图失败');
    }
  }

  /**
   * 根据用户ID获取拼图列表
   */
  async findByUserId(userId: string, page = 1, limit = 10): Promise<{
    collages: Collage[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;
    
    const countQuery = `
      SELECT COUNT(*) FROM ac_collages 
      WHERE user_id = $1 AND status != 'deleted'
    `;
    
    const query = `
      SELECT * FROM ac_collages 
      WHERE user_id = $1 AND status != 'deleted'
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    try {
      const countResult = await this.db.query(countQuery, [userId]);
      const total = parseInt(countResult.rows[0].count);
      
      const result = await this.db.query(query, [userId, limit, offset]);
      const collages = result.rows.map(this.formatCollageResult);

      return {
        collages,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('查询用户拼图列表失败:', error);
      throw new Error('查询用户拼图列表失败');
    }
  }

  /**
   * 根据会话ID获取拼图列表（未登录用户）
   */
  async findBySessionId(sessionId: string): Promise<Collage[]> {
    const query = `
      SELECT * FROM ac_collages 
      WHERE session_id = $1 AND status != 'deleted'
      ORDER BY created_at DESC
    `;

    try {
      const result = await this.db.query(query, [sessionId]);
      return result.rows.map(this.formatCollageResult);
    } catch (error) {
      console.error('查询会话拼图列表失败:', error);
      throw new Error('查询会话拼图列表失败');
    }
  }

  /**
   * 更新拼图
   */
  async update(id: string, data: UpdateCollageRequest): Promise<Collage> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.title !== undefined) {
      updateFields.push(`title = $${paramCount++}`);
      values.push(data.title);
    }

    if (data.description !== undefined) {
      updateFields.push(`description = $${paramCount++}`);
      values.push(data.description);
    }

    if (data.canvas_config !== undefined) {
      updateFields.push(`canvas_config = $${paramCount++}`);
      values.push(JSON.stringify(data.canvas_config));
    }

    if (data.elements !== undefined) {
      updateFields.push(`elements = $${paramCount++}`);
      values.push(JSON.stringify(data.elements));
    }

    if (data.visibility !== undefined) {
      updateFields.push(`visibility = $${paramCount++}`);
      values.push(data.visibility);
    }

    updateFields.push(`updated_at = NOW()`);
    updateFields.push(`last_edited_at = NOW()`);

    values.push(id);

    const query = `
      UPDATE ac_collages 
      SET ${updateFields.join(', ')}
      WHERE uuid = $${paramCount} AND status != 'deleted'
      RETURNING *
    `;

    try {
      const result = await this.db.query(query, values);
      if (result.rows.length === 0) {
        throw new Error('拼图不存在或已删除');
      }
      return this.formatCollageResult(result.rows[0]);
    } catch (error) {
      console.error('更新拼图失败:', error);
      throw new Error('更新拼图失败');
    }
  }

  /**
   * 更新拼图状态
   */
  async updateStatus(
    id: string, 
    status: string, 
    generationStatus?: string,
    additionalData?: Record<string, any>
  ): Promise<void> {
    const updateFields = ['status = $2', 'updated_at = NOW()'];
    const values = [id, status];
    let paramCount = 3;

    if (generationStatus !== undefined) {
      updateFields.push(`generation_status = $${paramCount++}`);
      values.push(generationStatus);
    }

    if (additionalData?.ai_processing_time !== undefined) {
      updateFields.push(`ai_processing_time = $${paramCount++}`);
      values.push(additionalData.ai_processing_time);
    }

    if (additionalData?.ai_model !== undefined) {
      updateFields.push(`ai_model = $${paramCount++}`);
      values.push(additionalData.ai_model);
    }

    if (additionalData?.thumbnail_url !== undefined) {
      updateFields.push(`thumbnail_url = $${paramCount++}`);
      values.push(additionalData.thumbnail_url);
    }

    if (additionalData?.preview_url !== undefined) {
      updateFields.push(`preview_url = $${paramCount++}`);
      values.push(additionalData.preview_url);
    }

    if (additionalData?.full_image_url !== undefined) {
      updateFields.push(`full_image_url = $${paramCount++}`);
      values.push(additionalData.full_image_url);
    }

    if (status === 'completed') {
      updateFields.push('completed_at = NOW()');
    }

    const query = `
      UPDATE ac_collages 
      SET ${updateFields.join(', ')}
      WHERE uuid = $1
    `;

    try {
      await this.db.query(query, values);
    } catch (error) {
      console.error('更新拼图状态失败:', error);
      throw new Error('更新拼图状态失败');
    }
  }

  /**
   * 软删除拼图
   */
  async softDelete(id: string): Promise<void> {
    const query = `
      UPDATE ac_collages 
      SET status = 'deleted', updated_at = NOW()
      WHERE uuid = $1
    `;

    try {
      await this.db.query(query, [id]);
    } catch (error) {
      console.error('删除拼图失败:', error);
      throw new Error('删除拼图失败');
    }
  }

  /**
   * 增加下载次数
   */
  async incrementDownloadCount(id: string): Promise<void> {
    const query = `
      UPDATE ac_collages 
      SET download_count = download_count + 1, updated_at = NOW()
      WHERE uuid = $1
    `;

    try {
      await this.db.query(query, [id]);
    } catch (error) {
      console.error('增加下载次数失败:', error);
      throw new Error('增加下载次数失败');
    }
  }

  /**
   * 增加查看次数
   */
  async incrementViewCount(id: string): Promise<void> {
    const query = `
      UPDATE ac_collages 
      SET view_count = view_count + 1, updated_at = NOW()
      WHERE uuid = $1
    `;

    try {
      await this.db.query(query, [id]);
    } catch (error) {
      console.error('增加查看次数失败:', error);
      throw new Error('增加查看次数失败');
    }
  }

  /**
   * 获取用户拼图统计
   */
  async getUserStats(userId: string): Promise<{
    totalCollages: number;
    completedCollages: number;
    totalDownloads: number;
    totalViews: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total_collages,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_collages,
        COALESCE(SUM(download_count), 0) as total_downloads,
        COALESCE(SUM(view_count), 0) as total_views
      FROM ac_collages 
      WHERE user_id = $1 AND status != 'deleted'
    `;

    try {
      const result = await this.db.query(query, [userId]);
      const row = result.rows[0];
      
      return {
        totalCollages: parseInt(row.total_collages),
        completedCollages: parseInt(row.completed_collages),
        totalDownloads: parseInt(row.total_downloads),
        totalViews: parseInt(row.total_views)
      };
    } catch (error) {
      console.error('获取用户拼图统计失败:', error);
      throw new Error('获取用户拼图统计失败');
    }
  }

  /**
   * 获取精选拼图
   */
  async getFeaturedCollages(limit = 12): Promise<Collage[]> {
    const query = `
      SELECT * FROM ac_collages 
      WHERE is_featured = true 
        AND status = 'completed' 
        AND visibility = 'public'
      ORDER BY view_count DESC, created_at DESC
      LIMIT $1
    `;

    try {
      const result = await this.db.query(query, [limit]);
      return result.rows.map(this.formatCollageResult);
    } catch (error) {
      console.error('获取精选拼图失败:', error);
      throw new Error('获取精选拼图失败');
    }
  }

  /**
   * 格式化拼图查询结果
   */
  private formatCollageResult(row: any): Collage {
    return {
      id: row.id,
      uuid: row.uuid,
      user_id: row.user_id,
      session_id: row.session_id,
      title: row.title,
      description: row.description,
      canvas_config: row.canvas_config,
      elements: row.elements,
      metadata: row.metadata,
      template_id: row.template_id,
      generated_style: row.generated_style,
      user_preferences: row.user_preferences,
      thumbnail_url: row.thumbnail_url,
      preview_url: row.preview_url,
      full_image_url: row.full_image_url,
      ai_model: row.ai_model,
      ai_processing_time: row.ai_processing_time,
      credits_used: row.credits_used,
      status: row.status,
      generation_status: row.generation_status,
      visibility: row.visibility,
      is_featured: row.is_featured,
      download_count: row.download_count,
      view_count: row.view_count,
      version: row.version,
      parent_collage_id: row.parent_collage_id,
      started_at: row.started_at?.toISOString() || new Date().toISOString(),
      completed_at: row.completed_at?.toISOString(),
      last_edited_at: row.last_edited_at?.toISOString() || new Date().toISOString(),
      created_at: row.created_at?.toISOString() || new Date().toISOString(),
      updated_at: row.updated_at?.toISOString() || new Date().toISOString()
    };
  }
}

export const collageModel = new CollageModel(); 