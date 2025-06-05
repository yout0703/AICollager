import { 
  Collage,
  CanvasConfig, 
  CollageElement,
  ImageElement,
  IconElement,
  Transform,
  ElementStyle,
  AILayoutSuggestion,
  AIImageAnalysis
} from '@/types/collage';
import { collageModel } from '@/lib/repositories/collage';
import { collageImageModel } from '@/lib/repositories/collageImage';
import { 
  analyzeImages, 
  suggestLayout, 
  generateColorScheme, 
  performCompleteAnalysis,
  ImageAnalysisResult,
  LayoutSuggestion,
  ColorScheme
} from './geminiService';
import { checkUserAILimit, checkSessionTrialLimit, consumeAIUsage, consumeTrialUsage } from '@/lib/services/dailyLimitService';
import { consumeCredits, checkCreditsAvailable } from '@/lib/services/creditService';
import { getUserInfo, incrementSessionTrialUsageCount, checkSessionTrialLimit as checkSessionLimit, getOrCreateUserSession } from '@/lib/services/userService';
import { IconService } from '@/lib/services/iconService';
import { AI_CONFIG } from '@/lib/ai-config';
import type { Collage as DbCollage } from "@/lib/repositories/collage";

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
      const validationResult = await this.validateUserAndLimits(request.user_id, request.session_id);
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
      await this.updateCollageStatus(collage.uuid, 'processing', 'analyzing');
      const imageAnalysisResults = await this.analyzeImages(collage.uuid, request.images);
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
      await this.updateCollageStatus(collage.uuid, 'processing', 'generating');
      const layoutResult = await this.generateLayout(imageAnalysisResults, request.preferences);
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
      const iconRecommendations = await this.recommendIcons(imageAnalysisResults, request.preferences?.theme);
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
      const finalCollageData = await this.generateFinalCollageData(
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
        elementCount: updatedCollage.elements?.length
      });

      // 8. 扣除积分（如果是登录用户）
      if (request.user_id) {
        console.log('💰 扣除用户积分...');
        // request.user_id 现在应该是内部 UUID
        await consumeCredits({
          userId: request.user_id, // 直接使用内部 UUID
          amount: AI_CONFIG.credits.collage,
          purpose: 'collage',
          relatedEntityId: updatedCollage.uuid
        });
        console.log('✅ 积分扣除完成:', { amount: AI_CONFIG.credits.collage });
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
   * @param id 拼图ID
   * @param userId 内部用户UUID（不是Clerk ID）
   */
  async getCollageById(id: string, userId?: string): Promise<Collage | null> {
    const dbCollage = await collageModel.findById(id);
    
    if (!dbCollage) {
      return null;
    }

    // 检查访问权限
    if (dbCollage.visibility === 'private' && userId) {
      // 这里的 userId 已经是内部 UUID，直接比较
      if (dbCollage.userId !== userId) {
        throw new Error('无权访问此拼图');
      }
    }

    // 增加查看次数
    await collageModel.incrementViewCount(id);

    return transformDbCollageToCollage(dbCollage);
  }

  /**
   * 获取用户拼图列表（支持分页）
   * @param userId 内部用户UUID（不是Clerk ID）
   */
  async getUserCollages(userId: string, page = 1, limit = 10): Promise<Collage[]> {
    const dbCollages = await collageModel.findByUser(userId, { page, limit });
    return dbCollages.map(transformDbCollageToCollage);
  }

  /**
   * 获取会话拼图列表（未登录用户）
   */
  async getSessionCollages(sessionId: string): Promise<Collage[]> {
    const dbCollages = await collageModel.findBySessionId(sessionId);
    return dbCollages.map(transformDbCollageToCollage);
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
    canvas_config?: CanvasConfig;
    elements?: CollageElement[];
  }): Promise<Collage> {
    // 验证拼图所有权
    const collage = await collageModel.findById(id);
    if (!collage || collage.userId !== userId) {
      throw new Error('拼图不存在或无权修改');
    }

    // 直接传递数据给model，它会自动处理last_edited_at的更新
    return transformDbCollageToCollage(await collageModel.update(id, data));
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
    return dbCollages.map(transformDbCollageToCollage);
  }

  // ===== 私有方法 =====

  /**
   * 验证用户身份和使用限制
   * @param userId 内部用户UUID（不是Clerk ID）
   */
  private async validateUserAndLimits(userId?: string, sessionId?: string): Promise<{
    canUse: boolean;
    message?: string;
    remainingCredits?: number;
    remainingUsage?: number;
  }> {
    if (userId) {
      // 登录用户：检查积分和每日限制
      const user = await getUserInfo(userId); // 使用内部 UUID 查询
      if (!user) {
        return { canUse: false, message: '用户不存在' };
      }

      if (user.credits < AI_CONFIG.credits.collage) {
        return { canUse: false, message: '积分不足，请邀请朋友获取积分' };
      }

      // checkUserAILimit 需要 Clerk ID，但这里需要重新设计
      // 暂时保留旧逻辑，但这个函数需要更新为接受内部 UUID
      const limitCheck = await checkUserAILimit(user.clerk_user_id);
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

    // 如果有用户ID，使用缓存优化的函数获取数据库 UUID
    let databaseUserId: string | undefined = undefined;
    if (request.user_id) {
      const { getUserInfoCached } = await import('./userCache');
      const user = await getUserInfoCached(request.user_id);
      if (user) {
        databaseUserId = user.uuid;
      }
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

    const dbCollage = await collageModel.create(collageData);
    return transformDbCollageToCollage(dbCollage);
  }

  /**
   * 分析上传的图片
   */
  private async analyzeImages(collageId: string, images: File[]): Promise<any[]> {
    console.log(`🔍 开始分析 ${images.length} 张图片...`);
    const analysisResults = [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      console.log(`📸 处理第 ${i + 1} 张图片:`, {
        name: image.name,
        size: `${Math.round(image.size / 1024)}KB`,
        type: image.type
      });
      
      try {
        // 这里应该上传图片到S3并获取URL
        console.log('📤 上传图片到R2...');
        const imageUrl = await this.uploadImageToR2(image);
        console.log('✅ 图片上传成功:', imageUrl);
        
        // 保存图片记录
        console.log('💾 保存图片记录到数据库...');
        await collageImageModel.create({
          collage_id: collageId,
          image_index: i,
          original_url: imageUrl,
          file_name: image.name,
          file_size: image.size,
          mime_type: image.type
        });

        // 准备AI分析的图片数据
        console.log('🧠 准备AI分析数据...');
        const imageData = {
          data: await this.fileToBuffer(image),
          mimeType: image.type,
          filename: image.name
        };

        // AI分析图片
        console.log('🤖 调用Gemini AI分析图片...');
        const analysisStartTime = Date.now();
        const analysis = await analyzeImages([imageData]);
        const analysisTime = Date.now() - analysisStartTime;
        
        console.log('📊 Gemini分析结果:', {
          success: analysis.success,
          analysisTime: `${analysisTime}ms`,
          hasResults: !!analysis.results,
          resultCount: analysis.results?.length,
          error: analysis.error
        });
        
        if (analysis.success && analysis.results) {
          console.log('✅ 图片分析成功:', {
            imageIndex: i,
            analysisKeys: Object.keys(analysis.results[0] || {}),
            resultData: analysis.results[0]
          });
          
          analysisResults.push({
            index: i,
            url: imageUrl,
            analysis: analysis.results[0]
          });
        } else {
          console.error('❌ 图片分析失败:', {
            imageIndex: i,
            error: analysis.error,
            analysis: analysis
          });
          
          // 即使分析失败也要保留图片信息
          analysisResults.push({
            index: i,
            url: imageUrl,
            analysis: null
          });
        }
      } catch (error) {
        console.error(`❌ 第 ${i + 1} 张图片处理失败:`, error);
        throw error;
      }
    }

    console.log('✅ 所有图片分析完成:', {
      totalImages: images.length,
      successfulAnalyses: analysisResults.filter(r => r.analysis).length,
      failedAnalyses: analysisResults.filter(r => !r.analysis).length
    });

    return analysisResults;
  }

  /**
   * 生成拼图布局
   */
  private async generateLayout(imageAnalyses: any[], preferences?: any): Promise<any> {
    console.log('🎨 调用Gemini生成布局建议...');
    console.log('📋 布局参数:', {
      imageCount: imageAnalyses.length,
      hasAnalyses: imageAnalyses.map(img => !!img.analysis),
      preferences: preferences
    });
    
    const layoutParams = {
      images: imageAnalyses.map(img => img.analysis),
      preferences
    };
    
    console.log('🤖 发送给Gemini的布局参数:', {
      imageAnalysesCount: layoutParams.images.length,
      validAnalyses: layoutParams.images.filter(img => img).length,
      preferences: layoutParams.preferences
    });
    
    const layoutStartTime = Date.now();
    const result = await suggestLayout(layoutParams);
    const layoutTime = Date.now() - layoutStartTime;
    
    console.log('📊 Gemini布局结果:', {
      success: result.success,
      layoutTime: `${layoutTime}ms`,
      hasResult: !!result,
      error: result.error,
      suggestion: result.suggestion ? {
        layoutType: result.suggestion.layout_type,
        aspectRatio: result.suggestion.aspect_ratio,
        maskStrategy: result.suggestion.mask_strategy,
        suggestionsCount: result.suggestion.suggestions?.length,
        reasoning: result.suggestion.reasoning
      } : null
    });
    
    return result;
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
    console.log('🎨 开始生成最终拼图数据...');
    console.log('📊 输入数据概览:', {
      layoutResult: {
        success: layoutResult.success,
        hasResult: !!layoutResult,
        layoutType: layoutResult?.suggestion?.layout_type
      },
      iconCount: iconRecommendations.length,
      imageCount: imageAnalyses.length
    });
    
    // 1. 设置画布配置
    const canvas_config: CanvasConfig = {
      width: 800,
      height: 800,
      aspectRatio: layoutResult.suggestion?.aspect_ratio || '1:1',
      backgroundColor: '#ffffff',
      padding: 20
    };

    console.log('📐 画布配置:', canvas_config);

    // 2. 计算有效绘制区域
    const effectiveWidth = canvas_config.width - (canvas_config.padding * 2);
    const effectiveHeight = canvas_config.height - (canvas_config.padding * 2);
    console.log('📏 有效绘制区域:', { 
      effectiveWidth, 
      effectiveHeight,
      startX: canvas_config.padding,
      startY: canvas_config.padding
    });

    // 3. 生成图片元素
    const elements: CollageElement[] = [];
    
    if (layoutResult.success && layoutResult.suggestion) {
      const suggestion = layoutResult.suggestion;
      console.log('🤖 AI布局建议详情:', {
        layoutType: suggestion.layout_type,
        maskStrategy: suggestion.mask_strategy,
        suggestionsCount: suggestion.suggestions?.length,
        reasoning: suggestion.reasoning
      });
      
      // 由于现在只支持mask_collage模式，直接处理遮罩拼图
      if (suggestion.layout_type === 'mask_collage' && suggestion.suggestions) {
        console.log('🎭 使用AI遮罩拼图布局生成元素...');
        
        // 遮罩拼图处理（当有suggestions时）
        this.generateGenericAIElements(suggestion, imageAnalyses, canvas_config, effectiveWidth, effectiveHeight, elements);
      } else {
        console.log('❌ 布局结果无效，使用紧急默认布局');
        // 紧急默认布局
        this.generateDefaultGridLayout(imageAnalyses, canvas_config, effectiveWidth, effectiveHeight, elements);
      }
    } else {
      console.log('❌ 布局结果无效，使用紧急默认布局');
      // 紧急默认布局
      this.generateDefaultGridLayout(imageAnalyses, canvas_config, effectiveWidth, effectiveHeight, elements);
    }

    // 4. 添加推荐的Icon元素
    if (iconRecommendations && iconRecommendations.length > 0) {
      console.log(`🎭 添加 ${iconRecommendations.length} 个推荐Icon (最多3个)`);
      
      iconRecommendations.slice(0, 3).forEach((icon, index) => { // 最多添加3个icon
        // 计算Icon位置（放在角落，但要避开图片区域）
        const iconSize = 40;
        const iconMargin = 15; // 距离边缘的距离
        
        const positions = [
          { x: iconMargin, y: iconMargin }, // 左上
          { x: canvas_config.width - iconSize - iconMargin, y: iconMargin }, // 右上
          { x: iconMargin, y: canvas_config.height - iconSize - iconMargin } // 左下
        ];
        
        const position = positions[index] || positions[0];
        
        console.log(`🎭 生成Icon元素 ${index + 1}:`, {
          iconId: icon.iconId,
          iconName: icon.iconName,
          position: position,
          size: iconSize
        });
        
        elements.push({
          id: `icon-${index}`,
          type: 'icon',
          zIndex: 10,
          transform: {
            x: position.x,
            y: position.y,
            width: iconSize,
            height: iconSize,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            flipX: false,
            flipY: false
          },
          style: {
            opacity: 0.8,
            borderRadius: 0
          },
          isLocked: false,
          isVisible: true,
          iconId: icon.iconId || 'default-icon',
          iconName: icon.iconName || 'decoration',
          category: 'decoration',
          svgContent: '<svg></svg>', // 占位符，实际应该从icon库获取
          color: '#666666',
          size: iconSize
        } as IconElement);
      });
    }

    console.log(`✅ 最终拼图数据生成完成:`, {
      totalElements: elements.length,
      imageElements: elements.filter(e => e.type === 'image').length,
      iconElements: elements.filter(e => e.type === 'icon').length,
      canvasConfig: canvas_config,
      elementPositions: elements.map(e => ({
        id: e.id,
        type: e.type,
        position: { x: e.transform.x, y: e.transform.y, width: e.transform.width, height: e.transform.height }
      }))
    });
    
    // 添加详细的元素位置信息日志
    console.log('📐 详细元素位置信息:');
    elements.forEach((element, index) => {
      console.log(`  ${index + 1}. ${element.id} (${element.type}):`, {
        x: Math.round(element.transform.x),
        y: Math.round(element.transform.y), 
        width: Math.round(element.transform.width),
        height: Math.round(element.transform.height),
        rotation: element.transform.rotation,
        zIndex: element.zIndex
      });
    });
    
    return {
      canvas_config,
      elements
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

    return transformDbCollageToCollage(updatedCollage);
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
   * 上传图片到 Cloudflare R2（带MD5去重）
   */
  private async uploadImageToR2(image: File): Promise<string> {
    try {
      // 验证 R2 配置
      const { validateR2Config, uploadBufferToR2WithDedup, getAccessibleR2Url } = await import('@/lib/storage');
      
      if (!validateR2Config()) {
        throw new Error('R2 配置验证失败');
      }
      
      // 转换File为Buffer
      const buffer = await this.fileToBuffer(image);
      
      const bucketName = process.env.R2_BUCKET_NAME;
      if (!bucketName) {
        throw new Error('R2_BUCKET_NAME环境变量未设置');
      }
      
      // 获取文件扩展名，用于生成适当的MD5文件名
      const fileExtension = image.name.split('.').pop() || 'jpg';
      const contentType = image.type || 'image/jpeg';
      
      console.log(`📤 上传图片到 R2 (智能去重): ${image.name}`);
      const uploadResult = await uploadBufferToR2WithDedup(
        buffer, 
        bucketName, 
        contentType,
        'collage-images'
      );
      
      // 使用智能访问获取最终可用的 URL
      console.log(`🔗 获取可访问 URL: ${uploadResult.Key}`);
      const accessResult = await getAccessibleR2Url(uploadResult.Key);
      
      if (uploadResult.isExisting) {
        console.log(`♻️  使用已存在的图片: ${accessResult.url} (${accessResult.type}, MD5: ${uploadResult.md5Hash})`);
      } else {
        console.log(`✅ 新图片上传成功: ${accessResult.url} (${accessResult.type}, MD5: ${uploadResult.md5Hash})`);
      }
      
      // 如果是预签名 URL，记录过期时间
      if (accessResult.type === 'presigned' && accessResult.expiresAt) {
        console.log(`⏰ 预签名 URL 将于 ${accessResult.expiresAt.toLocaleString()} 过期`);
      }
      
      return accessResult.url;
      
    } catch (error) {
      console.error('❌ R2上传失败:', error);
      
      // 如果R2上传失败，返回一个本地临时URL（仅开发环境）
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 开发环境：返回临时URL');
        return `data:${image.type};base64,${(await this.fileToBuffer(image)).toString('base64')}`;
      }
      
      throw new Error(`图片上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 将File转换为Buffer
   */
  private async fileToBuffer(file: File): Promise<Buffer> {
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * 生成网格布局元素
   */
  private generateGridElements(suggestion: any, imageAnalyses: any[], canvas_config: any, effectiveWidth: number, effectiveHeight: number, elements: CollageElement[]): void {
    // 从布局建议中获取网格参数
    const gridRows = suggestion.suggestions.length > 0 ? 
      Math.ceil(Math.sqrt(suggestion.suggestions.length)) : 2;
    const gridCols = Math.ceil(suggestion.suggestions.length / gridRows);
    
    const gridGap = 10;
    const totalHorizontalGaps = (gridCols - 1) * gridGap;
    const totalVerticalGaps = (gridRows - 1) * gridGap;
    
    const cellWidth = (effectiveWidth - totalHorizontalGaps) / gridCols;
    const cellHeight = (effectiveHeight - totalVerticalGaps) / gridRows;
    
    console.log('📊 生成网格布局:', {
      gridSize: `${gridRows}x${gridCols}`,
      cellSize: `${cellWidth}x${cellHeight}`,
      totalElements: suggestion.suggestions.length
    });
    
    suggestion.suggestions.forEach((imgSuggestion: any, index: number) => {
      if (index < imageAnalyses.length) {
        const imageAnalysis = imageAnalyses[imgSuggestion.image_index || index];
        
        const row = Math.floor(index / gridCols);
        const col = index % gridCols;
        
        const x = canvas_config.padding + col * (cellWidth + gridGap);
        const y = canvas_config.padding + row * (cellHeight + gridGap);
        
        console.log(`📊 生成网格图片元素 ${index + 1}:`, {
          gridPosition: { row, col },
          position: { x, y, width: cellWidth, height: cellHeight }
        });
        
        // 创建默认的遮罩区域和图片变换
        const defaultMaskRegion = {
          id: `mask-${index}`,
          shape: 'rectangle' as const,
          clipPath: 'none',
          position: { x, y, width: cellWidth, height: cellHeight }
        };
        
        const defaultImageTransform = {
          position: { x: 0, y: 0 },
          scale: 1,
          rotation: 0,
          anchor: { x: 0.5, y: 0.5 }
        };
        
        const element = {
          id: `image-${index}`,
          type: 'image' as const,
          zIndex: imgSuggestion.z_index || 1,
          transform: {
            x: x,
            y: y,
            width: cellWidth,
            height: cellHeight,
            rotation: imgSuggestion.rotation || 0,
            scaleX: 1,
            scaleY: 1,
            flipX: false,
            flipY: false
          },
          style: {
            opacity: 1,
            borderRadius: 0
          },
          isLocked: false,
          isVisible: true,
          src: imageAnalysis.url,
          originalSrc: imageAnalysis.url,
          alt: `Image ${index + 1}`,
          maskRegion: defaultMaskRegion,
          imageTransform: defaultImageTransform
        } as ImageElement;
        
        elements.push(element);
      }
    });
  }

  /**
   * 生成几何布局元素
   */
  private generateGeometricElements(suggestion: any, imageAnalyses: any[], canvas_config: any, effectiveWidth: number, effectiveHeight: number, elements: CollageElement[]): void {
    suggestion.suggestions.forEach((imgSuggestion: any, index: number) => {
      if (index < imageAnalyses.length) {
        const imageAnalysis = imageAnalyses[imgSuggestion.image_index || index];
        
        const actualX = canvas_config.padding + (imgSuggestion.position.x / 100) * effectiveWidth;
        const actualY = canvas_config.padding + (imgSuggestion.position.y / 100) * effectiveHeight;
        const actualWidth = (imgSuggestion.position.width / 100) * effectiveWidth;
        const actualHeight = (imgSuggestion.position.height / 100) * effectiveHeight;
        
        console.log(`🔺 生成几何图片元素 ${index + 1}:`, {
          position: { x: actualX, y: actualY, width: actualWidth, height: actualHeight },
          rotation: imgSuggestion.rotation,
          hasClipPath: !!imgSuggestion.clip_path,
          clipPath: imgSuggestion.clip_path
        });
        
        // 创建默认的遮罩区域和图片变换
        const defaultMaskRegion = {
          id: `mask-${index}`,
          shape: 'rectangle' as const,
          clipPath: imgSuggestion.clip_path || 'none',
          position: { x: actualX, y: actualY, width: actualWidth, height: actualHeight }
        };
        
        const defaultImageTransform = {
          position: { x: 0, y: 0 },
          scale: 1,
          rotation: imgSuggestion.rotation || 0,
          anchor: { x: 0.5, y: 0.5 }
        };
        
        const element = {
          id: `image-${index}`,
          type: 'image' as const,
          zIndex: imgSuggestion.z_index || 1,
          transform: {
            x: actualX,
            y: actualY,
            width: actualWidth,
            height: actualHeight,
            rotation: imgSuggestion.rotation || 0,
            scaleX: 1,
            scaleY: 1,
            flipX: false,
            flipY: false
          },
          style: {
            opacity: 1,
            borderRadius: 0
          },
          isLocked: false,
          isVisible: true,
          src: imageAnalysis.url,
          originalSrc: imageAnalysis.url,
          alt: `Image ${index + 1}`,
          maskRegion: defaultMaskRegion,
          imageTransform: defaultImageTransform
        } as ImageElement;
        
        // 调试：检查最终元素
        console.log(`🔺 最终几何元素 ${index + 1}:`, {
          id: element.id,
          position: element.transform,
          hasMaskRegion: !!element.maskRegion,
          maskShape: element.maskRegion.shape
        });
        
        elements.push(element);
      }
    });
  }

  /**
   * 生成自由形状布局元素
   */
  private generateFreeformElements(suggestion: any, imageAnalyses: any[], canvas_config: any, effectiveWidth: number, effectiveHeight: number, elements: CollageElement[]): void {
    suggestion.suggestions.forEach((imgSuggestion: any, index: number) => {
      if (index < imageAnalyses.length) {
        const imageAnalysis = imageAnalyses[imgSuggestion.image_index || index];
        
        const actualX = canvas_config.padding + (imgSuggestion.position.x / 100) * effectiveWidth;
        const actualY = canvas_config.padding + (imgSuggestion.position.y / 100) * effectiveHeight;
        const actualWidth = (imgSuggestion.position.width / 100) * effectiveWidth;
        const actualHeight = (imgSuggestion.position.height / 100) * effectiveHeight;
        
        console.log(`🎨 生成自由形状图片元素 ${index + 1}:`, {
          position: { x: actualX, y: actualY, width: actualWidth, height: actualHeight },
          rotation: imgSuggestion.rotation,
          zIndex: imgSuggestion.z_index
        });
        
        const element = {
          id: `image-${index}`,
          type: 'image',
          zIndex: imgSuggestion.z_index || (index + 1),
          transform: {
            x: actualX,
            y: actualY,
            width: actualWidth,
            height: actualHeight,
            rotation: imgSuggestion.rotation || 0,
            scaleX: 1,
            scaleY: 1,
            flipX: false,
            flipY: false
          },
          style: {
            opacity: imgSuggestion.opacity || 1,
            borderRadius: 0
          },
          isLocked: false,
          isVisible: true,
          src: imageAnalysis.url,
          originalSrc: imageAnalysis.url,
          alt: `Image ${index + 1}`
        } as ImageElement;
        
        elements.push(element);
      }
    });
  }

  /**
   * 生成瀑布流布局元素
   */
  private generateMasonryElements(suggestion: any, imageAnalyses: any[], canvas_config: any, effectiveWidth: number, effectiveHeight: number, elements: CollageElement[]): void {
    suggestion.suggestions.forEach((imgSuggestion: any, index: number) => {
      if (index < imageAnalyses.length) {
        const imageAnalysis = imageAnalyses[imgSuggestion.image_index || index];
        
        const actualX = canvas_config.padding + (imgSuggestion.position.x / 100) * effectiveWidth;
        const actualY = canvas_config.padding + (imgSuggestion.position.y / 100) * effectiveHeight;
        const actualWidth = (imgSuggestion.position.width / 100) * effectiveWidth;
        const actualHeight = (imgSuggestion.position.height / 100) * effectiveHeight;
        
        console.log(`🧱 生成瀑布流图片元素 ${index + 1}:`, {
          position: { x: actualX, y: actualY, width: actualWidth, height: actualHeight }
        });
        
        const element = {
          id: `image-${index}`,
          type: 'image',
          zIndex: imgSuggestion.z_index || 1,
          transform: {
            x: actualX,
            y: actualY,
            width: actualWidth,
            height: actualHeight,
            rotation: imgSuggestion.rotation || 0,
            scaleX: 1,
            scaleY: 1,
            flipX: false,
            flipY: false
          },
          style: {
            opacity: 1,
            borderRadius: 0
          },
          isLocked: false,
          isVisible: true,
          src: imageAnalysis.url,
          originalSrc: imageAnalysis.url,
          alt: `Image ${index + 1}`
        } as ImageElement;
        
        elements.push(element);
      }
    });
  }

  /**
   * 生成通用AI布局元素 - 支持遮罩拼图模式
   */
  private generateGenericAIElements(suggestion: any, imageAnalyses: any[], canvas_config: any, effectiveWidth: number, effectiveHeight: number, elements: CollageElement[]): void {
    suggestion.suggestions.forEach((imgSuggestion: any, index: number) => {
      if (index < imageAnalyses.length) {
        const imageAnalysis = imageAnalyses[imgSuggestion.image_index || index];
        
        // 检查是否为遮罩模式
        if (imgSuggestion.mask_region && imgSuggestion.image_transform) {
          // 遮罩模式处理
          console.log(`🎭 生成遮罩拼图元素 ${index + 1}:`, {
            layoutType: suggestion.layout_type,
            maskRegion: imgSuggestion.mask_region,
            imageTransform: imgSuggestion.image_transform
          });
          
          const element = {
            id: `image-${index}`,
            type: 'image',
            zIndex: imgSuggestion.z_index || 1,
            // 保留transform字段用于兼容性，但主要使用maskRegion和imageTransform
            transform: {
              x: imgSuggestion.mask_region.position.x,
              y: imgSuggestion.mask_region.position.y,
              width: imgSuggestion.mask_region.position.width,
              height: imgSuggestion.mask_region.position.height,
              rotation: 0, // 遮罩区域不旋转
              scaleX: 1,
              scaleY: 1,
              flipX: false,
              flipY: false
            },
            style: {
              opacity: imgSuggestion.opacity || 1,
              borderRadius: imgSuggestion.borderRadius || 0
            },
            isLocked: false,
            isVisible: true,
            src: imageAnalysis.url,
            originalSrc: imageAnalysis.url,
            alt: `Image ${index + 1}`,
            // 遮罩模式专用字段
            maskRegion: {
              id: `mask-${index}`,
              shape: imgSuggestion.mask_region.shape,
              clipPath: imgSuggestion.mask_region.clip_path,
              position: imgSuggestion.mask_region.position
            },
            imageTransform: {
              position: imgSuggestion.image_transform.position,
              scale: imgSuggestion.image_transform.scale,
              rotation: imgSuggestion.image_transform.rotation,
              anchor: { x: 0.5, y: 0.5 }
            }
          } as ImageElement;
          
          elements.push(element);
        } else if (imgSuggestion.position) {
          // 传统模式处理（向后兼容）
          const actualX = canvas_config.padding + (imgSuggestion.position.x / 100) * effectiveWidth;
          const actualY = canvas_config.padding + (imgSuggestion.position.y / 100) * effectiveHeight;
          const actualWidth = (imgSuggestion.position.width / 100) * effectiveWidth;
          const actualHeight = (imgSuggestion.position.height / 100) * effectiveHeight;
          
          console.log(`📋 生成传统AI图片元素 ${index + 1}:`, {
            layoutType: suggestion.layout_type,
            position: { x: actualX, y: actualY, width: actualWidth, height: actualHeight },
            rotation: imgSuggestion.rotation,
            clipPath: imgSuggestion.clip_path
          });
          
          // 为传统模式创建默认的遮罩区域和图片变换
          const defaultMaskRegion = {
            id: `mask-${index}`,
            shape: 'rectangle' as const,
            clipPath: imgSuggestion.clip_path || 'none',
            position: {
              x: actualX,
              y: actualY,
              width: actualWidth,
              height: actualHeight
            }
          };
          
          const defaultImageTransform = {
            position: { x: 0, y: 0 },
            scale: 1,
            rotation: imgSuggestion.rotation || 0,
            anchor: { x: 0.5, y: 0.5 }
          };
          
          const element = {
            id: `image-${index}`,
            type: 'image' as const,
            zIndex: imgSuggestion.z_index || 1,
            transform: {
              x: actualX,
              y: actualY,
              width: actualWidth,
              height: actualHeight,
              rotation: imgSuggestion.rotation || 0,
              scaleX: 1,
              scaleY: 1,
              flipX: false,
              flipY: false
            },
            style: {
              opacity: imgSuggestion.opacity || 1,
              borderRadius: imgSuggestion.borderRadius || 0
            },
            isLocked: false,
            isVisible: true,
            src: imageAnalysis.url,
            originalSrc: imageAnalysis.url,
            alt: `Image ${index + 1}`,
            // 传统模式也需要这些字段（用默认值）
            maskRegion: defaultMaskRegion,
            imageTransform: defaultImageTransform
          } as ImageElement;
          
          elements.push(element);
        } else {
          console.warn(`⚠️  图片建议 ${index + 1} 缺少位置信息:`, imgSuggestion);
        }
      }
    });
  }

  /**
   * 生成紧急默认布局
   */
  private generateDefaultGridLayout(imageAnalyses: any[], canvas_config: any, effectiveWidth: number, effectiveHeight: number, elements: CollageElement[]): void {
    const cols = Math.ceil(Math.sqrt(imageAnalyses.length));
    const rows = Math.ceil(imageAnalyses.length / cols);
    const gridGap = 10;
    
    const totalHorizontalGaps = (cols - 1) * gridGap;
    const totalVerticalGaps = (rows - 1) * gridGap;
    
    const cellWidth = (effectiveWidth - totalHorizontalGaps) / cols;
    const cellHeight = (effectiveHeight - totalVerticalGaps) / rows;
    
    console.log('🚨 紧急默认布局参数:', {
      gridSize: `${rows}x${cols}`,
      cellSize: `${cellWidth}x${cellHeight}`,
      gridGap
    });
    
    imageAnalyses.forEach((imageAnalysis, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      const x = canvas_config.padding + col * (cellWidth + gridGap);
      const y = canvas_config.padding + row * (cellHeight + gridGap);
      
      // 为默认布局创建遮罩区域和图片变换
      const defaultMaskRegion = {
        id: `mask-${index}`,
        shape: 'rectangle' as const,
        clipPath: 'none',
        position: { x, y, width: cellWidth, height: cellHeight }
      };
      
      const defaultImageTransform = {
        position: { x: 0, y: 0 },
        scale: 1,
        rotation: 0,
        anchor: { x: 0.5, y: 0.5 }
      };
      
      elements.push({
        id: `image-${index}`,
        type: 'image',
        zIndex: 1,
        transform: {
          x: x,
          y: y,
          width: cellWidth,
          height: cellHeight,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          flipX: false,
          flipY: false
        },
        style: {
          opacity: 1,
          borderRadius: 0
        },
        isLocked: false,
        isVisible: true,
        src: imageAnalysis.url,
        originalSrc: imageAnalysis.url,
        alt: `Image ${index + 1}`,
        // 添加必需的遮罩字段
        maskRegion: defaultMaskRegion,
        imageTransform: defaultImageTransform
      } as ImageElement);
    });
  }
}

// 数据库模型转业务模型
function transformDbCollageToCollage(dbCollage: any): any {
  return {
    id: dbCollage.id,
    uuid: dbCollage.uuid,
    user_id: dbCollage.userId || undefined,
    session_id: dbCollage.sessionId || undefined,
    title: dbCollage.title || undefined,
    description: dbCollage.description || undefined,
    
    // 默认值用于必需字段
    canvas_config: dbCollage.canvasConfig || { 
      width: 800, 
      height: 600, 
      aspectRatio: '4:3', 
      backgroundColor: '#ffffff', 
      padding: 20 
    },
    elements: Array.isArray(dbCollage.elements) ? dbCollage.elements : [],
    metadata: dbCollage.metadata || { 
      aiAnalysis: {
        processingTime: 0,
        model: '',
        confidence: 0,
        recommendations: [],
        colorPalette: [],
        theme: '',
        mood: ''
      },
      performance: {}
    },
    
    template_id: dbCollage.templateId || undefined,
    generated_style: dbCollage.generatedStyle || undefined,
    user_preferences: dbCollage.userPreferences || undefined,
    
    thumbnail_url: dbCollage.thumbnailUrl || undefined,
    preview_url: dbCollage.previewUrl || undefined,
    full_image_url: dbCollage.fullImageUrl || undefined,
    
    ai_model: dbCollage.aiModel || undefined,
    ai_processing_time: dbCollage.aiProcessingTime || undefined,
    credits_used: dbCollage.creditsUsed || 0,
    
    status: dbCollage.status as any || 'draft',
    generation_status: dbCollage.generationStatus as any || 'pending',
    
    visibility: dbCollage.visibility as any || 'private',
    is_featured: dbCollage.isFeatured || false,
    download_count: dbCollage.downloadCount || 0,
    view_count: dbCollage.viewCount || 0,
    
    version: dbCollage.version || 1,
    parent_collage_id: dbCollage.parentCollageId || undefined,
    
    started_at: dbCollage.startedAt?.toISOString() || dbCollage.createdAt.toISOString(),
    completed_at: dbCollage.completedAt?.toISOString() || undefined,
    last_edited_at: dbCollage.lastEditedAt?.toISOString() || dbCollage.updatedAt.toISOString(),
    created_at: dbCollage.createdAt.toISOString(),
    updated_at: dbCollage.updatedAt.toISOString(),
  };
}

export const collageService = new CollageService();