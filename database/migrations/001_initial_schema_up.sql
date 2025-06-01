-- =====================================
-- Migration: 001_initial_schema
-- Description: 创建初始数据库结构
-- Author: AI Collager Team
-- Date: 2025-01-25
-- Dependencies: none
-- =====================================

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
    
    -- 图片属性
    width INTEGER,
    height INTEGER,
    format VARCHAR(10),
    
    -- AI分析结果
    ai_analysis JSONB DEFAULT '{}',
    
    -- 元数据
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_ac_users_clerk_id ON ac_users(clerk_id);
CREATE INDEX idx_ac_users_email ON ac_users(email);
CREATE INDEX idx_ac_users_status ON ac_users(status);
CREATE INDEX idx_ac_users_created_at ON ac_users(created_at);

CREATE INDEX idx_ac_user_sessions_session_id ON ac_user_sessions(session_id);
CREATE INDEX idx_ac_user_sessions_expires_at ON ac_user_sessions(expires_at);

CREATE INDEX idx_ac_collages_user_id ON ac_collages(user_id);
CREATE INDEX idx_ac_collages_session_id ON ac_collages(session_id);
CREATE INDEX idx_ac_collages_status ON ac_collages(status);
CREATE INDEX idx_ac_collages_visibility ON ac_collages(visibility);
CREATE INDEX idx_ac_collages_created_at ON ac_collages(created_at);
CREATE INDEX idx_ac_collages_deleted_at ON ac_collages(deleted_at);

CREATE INDEX idx_ac_collage_images_collage_id ON ac_collage_images(collage_id);
CREATE INDEX idx_ac_collage_images_image_index ON ac_collage_images(collage_id, image_index);

-- 创建触发器更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ac_users_updated_at 
    BEFORE UPDATE ON ac_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ac_user_sessions_updated_at 
    BEFORE UPDATE ON ac_user_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ac_collages_updated_at 
    BEFORE UPDATE ON ac_collages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ac_collage_images_updated_at 
    BEFORE UPDATE ON ac_collage_images 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT; 