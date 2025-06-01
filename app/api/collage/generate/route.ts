import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { CollageService, CollageGenerationRequest } from '@/services/collageService';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    // 解析请求数据
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const preferences = formData.get('preferences') ? 
      JSON.parse(formData.get('preferences') as string) : undefined;
    
    // 验证输入
    if (!files || files.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: '请上传至少一张图片' 
        },
        { status: 400 }
      );
    }
    
    if (files.length > 10) {
      return NextResponse.json(
        { 
          success: false,
          error: '最多只能上传10张图片' 
        },
        { status: 400 }
      );
    }

    // 验证文件类型和大小
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          { 
            success: false,
            error: '只能上传图片文件' 
          },
          { status: 400 }
        );
      }
      
      // 限制文件大小为10MB
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { 
            success: false,
            error: '单个图片文件不能超过10MB' 
          },
          { status: 400 }
        );
      }
    }

    // 构建拼图生成请求
    const collageRequest: CollageGenerationRequest = {
      user_id: userId || undefined,
      session_id: userId ? undefined : generateSessionId(request),
      title: title || undefined,
      description: description || undefined,
      images: files,
      preferences: preferences
    };

    console.log('🚀 开始真正的拼图生成流程...');
    console.log('📊 请求参数:', {
      userId: collageRequest.user_id,
      sessionId: collageRequest.session_id,
      imageCount: files.length,
      title: collageRequest.title,
      preferences: collageRequest.preferences
    });

    // 调用拼图服务
    const collageService = new CollageService();
    const result = await collageService.generateCollage(collageRequest);

    if (!result.success) {
      console.error('❌ 拼图生成失败:', result.error);
      return NextResponse.json(
        { 
          success: false,
          error: result.error
        },
        { status: 400 }
      );
    }

    console.log('✅ 拼图生成成功:', result.collage?.uuid);

    return NextResponse.json({
      success: true,
      collage: result.collage,
      remainingCredits: result.remainingCredits,
      remainingUsage: result.remainingUsage
    });
    
  } catch (error) {
    console.error('拼图生成API错误:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: '服务器内部错误',
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : '未知错误') : undefined
      },
      { status: 500 }
    );
  }
}

// 生成会话ID（用于未登录用户）
function generateSessionId(request: NextRequest): string {
  const ip = request.headers.get('x-forwarded-for') || 
            request.headers.get('x-real-ip') || 
            'unknown';
  const userAgent = request.headers.get('user-agent') || '';
  const timestamp = Date.now();
  
  // 简单的会话ID生成逻辑
  return `session_${timestamp}_${Buffer.from(ip + userAgent).toString('base64').substring(0, 10)}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '12');
  
  try {
    const collageService = new CollageService();
    const result = await collageService.getFeaturedCollages(limit);
    
    return NextResponse.json({
      success: true,
      collages: result
    });
    
  } catch (error) {
    console.error('获取精选拼图错误:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: '获取精选拼图失败' 
      },
      { status: 500 }
    );
  }
} 