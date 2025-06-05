import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/utils/userResolver';
import { IconService } from '@/lib/services/iconService';
import { checkUserPermission } from '@/lib/services/userService';

// 获取Icon统计信息
export async function GET(req: NextRequest) {
  try {
    const { clerkUserId } = await requireAuth();
    
    // 检查管理员权限（使用 Clerk ID）
    const hasPermission = await checkUserPermission(clerkUserId, 'admin');
    if (!hasPermission) {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      );
    }
    
    const result = await IconService.getStatistics();
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || '获取统计信息失败' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      icon_stats: result.icon_stats,
      category_stats: result.category_stats
    });
    
  } catch (error) {
    console.error('Get icon statistics failed:', error);
    return NextResponse.json(
      { error: '获取统计信息失败' },
      { status: 500 }
    );
  }
}

// 批量导入Icons
export async function POST(req: NextRequest) {
  try {
    const { clerkUserId } = await requireAuth();
    
    // 检查管理员权限（使用 Clerk ID）
    const hasPermission = await checkUserPermission(clerkUserId, 'admin');
    if (!hasPermission) {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    const { icons, action } = body;
    
    if (action === 'import' && Array.isArray(icons)) {
      // 批量导入Icons
      const result = await IconService.batchImportIcons(icons);
      
      return NextResponse.json({
        success: result.success,
        imported_count: result.imported_count,
        skipped_count: result.skipped_count,
        error_count: result.error_count,
        errors: result.errors,
        message: `导入完成: 成功 ${result.imported_count}, 跳过 ${result.skipped_count}, 失败 ${result.error_count}`
      });
      
    } else {
      return NextResponse.json(
        { error: '无效的操作或数据格式' },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error('Icon admin operation failed:', error);
    return NextResponse.json(
      { error: '操作失败' },
      { status: 500 }
    );
  }
} 