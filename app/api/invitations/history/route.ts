import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserInfo } from '@/services/userService';
import { getUserInviteHistory } from '@/services/invitationService';

// 获取用户邀请历史
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
    
    const result = await getUserInviteHistory(userId, {
      limit,
      offset
    });
    
    if (!result.success) {
      return NextResponse.json(
        { error: '获取邀请历史失败' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      invitations: result.invitations,
      stats: result.stats,
      limit,
      offset
    });
    
  } catch (error) {
    console.error('Get invite history failed:', error);
    return NextResponse.json(
      { error: '获取邀请历史失败' },
      { status: 500 }
    );
  }
} 