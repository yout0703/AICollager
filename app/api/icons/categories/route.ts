import { NextRequest, NextResponse } from 'next/server';
import { IconService } from '@/services/iconService';

// 获取Icon分类列表
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeCount = searchParams.get('include_count') === 'true';
    const treeStructure = searchParams.get('tree_structure') === 'true';
    
    const categories = await IconService.getCategories({
      include_count: includeCount,
      tree_structure: treeStructure
    });
    
    return NextResponse.json({
      success: true,
      categories,
      total: Array.isArray(categories) ? categories.length : 0
    });
    
  } catch (error) {
    console.error('Get icon categories failed:', error);
    return NextResponse.json(
      { error: '获取图标分类失败' },
      { status: 500 }
    );
  }
} 