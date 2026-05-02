import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/utils/userResolver';
import { generateInviteLink, checkCanCreateInvite } from '@/lib/services/invitationService';

// 生成邀请链接
export async function POST(req: NextRequest) {
  try {
    const { clerkUserId } = await requireAuth();

    // 检查是否可以创建邀请（使用 Clerk ID）
    const canCreateResult = await checkCanCreateInvite(clerkUserId);
    if (!canCreateResult.canCreate) {
      return NextResponse.json(
        { error: canCreateResult.reason || '无法创建邀请' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { email, method, custom_reward } = body;

    const result = await generateInviteLink({
      inviterId: clerkUserId, // 传递 Clerk ID
      email,
      method: method || 'link',
      customReward: custom_reward
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.message || '生成邀请链接失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      invitation: result.invitation,
      invite_url: result.inviteUrl
    });

  } catch (error) {
    console.error('Generate invite link failed:', error);
    return NextResponse.json(
      { error: '生成邀请链接失败' },
      { status: 500 }
    );
  }
}
