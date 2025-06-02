import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { registerUser, getUserInfo, initializeUserSettings } from '@/services/userService';

// 用户初始化设置
export async function POST(req: NextRequest) {
  console.log('🔄 [AUTH_SETUP] POST 请求开始');
  
  try {
    const { userId } = await auth();
    console.log('🔍 [AUTH_SETUP] 获取到的 userId:', userId);
    
    if (!userId) {
      console.log('❌ [AUTH_SETUP] 用户未登录');
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }
    
    // 获取Clerk用户信息
    console.log('🔍 [AUTH_SETUP] 开始获取 Clerk 用户信息');
    const clerkUser = await currentUser();
    console.log('🔍 [AUTH_SETUP] Clerk 用户信息:', {
      id: clerkUser?.id,
      email: clerkUser?.emailAddresses?.[0]?.emailAddress,
      username: clerkUser?.username,
      firstName: clerkUser?.firstName,
      lastName: clerkUser?.lastName
    });
    
    if (!clerkUser) {
      console.log('❌ [AUTH_SETUP] 获取 Clerk 用户信息失败');
      return NextResponse.json(
        { error: '获取用户信息失败' },
        { status: 400 }
      );
    }
    
    // 检查用户是否已存在
    console.log('🔍 [AUTH_SETUP] 检查用户是否已存在');
    let user = await getUserInfo(userId, 'clerk_id');
    console.log('🔍 [AUTH_SETUP] 数据库中的用户信息:', user ? { uuid: user.uuid, email: user.email } : '用户不存在');
    
    if (!user) {
      // 用户不存在，创建新用户
      console.log('🆕 [AUTH_SETUP] 用户不存在，开始创建新用户');
      const body = await req.json();
      console.log('🔍 [AUTH_SETUP] 请求体:', body);
      const { invited_by_code, language, timezone } = body;
      
      const registrationData = {
        clerk_user_id: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        username: clerkUser.username || '',
        display_name: clerkUser.firstName && clerkUser.lastName 
          ? `${clerkUser.firstName} ${clerkUser.lastName}` 
          : clerkUser.username || '',
        avatar_url: clerkUser.imageUrl || '',
        invited_by_code
      };
      console.log('🔍 [AUTH_SETUP] 注册数据:', registrationData);
      
      const registrationResult = await registerUser(registrationData);
      console.log('✅ [AUTH_SETUP] 用户注册成功:', { uuid: registrationResult.user.uuid });
      
      // 注册后更新用户设置
      if (language || timezone) {
        console.log('🔍 [AUTH_SETUP] 开始初始化用户设置');
        await initializeUserSettings(registrationResult.user.uuid, {
          language: language || 'zh-CN',
          timezone: timezone || 'Asia/Shanghai'
        });
        console.log('✅ [AUTH_SETUP] 用户设置初始化完成');
      }
      
      console.log('✅ [AUTH_SETUP] 新用户创建流程完成');
      return NextResponse.json({
        success: true,
        user: registrationResult.user,
        invitation_reward: registrationResult.invitationReward,
        is_new_user: true
      });
      
    } else {
      // 用户已存在，更新设置
      console.log('🔄 [AUTH_SETUP] 用户已存在，更新设置');
      const body = await req.json();
      const { language, timezone, email_notifications } = body;
      console.log('🔍 [AUTH_SETUP] 更新设置数据:', { language, timezone, email_notifications });
      
      const settingsUpdated = await initializeUserSettings(user.uuid, {
        language,
        timezone,
        email_notifications
      });
      
      if (!settingsUpdated) {
        console.log('❌ [AUTH_SETUP] 更新设置失败');
        return NextResponse.json(
          { error: '更新设置失败' },
          { status: 500 }
        );
      }
      
      // 获取更新后的用户信息
      const updatedUser = await getUserInfo(user.uuid);
      console.log('✅ [AUTH_SETUP] 用户设置更新完成');
      
      return NextResponse.json({
        success: true,
        user: updatedUser,
        is_new_user: false
      });
    }
    
  } catch (error) {
    console.error('❌ [AUTH_SETUP] 用户初始化失败:', error);
    console.error('❌ [AUTH_SETUP] 错误堆栈:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('❌ [AUTH_SETUP] 错误详情:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      cause: error instanceof Error ? error.cause : undefined
    });
    
    return NextResponse.json(
      { 
        error: '用户初始化失败',
        details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : String(error) : undefined
      },
      { status: 500 }
    );
  }
}

// 检查用户是否需要初始化
export async function GET(req: NextRequest) {
  console.log('🔄 [AUTH_SETUP] GET 请求开始');
  
  try {
    const { userId } = await auth();
    console.log('🔍 [AUTH_SETUP] GET 获取到的 userId:', userId);
    
    if (!userId) {
      console.log('❌ [AUTH_SETUP] GET 用户未登录');
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }
    
    console.log('🔍 [AUTH_SETUP] GET 开始查询用户信息');
    const user = await getUserInfo(userId, 'clerk_id');
    console.log('🔍 [AUTH_SETUP] GET 查询结果:', user ? { uuid: user.uuid, needs_setup: false } : { needs_setup: true });
    
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
    console.error('❌ [AUTH_SETUP] GET 检查用户状态失败:', error);
    console.error('❌ [AUTH_SETUP] GET 错误堆栈:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        error: '检查用户状态失败',
        details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : String(error) : undefined
      },
      { status: 500 }
    );
  }
} 