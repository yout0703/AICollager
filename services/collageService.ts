import { Collage, CreateCollageRequest, CanvasConfig, CollageElement } from '@/types/collage';
import { collageModel } from '@/models/collage';
import { collageImageModel } from '@/models/collageImage';
import { analyzeImages, suggestLayout, generateColorScheme, performCompleteAnalysis, type ImageAnalysisResult } from './geminiService';
import { checkUserAILimit, checkSessionTrialLimit, consumeAIUsage, consumeTrialUsage } from './dailyLimitService';
import { consumeCredits, checkCreditsAvailable } from './creditService';
import { getUserInfo, incrementSessionTrialUsageCount, checkSessionTrialLimit as checkSessionLimit, getOrCreateUserSession } from './userService';
import { IconService } from './iconService';
import { AI_CONFIG } from '@/lib/ai-config';

export interface CollageGenerationRequest {
  user_id?: string;
  session_id?: string;
  images: File[];
  title?: string;
  description?: string;
  preferences?: {
    style?: 'modern' | 'vintage' | 'artistic' | 'minimal';
    theme?: 'travel' | 'family' | 'food' | 'pets' | 'celebration';
    colorScheme?: 'auto' | 'warm' | 'cool' | 'monochrome';
    aspectRatio?: '1:1' | '4:3' | '16:9' | '3:4' | '9:16' | 'auto';
  };
}

export interface CollageGenerationResult {
  success: boolean;
  collage?: Collage;
  error?: string;
  remainingCredits?: number;
  remainingUsage?: number;
}

export class CollageService {
  /**
   * 一键生成拼图（核心功能）
   */
  async generateCollage(request: CollageGenerationRequest): Promise<CollageGenerationResult> {
    const startTime = Date.now();
    
    try {
      // 1. 验证用户身份和使用限制
      const validationResult = await this.validateUserAndLimits(request.user_id, request.session_id);
      if (!validationResult.canUse) {
        return {
          success: false,
          error: validationResult.message
        };
      }

      // 2. 创建初始拼图记录
      const collage = await this.createInitialCollage(request);

      // 3. 上传并分析图片
      await this.updateCollageStatus(collage.uuid, 'processing', 'analyzing');
      const imageAnalysisResults = await this.analyzeImages(collage.uuid, request.images);

      // 4. 生成拼图布局
      await this.updateCollageStatus(collage.uuid, 'processing', 'generating');
      const layoutResult = await this.generateLayout(imageAnalysisResults, request.preferences);

      // 5. 推荐Icon元素
      const iconRecommendations = await this.recommendIcons(imageAnalysisResults, request.preferences?.theme);

      // 6. 生成最终拼图数据
      const finalCollageData = await this.generateFinalCollageData(
        layoutResult,
        iconRecommendations,
        imageAnalysisResults
      );

      // 7. 更新拼图为完成状态
      const processingTime = Date.now() - startTime;
      const updatedCollage = await this.completeCollage(
        collage.uuid,
        finalCollageData,
        processingTime
      );

      // 8. 扣除积分（如果是登录用户）
      if (request.user_id) {
        await consumeCredits({
          userId: request.user_id,
          amount: AI_CONFIG.credits.collage,
          purpose: 'collage',
          relatedEntityId: updatedCollage.uuid
        });
      }

      return {
        success: true,
        collage: updatedCollage,
        remainingCredits: validationResult.remainingCredits,
        remainingUsage: validationResult.remainingUsage
      };

    } catch (error) {
      console.error('拼图生成失败:', error);
      
      // 更新拼图状态为失败
      if (request.user_id || request.session_id) {
        // 如果有collage记录，更新状态
        // 这里需要错误处理逻辑
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : '拼图生成失败，请稍后重试'
      };
    }
  }

  /**
   * 获取拼图详情
   */
  async getCollageById(id: string, userId?: string): Promise<Collage | null> {
    const collage = await collageModel.findById(id);
    
    if (!collage) {
      return null;
    }

    // 检查访问权限
    if (collage.visibility === 'private' && collage.user_id !== userId) {
      throw new Error('无权访问此拼图');
    }

    // 增加查看次数
    await collageModel.incrementViewCount(id);

    return collage;
  }

  /**
   * 获取用户拼图列表
   */
  async getUserCollages(userId: string, page = 1, limit = 10) {
    return await collageModel.findByUserId(userId, page, limit);
  }

  /**
   * 获取会话拼图列表（未登录用户）
   */
  async getSessionCollages(sessionId: string): Promise<Collage[]> {
    return await collageModel.findBySessionId(sessionId);
  }

  /**
   * 更新拼图
   */
  async updateCollage(id: string, userId: string, data: {
    title?: string;
    description?: string;
    visibility?: 'private' | 'public' | 'unlisted';
  }): Promise<Collage> {
    // 验证拼图所有权
    const collage = await collageModel.findById(id);
    if (!collage || collage.user_id !== userId) {
      throw new Error('拼图不存在或无权修改');
    }

    return await collageModel.update(id, data);
  }

  /**
   * 删除拼图
   */
  async deleteCollage(id: string, userId: string): Promise<void> {
    // 验证拼图所有权
    const collage = await collageModel.findById(id);
    if (!collage || collage.user_id !== userId) {
      throw new Error('拼图不存在或无权删除');
    }

    await collageModel.softDelete(id);
  }

  /**
   * 下载拼图
   */
  async downloadCollage(id: string, userId?: string): Promise<{
    downloadUrl: string;
    remainingCredits?: number;
  }> {
    const collage = await collageModel.findById(id);
    if (!collage) {
      throw new Error('拼图不存在');
    }

    // 检查访问权限
    if (collage.visibility === 'private' && collage.user_id !== userId) {
      throw new Error('无权下载此拼图');
    }

    // 如果是登录用户且不是自己的拼图，需要扣除下载积分
    if (userId && collage.user_id !== userId) {
      const user = await getUserInfo(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      if (user.credits < AI_CONFIG.credits.download) {
        throw new Error('积分不足，无法下载高清图片');
      }

      await consumeCredits({
        userId: userId,
        amount: AI_CONFIG.credits.download,
        purpose: 'download',
        relatedEntityId: collage.uuid
      });
    }

    // 增加下载次数
    await collageModel.incrementDownloadCount(id);

    // 返回下载链接
    return {
      downloadUrl: collage.full_image_url || collage.preview_url || '',
      remainingCredits: userId ? (await getUserInfo(userId))?.credits : undefined
    };
  }

  /**
   * 获取精选拼图
   */
  async getFeaturedCollages(limit = 12): Promise<Collage[]> {
    return await collageModel.getFeaturedCollages(limit);
  }

  // ===== 私有方法 =====

  /**
   * 验证用户身份和使用限制
   */
  private async validateUserAndLimits(userId?: string, sessionId?: string): Promise<{
    canUse: boolean;
    message?: string;
    remainingCredits?: number;
    remainingUsage?: number;
  }> {
    if (userId) {
      // 登录用户：检查积分和每日限制
      const user = await getUserInfo(userId);
      if (!user) {
        return { canUse: false, message: '用户不存在' };
      }

      if (user.credits < AI_CONFIG.credits.collage) {
        return { canUse: false, message: '积分不足，请邀请朋友获取积分' };
      }

      const limitCheck = await checkUserAILimit(userId);
      if (!limitCheck.allowed) {
        return { canUse: false, message: limitCheck.reason || '今日AI使用次数已达上限' };
      }

      return {
        canUse: true,
        remainingCredits: user.credits,
        remainingUsage: limitCheck.user_limit?.remaining
      };
    } else {
      // 未登录用户：检查试用次数
      if (!sessionId) {
        return { canUse: false, message: '缺少会话信息' };
      }

      const sessionCheck = await checkSessionLimit(sessionId);
      if (!sessionCheck.canUse) {
        return { canUse: false, message: sessionCheck.message || '试用次数已用完，请注册登录继续使用' };
      }

      return {
        canUse: true,
        remainingUsage: sessionCheck.trialLimit - sessionCheck.currentUsage
      };
    }
  }

  /**
   * 创建初始拼图记录
   */
  private async createInitialCollage(request: CollageGenerationRequest): Promise<Collage> {
    const defaultCanvas: CanvasConfig = {
      width: 800,
      height: 800,
      aspectRatio: request.preferences?.aspectRatio || '1:1',
      backgroundColor: '#ffffff',
      padding: 20
    };

    const collageData = {
      user_id: request.user_id,
      session_id: request.session_id,
      title: request.title || '我的拼图',
      description: request.description,
      images: [], // 添加缺失的images字段
      canvas_config: defaultCanvas,
      elements: [] as CollageElement[],
      metadata: {
        userPreferences: request.preferences,
        imageCount: request.images.length
      }
    };

    return await collageModel.create(collageData);
  }

  /**
   * 分析上传的图片
   */
  private async analyzeImages(collageId: string, images: File[]): Promise<any[]> {
    const analysisResults = [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      // 这里应该上传图片到S3并获取URL
      const imageUrl = await this.uploadImageToS3(image);
      
      // 保存图片记录
      await collageImageModel.create({
        collage_id: collageId,
        image_index: i,
        original_url: imageUrl,
        file_name: image.name,
        file_size: image.size,
        mime_type: image.type
      });

      // 准备AI分析的图片数据
      const imageData = {
        data: await this.fileToBuffer(image),
        mimeType: image.type,
        filename: image.name
      };

      // AI分析图片
      const analysis = await analyzeImages([imageData]);
      if (analysis.success && analysis.results) {
        analysisResults.push({
          index: i,
          url: imageUrl,
          analysis: analysis.results[0]
        });
      }
    }

    return analysisResults;
  }

  /**
   * 生成拼图布局
   */
  private async generateLayout(imageAnalyses: any[], preferences?: any): Promise<any> {
    const layoutParams = {
      images: imageAnalyses.map(img => img.analysis),
      preferences
    };
    return await suggestLayout(layoutParams);
  }

  /**
   * 推荐Icon元素
   */
  private async recommendIcons(imageAnalyses: any[], theme?: string): Promise<any[]> {
    // 基于图片分析结果和主题推荐Icon
    const keywords = imageAnalyses.flatMap(img => img.analysis?.keywords || []);
    
    const result = await IconService.recommendIcons({
      context: keywords.join(', '),
      theme: theme,
      limit: 10
    });
    
    return result.success ? result.recommendations || [] : [];
  }

  /**
   * 生成最终拼图数据
   */
  private async generateFinalCollageData(
    layoutResult: any,
    iconRecommendations: any[],
    imageAnalyses: any[]
  ): Promise<{ canvas_config: CanvasConfig; elements: CollageElement[] }> {
    // 这里需要将AI的建议转换为具体的拼图数据结构
    // 这是一个复杂的转换过程，涉及坐标计算、元素位置等
    
    return {
      canvas_config: layoutResult.canvas_config,
      elements: layoutResult.elements
    };
  }

  /**
   * 完成拼图创建
   */
  private async completeCollage(
    collageId: string,
    collageData: { canvas_config: CanvasConfig; elements: CollageElement[] },
    processingTime: number
  ): Promise<Collage> {
    // 更新拼图数据
    await collageModel.update(collageId, {
      canvas_config: collageData.canvas_config,
      elements: collageData.elements
    });

    // 更新状态为完成
    await collageModel.updateStatus(collageId, 'completed', 'completed', {
      ai_processing_time: processingTime,
      ai_model: AI_CONFIG.models.primary
    });

    const updatedCollage = await collageModel.findById(collageId);
    if (!updatedCollage) {
      throw new Error('获取完成的拼图失败');
    }

    return updatedCollage;
  }

  /**
   * 更新拼图状态
   */
  private async updateCollageStatus(
    collageId: string,
    status: string,
    generationStatus: string
  ): Promise<void> {
    await collageModel.updateStatus(collageId, status, generationStatus);
  }

  /**
   * 上传图片到S3
   */
  private async uploadImageToS3(image: File): Promise<string> {
    // TODO: 实现S3上传逻辑
    // 暂时返回一个模拟的URL
    return `https://example.com/images/${Date.now()}-${image.name}`;
  }

  /**
   * 将File转换为Buffer
   */
  private async fileToBuffer(file: File): Promise<Buffer> {
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

export const collageService = new CollageService(); 