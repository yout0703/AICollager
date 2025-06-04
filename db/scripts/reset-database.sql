-- 删除所有表和相关约束
-- 这将完全清空数据库，准备重新创建

-- 1. 禁用外键约束检查
SET session_replication_role = replica;

-- 2. 删除所有用户创建的表
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- 删除所有表
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    
    -- 删除所有序列
    FOR r IN (SELECT sequencename FROM pg_sequences WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS public.' || quote_ident(r.sequencename) || ' CASCADE';
    END LOOP;
    
    -- 删除所有函数
    FOR r IN (SELECT proname, oidvectortypes(proargtypes) as argtypes 
              FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
              WHERE n.nspname = 'public' AND p.prokind = 'f') 
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.proname) || '(' || r.argtypes || ') CASCADE';
    END LOOP;
    
    -- 删除所有类型
    FOR r IN (SELECT typname FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid 
              WHERE n.nspname = 'public' AND t.typtype = 'e') 
    LOOP
        EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
    END LOOP;
END $$;

-- 3. 重新启用外键约束检查
SET session_replication_role = DEFAULT;

-- 4. 确保 public schema 存在并设置正确权限
CREATE SCHEMA IF NOT EXISTS public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- 5. 创建 UUID 扩展 (如果需要)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 完成
SELECT 'Database reset completed successfully' as status; 