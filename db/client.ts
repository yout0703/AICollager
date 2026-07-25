import { drizzle } from 'drizzle-orm/postgres-js'
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless'
import postgres from 'postgres'
import { Pool } from '@neondatabase/serverless'
import * as schema from './schema'

// 根据环境选择连接方式
function createDbClient() {
  // 尝试从多个环境变量获取连接字符串
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!connectionString) {
    throw new Error(
      '数据库连接字符串未配置。请在 .env.local 中设置 POSTGRES_URL 或 DATABASE_URL（参见 env.example）'
    )
  }

  // 检查是否为 Neon serverless 环境 (生产环境或 serverless 部署)
  const isServerless = process.env.NODE_ENV === 'production' ||
                      process.env.VERCEL ||
                      connectionString.includes('neon.tech') ||
                      connectionString.includes('supabase.co')

  if (isServerless) {
    // 生产环境或 Vercel 部署使用 Neon Serverless
    const client = new Pool({ connectionString })
    return drizzleNeon(client, {
      schema,
      casing: 'snake_case'
    })
  } else {
    // 开发环境使用标准 postgres 连接
    const client = postgres(connectionString, {
      max: 1,                    // 开发环境只需要一个连接
      idle_timeout: 20,          // 空闲20秒后关闭
      connect_timeout: 10,       // 连接超时10秒
      prepare: false,            // 禁用预编译语句 (适合 serverless)
    })
    return drizzle(client, {
      schema,
      casing: 'snake_case'
    })
  }
}

// 导出数据库客户端实例
export const db = createDbClient()

// 导出类型
export type Database = typeof db
