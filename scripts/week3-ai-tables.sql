-- Week 3: AI服务集成 - 数据库表结构
-- 添加AI分析缓存表和AI使用统计表

-- AI分析缓存表
CREATE TABLE IF NOT EXISTS ac_ai_analysis_cache (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  
  -- 缓存信息
  cache_key VARCHAR(64) UNIQUE NOT NULL,
  cache_type VARCHAR(50) NOT NULL, -- 'image_analysis' | 'layout_suggestion' | 'icon_recommendation'
  
  -- AI模型信息
  ai_model VARCHAR(100) NOT NULL,
  model_version VARCHAR(50),
  
  -- 输入和输出数据
  input_data JSONB,
  analysis_result JSONB NOT NULL,
  confidence_score DECIMAL(5,4), -- 0.0000 to 1.0000
  
  -- 使用统计
  use_count INTEGER DEFAULT 1 NOT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- 时间信息
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- AI使用统计表
CREATE TABLE IF NOT EXISTS ac_ai_usage_stats (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  
  -- 统计周期
  date DATE NOT NULL, -- YYYY-MM-DD
  stat_type VARCHAR(20) DEFAULT 'daily' NOT NULL, -- 'daily' | 'weekly' | 'monthly'
  
  -- 使用次数统计
  total_requests INTEGER DEFAULT 0 NOT NULL,
  successful_requests INTEGER DEFAULT 0 NOT NULL,
  failed_requests INTEGER DEFAULT 0 NOT NULL,
  cached_requests INTEGER DEFAULT 0 NOT NULL,
  
  -- 分类统计
  image_analysis_count INTEGER DEFAULT 0 NOT NULL,
  layout_suggestion_count INTEGER DEFAULT 0 NOT NULL,
  icon_recommendation_count INTEGER DEFAULT 0 NOT NULL,
  
  -- 成本统计
  estimated_cost DECIMAL(10,4) DEFAULT 0 NOT NULL, -- 美元
  cost_currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
  
  -- 性能统计
  avg_response_time DECIMAL(10,2) DEFAULT 0 NOT NULL, -- 毫秒
  total_processing_time DECIMAL(15,2) DEFAULT 0 NOT NULL, -- 总处理时间（毫秒）
  
  -- 元数据
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 创建索引

-- AI分析缓存表索引
CREATE INDEX IF NOT EXISTS idx_ai_cache_key ON ac_ai_analysis_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_cache_type ON ac_ai_analysis_cache(cache_type);
CREATE INDEX IF NOT EXISTS idx_ai_cache_model ON ac_ai_analysis_cache(ai_model);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expires ON ac_ai_analysis_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_cache_created ON ac_ai_analysis_cache(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_cache_use_count ON ac_ai_analysis_cache(use_count);
CREATE INDEX IF NOT EXISTS idx_ai_cache_last_used ON ac_ai_analysis_cache(last_used_at);

-- AI使用统计表索引
CREATE INDEX IF NOT EXISTS idx_ai_stats_date ON ac_ai_usage_stats(date);
CREATE INDEX IF NOT EXISTS idx_ai_stats_type ON ac_ai_usage_stats(stat_type);
CREATE INDEX IF NOT EXISTS idx_ai_stats_date_type ON ac_ai_usage_stats(date, stat_type);
CREATE INDEX IF NOT EXISTS idx_ai_stats_created ON ac_ai_usage_stats(created_at);

-- 添加约束
ALTER TABLE ac_ai_analysis_cache 
ADD CONSTRAINT chk_ai_cache_type 
CHECK (cache_type IN ('image_analysis', 'layout_suggestion', 'icon_recommendation'));

ALTER TABLE ac_ai_analysis_cache 
ADD CONSTRAINT chk_ai_cache_use_count 
CHECK (use_count >= 1);

ALTER TABLE ac_ai_analysis_cache 
ADD CONSTRAINT chk_ai_cache_confidence 
CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1));

ALTER TABLE ac_ai_usage_stats 
ADD CONSTRAINT chk_ai_stats_type 
CHECK (stat_type IN ('daily', 'weekly', 'monthly'));

ALTER TABLE ac_ai_usage_stats 
ADD CONSTRAINT chk_ai_stats_requests 
CHECK (total_requests >= 0 AND successful_requests >= 0 AND failed_requests >= 0 AND cached_requests >= 0);

ALTER TABLE ac_ai_usage_stats 
ADD CONSTRAINT chk_ai_stats_counts 
CHECK (image_analysis_count >= 0 AND layout_suggestion_count >= 0 AND icon_recommendation_count >= 0);

ALTER TABLE ac_ai_usage_stats 
ADD CONSTRAINT chk_ai_stats_cost 
CHECK (estimated_cost >= 0);

ALTER TABLE ac_ai_usage_stats 
ADD CONSTRAINT chk_ai_stats_performance 
CHECK (avg_response_time >= 0 AND total_processing_time >= 0);

-- 创建唯一约束
ALTER TABLE ac_ai_usage_stats 
ADD CONSTRAINT uk_ai_stats_date_type 
UNIQUE (date, stat_type);

-- 创建触发器更新 updated_at
CREATE TRIGGER update_ai_usage_stats_updated_at 
    BEFORE UPDATE ON ac_ai_usage_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入初始数据（可选）
-- 插入今天的统计记录（如果不存在）
INSERT INTO ac_ai_usage_stats (date, stat_type) 
VALUES (CURRENT_DATE, 'daily')
ON CONFLICT (date, stat_type) DO NOTHING;

-- 显示创建的表信息
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename LIKE 'ac_ai_%'
ORDER BY tablename;

-- 显示索引信息
SELECT 
    schemaname,
    indexname,
    tablename
FROM pg_indexes 
WHERE indexname LIKE 'idx_ai_%'
ORDER BY tablename, indexname; 