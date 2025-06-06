import { collageImageModel } from '@/lib/repositories/collageImage';
import { analyzeImages } from '@/lib/services/aiAnalysisService';

export interface ImageAnalysisResult {
  index: number;
  url: string;
  analysis: any;
}

export class CollageImageService {
  /**
   * 分析上传的图片
   */
  async analyzeImages(collageId: string, images: File[]): Promise<ImageAnalysisResult[]> {
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
          collageId: collageId,
          imageIndex: i,
          originalUrl: imageUrl,
          fileName: image.name,
          fileSize: image.size,
          mimeType: image.type
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
   * 上传图片到 Cloudflare R2（带MD5去重）
   */
  async uploadImageToR2(image: File): Promise<string> {
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
  async fileToBuffer(file: File): Promise<Buffer> {
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

export const collageImageService = new CollageImageService(); 