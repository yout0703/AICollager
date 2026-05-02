import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/utils/userResolver';
import { getUserBalance } from '@/lib/services/creditService';

// 查询用户积分余额
export async function GET() {
  try {
    const { userId } = await requireAuth();

    const balanceResult = await getUserBalance(userId);

    if (!balanceResult.success) {
      return NextResponse.json(
        { error: '获取积分余额失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      balance: balanceResult.balance,
      user_uuid: userId
    });

  } catch (error) {
    console.error('Get credits balance failed:', error);
    return NextResponse.json(
      { error: '获取积分余额失败' },
      { status: 500 }
    );
  }
}
