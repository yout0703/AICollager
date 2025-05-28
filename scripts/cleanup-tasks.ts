import { cleanupExpiredSessions } from '@/models/session';
import { cleanupExpiredInvitations } from '@/models/invitation';
import { AICacheService } from '@/services/aiCacheService';
import { AIStatsService } from '@/services/aiStatsService';

// 清理过期会话、邀请和AI相关数据的定期任务
export async function runCleanupTasks(): Promise<{
  expiredSessions: number;
  expiredInvitations: number;
  expiredAICaches: number;
  lowUsageAICaches: number;
  oldAIStats: number;
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
    
    // 清理过期AI缓存
    const aiCacheCleanup = await AICacheService.cleanupExpiredCaches();
    const expiredAICaches = aiCacheCleanup.cleaned_count;
    console.log(`清理了 ${expiredAICaches} 个过期AI缓存`);
    
    // 清理低使用率AI缓存
    const lowUsageCacheCleanup = await AICacheService.cleanupLowUsageCaches(1);
    const lowUsageAICaches = lowUsageCacheCleanup.cleaned_count;
    console.log(`清理了 ${lowUsageAICaches} 个低使用率AI缓存`);
    
    // 清理旧AI统计数据（保留90天）
    const aiStatsCleanup = await AIStatsService.cleanupOldStatistics(90);
    const oldAIStats = aiStatsCleanup.cleaned_count;
    console.log(`清理了 ${oldAIStats} 条旧AI统计记录`);
    
    console.log('清理任务完成');
    
    return {
      expiredSessions,
      expiredInvitations,
      expiredAICaches,
      lowUsageAICaches,
      oldAIStats,
      success: true
    };
    
  } catch (error) {
    console.error('清理任务失败:', error);
    return {
      expiredSessions: 0,
      expiredInvitations: 0,
      expiredAICaches: 0,
      lowUsageAICaches: 0,
      oldAIStats: 0,
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