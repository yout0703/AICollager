import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { checkUserPermission } from '@/lib/services/userService';
import { runCleanupTasks } from '@/scripts/cleanup-tasks';

// 手动触发清理任务（仅管理员）
export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const isAdmin = await checkUserPermission(userId, 'admin');
    if (!isAdmin) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const result = await runCleanupTasks();

    return NextResponse.json({
      success: result.success,
      data: {
        expired_sessions: result.expiredSessions,
        expired_invitations: result.expiredInvitations,
        expired_ai_caches: result.expiredAICaches,
        low_usage_ai_caches: result.lowUsageAICaches,
        old_ai_stats: result.oldAIStats
      },
      message: result.message || '清理任务完成'
    });
  } catch (error) {
    console.error('Manual cleanup failed:', error);
    return NextResponse.json(
      { error: '清理任务失败' },
      { status: 500 }
    );
  }
} 