import { Pool } from "pg";
import { createClient } from '@supabase/supabase-js';

let globalPool: Pool;
let supabaseClient: ReturnType<typeof createClient>;

// Supabase 客户端
export function getSupabaseClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      supabaseClient = createClient(supabaseUrl, supabaseKey);
      return supabaseClient;
    }
  }
  return supabaseClient;
}

// 服务端 Supabase 客户端
export function getServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (supabaseUrl && serviceRoleKey) {
    return createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  
  throw new Error('Missing Supabase environment variables for server client');
}

// 检查当前使用的数据库类型
export function getDatabaseType(): 'supabase' | 'postgresql' {
  const nodeEnv = process.env.NODE_ENV;
  const forceSupabase = process.env.FORCE_SUPABASE === 'true';
  const forcePostgres = process.env.FORCE_POSTGRES === 'true';
  
  // 显式强制使用 Supabase
  if (forceSupabase) {
    return 'supabase';
  }
  
  // 显式强制使用 PostgreSQL
  if (forcePostgres) {
    return 'postgresql';
  }
  
  // 开发环境：优先使用本地 PostgreSQL
  if (nodeEnv === 'development') {
    const hasPostgresUrl = !!process.env.POSTGRES_URL;
    if (hasPostgresUrl) {
      console.log('🔧 开发环境：使用本地 PostgreSQL 数据库');
      return 'postgresql';
    }
    
    // 开发环境没有本地数据库配置，检查 Supabase
    const hasSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    if (hasSupabase) {
      console.log('🔧 开发环境：本地 PostgreSQL 未配置，使用 Supabase');
      return 'supabase';
    }
    
    console.log('🔧 开发环境：使用默认本地 PostgreSQL 配置');
    return 'postgresql';
  }
  
  // 生产环境：优先使用 Supabase
  if (nodeEnv === 'production') {
    const hasSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    if (hasSupabase) {
      console.log('🚀 生产环境：使用 Supabase 数据库');
      return 'supabase';
    }
    
    // 生产环境没有 Supabase 配置，检查 PostgreSQL
    const hasPostgresUrl = !!process.env.POSTGRES_URL;
    if (hasPostgresUrl) {
      console.log('🚀 生产环境：Supabase 未配置，使用 PostgreSQL');
      return 'postgresql';
    }
    
    throw new Error('生产环境需要配置 Supabase 或 PostgreSQL 数据库');
  }
  
  // 其他环境（staging 等）：根据配置自动选择
  const hasSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const hasPostgres = !!process.env.POSTGRES_URL;
  
  if (hasSupabase) {
    console.log(`🔄 ${nodeEnv} 环境：使用 Supabase 数据库`);
    return 'supabase';
  }
  
  if (hasPostgres) {
    console.log(`🔄 ${nodeEnv} 环境：使用 PostgreSQL 数据库`);
    return 'postgresql';
  }
  
  // 默认回退到 PostgreSQL
  console.log(`🔄 ${nodeEnv} 环境：默认使用 PostgreSQL 数据库`);
  return 'postgresql';
}

// 主数据库连接函数
export function getDb() {
  const dbType = getDatabaseType();
  
  if (dbType === 'supabase') {
    const supabase = getSupabaseClient();
    if (supabase) {
      return supabase;
    }
    // 如果 Supabase 客户端创建失败，回退到 PostgreSQL
    console.warn('⚠️ Supabase 客户端创建失败，回退到 PostgreSQL');
  }

  // 使用 PostgreSQL
  if (!globalPool) {
    const connectionString = process.env.POSTGRES_URL;
    
    if (!connectionString) {
      // 提供默认的开发环境连接字符串
      const defaultConnectionString = 'postgresql://postgres:123123@localhost:5432/aicollager';
      console.warn('⚠️ POSTGRES_URL 环境变量未设置，使用默认配置:', defaultConnectionString);
      
      globalPool = new Pool({
        connectionString: defaultConnectionString,
      });
    } else {
      globalPool = new Pool({
        connectionString,
      });
    }
  }

  return globalPool;
}
