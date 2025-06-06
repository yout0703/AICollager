// 拼图服务统一入口
export { collageValidationService } from './collageValidationService';
export { collageImageService } from './collageImageService';
export { collageLayoutService } from './collageLayoutService';
export { collageCrudService } from './collageCrudService';
export { collageGenerationService } from './collageGenerationService';

// 类型导出
export type { ValidationResult } from './collageValidationService';
export type { ImageAnalysisResult } from './collageImageService';
export type { LayoutGenerationResult } from './collageLayoutService';
export type { CollageGenerationRequest, CollageGenerationResult } from './collageGenerationService';

// 为了保持向后兼容，重新导出主要的服务接口
import { collageGenerationService } from './collageGenerationService';
import { collageCrudService } from './collageCrudService';

/**
 * 向后兼容的拼图服务类
 * 整合了生成和CRUD功能
 */
export class CollageService {
  // 生成相关方法
  async generateCollage(request: any) {
    return collageGenerationService.generateCollage(request);
  }

  // CRUD相关方法  
  async getCollageById(id: string, userId?: string) {
    return collageCrudService.getCollageById(id, userId);
  }

  async getUserCollages(userId: string, page = 1, limit = 10) {
    return collageCrudService.getUserCollages(userId, page, limit);
  }

  async getSessionCollages(sessionId: string) {
    return collageCrudService.getSessionCollages(sessionId);
  }

  async updateCollage(id: string, userId: string, data: any) {
    return collageCrudService.updateCollage(id, userId, data);
  }

  async deleteCollage(collageId: string, userId: string) {
    return collageCrudService.deleteCollage(collageId, userId);
  }

  async downloadCollage(collageId: string) {
    return collageCrudService.downloadCollage(collageId);
  }

  async getFeaturedCollages(limit = 12) {
    return collageCrudService.getFeaturedCollages(limit);
  }
}

export const collageService = new CollageService(); 