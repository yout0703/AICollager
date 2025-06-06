import { suggestLayout } from '@/lib/services/aiAnalysisService';
import { IconService } from '@/lib/services/iconService';
import { CollageElement, ImageElement, IconElement, CanvasConfig } from '@/types/collage';
import type { ImageAnalysisResult } from './collageImageService';

export interface LayoutGenerationResult {
  canvas_config: CanvasConfig;
  elements: CollageElement[];
}

export class CollageLayoutService {
  /**
   * 生成拼图布局
   */
  async generateLayout(imageAnalyses: ImageAnalysisResult[], preferences?: any): Promise<any> {
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
  async recommendIcons(imageAnalyses: ImageAnalysisResult[], theme?: string): Promise<any[]> {
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
  async generateFinalCollageData(
    layoutResult: any,
    iconRecommendations: any[],
    imageAnalyses: ImageAnalysisResult[]
  ): Promise<LayoutGenerationResult> {
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
   * 生成通用AI布局元素 - 支持遮罩拼图模式
   */
  private generateGenericAIElements(suggestion: any, imageAnalyses: ImageAnalysisResult[], canvas_config: any, effectiveWidth: number, effectiveHeight: number, elements: CollageElement[]): void {
    suggestion.suggestions.forEach((imgSuggestion: any, index: number) => {
      if (index < imageAnalyses.length) {
        const imageAnalysis = imageAnalyses[imgSuggestion.imageIndex || index];
        
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
  private generateDefaultGridLayout(imageAnalyses: ImageAnalysisResult[], canvas_config: any, effectiveWidth: number, effectiveHeight: number, elements: CollageElement[]): void {
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

export const collageLayoutService = new CollageLayoutService(); 