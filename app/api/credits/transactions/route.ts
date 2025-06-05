import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserInfo } from '@/lib/services/userService';
import { getUserTransactionHistory, getUserCreditStats } from '@/lib/services/creditService';

// 获取用户积分交易历史
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }
    
    const user = await getUserInfo(userId, 'clerk_id');
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }
    
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type') as any;
    const includeStats = searchParams.get('include_stats') === 'true';
    
    const historyResult = await getUserTransactionHistory(user.uuid, {
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
      const statsResult = await getUserCreditStats(user.uuid);
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