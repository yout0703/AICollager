import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/models/db';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    
    // 测试数据库连接
    console.log('🔍 测试数据库连接...');
    const result = await db.query('SELECT NOW() as current_time, version() as pg_version');
    
    // 检查数据库表
    const tablesResult = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'ac_%'
      ORDER BY table_name
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    
    return NextResponse.json({
      success: true,
      message: '数据库连接成功',
      info: {
        currentTime: result.rows[0].current_time,
        postgresVersion: result.rows[0].pg_version,
        tablesFound: tables.length,
        tables: tables
      }
    });
    
  } catch (error) {
    console.error('数据库连接测试失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      suggestions: [
        '1. 确认 PostgreSQL 服务已启动',
        '2. 检查 .env.local 中的 POSTGRES_URL 配置',
        '3. 确认数据库用户和密码正确',
        '4. 确认数据库 aicollager 已创建',
        '5. 运行 pnpm run db:migrate 初始化表结构'
      ]
    }, { status: 500 });
  }
} 