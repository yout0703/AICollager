import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { AIStatsService } from '@/lib/services/aiStatsService';
import { AICacheService } from '@/lib/services/aiCacheService';

// AI统计信息API
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    // 这个API需要管理员权限或用户只能查看今日统计
    // 暂时简化，所有用户都可以查看今日统计
    
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'today'; // today, history, cache, summary
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const days = parseInt(searchParams.get('days') || '7');
    
    switch (type) {
      case 'today':
        const todayStats = await AIStatsService.getTodayStatistics();
        return NextResponse.json({
          success: true,
          type: 'today',
          data: todayStats
        });
        
      case 'history':
        if (!startDate || !endDate) {
          return NextResponse.json(
            { error: '历史统计需要提供开始和结束日期' },
            { status: 400 }
          );
        }
        
        const historyStats = await AIStatsService.getHistoryStatistics({
          startDate,
          endDate
        });
        
        return NextResponse.json({
          success: true,
          type: 'history',
          data: historyStats
        });
        
      case 'cache':
        const cacheStats = await AICacheService.getCacheStatistics();
        const cacheHealth = await AICacheService.checkCacheHealth();
        
        return NextResponse.json({
          success: true,
          type: 'cache',
          data: {
            statistics: cacheStats,
            health: cacheHealth
          }
        });
        
      case 'summary':
        const globalSummary = await AIStatsService.getGlobalSummary(days);
        const costAnalysis = await AIStatsService.getCostAnalysis(days);
        
        return NextResponse.json({
          success: true,
          type: 'summary',
          data: {
            global_summary: globalSummary,
            cost_analysis: costAnalysis
          }
        });
        
      default:
        return NextResponse.json(
          { error: '不支持的统计类型' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Get AI stats failed:', error);
    return NextResponse.json(
      { error: '获取统计信息失败' },
      { status: 500 }
    );
  }
}

// 管理员功能：生成统计报告
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }
    
    // TODO: 添加管理员权限检查
    // const isAdmin = await checkAdminPermission(userId);
    // if (!isAdmin) {
    //   return NextResponse.json({ error: '权限不足' }, { status: 403 });
    // }
    
    const body = await req.json();
    const { start_date, end_date, include_details = false } = body;
    
    if (!start_date || !end_date) {
      return NextResponse.json(
        { error: '请提供开始和结束日期' },
        { status: 400 }
      );
    }
    
    const report = await AIStatsService.generateReport({
      startDate: start_date,
      endDate: end_date,
      includeDetails: include_details
    });
    
    return NextResponse.json(report);
    
  } catch (error) {
    console.error('Generate AI stats report failed:', error);
    return NextResponse.json(
      { error: '生成统计报告失败' },
      { status: 500 }
    );
  }
} 