import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserInfo } from '@/services/userService';
import { generateInviteLink, checkCanCreateInvite } from '@/services/invitationService';

// 生成邀请链接
export async function POST(req: NextRequest) {
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
    
    // 检查是否可以创建邀请
    const canCreateResult = await checkCanCreateInvite(user.uuid);
    if (!canCreateResult.canCreate) {
      return NextResponse.json(
        { error: canCreateResult.reason || '无法创建邀请' },
        { status: 400 }
      );
    }
    
    const body = await req.json();
    const { email, method, custom_reward } = body;
    
    const result = await generateInviteLink({
      inviterId: user.uuid,
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