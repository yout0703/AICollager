import { cleanupExpiredSessions } from '@/lib/repositories/session';
import { cleanupExpiredInvitations } from '@/lib/repositories/invitation';

// 清理过期会话与邀请的定期任务
export async function runCleanupTasks(): Promise<{
  expiredSessions: number;
  expiredInvitations: number;
  success: boolean;
  message?: string;
}> {
  try {
    console.log('开始执行清理任务...');

    // 清理过期会话
    const expiredSessions = await cleanupExpiredSessions();
    console.log(`清理了 ${expiredSessions} 个过期会话`);

    // 清理过期邀请
    const expiredInvitations = await cleanupExpiredInvitations();
    console.log(`清理了 ${expiredInvitations} 个过期邀请`);

    console.log('清理任务完成');

    return {
      expiredSessions,
      expiredInvitations,
      success: true
    };
  } catch (error) {
    console.error('清理任务失败:', error);
    return {
      expiredSessions: 0,
      expiredInvitations: 0,
      success: false,
      message: error instanceof Error ? error.message : '未知错误'
    };
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runCleanupTasks()
    .then((result) => {
      console.log('清理结果:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('脚本执行失败:', error);
      process.exit(1);
    });
}
