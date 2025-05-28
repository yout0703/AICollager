-- ================================
-- AI Collager MVP 数据库Schema 
-- 创建日期: 2025-05-25
-- 说明: 全新的数据库表结构，所有表使用 ac_ 前缀
-- ================================

-- 删除现有表（如果存在）
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS covers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ================================
-- 用户和认证相关表
-- ================================

-- 用户主表
CREATE TABLE ac_users (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL, -- Clerk用户ID
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100),
    display_name VARCHAR(255),
    avatar_url VARCHAR(500),
    
    -- 积分相关
    credits INT DEFAULT 50, -- 当前积分余额
    total_earned_credits INT DEFAULT 50, -- 累计获得积分
    total_used_credits INT DEFAULT 0, -- 累计使用积分
    
    -- 邀请相关
    invite_code VARCHAR(50) UNIQUE NOT NULL,
    invited_by_code VARCHAR(50), -- 邀请人的邀请码
    invited_by_user_id UUID, -- 邀请人ID
    
    -- AI使用限制
    daily_ai_usage INT DEFAULT 0, -- 今日AI使用次数
    last_ai_usage_date DATE, -- 最后使用AI的日期
    total_ai_usage INT DEFAULT 0, -- 累计AI使用次数
    
    -- 用户设置
    language VARCHAR(10) DEFAULT 'zh-CN',
    timezone VARCHAR(50) DEFAULT 'Asia/Shanghai',
    email_notifications BOOLEAN DEFAULT true,
    
    -- 状态和时间
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'suspended', 'deleted'
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用户会话表（追踪未登录用户的试用次数）
CREATE TABLE ac_user_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    user_id UUID, -- 登录用户关联，未登录时为NULL
    trial_usage_count INT DEFAULT 0, -- 试用次数
    ip_address INET,
    user_agent TEXT,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- ================================
-- 积分系统相关表
-- ================================

-- 积分流水表
CREATE TABLE ac_credit_transactions (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    
    -- 交易信息
    amount INT NOT NULL, -- 正数为获得，负数为消耗
    balance_after INT NOT NULL, -- 交易后余额
    transaction_type VARCHAR(50) NOT NULL, -- 'register', 'invite', 'collage', 'download', 'purchase', 'admin_adjust'
    
    -- 描述和关联
    title VARCHAR(255), -- 交易标题
    description TEXT, -- 详细描述
    related_entity_type VARCHAR(50), -- 关联实体类型 'collage', 'order', 'invitation'
    related_entity_id UUID, -- 关联实体ID
    
    -- 元数据
    metadata JSONB, -- 额外信息，如AI使用详情等
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 邀请记录表
CREATE TABLE ac_invitations (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    
    -- 邀请关系
    inviter_id UUID NOT NULL, -- 邀请人ID
    invitee_id UUID, -- 被邀请人ID（注册后填入）
    invite_code VARCHAR(50) NOT NULL, -- 邀请码
    
    -- 邀请信息
    email VARCHAR(255), -- 被邀请人邮箱（如果通过邮箱邀请）
    invitation_method VARCHAR(20) DEFAULT 'link', -- 'link', 'email', 'social'
    
    -- 奖励信息
    inviter_reward INT DEFAULT 20, -- 邀请人奖励积分
    invitee_reward INT DEFAULT 20, -- 被邀请人奖励积分
    
    -- 状态追踪
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'expired'
    clicked_at TIMESTAMPTZ, -- 点击邀请链接时间
    registered_at TIMESTAMPTZ, -- 注册完成时间
    reward_given_at TIMESTAMPTZ, -- 奖励发放时间
    
    -- 元数据
    metadata JSONB, -- 额外信息，如来源页面等
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- ================================
-- Icon库管理相关表
-- ================================

-- Icon分类表
CREATE TABLE ac_icon_categories (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    
    -- 分类信息
    category_id VARCHAR(100) UNIQUE NOT NULL, -- 分类标识符
    category_name VARCHAR(255) NOT NULL, -- 分类名称
    parent_category_id VARCHAR(100), -- 父分类ID
    
    -- 描述信息
    description TEXT, -- 人类可读描述
    ai_description TEXT, -- AI理解的描述
    ai_keywords TEXT[], -- AI搜索关键词
    
    -- 显示配置
    display_order INT DEFAULT 0, -- 显示顺序
    icon_color VARCHAR(20) DEFAULT '#666666', -- 分类图标颜色
    is_active BOOLEAN DEFAULT true, -- 是否启用
    
    -- 统计信息
    icon_count INT DEFAULT 0, -- 该分类下的Icon数量
    usage_count INT DEFAULT 0, -- 使用次数
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Icon库表
CREATE TABLE ac_icons (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    
    -- Icon基本信息
    icon_id VARCHAR(100) UNIQUE NOT NULL, -- Icon标识符
    icon_name VARCHAR(255) NOT NULL, -- Icon名称
    category_id VARCHAR(100) NOT NULL, -- 所属分类
    
    -- 内容和样式
    svg_content TEXT NOT NULL, -- SVG内容
    style VARCHAR(50) DEFAULT 'outline', -- 'outline', 'filled', 'duotone', 'color'
    
    -- 支持的变体
    size_variants JSONB DEFAULT '["16","24","32","48","64"]', -- 支持的尺寸
    color_variants JSONB DEFAULT '["currentColor"]', -- 支持的颜色
    
    -- AI相关
    tags TEXT[] DEFAULT '{}', -- 标签数组
    ai_keywords TEXT[] DEFAULT '{}', -- AI识别关键词
    semantic_meaning TEXT, -- 语义含义
    ai_description TEXT, -- AI理解的描述
    
    -- 使用统计
    popularity_score INT DEFAULT 0, -- 受欢迎程度评分
    usage_count INT DEFAULT 0, -- 使用次数
    last_used_at TIMESTAMPTZ, -- 最后使用时间
    
    -- 状态和权限
    is_active BOOLEAN DEFAULT true, -- 是否启用
    is_premium BOOLEAN DEFAULT false, -- 是否为高级Icon
    
    -- 元数据
    source VARCHAR(100), -- 来源，如 'heroicons', 'custom'
    version VARCHAR(20) DEFAULT '1.0.0', -- 版本号
    license VARCHAR(100) DEFAULT 'MIT', -- 许可证
    metadata JSONB, -- 额外元数据
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================
-- 拼图相关表
-- ================================

-- 拼图模板表
CREATE TABLE ac_templates (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    
    -- 模板基本信息
    template_id VARCHAR(100) UNIQUE NOT NULL,
    template_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- 模板配置
    min_images INT NOT NULL DEFAULT 2, -- 最少图片数
    max_images INT NOT NULL DEFAULT 9, -- 最多图片数
    aspect_ratios JSONB DEFAULT '["1:1","4:3","16:9"]', -- 支持的宽高比
    
    -- 模板结构
    canvas_config JSONB NOT NULL, -- 画布配置模板
    layout_structure JSONB NOT NULL, -- 布局结构定义
    
    -- 分类和标签
    category VARCHAR(100) NOT NULL, -- 'standard', 'artistic', 'social', 'print'
    style VARCHAR(100), -- 'modern', 'vintage', 'minimal', 'decorative'
    tags TEXT[] DEFAULT '{}',
    
    -- AI相关
    ai_keywords TEXT[] DEFAULT '{}', -- AI选择关键词
    ai_description TEXT, -- AI理解的描述
    ai_suitable_themes TEXT[] DEFAULT '{}', -- 适合的主题
    
    -- 使用配置
    is_premium BOOLEAN DEFAULT false, -- 是否为高级模板
    credits_cost INT DEFAULT 0, -- 使用所需积分
    
    -- 统计信息
    usage_count INT DEFAULT 0, -- 使用次数
    rating DECIMAL(3,2) DEFAULT 0.00, -- 平均评分
    rating_count INT DEFAULT 0, -- 评分次数
    
    -- 状态
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false, -- 是否为特色模板
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 拼图主表
CREATE TABLE ac_collages (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    
    -- 基本信息
    user_id UUID, -- 创建用户ID，未登录用户为NULL
    session_id VARCHAR(100), -- 会话ID，用于未登录用户
    title VARCHAR(255),
    description TEXT,
    
    -- 拼图数据
    canvas_config JSONB NOT NULL, -- 画布配置
    elements JSONB NOT NULL, -- 拼图元素数组
    metadata JSONB NOT NULL, -- 元数据（AI分析结果等）
    
    -- 模板和风格
    template_id VARCHAR(100), -- 使用的模板ID
    generated_style VARCHAR(100), -- AI生成的风格
    user_preferences JSONB, -- 用户偏好设置
    
    -- 图片资源
    thumbnail_url VARCHAR(500), -- 缩略图URL
    preview_url VARCHAR(500), -- 预览图URL
    full_image_url VARCHAR(500), -- 高清图URL
    
    -- AI相关
    ai_model VARCHAR(100), -- 使用的AI模型
    ai_processing_time INT, -- AI处理时间（毫秒）
    credits_used INT DEFAULT 5, -- 消耗的积分
    
    -- 状态管理
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'processing', 'completed', 'failed', 'deleted'
    generation_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'analyzing', 'generating', 'rendering', 'completed'
    
    -- 权限和分享
    visibility VARCHAR(20) DEFAULT 'private', -- 'private', 'public', 'unlisted'
    is_featured BOOLEAN DEFAULT false, -- 是否为精选作品
    download_count INT DEFAULT 0, -- 下载次数
    view_count INT DEFAULT 0, -- 查看次数
    
    -- 版本控制
    version INT DEFAULT 1, -- 版本号
    parent_collage_id UUID, -- 父拼图ID（编辑时）
    
    -- 时间记录
    started_at TIMESTAMPTZ DEFAULT NOW(), -- 开始创建时间
    completed_at TIMESTAMPTZ, -- 完成时间
    last_edited_at TIMESTAMPTZ DEFAULT NOW(), -- 最后编辑时间
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 拼图图片表
CREATE TABLE ac_collage_images (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    
    -- 关联信息
    collage_id UUID NOT NULL, -- 拼图ID
    image_index INT NOT NULL, -- 在拼图中的索引
    element_id VARCHAR(100), -- 对应的元素ID
    
    -- 图片信息
    original_url VARCHAR(500) NOT NULL, -- 原始图片URL
    processed_url VARCHAR(500), -- 处理后图片URL
    file_name VARCHAR(255), -- 原始文件名
    file_size INT, -- 文件大小（字节）
    mime_type VARCHAR(100), -- MIME类型
    
    -- 图片属性
    original_dimensions JSONB, -- 原始尺寸 {width, height}
    processed_dimensions JSONB, -- 处理后尺寸
    
    -- AI分析结果
    ai_analysis JSONB, -- AI分析结果
    dominant_colors JSONB, -- 主色调
    content_tags TEXT[], -- 内容标签
    
    -- 处理状态
    processing_status VARCHAR(20) DEFAULT 'uploaded', -- 'uploaded', 'processing', 'completed', 'failed'
    
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================
-- AI服务相关表
-- ================================

-- AI使用统计表（全站统计）
CREATE TABLE ac_ai_usage_stats (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    
    -- 请求统计
    total_requests INT DEFAULT 0, -- 总请求数
    successful_requests INT DEFAULT 0, -- 成功请求数
    failed_requests INT DEFAULT 0, -- 失败请求数
    
    -- 功能分类统计
    image_analysis_requests INT DEFAULT 0, -- 图片分析请求
    layout_generation_requests INT DEFAULT 0, -- 布局生成请求
    icon_recommendation_requests INT DEFAULT 0, -- Icon推荐请求
    
    -- 成本统计
    total_cost DECIMAL(10,4) DEFAULT 0, -- 总成本（USD）
    avg_cost_per_request DECIMAL(10,4) DEFAULT 0, -- 平均每次请求成本
    
    -- 性能统计
    avg_processing_time INT DEFAULT 0, -- 平均处理时间（毫秒）
    max_processing_time INT DEFAULT 0, -- 最大处理时间
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(date)
);

-- AI分析缓存表
CREATE TABLE ac_ai_analysis_cache (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    
    -- 缓存标识
    cache_key VARCHAR(64) UNIQUE NOT NULL, -- 缓存键（通常是图片hash）
    cache_type VARCHAR(50) NOT NULL, -- 'image_analysis', 'layout_suggestion', 'icon_recommendation'
    
    -- AI模型信息
    ai_model VARCHAR(100) NOT NULL, -- 使用的AI模型
    model_version VARCHAR(50), -- 模型版本
    
    -- 缓存内容
    input_data JSONB, -- 输入数据
    analysis_result JSONB NOT NULL, -- 分析结果
    confidence_score DECIMAL(3,2), -- 置信度评分
    
    -- 使用统计
    use_count INT DEFAULT 1, -- 使用次数
    last_used_at TIMESTAMPTZ DEFAULT NOW(), -- 最后使用时间
    
    -- 有效期
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'), -- 过期时间
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================
-- 订单和支付相关表（为未来扩展准备）
-- ================================

-- 订单表
CREATE TABLE ac_orders (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    order_no VARCHAR(255) UNIQUE NOT NULL, -- 订单号
    
    -- 用户信息
    user_id UUID NOT NULL, -- 购买用户ID
    user_email VARCHAR(255) NOT NULL, -- 用户邮箱
    
    -- 订单内容
    product_type VARCHAR(50) NOT NULL, -- 'credits', 'premium', 'template_pack'
    product_name VARCHAR(255), -- 产品名称
    credits_amount INT DEFAULT 0, -- 积分数量
    
    -- 价格信息
    amount_cents INT NOT NULL, -- 金额（分）
    currency VARCHAR(10) DEFAULT 'USD', -- 货币
    discount_amount_cents INT DEFAULT 0, -- 折扣金额
    final_amount_cents INT NOT NULL, -- 最终金额
    
    -- 支付信息
    payment_provider VARCHAR(50), -- 'stripe', 'paypal', 'alipay'
    payment_session_id VARCHAR(255), -- 支付会话ID
    payment_intent_id VARCHAR(255), -- 支付意图ID
    
    -- 订单状态
    order_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded', 'cancelled'
    payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'succeeded', 'failed'
    fulfillment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'fulfilled', 'failed'
    
    -- 时间记录
    paid_at TIMESTAMPTZ, -- 支付完成时间
    fulfilled_at TIMESTAMPTZ, -- 履行完成时间
    expires_at TIMESTAMPTZ, -- 订单过期时间
    
    -- 元数据
    metadata JSONB, -- 额外信息
    notes TEXT, -- 备注
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================
-- 系统配置和管理表
-- ================================

-- 系统配置表
CREATE TABLE ac_system_configs (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    config_type VARCHAR(50) NOT NULL, -- 'ai_limits', 'pricing', 'features', 'ui'
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 管理员操作日志表
CREATE TABLE ac_admin_logs (
    id SERIAL PRIMARY KEY,
    admin_user_id UUID NOT NULL, -- 管理员用户ID
    action VARCHAR(100) NOT NULL, -- 操作类型
    target_entity_type VARCHAR(50), -- 目标实体类型
    target_entity_id UUID, -- 目标实体ID
    old_data JSONB, -- 操作前数据
    new_data JSONB, -- 操作后数据
    ip_address INET, -- IP地址
    user_agent TEXT, -- 用户代理
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================
-- 外键约束
-- ================================

-- 添加外键约束
ALTER TABLE ac_users ADD CONSTRAINT fk_ac_users_invited_by 
    FOREIGN KEY (invited_by_user_id) REFERENCES ac_users(uuid) ON DELETE SET NULL;

ALTER TABLE ac_user_sessions ADD CONSTRAINT fk_ac_user_sessions_user 
    FOREIGN KEY (user_id) REFERENCES ac_users(uuid) ON DELETE CASCADE;

ALTER TABLE ac_credit_transactions ADD CONSTRAINT fk_ac_credit_transactions_user 
    FOREIGN KEY (user_id) REFERENCES ac_users(uuid) ON DELETE CASCADE;

ALTER TABLE ac_invitations ADD CONSTRAINT fk_ac_invitations_inviter 
    FOREIGN KEY (inviter_id) REFERENCES ac_users(uuid) ON DELETE CASCADE;

ALTER TABLE ac_invitations ADD CONSTRAINT fk_ac_invitations_invitee 
    FOREIGN KEY (invitee_id) REFERENCES ac_users(uuid) ON DELETE SET NULL;

ALTER TABLE ac_icons ADD CONSTRAINT fk_ac_icons_category 
    FOREIGN KEY (category_id) REFERENCES ac_icon_categories(category_id) ON DELETE RESTRICT;

ALTER TABLE ac_collages ADD CONSTRAINT fk_ac_collages_user 
    FOREIGN KEY (user_id) REFERENCES ac_users(uuid) ON DELETE SET NULL;

ALTER TABLE ac_collages ADD CONSTRAINT fk_ac_collages_template 
    FOREIGN KEY (template_id) REFERENCES ac_templates(template_id) ON DELETE SET NULL;

ALTER TABLE ac_collages ADD CONSTRAINT fk_ac_collages_parent 
    FOREIGN KEY (parent_collage_id) REFERENCES ac_collages(uuid) ON DELETE SET NULL;

ALTER TABLE ac_collage_images ADD CONSTRAINT fk_ac_collage_images_collage 
    FOREIGN KEY (collage_id) REFERENCES ac_collages(uuid) ON DELETE CASCADE;

ALTER TABLE ac_orders ADD CONSTRAINT fk_ac_orders_user 
    FOREIGN KEY (user_id) REFERENCES ac_users(uuid) ON DELETE RESTRICT;

-- ================================
-- 索引优化
-- ================================

-- 用户表索引
CREATE INDEX idx_ac_users_clerk_id ON ac_users(clerk_user_id);
CREATE INDEX idx_ac_users_email ON ac_users(email);
CREATE INDEX idx_ac_users_invite_code ON ac_users(invite_code);
CREATE INDEX idx_ac_users_invited_by ON ac_users(invited_by_user_id);
CREATE INDEX idx_ac_users_status ON ac_users(status);
CREATE INDEX idx_ac_users_created_at ON ac_users(created_at);

-- 会话表索引
CREATE INDEX idx_ac_user_sessions_session_id ON ac_user_sessions(session_id);
CREATE INDEX idx_ac_user_sessions_user_id ON ac_user_sessions(user_id);
CREATE INDEX idx_ac_user_sessions_expires_at ON ac_user_sessions(expires_at);

-- 积分交易索引
CREATE INDEX idx_ac_credit_transactions_user_id ON ac_credit_transactions(user_id);
CREATE INDEX idx_ac_credit_transactions_type ON ac_credit_transactions(transaction_type);
CREATE INDEX idx_ac_credit_transactions_created_at ON ac_credit_transactions(created_at);
CREATE INDEX idx_ac_credit_transactions_related ON ac_credit_transactions(related_entity_type, related_entity_id);

-- 邀请记录索引
CREATE INDEX idx_ac_invitations_inviter ON ac_invitations(inviter_id);
CREATE INDEX idx_ac_invitations_invitee ON ac_invitations(invitee_id);
CREATE INDEX idx_ac_invitations_code ON ac_invitations(invite_code);
CREATE INDEX idx_ac_invitations_status ON ac_invitations(status);

-- Icon相关索引
CREATE INDEX idx_ac_icon_categories_parent ON ac_icon_categories(parent_category_id);
CREATE INDEX idx_ac_icon_categories_active ON ac_icon_categories(is_active);
CREATE INDEX idx_ac_icons_category ON ac_icons(category_id);
CREATE INDEX idx_ac_icons_style ON ac_icons(style);
CREATE INDEX idx_ac_icons_active ON ac_icons(is_active);
CREATE INDEX idx_ac_icons_premium ON ac_icons(is_premium);
CREATE INDEX idx_ac_icons_popularity ON ac_icons(popularity_score);
CREATE INDEX idx_ac_icons_tags ON ac_icons USING GIN(tags);
CREATE INDEX idx_ac_icons_ai_keywords ON ac_icons USING GIN(ai_keywords);

-- 模板索引
CREATE INDEX idx_ac_templates_category ON ac_templates(category);
CREATE INDEX idx_ac_templates_style ON ac_templates(style);
CREATE INDEX idx_ac_templates_active ON ac_templates(is_active);
CREATE INDEX idx_ac_templates_premium ON ac_templates(is_premium);
CREATE INDEX idx_ac_templates_featured ON ac_templates(is_featured);
CREATE INDEX idx_ac_templates_usage ON ac_templates(usage_count);

-- 拼图相关索引
CREATE INDEX idx_ac_collages_user_id ON ac_collages(user_id);
CREATE INDEX idx_ac_collages_session_id ON ac_collages(session_id);
CREATE INDEX idx_ac_collages_template_id ON ac_collages(template_id);
CREATE INDEX idx_ac_collages_status ON ac_collages(status);
CREATE INDEX idx_ac_collages_visibility ON ac_collages(visibility);
CREATE INDEX idx_ac_collages_featured ON ac_collages(is_featured);
CREATE INDEX idx_ac_collages_created_at ON ac_collages(created_at);
CREATE INDEX idx_ac_collages_completed_at ON ac_collages(completed_at);

CREATE INDEX idx_ac_collage_images_collage_id ON ac_collage_images(collage_id);
CREATE INDEX idx_ac_collage_images_status ON ac_collage_images(processing_status);

-- AI相关索引
CREATE INDEX idx_ac_ai_usage_stats_date ON ac_ai_usage_stats(date);
CREATE INDEX idx_ac_ai_analysis_cache_key ON ac_ai_analysis_cache(cache_key);
CREATE INDEX idx_ac_ai_analysis_cache_type ON ac_ai_analysis_cache(cache_type);
CREATE INDEX idx_ac_ai_analysis_cache_expires ON ac_ai_analysis_cache(expires_at);

-- 订单索引
CREATE INDEX idx_ac_orders_user_id ON ac_orders(user_id);
CREATE INDEX idx_ac_orders_order_no ON ac_orders(order_no);
CREATE INDEX idx_ac_orders_status ON ac_orders(order_status);
CREATE INDEX idx_ac_orders_payment_status ON ac_orders(payment_status);
CREATE INDEX idx_ac_orders_created_at ON ac_orders(created_at);

-- 系统配置索引
CREATE INDEX idx_ac_system_configs_key ON ac_system_configs(config_key);
CREATE INDEX idx_ac_system_configs_type ON ac_system_configs(config_type);
CREATE INDEX idx_ac_system_configs_active ON ac_system_configs(is_active);

-- 管理日志索引
CREATE INDEX idx_ac_admin_logs_admin_user ON ac_admin_logs(admin_user_id);
CREATE INDEX idx_ac_admin_logs_action ON ac_admin_logs(action);
CREATE INDEX idx_ac_admin_logs_target ON ac_admin_logs(target_entity_type, target_entity_id);
CREATE INDEX idx_ac_admin_logs_created_at ON ac_admin_logs(created_at);

-- ================================
-- 初始化数据
-- ================================

-- 插入默认Icon分类
INSERT INTO ac_icon_categories (category_id, category_name, description, ai_description, ai_keywords, display_order) VALUES
('general', '通用', '通用图标分类', 'General purpose icons for common UI elements', ARRAY['general', 'common', 'basic'], 1),
('travel', '旅行', '旅行相关图标', 'Travel and transportation related icons', ARRAY['travel', 'trip', 'vacation', 'transport'], 2),
('food', '美食', '美食餐饮图标', 'Food, dining and restaurant related icons', ARRAY['food', 'dining', 'restaurant', 'cooking'], 3),
('nature', '自然', '自然环境图标', 'Nature, plants, animals and outdoor icons', ARRAY['nature', 'plants', 'animals', 'outdoor'], 4),
('celebration', '庆祝', '节日庆祝图标', 'Holiday, celebration and party icons', ARRAY['celebration', 'party', 'holiday', 'festival'], 5),
('people', '人物', '人物相关图标', 'People, family and social icons', ARRAY['people', 'family', 'social', 'human'], 6),
('decoration', '装饰', '装饰性图标', 'Decorative elements and ornaments', ARRAY['decoration', 'ornament', 'design', 'border'], 7);

-- 插入系统配置
INSERT INTO ac_system_configs (config_key, config_value, config_type, description) VALUES
('ai_daily_limits', '{"user_limit": 20, "global_limit": 5000}', 'ai_limits', 'AI使用每日限制配置'),
('credit_pricing', '{"collage": 5, "download": 10, "premium_template": 15}', 'pricing', '积分消耗定价'),
('invitation_rewards', '{"inviter": 20, "invitee": 20}', 'pricing', '邀请奖励配置'),
('free_trial_limits', '{"anonymous_usage": 3, "session_duration_days": 30}', 'features', '免费试用限制'),
('ai_models', '{"primary": "gemini-pro-vision", "fallback": "gemini-pro"}', 'ai_limits', 'AI模型配置'); 