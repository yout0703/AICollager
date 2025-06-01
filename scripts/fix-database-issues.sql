-- 修复AI使用统计表的字段不匹配问题
-- 创建日期: 2025-01-25

-- 备份当前数据（如果有的话）
CREATE TABLE IF NOT EXISTS ac_ai_usage_stats_backup AS SELECT * FROM ac_ai_usage_stats;

-- 删除并重新创建ac_ai_usage_stats表
DROP TABLE IF EXISTS ac_ai_usage_stats CASCADE;

CREATE TABLE ac_ai_usage_stats (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
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

-- 创建索引
CREATE INDEX idx_ac_ai_usage_stats_date ON ac_ai_usage_stats(date);
CREATE INDEX idx_ac_ai_usage_stats_created_at ON ac_ai_usage_stats(created_at);

-- 如果有备份数据，尝试迁移（根据字段映射）
INSERT INTO ac_ai_usage_stats (
    date, total_requests, successful_requests, failed_requests,
    image_analysis_count, layout_suggestion_count, icon_recommendation_count,
    estimated_cost, avg_response_time, created_at
)
SELECT 
    date,
    total_requests,
    successful_requests,
    failed_requests,
    image_analysis_requests as image_analysis_count,
    layout_generation_requests as layout_suggestion_count,
    icon_recommendation_requests as icon_recommendation_count,
    total_cost as estimated_cost,
    avg_processing_time as avg_response_time,
    created_at
FROM ac_ai_usage_stats_backup
WHERE EXISTS (SELECT 1 FROM ac_ai_usage_stats_backup LIMIT 1)
ON CONFLICT (date) DO NOTHING;

-- 删除备份表
DROP TABLE IF EXISTS ac_ai_usage_stats_backup;

-- 创建触发器更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_usage_stats_updated_at 
    BEFORE UPDATE ON ac_ai_usage_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入今天的初始记录
INSERT INTO ac_ai_usage_stats (date) 
VALUES (CURRENT_DATE)
ON CONFLICT (date) DO NOTHING;

COMMIT;

-- 显示修复结果
SELECT 'AI使用统计表修复完成' as message;
SELECT tablename, schemaname FROM pg_tables WHERE tablename = 'ac_ai_usage_stats';
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'ac_ai_usage_stats' 
ORDER BY ordinal_position; 