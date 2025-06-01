-- =====================================
-- Migration: 002_add_credits_system
-- Description: 添加积分系统相关表
-- Author: AI Collager Team
-- Date: 2025-01-25
-- Dependencies: 001_initial_schema
-- =====================================

-- 积分交易记录表
CREATE TABLE ac_credit_transactions (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    
    -- 用户关联
    user_id UUID NOT NULL REFERENCES ac_users(uuid) ON DELETE CASCADE,
    
    -- 交易信息
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('earn', 'spend', 'refund', 'invite', 'bonus', 'purchase')),
    
    -- 描述信息
    title VARCHAR(255),
    description TEXT,
    
    -- 关联实体
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    
    -- 元数据
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 邀请记录表
CREATE TABLE ac_invitations (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    
    -- 邀请关系
    inviter_id UUID NOT NULL REFERENCES ac_users(uuid) ON DELETE CASCADE,
    invitee_id UUID REFERENCES ac_users(uuid) ON DELETE SET NULL,
    
    -- 邀请信息
    invite_code VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    invitation_method VARCHAR(20) DEFAULT 'link',
    
    -- 奖励信息
    inviter_reward INTEGER DEFAULT 20,
    invitee_reward INTEGER DEFAULT 20,
    
    -- 状态管理
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'cancelled')),
    
    -- 时间跟踪
    clicked_at TIMESTAMPTZ,
    registered_at TIMESTAMPTZ,
    reward_given_at TIMESTAMPTZ,
    
    -- 元数据
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- 创建索引
CREATE INDEX idx_ac_credit_transactions_user_id ON ac_credit_transactions(user_id);
CREATE INDEX idx_ac_credit_transactions_type ON ac_credit_transactions(transaction_type);
CREATE INDEX idx_ac_credit_transactions_created_at ON ac_credit_transactions(created_at);
CREATE INDEX idx_ac_credit_transactions_related_entity ON ac_credit_transactions(related_entity_type, related_entity_id);

CREATE INDEX idx_ac_invitations_inviter_id ON ac_invitations(inviter_id);
CREATE INDEX idx_ac_invitations_invitee_id ON ac_invitations(invitee_id);
CREATE INDEX idx_ac_invitations_invite_code ON ac_invitations(invite_code);
CREATE INDEX idx_ac_invitations_status ON ac_invitations(status);
CREATE INDEX idx_ac_invitations_expires_at ON ac_invitations(expires_at);

-- 创建触发器
CREATE TRIGGER update_ac_invitations_updated_at 
    BEFORE UPDATE ON ac_invitations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT; 