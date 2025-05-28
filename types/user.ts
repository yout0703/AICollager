// 用户相关类型定义
export interface User {
  id: number;
  uuid: string;
  clerk_user_id: string;
  email: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  
  // 积分相关
  credits: number;
  total_earned_credits: number;
  total_used_credits: number;
  
  // 邀请相关
  invite_code: string;
  invited_by_code?: string;
  invited_by_user_id?: string;
  
  // AI使用限制
  daily_ai_usage: number;
  last_ai_usage_date?: string;
  total_ai_usage: number;
  
  // 用户设置
  language: string;
  timezone: string;
  email_notifications: boolean;
  
  // 状态和时间
  status: 'active' | 'suspended' | 'deleted';
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

// 用户会话类型
export interface UserSession {
  id: number;
  session_id: string;
  user_id?: string;
  trial_usage_count: number;
  ip_address?: string;
  user_agent?: string;
  last_activity_at: string;
  created_at: string;
  expires_at: string;
}

// 用户创建请求类型
export interface CreateUserRequest {
  clerk_user_id: string;
  email: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  invited_by_code?: string;
} 