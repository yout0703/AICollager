import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseType, getSupabaseClient, getServerSupabaseClient } from '@/models/db';

export async function GET(req: NextRequest) {
  console.log('🔄 [DB_STATUS] 开始数据库状态检查');
  
  try {
    // 检查环境变量
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasClerkSecretKey: !!process.env.CLERK_SECRET_KEY,
      hasClerkPublishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
        process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + '...' : 'Not set'
    };
    
    console.log('🔍 [DB_STATUS] 环境变量检查:', envCheck);
    
    // 检查数据库类型
    const dbType = getDatabaseType();
    console.log('🔍 [DB_STATUS] 数据库类型:', dbType);
    
    const dbStatus = {
      type: dbType,
      clientConnection: false,
      serverConnection: false,
      error: null as string | null
    };
    
    if (dbType === 'supabase') {
      try {
        // 测试客户端连接
        const clientSupabase = getSupabaseClient();
        if (clientSupabase) {
          console.log('✅ [DB_STATUS] Supabase 客户端创建成功');
          dbStatus.clientConnection = true;
        }
        
        // 测试服务端连接
        const serverSupabase = getServerSupabaseClient();
        if (serverSupabase) {
          console.log('✅ [DB_STATUS] Supabase 服务端客户端创建成功');
          
          // 尝试简单查询 - 使用正确的表名 ac_users
          const { data, error } = await serverSupabase
            .from('ac_users')
            .select('count')
            .limit(1);
            
          if (error) {
            console.log('⚠️ [DB_STATUS] Supabase 查询测试失败:', error);
            dbStatus.error = error.message;
          } else {
            console.log('✅ [DB_STATUS] Supabase 查询测试成功');
            dbStatus.serverConnection = true;
          }
        }
      } catch (error) {
        console.error('❌ [DB_STATUS] Supabase 连接测试失败:', error);
        dbStatus.error = error instanceof Error ? error.message : String(error);
      }
    }
    
    const result = {
      timestamp: new Date().toISOString(),
      environment: envCheck,
      database: dbStatus,
      status: dbStatus.clientConnection && dbStatus.serverConnection ? 'healthy' : 'error'
    };
    
    console.log('📊 [DB_STATUS] 最终状态:', result);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('❌ [DB_STATUS] 状态检查失败:', error);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 