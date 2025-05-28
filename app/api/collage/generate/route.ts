import { NextRequest, NextResponse } from 'next/server';
import { CollageService, CollageGenerationRequest } from '@/services/collageService';
import { auth } from '@clerk/nextjs/server';

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
        { error: '请上传至少一张图片' },
        { status: 400 }
      );
    }
    
    if (files.length > 10) {
      return NextResponse.json(
        { error: '最多只能上传10张图片' },
        { status: 400 }
      );
    }
    
    // 生成会话ID（如果用户未登录）
    const sessionId = userId ? undefined : `session-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    
    // 准备拼图生成请求
    const collageRequest: CollageGenerationRequest = {
      user_id: userId || undefined,
      session_id: sessionId,
      images: files,
      title: title || undefined,
      description: description || undefined,
      preferences: preferences
    };
    
    // 创建CollageService实例并生成拼图
    const collageService = new CollageService();
    const result = await collageService.generateCollage(collageRequest);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
    
    // 返回成功结果
    return NextResponse.json({
      success: true,
      collage: result.collage,
      remainingCredits: result.remainingCredits,
      remainingUsage: result.remainingUsage,
      sessionId: sessionId // 返回给前端用于后续请求
    });
    
  } catch (error) {
    console.error('拼图生成API错误:', error);
    
    return NextResponse.json(
      { 
        error: '服务器内部错误',
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : '未知错误') : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '12');
  
  try {
    const collageService = new CollageService();
    const featuredCollages = await collageService.getFeaturedCollages(limit);
    
    return NextResponse.json({
      success: true,
      collages: featuredCollages
    });
    
  } catch (error) {
    console.error('获取精选拼图错误:', error);
    
    return NextResponse.json(
      { error: '获取精选拼图失败' },
      { status: 500 }
    );
  }
} 