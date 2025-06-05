import { NextRequest, NextResponse } from 'next/server';
import { CollageService } from '@/lib/services/collageService';
import { resolveUser } from '@/lib/utils/userResolver';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userInfo = await resolveUser();
    const { id: collageId } = await params;
    
    if (!collageId) {
      return NextResponse.json(
        { error: '拼图ID不能为空' },
        { status: 400 }
      );
    }
    
    const collageService = new CollageService();
    const result = await collageService.downloadCollage(collageId);
    
    return NextResponse.json({
      success: true,
      downloadUrl: result.url,
      filename: result.filename
    });
    
  } catch (error) {
    console.error('下载拼图错误:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('积分不足')) {
        return NextResponse.json(
          { error: '积分不足，无法下载高清图片' },
          { status: 402 } // Payment Required
        );
      }
      
      if (error.message.includes('无权')) {
        return NextResponse.json(
          { error: '无权下载此拼图' },
          { status: 403 }
        );
      }
      
      if (error.message.includes('不存在')) {
        return NextResponse.json(
          { error: '拼图不存在' },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: '下载拼图失败',
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : '未知错误') : undefined
      },
      { status: 500 }
    );
  }
} 