-- AI Collager 数据库初始化脚本
-- 创建所有必要的表结构

-- 用户表
CREATE TABLE IF NOT EXISTS ac_users (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100),
  display_name VARCHAR(255),
  avatar_url TEXT,
  
  -- 积分相关
  credits INTEGER DEFAULT 50 NOT NULL,
  total_earned_credits INTEGER DEFAULT 50 NOT NULL,
  total_used_credits INTEGER DEFAULT 0 NOT NULL,
  
  -- 邀请相关
  invite_code VARCHAR(20) UNIQUE NOT NULL,
  invited_by_code VARCHAR(20),
  invited_by_user_id UUID,
  
  -- AI使用限制
  daily_ai_usage INTEGER DEFAULT 0 NOT NULL,
  last_ai_usage_date DATE,
  total_ai_usage INTEGER DEFAULT 0 NOT NULL,
  
  -- 用户设置
  language VARCHAR(10) DEFAULT 'zh-CN' NOT NULL,
  timezone VARCHAR(50) DEFAULT 'Asia/Shanghai' NOT NULL,
  email_notifications BOOLEAN DEFAULT true NOT NULL,
  
  -- 状态和时间
  status VARCHAR(20) DEFAULT 'active' NOT NULL,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 用户会话表
CREATE TABLE IF NOT EXISTS ac_user_sessions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID REFERENCES ac_users(uuid) ON DELETE CASCADE,
  trial_usage_count INTEGER DEFAULT 0 NOT NULL,
  ip_address INET,
  user_agent TEXT,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 积分交易表
CREATE TABLE IF NOT EXISTS ac_credit_transactions (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  user_id UUID REFERENCES ac_users(uuid) ON DELETE CASCADE NOT NULL,
  
  -- 交易信息
  amount INTEGER NOT NULL, -- 正数为获得，负数为消耗
  balance_after INTEGER NOT NULL,
  transaction_type VARCHAR(50) NOT NULL,
  
  -- 描述和关联
  title VARCHAR(255),
  description TEXT,
  related_entity_type VARCHAR(50),
  related_entity_id VARCHAR(255),
  
  -- 元数据
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 邀请表
CREATE TABLE IF NOT EXISTS ac_invitations (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  
  -- 邀请关系
  inviter_id UUID REFERENCES ac_users(uuid) ON DELETE CASCADE NOT NULL,
  invitee_id UUID REFERENCES ac_users(uuid) ON DELETE SET NULL,
  invite_code VARCHAR(20) UNIQUE NOT NULL,
  
  -- 邀请信息
  email VARCHAR(255),
  invitation_method VARCHAR(20) DEFAULT 'link' NOT NULL,
  
  -- 奖励信息
  inviter_reward INTEGER DEFAULT 20 NOT NULL,
  invitee_reward INTEGER DEFAULT 20 NOT NULL,
  
  -- 状态追踪
  status VARCHAR(20) DEFAULT 'pending' NOT NULL,
  clicked_at TIMESTAMP WITH TIME ZONE,
  registered_at TIMESTAMP WITH TIME ZONE,
  reward_given_at TIMESTAMP WITH TIME ZONE,
  
  -- 元数据
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON ac_users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON ac_users(email);
CREATE INDEX IF NOT EXISTS idx_users_invite_code ON ac_users(invite_code);
CREATE INDEX IF NOT EXISTS idx_users_invited_by_code ON ac_users(invited_by_code);
CREATE INDEX IF NOT EXISTS idx_users_status ON ac_users(status);

CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON ac_user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON ac_user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON ac_user_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON ac_credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON ac_credit_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON ac_credit_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_invitations_inviter_id ON ac_invitations(inviter_id);
CREATE INDEX IF NOT EXISTS idx_invitations_invitee_id ON ac_invitations(invitee_id);
CREATE INDEX IF NOT EXISTS idx_invitations_code ON ac_invitations(invite_code);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON ac_invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON ac_invitations(expires_at);

-- 创建触发器函数，自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表创建触发器
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON ac_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invitations_updated_at 
    BEFORE UPDATE ON ac_invitations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 添加外键约束
ALTER TABLE ac_users 
ADD CONSTRAINT fk_users_invited_by_user 
FOREIGN KEY (invited_by_user_id) REFERENCES ac_users(uuid) ON DELETE SET NULL;

-- 添加检查约束
ALTER TABLE ac_users 
ADD CONSTRAINT chk_users_status 
CHECK (status IN ('active', 'suspended', 'deleted'));

ALTER TABLE ac_users 
ADD CONSTRAINT chk_users_credits_positive 
CHECK (credits >= 0);

ALTER TABLE ac_invitations 
ADD CONSTRAINT chk_invitations_status 
CHECK (status IN ('pending', 'completed', 'expired'));

ALTER TABLE ac_invitations 
ADD CONSTRAINT chk_invitations_method 
CHECK (invitation_method IN ('link', 'email', 'social'));

-- 插入一些示例数据（可选）
-- INSERT INTO ac_users (clerk_user_id, email, username, display_name) 
-- VALUES ('test_user_1', 'test@example.com', 'testuser', 'Test User')
-- ON CONFLICT (clerk_user_id) DO NOTHING; 