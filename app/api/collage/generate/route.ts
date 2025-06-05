import { NextRequest, NextResponse } from 'next/server';
import { resolveUser } from '@/lib/utils/userResolver';
import { CollageService, CollageGenerationRequest } from '@/lib/services/collageService';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let requestId = `req_${startTime}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`[${requestId}] 🚀 开始处理拼图生成请求`);
    
    const userInfo = await resolveUser();
    console.log(`[${requestId}] 👤 用户认证: ${userInfo ? '已登录' : '未登录'}`);
    
    // 解析请求数据
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const preferences = formData.get('preferences') ? 
      JSON.parse(formData.get('preferences') as string) : undefined;
    
    console.log(`[${requestId}] 📊 请求数据: 图片数量=${files.length}, 标题=${title || '无'}`);
    
    // 验证输入
    if (!files || files.length === 0) {
      console.warn(`[${requestId}] ⚠️ 验证失败: 没有上传图片`);
      return NextResponse.json(
        { 
          success: false,
          error: '请上传至少一张图片' 
        },
        { status: 400 }
      );
    }
    
    if (files.length > 10) {
      console.warn(`[${requestId}] ⚠️ 验证失败: 图片数量超限 (${files.length})`);
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
        console.warn(`[${requestId}] ⚠️ 验证失败: 非图片文件 ${file.type}`);
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
        console.warn(`[${requestId}] ⚠️ 验证失败: 文件过大 ${(file.size / 1024 / 1024).toFixed(2)}MB`);
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
      user_id: userInfo?.userId || undefined,
      session_id: userInfo ? undefined : generateSessionId(request),
      title: title || undefined,
      description: description || undefined,
      images: files,
      preferences: preferences
    };

    console.log(`[${requestId}] 🎨 开始拼图生成...`);

    // 调用拼图服务
    const collageService = new CollageService();
    const result = await collageService.generateCollage(collageRequest);

    if (!result.success) {
      console.error(`[${requestId}] ❌ 拼图生成失败:`, result.error);
      return NextResponse.json(
        { 
          success: false,
          error: result.error
        },
        { status: 400 }
      );
    }

    const duration = Date.now() - startTime;
    console.log(`[${requestId}] ✅ 拼图生成成功: ${result.collage?.uuid} (耗时: ${duration}ms)`);

    return NextResponse.json({
      success: true,
      collage: result.collage,
      remainingCredits: result.remainingCredits,
      remainingUsage: result.remainingUsage
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${requestId}] 💥 拼图生成API错误 (耗时: ${duration}ms):`, {
      error: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    
    return NextResponse.json(
      { 
        success: false,
        error: '服务器内部错误',
        requestId: requestId,
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
    console.error('获取精选拼图错误:', {
      error: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        success: false,
        error: '获取精选拼图失败' 
      },
      { status: 500 }
    );
  }
} 