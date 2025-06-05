import { NextRequest, NextResponse } from 'next/server';
import { validateInviteCode, handleInviteClick, getInviteDetails } from '@/lib/services/invitationService';

// 验证邀请码
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code: inviteCode } = await params;
    
    if (!inviteCode) {
      return NextResponse.json(
        { error: '邀请码不能为空' },
        { status: 400 }
      );
    }
    
    const result = await getInviteDetails(inviteCode);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message || '邀请码无效' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      invitation: result.invitation,
      inviter_name: result.inviterName
    });
    
  } catch (error) {
    console.error('Validate invite code failed:', error);
    return NextResponse.json(
      { error: '验证邀请码失败' },
      { status: 500 }
    );
  }
}

// 处理邀请点击
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code: inviteCode } = await params;
    
    if (!inviteCode) {
      return NextResponse.json(
        { error: '邀请码不能为空' },
        { status: 400 }
      );
    }
    
    const result = await handleInviteClick(inviteCode);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message || '处理邀请点击失败' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      invitation: result.invitation
    });
    
  } catch (error) {
    console.error('Handle invite click failed:', error);
    return NextResponse.json(
      { error: '处理邀请点击失败' },
      { status: 500 }
    );
  }
} 