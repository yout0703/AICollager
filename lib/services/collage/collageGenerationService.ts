import { collageModel } from '@/lib/repositories/collage';
import { Collage, CanvasConfig, CollageElement } from '@/types/collage';
import { AI_CONFIG } from '@/lib/ai-config';
import { collageValidationService } from './collageValidationService';
import { collageImageService } from './collageImageService';
import { collageLayoutService, type LayoutGenerationResult } from './collageLayoutService';
import { collageCrudService } from './collageCrudService';

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

export class CollageGenerationService {
  /**
   * 一键生成拼图（核心功能）
   */
  async generateCollage(request: CollageGenerationRequest): Promise<CollageGenerationResult> {
    const startTime = Date.now();
    console.log('🚀 开始生成拼图...');
    console.log('📋 请求参数:', {
      hasUserId: !!request.user_id,
      hasSessionId: !!request.session_id,
      imageCount: request.images.length,
      title: request.title,
      description: request.description,
      preferences: request.preferences
    });

    try {
      // 1. 验证用户身份和使用限制
      console.log('🔐 开始验证用户身份和使用限制...');
      const validationResult = await collageValidationService.validateUserAndLimits(request.user_id, request.session_id);
      console.log('✅ 用户验证结果:', validationResult);

      if (!validationResult.canUse) {
        console.log('❌ 用户验证失败:', validationResult.message);
        return {
          success: false,
          error: validationResult.message
        };
      }

      // 2. 创建初始拼图记录
      console.log('📝 创建初始拼图记录...');
      const collage = await this.createInitialCollage(request);
      console.log('✅ 初始拼图记录创建完成:', { uuid: collage.uuid, title: collage.title });

      // 3. 上传并分析图片
      console.log('🔍 开始上传并分析图片...');
      await collageCrudService.updateCollageStatus(collage.uuid, 'processing', 'analyzing');
      const imageAnalysisResults = await collageImageService.analyzeImages(collage.uuid, request.images);
      console.log('✅ 图片分析完成:', {
        totalImages: imageAnalysisResults.length,
        results: imageAnalysisResults.map(result => ({
          index: result.index,
          hasUrl: !!result.url,
          hasAnalysis: !!result.analysis,
          analysisKeys: result.analysis ? Object.keys(result.analysis) : []
        }))
      });

      // 4. 生成拼图布局
      console.log('🎨 开始生成拼图布局...');
      await collageCrudService.updateCollageStatus(collage.uuid, 'processing', 'generating');
      const layoutResult = await collageLayoutService.generateLayout(imageAnalysisResults, request.preferences);
      console.log('✅ 布局生成完成:', {
        success: layoutResult.success,
        hasResult: !!layoutResult,
        layoutType: layoutResult?.suggestion?.layout_type,
        maskInfo: layoutResult?.suggestion ? {
          maskStrategy: layoutResult.suggestion.mask_strategy,
          suggestionsCount: layoutResult.suggestion.suggestions?.length
        } : null
      });

      // 5. 推荐Icon元素
      console.log('🎭 开始推荐Icon元素...');
      const iconRecommendations = await collageLayoutService.recommendIcons(imageAnalysisResults, request.preferences?.theme);
      console.log('✅ Icon推荐完成:', {
        recommendationCount: iconRecommendations.length,
        icons: iconRecommendations.map(icon => ({
          iconId: icon.iconId,
          iconName: icon.iconName,
          category: icon.category
        }))
      });

      // 6. 生成最终拼图数据
      console.log('🎯 开始生成最终拼图数据...');
      const finalCollageData = await collageLayoutService.generateFinalCollageData(
        layoutResult,
        iconRecommendations,
        imageAnalysisResults
      );
      console.log('✅ 最终拼图数据生成完成:', {
        canvasConfig: finalCollageData.canvas_config,
        elementCount: finalCollageData.elements.length,
        elementTypes: finalCollageData.elements.reduce((acc, el) => {
          acc[el.type] = (acc[el.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      });

      // 详细显示画布配置
      console.log('🖼️  画布配置详情:', JSON.stringify(finalCollageData.canvas_config, null, 2));

      // 7. 更新拼图为完成状态
      console.log('🏁 完成拼图创建...');
      const processingTime = Date.now() - startTime;
      const updatedCollage = await this.completeCollage(
        collage.uuid,
        finalCollageData,
        processingTime
      );
      console.log('✅ 拼图创建完成:', {
        uuid: updatedCollage.uuid,
        processingTime: `${processingTime}ms`,
        status: updatedCollage.status,
        elementCount: Array.isArray(updatedCollage.elements) ? updatedCollage.elements.length : 0
      });

      // 8. 扣除积分（如果是登录用户）
      if (request.user_id) {
        await collageValidationService.consumeUserCredits(request.user_id, updatedCollage.uuid);
      }

      return {
        success: true,
        collage: updatedCollage,
        remainingCredits: validationResult.remainingCredits,
        remainingUsage: validationResult.remainingUsage
      };

    } catch (error) {
      console.error('❌ 拼图生成失败:', error);
      console.error('错误堆栈:', error instanceof Error ? error.stack : 'No stack trace');

      return {
        success: false,
        error: error instanceof Error ? error.message : '拼图生成失败，请稍后重试'
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

    // 处理用户ID - 关键步骤，确保用户归属正确
    let databaseUserId: string | undefined = undefined;

    console.log(`🔍 [CREATE_COLLAGE] 开始处理用户ID: request.user_id = ${request.user_id}`);

    if (request.user_id) {
      // 检查传入的是否是UUID格式（36个字符，包含4个连字符）
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(request.user_id);

      if (isUUID) {
        // 传入的已经是数据库UUID，直接使用
        databaseUserId = request.user_id;
        console.log(`✅ [CREATE_COLLAGE] 接收到数据库UUID，直接使用: ${databaseUserId}`);
      } else {
        // 传入的是Clerk ID，需要解析为UUID
        console.log(`🔍 [CREATE_COLLAGE] 接收到Clerk ID，开始解析: ${request.user_id}`);

        try {
          const { getUserInfoCached } = await import('@/lib/services/userCache');
          const user = await getUserInfoCached(request.user_id);
          if (user) {
            databaseUserId = user.uuid;
            console.log(`✅ [CREATE_COLLAGE] Clerk ID解析成功: ${request.user_id} -> ${databaseUserId}`);
          } else {
            console.log(`⚠️ [CREATE_COLLAGE] 缓存查询失败，尝试直接查询`);

            // 方法2: 直接从数据库查询
            const { getUserInfo } = await import('@/lib/services/userService');
            const userFromDB = await getUserInfo(request.user_id, 'clerk_id');
            if (userFromDB) {
              databaseUserId = userFromDB.uuid;
              console.log(`✅ [CREATE_COLLAGE] 直接查询成功: ${request.user_id} -> ${databaseUserId}`);
            } else {
              console.error(`❌ [CREATE_COLLAGE] 所有查询都失败，用户不存在: ${request.user_id}`);
            }
          }
        } catch (error) {
          console.error(`💥 [CREATE_COLLAGE] 用户查询异常:`, error);
        }
      }
    } else {
      console.log(`⚠️ [CREATE_COLLAGE] 没有用户ID，创建匿名拼图`);
    }

    console.log(`📋 [CREATE_COLLAGE] 最终用户ID结果: ${databaseUserId || 'null'}`);

    // 如果有用户但解析失败，这是一个严重问题
    if (request.user_id && !databaseUserId) {
      console.error(`🚨 [CREATE_COLLAGE] 严重错误：有用户ID但解析失败，这会导致拼图归属错误！`);
    }

    const collageData = {
      userId: databaseUserId,
      sessionId: request.session_id,
      title: request.title || '我的拼图',
      description: request.description,
      canvasConfig: defaultCanvas,
      elements: [] as CollageElement[],
      metadata: {
        userPreferences: request.preferences,
        imageCount: request.images.length
      }
    };

    console.log(`📝 [CREATE_COLLAGE] 创建拼图数据:`, {
      hasUserId: !!collageData.userId,
      userId: collageData.userId,
      hasSessionId: !!collageData.sessionId,
      sessionId: collageData.sessionId,
      title: collageData.title,
      description: collageData.description
    });

    const dbCollage = await collageModel.create(collageData);

    console.log(`✅ [CREATE_COLLAGE] 拼图创建成功:`, {
      uuid: dbCollage.uuid,
      dbUserId: dbCollage.userId,
      dbSessionId: dbCollage.sessionId,
      title: dbCollage.title
    });

    return dbCollage;
  }

  /**
   * 完成拼图创建
   */
  private async completeCollage(
    collageId: string,
    collageData: LayoutGenerationResult,
    processingTime: number
  ): Promise<Collage> {
    // 更新拼图数据
    await collageModel.update(collageId, {
      canvasConfig: collageData.canvas_config,
      elements: collageData.elements
    });

    // 更新状态为完成
    await collageModel.updateStatus(collageId, 'completed', 'completed', {
      aiProcessingTime: processingTime,
      aiModel: AI_CONFIG.models.primary
    });

    const updatedCollage = await collageModel.findById(collageId);
    if (!updatedCollage) {
      throw new Error('获取完成的拼图失败');
    }

    return updatedCollage;
  }
}

export const collageGenerationService = new CollageGenerationService();
