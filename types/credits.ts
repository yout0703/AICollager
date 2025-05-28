// 积分系统相关类型定义

// 积分交易类型
export interface CreditTransaction {
  id: number;
  uuid: string;
  user_id: string;
  
  // 交易信息
  amount: number; // 正数为获得，负数为消耗
  balance_after: number;
  transaction_type: 'register' | 'invite' | 'collage' | 'download' | 'premium_template' | 'purchase' | 'admin_adjust' | 'promotion';
  
  // 描述和关联
  title?: string;
  description?: string;
  related_entity_type?: 'collage' | 'order' | 'invitation';
  related_entity_id?: string;
  
  // 元数据
  metadata?: Record<string, any>;
  
  created_at: string;
}

// 邀请记录类型
export interface Invitation {
  id: number;
  uuid: string;
  
  // 邀请关系
  inviter_id: string;
  invitee_id?: string;
  invite_code: string;
  
  // 邀请信息
  email?: string;
  invitation_method: 'link' | 'email' | 'social';
  
  // 奖励信息
  inviter_reward: number;
  invitee_reward: number;
  
  // 状态追踪
  status: 'pending' | 'completed' | 'expired';
  clicked_at?: string;
  registered_at?: string;
  reward_given_at?: string;
  
  // 元数据
  metadata?: Record<string, any>;
  
  created_at: string;
  updated_at: string;
  expires_at: string;
}

// 积分操作请求类型
export interface CreditOperationRequest {
  user_id: string;
  amount: number;
  transaction_type: CreditTransaction['transaction_type'];
  title?: string;
  description?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  metadata?: Record<string, any>;
}

// 邀请创建请求类型
export interface CreateInvitationRequest {
  inviter_id: string;
  email?: string;
  invitation_method?: 'link' | 'email' | 'social';
  inviter_reward?: number;
  invitee_reward?: number;
  metadata?: Record<string, any>;
} 