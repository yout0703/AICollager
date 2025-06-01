-- =====================================
-- AI Collager Supabase 数据库结构
-- 适配版本: 基于 current.sql
-- =====================================

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 核心用户系统
-- =============================================

-- 用户表
CREATE TABLE ac_users (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    clerk_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE,
    avatar_url VARCHAR(500),
    display_name VARCHAR(100),
    
    -- 积分系统
    credits INTEGER DEFAULT 50,
    total_earned_credits INTEGER DEFAULT 50,
    total_used_credits INTEGER DEFAULT 0,
    
    -- 试用系统
    trial_start_date TIMESTAMPTZ,
    trial_usage_count INTEGER DEFAULT 0,
    is_premium BOOLEAN DEFAULT false,
    premium_expires_at TIMESTAMPTZ,
    
    -- 状态和元数据
    status VARCHAR(20) DEFAULT 'active',
    last_login_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用户会话表（未登录用户）
CREATE TABLE ac_user_sessions (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    
    -- 试用限制
    trial_usage_count INTEGER DEFAULT 0,
    trial_start_date TIMESTAMPTZ DEFAULT NOW(),
    
    -- 会话信息
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    
    -- 元数据
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- =============================================
-- 积分系统
-- =============================================

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

-- =============================================
-- 拼图系统
-- =============================================

-- 拼图表
CREATE TABLE ac_collages (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    
    -- 归属关系
    user_id UUID REFERENCES ac_users(uuid) ON DELETE CASCADE,
    session_id VARCHAR(255),
    
    -- 基本信息
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- 拼图配置
    canvas_config JSONB NOT NULL DEFAULT '{}',
    elements JSONB DEFAULT '[]',
    
    -- 图片信息
    preview_url VARCHAR(500),
    full_image_url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    
    -- 状态管理
    status VARCHAR(20) DEFAULT 'draft',
    generation_status VARCHAR(20) DEFAULT 'pending',
    visibility VARCHAR(20) DEFAULT 'private',
    
    -- 统计信息
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    
    -- AI处理信息
    ai_processing_time INTEGER,
    ai_model VARCHAR(50),
    ai_cost DECIMAL(10,4) DEFAULT 0,
    
    -- 元数据
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 拼图图片表
CREATE TABLE ac_collage_images (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    
    -- 关联拼图
    collage_id UUID NOT NULL REFERENCES ac_collages(uuid) ON DELETE CASCADE,
    
    -- 图片信息
    image_index INTEGER NOT NULL,
    original_url VARCHAR(500) NOT NULL,
    processed_url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    
    -- 文件信息
    file_name VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    
    -- 位置和变换
    position_x REAL,
    position_y REAL,
    width REAL,
    height REAL,
    rotation REAL DEFAULT 0,
    scale_x REAL DEFAULT 1,
    scale_y REAL DEFAULT 1,
    
    -- 处理状态
    status VARCHAR(20) DEFAULT 'pending',
    processing_error TEXT,
    
    -- 元数据
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- AI使用统计和限制
-- =============================================

-- AI使用统计表
CREATE TABLE ac_ai_usage_stats (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    
    -- 统计日期
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- 统计数据
    total_requests INTEGER DEFAULT 0,
    successful_requests INTEGER DEFAULT 0,
    failed_requests INTEGER DEFAULT 0,
    total_processing_time INTEGER DEFAULT 0,
    total_cost DECIMAL(10,4) DEFAULT 0,
    
    -- 按模型统计
    model_usage JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 每日限制表
CREATE TABLE ac_daily_limits (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    
    -- 用户或会话关联
    user_id UUID REFERENCES ac_users(uuid) ON DELETE CASCADE,
    session_id VARCHAR(255),
    
    -- 限制信息
    limit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    limit_type VARCHAR(20) NOT NULL,
    current_usage INTEGER DEFAULT 0,
    limit_value INTEGER NOT NULL,
    
    -- 重置信息
    reset_at TIMESTAMPTZ DEFAULT (CURRENT_DATE + INTERVAL '1 day'),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, limit_date, limit_type),
    UNIQUE(session_id, limit_date, limit_type)
);

-- =============================================
-- 图标系统
-- =============================================

-- 图标表
CREATE TABLE ac_icons (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    
    -- 图标信息
    icon_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    subcategory VARCHAR(100),
    
    -- 图标数据
    svg_data TEXT NOT NULL,
    tags TEXT[],
    keywords TEXT[],
    
    -- 样式信息
    style VARCHAR(50),
    color_scheme VARCHAR(50),
    size_info JSONB DEFAULT '{}',
    
    -- 状态和统计
    status VARCHAR(20) DEFAULT 'active',
    usage_count INTEGER DEFAULT 0,
    popularity_score REAL DEFAULT 0,
    
    -- 元数据
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 索引优化
-- =============================================

-- 用户表索引
CREATE INDEX idx_ac_users_clerk_id ON ac_users(clerk_id);
CREATE INDEX idx_ac_users_email ON ac_users(email);
CREATE INDEX idx_ac_users_status ON ac_users(status);
CREATE INDEX idx_ac_users_created_at ON ac_users(created_at);

-- 会话表索引
CREATE INDEX idx_ac_user_sessions_session_id ON ac_user_sessions(session_id);
CREATE INDEX idx_ac_user_sessions_expires_at ON ac_user_sessions(expires_at);

-- 积分交易索引
CREATE INDEX idx_ac_credit_transactions_user_id ON ac_credit_transactions(user_id);
CREATE INDEX idx_ac_credit_transactions_type ON ac_credit_transactions(transaction_type);
CREATE INDEX idx_ac_credit_transactions_created_at ON ac_credit_transactions(created_at);
CREATE INDEX idx_ac_credit_transactions_related_entity ON ac_credit_transactions(related_entity_type, related_entity_id);

-- 邀请表索引
CREATE INDEX idx_ac_invitations_inviter_id ON ac_invitations(inviter_id);
CREATE INDEX idx_ac_invitations_invitee_id ON ac_invitations(invitee_id);
CREATE INDEX idx_ac_invitations_invite_code ON ac_invitations(invite_code);
CREATE INDEX idx_ac_invitations_status ON ac_invitations(status);
CREATE INDEX idx_ac_invitations_expires_at ON ac_invitations(expires_at);

-- 拼图表索引
CREATE INDEX idx_ac_collages_user_id ON ac_collages(user_id);
CREATE INDEX idx_ac_collages_session_id ON ac_collages(session_id);
CREATE INDEX idx_ac_collages_status ON ac_collages(status);
CREATE INDEX idx_ac_collages_visibility ON ac_collages(visibility);
CREATE INDEX idx_ac_collages_created_at ON ac_collages(created_at);
CREATE INDEX idx_ac_collages_deleted_at ON ac_collages(deleted_at);

-- 拼图图片索引
CREATE INDEX idx_ac_collage_images_collage_id ON ac_collage_images(collage_id);
CREATE INDEX idx_ac_collage_images_image_index ON ac_collage_images(collage_id, image_index);

-- AI统计索引
CREATE INDEX idx_ac_ai_usage_stats_date ON ac_ai_usage_stats(date);
CREATE INDEX idx_ac_ai_usage_stats_created_at ON ac_ai_usage_stats(created_at);

-- 限制表索引
CREATE INDEX idx_ac_daily_limits_user_id ON ac_daily_limits(user_id);
CREATE INDEX idx_ac_daily_limits_session_id ON ac_daily_limits(session_id);
CREATE INDEX idx_ac_daily_limits_date_type ON ac_daily_limits(limit_date, limit_type);

-- 图标表索引
CREATE INDEX idx_ac_icons_icon_id ON ac_icons(icon_id);
CREATE INDEX idx_ac_icons_category ON ac_icons(category);
CREATE INDEX idx_ac_icons_status ON ac_icons(status);
CREATE INDEX idx_ac_icons_tags ON ac_icons USING GIN(tags);
CREATE INDEX idx_ac_icons_usage_count ON ac_icons(usage_count DESC);

-- =============================================
-- 触发器函数
-- =============================================

-- 更新 updated_at 列的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有需要的表添加触发器
CREATE TRIGGER update_ac_users_updated_at 
    BEFORE UPDATE ON ac_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ac_user_sessions_updated_at 
    BEFORE UPDATE ON ac_user_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ac_invitations_updated_at 
    BEFORE UPDATE ON ac_invitations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ac_collages_updated_at 
    BEFORE UPDATE ON ac_collages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ac_collage_images_updated_at 
    BEFORE UPDATE ON ac_collage_images 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_usage_stats_updated_at 
    BEFORE UPDATE ON ac_ai_usage_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ac_daily_limits_updated_at 
    BEFORE UPDATE ON ac_daily_limits 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ac_icons_updated_at 
    BEFORE UPDATE ON ac_icons 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 行级安全策略 (RLS)
-- =============================================

-- 启用 RLS
ALTER TABLE ac_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ac_user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ac_credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ac_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ac_collages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ac_collage_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE ac_daily_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE ac_icons ENABLE ROW LEVEL SECURITY;

-- 用户表 - 用户只能访问自己的数据
CREATE POLICY "Users can view own profile" ON ac_users
    FOR SELECT USING (clerk_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own profile" ON ac_users
    FOR UPDATE USING (clerk_id = auth.jwt() ->> 'sub');

-- 积分交易 - 用户只能查看自己的交易记录
CREATE POLICY "Users can view own transactions" ON ac_credit_transactions
    FOR SELECT USING (user_id IN (
        SELECT uuid FROM ac_users WHERE clerk_id = auth.jwt() ->> 'sub'
    ));

-- 拼图 - 用户可以访问自己的拼图和公开的拼图
CREATE POLICY "Users can view own collages" ON ac_collages
    FOR SELECT USING (
        user_id IN (SELECT uuid FROM ac_users WHERE clerk_id = auth.jwt() ->> 'sub')
        OR visibility = 'public'
    );

CREATE POLICY "Users can manage own collages" ON ac_collages
    FOR ALL USING (user_id IN (
        SELECT uuid FROM ac_users WHERE clerk_id = auth.jwt() ->> 'sub'
    ));

-- 拼图图片 - 通过拼图权限控制
CREATE POLICY "Users can access collage images" ON ac_collage_images
    FOR SELECT USING (collage_id IN (
        SELECT uuid FROM ac_collages WHERE 
            user_id IN (SELECT uuid FROM ac_users WHERE clerk_id = auth.jwt() ->> 'sub')
            OR visibility = 'public'
    ));

-- 图标 - 所有用户可以查看活跃的图标
CREATE POLICY "Anyone can view active icons" ON ac_icons
    FOR SELECT USING (status = 'active');

-- 服务端访问策略（用于管理员操作）
CREATE POLICY "Service role bypass" ON ac_users
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass transactions" ON ac_credit_transactions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass collages" ON ac_collages
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass images" ON ac_collage_images
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass icons" ON ac_icons
    FOR ALL USING (auth.role() = 'service_role'); 