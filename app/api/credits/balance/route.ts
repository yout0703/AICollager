import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserInfo } from '@/services/userService';
import { getUserBalance } from '@/services/creditService';

// 查询用户积分余额
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
    
    const balanceResult = await getUserBalance(user.uuid);
    
    if (!balanceResult.success) {
      return NextResponse.json(
        { error: '获取积分余额失败' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      balance: balanceResult.balance,
      user_uuid: user.uuid
    });
    
  } catch (error) {
    console.error('Get credits balance failed:', error);
    return NextResponse.json(
      { error: '获取积分余额失败' },
      { status: 500 }
    );
  }
} 