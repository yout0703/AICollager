import { collageModel } from '@/lib/repositories/collage';
import { CanvasConfig, CollageElement } from '@/types/collage';
import type { Collage as DbCollage } from "@/lib/repositories/collage";

// 使用数据库模型作为统一接口
export type Collage = DbCollage;

export class CollageCrudService {
  /**
   * 数据库模型转换辅助函数
   * 处理一些特殊字段的转换（如 boolean 字段）
   */
  private normalizeCollageData(dbCollage: DbCollage): Collage {
    return {
      ...dbCollage,
      // 如果以后需要转换 isFeatured 为 boolean，可以在这里处理
      // isFeatured: Boolean(dbCollage.isFeatured)
    };
  }

  /**
   * 获取拼图详情
   * @param id 拼图ID
   * @param userId 内部用户UUID（不是Clerk ID）
   */
  async getCollageById(id: string, userId?: string): Promise<Collage | null> {
    const dbCollage = await collageModel.findById(id);
    
    if (!dbCollage) {
      return null;
    }

    // 检查访问权限
    if (dbCollage.visibility === 'private') {
      // 对于私有拼图，必须有用户身份且是拼图所有者
      if (!userId) {
        throw new Error('无权访问此拼图：需要登录');
      }
      
      if (dbCollage.userId !== userId) {
        console.log(`🚫 权限检查失败: 拼图所有者=${dbCollage.userId}, 当前用户=${userId}`);
        throw new Error('无权访问此拼图：您不是拼图所有者');
      }
    }

    // 增加查看次数
    await collageModel.incrementViewCount(id);

    // 直接返回数据库模型，应用规范化
    return this.normalizeCollageData(dbCollage);
  }

  /**
   * 获取用户拼图列表（支持分页）
   * @param userId 内部用户UUID（不是Clerk ID）
   */
  async getUserCollages(userId: string, page = 1, limit = 10): Promise<Collage[]> {
    const dbCollages = await collageModel.findByUser(userId, { page, limit });
    return dbCollages.map(collage => this.normalizeCollageData(collage));
  }

  /**
   * 获取会话拼图列表（未登录用户）
   */
  async getSessionCollages(sessionId: string): Promise<Collage[]> {
    const dbCollages = await collageModel.findBySessionId(sessionId);
    return dbCollages.map(collage => this.normalizeCollageData(collage));
  }

  /**
   * 更新拼图（包含编辑器数据）
   * @param id 拼图ID
   * @param userId 内部用户UUID（不是Clerk ID）
   */
  async updateCollage(id: string, userId: string, data: {
    title?: string;
    description?: string;
    visibility?: 'private' | 'public' | 'unlisted';
    canvasConfig?: CanvasConfig;
    elements?: CollageElement[];
  }): Promise<Collage> {
    // 验证拼图所有权
    const collage = await collageModel.findById(id);
    if (!collage || collage.userId !== userId) {
      throw new Error('拼图不存在或无权修改');
    }

    // 将前端字段映射到数据库字段
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.visibility !== undefined) updateData.visibility = data.visibility;
    if (data.canvasConfig !== undefined) updateData.canvasConfig = data.canvasConfig;
    if (data.elements !== undefined) updateData.elements = data.elements;

    // 返回更新后的数据，应用规范化
    const updatedCollage = await collageModel.update(id, updateData);
    return this.normalizeCollageData(updatedCollage);
  }

  /**
   * 删除拼图（软删除）
   * @param collageId 拼图ID
   * @param userId 内部用户UUID（不是Clerk ID）
   */
  async deleteCollage(collageId: string, userId: string): Promise<boolean> {
    // 验证拼图所有权
    const dbCollage = await collageModel.findById(collageId);
    if (!dbCollage || dbCollage.userId !== userId) {
      throw new Error('拼图不存在或无权删除');
    }

    return await collageModel.softDelete(collageId);
  }

  /**
   * 下载拼图
   */
  async downloadCollage(collageId: string): Promise<{ url: string; filename: string }> {
    const dbCollage = await collageModel.findById(collageId);
    if (!dbCollage) {
      throw new Error('拼图不存在');
    }

    if (dbCollage.status !== 'completed') {
      throw new Error('拼图尚未完成生成');
    }

    // 增加下载次数
    await collageModel.incrementDownloadCount(collageId);

    return {
      url: dbCollage.fullImageUrl || dbCollage.previewUrl || '',
      filename: `${dbCollage.title || 'collage'}_${dbCollage.uuid}.png`
    };
  }

  /**
   * 获取精选拼图
   */
  async getFeaturedCollages(limit = 12): Promise<Collage[]> {
    const dbCollages = await collageModel.getFeaturedCollages(limit);
    return dbCollages.map(collage => this.normalizeCollageData(collage));
  }

  /**
   * 更新拼图状态
   */
  async updateCollageStatus(
    collageId: string,
    status: string,
    generationStatus: string,
    metadata?: any
  ): Promise<void> {
    await collageModel.updateStatus(collageId, status, generationStatus, metadata);
  }
}

export const collageCrudService = new CollageCrudService(); 