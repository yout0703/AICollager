import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/utils/userResolver';
import { getUserInviteHistory } from '@/lib/services/invitationService';

// 获取用户邀请历史
export async function GET(req: NextRequest) {
  try {
    const { clerkUserId } = await requireAuth();
    
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    const result = await getUserInviteHistory(clerkUserId, {
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