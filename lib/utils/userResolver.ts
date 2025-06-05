// 用户身份解析工具
import { auth } from '@clerk/nextjs/server';
import { getUserInfoCached } from '@/lib/services/userCache';

export interface AuthResult {
  isAuthenticated: boolean;
  clerkUserId?: string;
  userId?: string; // 内部系统的 UUID
  user?: any;
}

/**
 * 解析用户身份并转换为内部 UUID
 * 这是所有需要用户身份的 API 的入口函数
 */
export async function resolveUser(): Promise<AuthResult> {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return {
        isAuthenticated: false
      };
    }
    
    // 将 Clerk ID 转换为内部用户信息
    const user = await getUserInfoCached(clerkUserId);
    
    if (!user) {
      return {
        isAuthenticated: true,
        clerkUserId,
        userId: undefined,
        user: null
      };
    }
    
    return {
      isAuthenticated: true,
      clerkUserId,
      userId: user.uuid, // 这里是我们系统内部的 UUID
      user
    };
    
  } catch (error) {
    console.error('用户身份解析失败:', error);
    return {
      isAuthenticated: false
    };
  }
}

/**
 * 认证中间件：确保用户已登录并返回内部 UUID
 */
export async function requireAuth(): Promise<{
  userId: string;
  user: any;
  clerkUserId: string;
}> {
  const authResult = await resolveUser();
  
  if (!authResult.isAuthenticated) {
    throw new Error('未登录');
  }
  
  if (!authResult.userId || !authResult.user) {
    throw new Error('用户不存在');
  }
  
  return {
    userId: authResult.userId, // 内部 UUID
    user: authResult.user,
    clerkUserId: authResult.clerkUserId!
  };
} 