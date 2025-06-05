import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/utils/userResolver';
import { getUserTransactionHistory, getUserCreditStats } from '@/lib/services/creditService';

// 获取用户积分交易历史
export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type') as any;
    const includeStats = searchParams.get('include_stats') === 'true';
    
    const historyResult = await getUserTransactionHistory(userId, {
      limit,
      offset,
      type
    });
    
    if (!historyResult.success) {
      return NextResponse.json(
        { error: '获取交易历史失败' },
        { status: 500 }
      );
    }
    
    const response: any = {
      success: true,
      transactions: historyResult.transactions,
      total: historyResult.total,
      limit,
      offset
    };
    
    // 如果需要统计信息
    if (includeStats) {
      const statsResult = await getUserCreditStats(userId);
      if (statsResult.success) {
        response.stats = {
          currentBalance: statsResult.currentBalance,
          totalEarned: statsResult.totalEarned,
          totalSpent: statsResult.totalSpent,
          transactionCount: statsResult.transactionCount
        };
      }
    }
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Get credit transactions failed:', error);
    return NextResponse.json(
      { error: '获取交易历史失败' },
      { status: 500 }
    );
  }
} 