import { NextRequest, NextResponse } from 'next/server';
import { IconService } from '@/lib/services/iconService';
import { IconSearchRequest } from '@/types/icons';

// Icon搜索API
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // 解析搜索参数
    const searchRequest: IconSearchRequest = {
      query: searchParams.get('query') || undefined,
      category_id: searchParams.get('category_id') || undefined,
      style: (searchParams.get('style') as any) || undefined,
      tags: searchParams.get('tags') ? searchParams.get('tags')!.split(',') : undefined,
      is_premium: searchParams.get('is_premium') ? searchParams.get('is_premium') === 'true' : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
    };
    
    // 执行搜索
    const result = await IconService.searchIcons(searchRequest);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Icon搜索失败' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      icons: result.icons,
      total: result.total,
      suggestions: result.suggestions,
      categories: result.categories,
      pagination: {
        limit: searchRequest.limit,
        offset: searchRequest.offset,
        has_more: (result.total || 0) > (searchRequest.offset || 0) + (searchRequest.limit || 20)
      }
    });
    
  } catch (error) {
    console.error('Icon search API failed:', error);
    return NextResponse.json(
      { error: '搜索服务暂时不可用' },
      { status: 500 }
    );
  }
}

// 按分类获取Icons
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category_id, style, is_premium, limit = 20, offset = 0 } = body;
    
    if (!category_id) {
      return NextResponse.json(
        { error: '请提供分类ID' },
        { status: 400 }
      );
    }
    
    const result = await IconService.getIconsByCategory(category_id, {
      style,
      is_premium,
      limit,
      offset
    });
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || '获取分类图标失败' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      icons: result.icons,
      total: result.total,
      category: result.category,
      pagination: {
        limit,
        offset,
        has_more: (result.total || 0) > offset + limit
      }
    });
    
  } catch (error) {
    console.error('Get icons by category failed:', error);
    return NextResponse.json(
      { error: '获取分类图标失败' },
      { status: 500 }
    );
  }
} 