import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// 获取数据库连接字符串
function getDatabaseUrl(): string {
  const forceSupabase = process.env.FORCE_SUPABASE === 'true';
  const forcePostgres = process.env.FORCE_POSTGRES === 'true';

  // 显式强制使用 Supabase
  if (forceSupabase && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    // 从 Supabase URL 构建连接字符串
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (serviceKey) {
      // 提取 Supabase 项目信息
      const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
      if (match) {
        const projectRef = match[1];
        return `postgresql://postgres:${encodeURIComponent(serviceKey)}@db.${projectRef}.supabase.co:5432/postgres`;
      }
    }
  }
  
  // 显式强制使用 PostgreSQL 或有 DATABASE_URL
  if (forcePostgres || process.env.DATABASE_URL) {
    return process.env.DATABASE_URL!;
  }
  
  // 有 POSTGRES_URL (项目首选)
  if (process.env.POSTGRES_URL) {
    return process.env.POSTGRES_URL;
  }

  throw new Error(
    '数据库连接字符串未配置。请设置 POSTGRES_URL 或 DATABASE_URL（参见 env.example）'
  );
}

export default defineConfig({
  schema: "./db/schema/*",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: getDatabaseUrl(),
  },
  verbose: true,
  strict: true,
}); 