import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { registerUser, getUserInfo, initializeUserSettings } from '@/services/userService';

// 用户初始化设置
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }
    
    // 获取Clerk用户信息
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json(
        { error: '获取用户信息失败' },
        { status: 400 }
      );
    }
    
    // 检查用户是否已存在
    let user = await getUserInfo(userId, 'clerk_id');
    
    if (!user) {
      // 用户不存在，创建新用户
      const body = await req.json();
      const { invited_by_code, language, timezone } = body;
      
      const registrationResult = await registerUser({
        clerk_user_id: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        username: clerkUser.username || '',
        display_name: clerkUser.firstName && clerkUser.lastName 
          ? `${clerkUser.firstName} ${clerkUser.lastName}` 
          : clerkUser.username || '',
        avatar_url: clerkUser.imageUrl || '',
        invited_by_code
      });
      
      // 注册后更新用户设置
      if (language || timezone) {
        await initializeUserSettings(registrationResult.user.uuid, {
          language: language || 'zh-CN',
          timezone: timezone || 'Asia/Shanghai'
        });
      }
      
      return NextResponse.json({
        success: true,
        user: registrationResult.user,
        invitation_reward: registrationResult.invitationReward,
        is_new_user: true
      });
      
    } else {
      // 用户已存在，更新设置
      const body = await req.json();
      const { language, timezone, email_notifications } = body;
      
      const settingsUpdated = await initializeUserSettings(user.uuid, {
        language,
        timezone,
        email_notifications
      });
      
      if (!settingsUpdated) {
        return NextResponse.json(
          { error: '更新设置失败' },
          { status: 500 }
        );
      }
      
      // 获取更新后的用户信息
      const updatedUser = await getUserInfo(user.uuid);
      
      return NextResponse.json({
        success: true,
        user: updatedUser,
        is_new_user: false
      });
    }
    
  } catch (error) {
    console.error('User setup failed:', error);
    return NextResponse.json(
      { error: '用户初始化失败' },
      { status: 500 }
    );
  }
}

// 检查用户是否需要初始化
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
    
    return NextResponse.json({
      needs_setup: !user,
      user: user ? {
        uuid: user.uuid,
        email: user.email,
        username: user.username,
        display_name: user.display_name,
        language: user.language,
        timezone: user.timezone
      } : null
    });
    
  } catch (error) {
    console.error('Check user setup failed:', error);
    return NextResponse.json(
      { error: '检查用户状态失败' },
      { status: 500 }
    );
  }
} 