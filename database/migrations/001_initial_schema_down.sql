-- =====================================
-- Rollback: 001_initial_schema
-- Description: 回滚初始数据库结构
-- Author: AI Collager Team
-- Date: 2025-01-25
-- =====================================

-- 删除触发器
DROP TRIGGER IF EXISTS update_ac_collage_images_updated_at ON ac_collage_images;
DROP TRIGGER IF EXISTS update_ac_collages_updated_at ON ac_collages;
DROP TRIGGER IF EXISTS update_ac_user_sessions_updated_at ON ac_user_sessions;
DROP TRIGGER IF EXISTS update_ac_users_updated_at ON ac_users;

-- 删除函数
DROP FUNCTION IF EXISTS update_updated_at_column();

-- 删除索引 (CASCADE会自动删除，但明确列出更清晰)
DROP INDEX IF EXISTS idx_ac_collage_images_image_index;
DROP INDEX IF EXISTS idx_ac_collage_images_collage_id;
DROP INDEX IF EXISTS idx_ac_collages_deleted_at;
DROP INDEX IF EXISTS idx_ac_collages_created_at;
DROP INDEX IF EXISTS idx_ac_collages_visibility;
DROP INDEX IF EXISTS idx_ac_collages_status;
DROP INDEX IF EXISTS idx_ac_collages_session_id;
DROP INDEX IF EXISTS idx_ac_collages_user_id;
DROP INDEX IF EXISTS idx_ac_user_sessions_expires_at;
DROP INDEX IF EXISTS idx_ac_user_sessions_session_id;
DROP INDEX IF EXISTS idx_ac_users_created_at;
DROP INDEX IF EXISTS idx_ac_users_status;
DROP INDEX IF EXISTS idx_ac_users_email;
DROP INDEX IF EXISTS idx_ac_users_clerk_id;

-- 删除表 (按依赖关系的逆序删除)
DROP TABLE IF EXISTS ac_collage_images CASCADE;
DROP TABLE IF EXISTS ac_collages CASCADE;
DROP TABLE IF EXISTS ac_user_sessions CASCADE;
DROP TABLE IF EXISTS ac_users CASCADE;

-- 删除扩展 (谨慎删除，可能被其他应用使用)
-- DROP EXTENSION IF EXISTS "uuid-ossp";

COMMIT; 