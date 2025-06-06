// 用户相关类型定义
export interface User {
  id: number;
  uuid: string;
  clerkUserId: string;
  email: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  
  // 积分相关
  credits: number;
  totalEarnedCredits: number;
  totalUsedCredits: number;
  
  // 邀请相关
  inviteCode: string;
  invitedByCode?: string;
  invitedByUserId?: string;
  
  // AI使用限制
  dailyAiUsage: number;
  lastAiUsageDate?: string;
  totalAiUsage: number;
  
  // 用户设置
  language: string;
  timezone: string;
  emailNotifications: boolean;
  
  // 状态和时间
  status: 'active' | 'suspended' | 'deleted';
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

// 用户会话类型
export interface UserSession {
  id: number;
  sessionId: string;
  userId?: string;
  trialUsageCount: number;
  ipAddress?: string;
  userAgent?: string;
  lastActivityAt: string;
  createdAt: string;
  expiresAt: string;
}

// 用户创建请求类型
export interface CreateUserRequest {
  clerkUserId: string;
  email: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  invitedByCode?: string;
} 