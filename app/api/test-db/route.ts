import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 测试数据库连接...');
    console.log('📊 数据库类型: Drizzle ORM with PostgreSQL');
    
    try {
      // 获取当前时间
      const timeResult = await db.execute(sql`SELECT NOW() as current_time`);
      
      // 获取版本信息
      const versionResult = await db.execute(sql`SELECT version() as version`);
      
      // 获取数据库表信息
      const tablesResult = await db.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name LIKE 'ac_%'
        ORDER BY table_name
      `);
      
      const tables = (tablesResult as any[]).map(row => row.table_name);
      
      return NextResponse.json({
        success: true,
        message: 'Drizzle ORM 数据库连接成功',
        dbType: 'drizzle-postgresql',
        info: {
          currentTime: (timeResult as any[])[0]?.current_time,
          version: (versionResult as any[])[0]?.version,
          tablesFound: tables.length,
          tables: tables,
          note: 'Drizzle ORM 连接测试成功'
        }
      });
    } catch (connectionError) {
      // 如果连接失败，返回错误信息
      return NextResponse.json({
        success: false,
        message: 'Drizzle ORM 连接失败',
        dbType: 'drizzle-postgresql',
        info: {
          currentTime: new Date().toISOString(),
          note: 'Drizzle ORM 客户端初始化失败',
          error: connectionError instanceof Error ? connectionError.message : '连接测试失败'
        }
      });
    }
    
  } catch (error) {
    console.error('数据库连接测试失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      suggestions: [
        '1. 确认数据库服务已启动',
        '2. 检查 .env.local 中的数据库配置',
        '3. 确认数据库用户和密码正确',
        '4. 确认数据库已创建',
        '5. 运行 pnpm run db:push 初始化表结构'
      ]
    }, { status: 500 });
  }
} 