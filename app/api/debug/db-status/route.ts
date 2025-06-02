import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

// 检查是否允许访问调试 API
function isDebugAccessAllowed(userId?: string | null): boolean {
  // 在开发环境允许所有人访问
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  // 在生产环境需要特定的环境变量或用户权限
  const debugEnabled = process.env.ENABLE_DEBUG_API === 'true';
  if (!debugEnabled) {
    return false;
  }

  // 可以添加更多的权限检查逻辑
  return true;
}

export async function GET(request: NextRequest) {
  try {
    // 获取用户认证信息
    const { userId } = await auth();
    
    // 检查访问权限
    if (!isDebugAccessAllowed(userId)) {
      return NextResponse.json(
        { error: '调试 API 在生产环境中被禁用' },
        { status: 403 }
      );
    }

    console.log('🔄 [DB_STATUS] 开始数据库状态检查');
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV || 'unknown',
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasClerkSecretKey: !!process.env.CLERK_SECRET_KEY,
        hasClerkPublishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL 
          ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...` 
          : 'N/A',
      },
      database: {
        type: 'Supabase',
        clientConnection: false,
        serverConnection: false,
        error: null as string | null,
      },
      status: 'unknown' as 'healthy' | 'unhealthy' | 'unknown'
    };

    // 测试客户端连接（使用 anon key）
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        console.log('🔍 [DEBUG API] 测试客户端连接');
        const supabaseClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        
        const { data, error } = await supabaseClient
          .from('ac_users')
          .select('count')
          .limit(1);
        
        if (error) {
          console.log('⚠️ [DEBUG API] 客户端连接错误:', error.message);
          debugInfo.database.error = `客户端连接错误: ${error.message}`;
        } else {
          console.log('✅ [DEBUG API] 客户端连接成功');
          debugInfo.database.clientConnection = true;
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.log('❌ [DEBUG API] 客户端连接异常:', errorMsg);
        debugInfo.database.error = `客户端连接异常: ${errorMsg}`;
      }
    }

    // 测试服务端连接（使用 service role key）
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        console.log('🔍 [DEBUG API] 测试服务端连接');
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        );
        
        const { data, error } = await supabaseAdmin
          .from('ac_users')
          .select('count')
          .limit(1);
        
        if (error) {
          console.log('⚠️ [DEBUG API] 服务端连接错误:', error.message);
          if (!debugInfo.database.error) {
            debugInfo.database.error = `服务端连接错误: ${error.message}`;
          }
        } else {
          console.log('✅ [DEBUG API] 服务端连接成功');
          debugInfo.database.serverConnection = true;
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.log('❌ [DEBUG API] 服务端连接异常:', errorMsg);
        if (!debugInfo.database.error) {
          debugInfo.database.error = `服务端连接异常: ${errorMsg}`;
        }
      }
    }

    // 确定整体状态
    if (debugInfo.database.clientConnection && debugInfo.database.serverConnection) {
      debugInfo.status = 'healthy';
    } else if (debugInfo.database.clientConnection || debugInfo.database.serverConnection) {
      debugInfo.status = 'unhealthy';
    } else {
      debugInfo.status = 'unhealthy';
    }

    console.log('🔍 [DEBUG API] 数据库状态检查完成:', debugInfo.status);
    
    return NextResponse.json(debugInfo);
  } catch (error) {
    console.error('❌ [DEBUG API] 检查数据库状态时发生错误:', error);
    return NextResponse.json(
      { 
        error: '检查数据库状态时发生错误',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 