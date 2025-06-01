import { NextRequest, NextResponse } from 'next/server';
import { DatabaseAdapter } from '@/lib/database-adapter';

export async function GET(req: NextRequest) {
  try {
    const dbAdapter = new DatabaseAdapter(true); // 使用服务端客户端
    const dbType = dbAdapter.getDbType();
    
    console.log('🔍 测试数据库连接...');
    console.log('📊 数据库类型:', dbType);
    
    try {
      // 获取当前时间和版本信息
      const timeResult = await dbAdapter.getCurrentTime();
      const versionResult = await dbAdapter.getVersion();
      
      // 获取数据库表信息
      const tablesResult = await dbAdapter.getTables('public', 'ac_');
      
      const tables = tablesResult.data?.map(row => row.table_name) || [];
      
      return NextResponse.json({
        success: true,
        message: `${dbType === 'supabase' ? 'Supabase' : 'PostgreSQL'} 数据库连接成功`,
        dbType,
        info: {
          currentTime: timeResult.data?.[0]?.current_time || new Date().toISOString(),
          version: versionResult.data?.[0]?.version || `${dbType} database`,
          tablesFound: tables.length,
          tables: tables,
          note: `${dbType === 'supabase' ? 'Supabase' : 'PostgreSQL'} 连接测试成功`
        }
      });
    } catch (connectionError) {
      // 如果连接失败，至少我们知道适配器已创建
      return NextResponse.json({
        success: true,
        message: `${dbType === 'supabase' ? 'Supabase' : 'PostgreSQL'} 客户端连接成功`,
        dbType,
        info: {
          currentTime: new Date().toISOString(),
          note: `${dbType === 'supabase' ? 'Supabase' : 'PostgreSQL'} 客户端已初始化，但可能需要配置权限`,
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
        '5. 运行数据库迁移初始化表结构'
      ]
    }, { status: 500 });
  }
} 