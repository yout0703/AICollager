import { NextRequest, NextResponse } from 'next/server';
import { CollageService } from '@/lib/services/collageService';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sessionId = searchParams.get('sessionId');
    
    const collageService = new CollageService();
    
    if (userId) {
      // 登录用户：获取用户拼图历史
      const result = await collageService.getUserCollages(userId, page, limit);
      
      return NextResponse.json({
        success: true,
        ...result
      });
      
    } else if (sessionId) {
      // 未登录用户：获取会话拼图历史
      const collages = await collageService.getSessionCollages(sessionId);
      
      return NextResponse.json({
        success: true,
        collages,
        total: collages.length,
        page: 1,
        totalPages: 1
      });
      
    } else {
      return NextResponse.json(
        { error: '请提供用户ID或会话ID' },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error('获取拼图历史错误:', error);
    
    return NextResponse.json(
      { 
        error: '获取拼图历史失败',
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : '未知错误') : undefined
      },
      { status: 500 }
    );
  }
} 