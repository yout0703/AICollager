-- =====================================
-- Migration: 003_add_ai_features
-- Description: 添加AI功能相关表
-- Author: AI Collager Team  
-- Date: 2025-01-25
-- Dependencies: 002_add_credits_system
-- =====================================

-- AI使用统计表
CREATE TABLE ac_ai_usage_stats (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    
    -- 使用次数统计
    total_requests INT DEFAULT 0,
    successful_requests INT DEFAULT 0,
    failed_requests INT DEFAULT 0,
    cached_requests INT DEFAULT 0,
    
    -- 分类统计
    image_analysis_count INT DEFAULT 0,
    layout_suggestion_count INT DEFAULT 0,
    icon_recommendation_count INT DEFAULT 0,
    
    -- 成本统计
    estimated_cost DECIMAL(10,4) DEFAULT 0,
    cost_currency VARCHAR(3) DEFAULT 'USD',
    
    -- 性能统计
    avg_response_time DECIMAL(10,2) DEFAULT 0,
    total_processing_time DECIMAL(15,2) DEFAULT 0,
    
    -- 元数据
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(date)
);

-- 每日使用限制表
CREATE TABLE ac_daily_limits (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    
    -- 关联用户
    user_id UUID REFERENCES ac_users(uuid) ON DELETE CASCADE,
    session_id VARCHAR(255),
    
    -- 日期和类型
    limit_date DATE NOT NULL,
    limit_type VARCHAR(20) NOT NULL CHECK (limit_type IN ('ai_requests', 'downloads', 'generations')),
    
    -- 限制信息
    usage_count INTEGER DEFAULT 0,
    limit_value INTEGER NOT NULL,
    
    -- 元数据
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, limit_date, limit_type),
    UNIQUE(session_id, limit_date, limit_type)
);

-- Icon库表
CREATE TABLE ac_icons (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    
    -- 基本信息
    icon_id VARCHAR(100) UNIQUE NOT NULL,
    icon_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    tags TEXT[],
    
    -- 图标内容
    svg_content TEXT NOT NULL,
    svg_url VARCHAR(500),
    
    -- 分类和属性
    style VARCHAR(20) DEFAULT 'outline',
    size_variants INTEGER[] DEFAULT '{16,24,32,48}',
    color_variants TEXT[] DEFAULT '{"#000000"}',
    
    -- 使用统计
    usage_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    
    -- 状态
    status VARCHAR(20) DEFAULT 'active',
    is_premium BOOLEAN DEFAULT false,
    
    -- 元数据
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_ac_ai_usage_stats_date ON ac_ai_usage_stats(date);
CREATE INDEX idx_ac_ai_usage_stats_created_at ON ac_ai_usage_stats(created_at);

CREATE INDEX idx_ac_daily_limits_user_id ON ac_daily_limits(user_id);
CREATE INDEX idx_ac_daily_limits_session_id ON ac_daily_limits(session_id);
CREATE INDEX idx_ac_daily_limits_date_type ON ac_daily_limits(limit_date, limit_type);

CREATE INDEX idx_ac_icons_icon_id ON ac_icons(icon_id);
CREATE INDEX idx_ac_icons_category ON ac_icons(category);
CREATE INDEX idx_ac_icons_status ON ac_icons(status);
CREATE INDEX idx_ac_icons_tags ON ac_icons USING GIN(tags);
CREATE INDEX idx_ac_icons_usage_count ON ac_icons(usage_count DESC);

-- 创建触发器
CREATE TRIGGER update_ai_usage_stats_updated_at 
    BEFORE UPDATE ON ac_ai_usage_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ac_daily_limits_updated_at 
    BEFORE UPDATE ON ac_daily_limits 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ac_icons_updated_at 
    BEFORE UPDATE ON ac_icons 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入今天的初始AI统计记录
INSERT INTO ac_ai_usage_stats (date) 
VALUES (CURRENT_DATE)
ON CONFLICT (date) DO NOTHING;

-- 插入一些默认的Icon数据
INSERT INTO ac_icons (icon_id, icon_name, category, tags, svg_content, style) VALUES
('heart', '心形', 'emotion', '{"爱心", "喜欢", "情感"}', '<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>', 'filled'),
('star', '星星', 'emotion', '{"评分", "喜欢", "收藏"}', '<svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>', 'filled'),
('camera', '相机', 'media', '{"拍照", "摄影", "图片"}', '<svg viewBox="0 0 24 24"><path d="M12 15.2l3.536-3.536-1.414-1.414L12 12.372 9.878 10.25 8.464 11.664 12 15.2zm0-6.8c-2.48 0-4.5 2.02-4.5 4.5s2.02 4.5 4.5 4.5 4.5-2.02 4.5-4.5-2.02-4.5-4.5-4.5z"/></svg>', 'outline'),
('music', '音乐', 'media', '{"音符", "歌曲", "音频"}', '<svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>', 'filled'),
('gift', '礼物', 'celebration', '{"生日", "庆祝", "惊喜"}', '<svg viewBox="0 0 24 24"><path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-2 .89-2 2v4c0 1.11.89 2 2 2h1v6c0 1.11.89 2 2 2h10c1.11 0 2-.89 2-2v-6h1c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2z"/></svg>', 'filled');

COMMIT; 