import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserInfo } from '@/services/userService';
import { getUsageLimitInfo } from '@/services/dailyLimitService';

// 检查AI使用限制API
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');
    
    // 获取使用限制信息
    const limitInfo = await getUsageLimitInfo(
      userId ? (await getUserInfo(userId, 'clerk_id'))?.uuid : undefined,
      sessionId || undefined
    );
    
    return NextResponse.json({
      success: true,
      limit_info: limitInfo
    });
    
  } catch (error) {
    console.error('Check AI limits failed:', error);
    return NextResponse.json(
      { error: '检查使用限制失败' },
      { status: 500 }
    );
  }
} 