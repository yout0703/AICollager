import { NextRequest, NextResponse } from 'next/server';
import { validateR2Config, uploadBufferToR2WithDedup, checkR2PublicAccess, getAccessibleR2Url } from '@/lib/storage';

/**
 * 测试 Cloudflare R2 配置
 */
export async function GET(req: NextRequest) {
  try {
    // 验证 R2 配置
    const isValid = validateR2Config();
    
    if (!isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: '缺少必要的 R2 配置环境变量',
          required: [
            'R2_ACCOUNT_ID',
            'R2_ACCESS_KEY_ID',
            'R2_SECRET_ACCESS_KEY',
            'R2_BUCKET_NAME'
          ]
        },
        { status: 400 }
      );
    }

    // 检查配置值
    const config = {
      hasAccountId: !!process.env.R2_ACCOUNT_ID,
      hasAccessKey: !!process.env.R2_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.R2_SECRET_ACCESS_KEY,
      hasBucketName: !!process.env.R2_BUCKET_NAME,
      hasPublicUrl: !!process.env.R2_PUBLIC_URL,
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      bucketName: process.env.R2_BUCKET_NAME,
      publicUrl: process.env.R2_PUBLIC_URL || `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev`
    };

    return NextResponse.json({
      success: true,
      message: 'R2 配置验证成功',
      config
    });

  } catch (error) {
    console.error('R2 配置测试失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '未知错误' 
      },
      { status: 500 }
    );
  }
}

/**
 * 测试 R2 上传和公开访问
 */
export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json();
    
    if (action === 'test-upload') {
      // 创建一个小的测试图片 Buffer
      const testImageBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        'base64'
      );
      
      const bucketName = process.env.R2_BUCKET_NAME!;
      
      // 上传测试文件
      const uploadResult = await uploadBufferToR2WithDedup(
        testImageBuffer,
        bucketName,
        'image/png',
        'test'
      );
      
      // 检查公开访问
      const accessResult = await checkR2PublicAccess(uploadResult.Key);
      
      // 测试智能访问
      const smartAccessResult = await getAccessibleR2Url(uploadResult.Key);
      
      return NextResponse.json({
        success: true,
        message: '上传和访问测试完成',
        upload: {
          url: uploadResult.Location,
          key: uploadResult.Key,
          isExisting: uploadResult.isExisting
        },
        publicAccess: accessResult,
        smartAccess: smartAccessResult
      });
    }
    
    return NextResponse.json(
      { error: '不支持的操作' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('R2 上传测试失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '未知错误' 
      },
      { status: 500 }
    );
  }
} 