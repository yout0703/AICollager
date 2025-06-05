import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/utils/userResolver';
import { updateUserInfo } from '@/lib/services/userService';

// 获取用户信息
export async function GET(req: NextRequest) {
  try {
    // 在边界处解析用户身份，后续业务逻辑只使用内部 UUID
    const { userId, user } = await requireAuth();
    
    // 注意：这里的 userId 已经是内部 UUID，不是 Clerk ID
    
    // 返回用户信息（隐藏敏感信息）
    const publicUserInfo = {
      userId: userId, // 内部 UUID，前端主要使用这个
      uuid: user.uuid, // 兼容性保留
      clerkUserId: user.clerk_user_id, // 前端缓存需要
      email: user.email,
      username: user.username,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      credits: user.credits,
      invite_code: user.invite_code,
      language: user.language,
      timezone: user.timezone,
      email_notifications: user.email_notifications,
      daily_ai_usage: user.daily_ai_usage,
      total_ai_usage: user.total_ai_usage,
      created_at: user.created_at,
      last_login_at: user.last_login_at
    };
    
    return NextResponse.json({
      success: true,
      user: publicUserInfo
    });
    
  } catch (error) {
    console.error('Get user profile failed:', error);
    return NextResponse.json(
      { error: '获取用户信息失败' },
      { status: 500 }
    );
  }
}

// 更新用户信息
export async function PUT(req: NextRequest) {
  try {
    // 在边界处解析用户身份
    const { userId, user } = await requireAuth();
    // 注意：这里的 userId 已经是内部 UUID
    
    const body = await req.json();
    const { display_name, username, language, timezone, email_notifications } = body;
    
    // 只允许更新特定字段
    const updateData: any = {};
    if (display_name !== undefined) updateData.display_name = display_name;
    if (username !== undefined) updateData.username = username;
    if (language !== undefined) updateData.language = language;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (email_notifications !== undefined) updateData.email_notifications = email_notifications;
    
    const updatedUser = await updateUserInfo(userId, updateData);
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: '更新用户信息失败' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      user: {
        uuid: updatedUser.uuid,
        email: updatedUser.email,
        username: updatedUser.username,
        display_name: updatedUser.display_name,
        avatar_url: updatedUser.avatar_url,
        language: updatedUser.language,
        timezone: updatedUser.timezone,
        email_notifications: updatedUser.email_notifications
      }
    });
    
  } catch (error) {
    console.error('Update user profile failed:', error);
    return NextResponse.json(
      { error: '更新用户信息失败' },
      { status: 500 }
    );
  }
} 