import { NextRequest, NextResponse } from 'next/server';
import { resolveUser } from '@/lib/utils/userResolver';
import { getUsageLimitInfo } from '@/lib/services/dailyLimitService';

// 检查AI使用限制API
export async function GET(req: NextRequest) {
  try {
    const userInfo = await resolveUser();
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');
    
    // 获取使用限制信息
    const limitInfo = await getUsageLimitInfo(
      userInfo?.userId,
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