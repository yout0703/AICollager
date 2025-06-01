import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseType, getSupabaseClient, getServerSupabaseClient } from '@/models/db';
import { DatabaseAdapter } from '@/lib/database-adapter';

export async function GET(request: NextRequest) {
  try {
    const dbType = getDatabaseType();
    
    if (dbType !== 'supabase') {
      return NextResponse.json({
        success: false,
        message: 'Supabase 配置未找到，当前使用 PostgreSQL',
        dbType,
        config: {
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        }
      }, { status: 400 });
    }

    // 测试客户端连接
    const clientSupabase = getSupabaseClient();
    
    // 测试服务端连接
    const serverSupabase = getServerSupabaseClient();

    // 测试数据库适配器
    const adapter = new DatabaseAdapter();
    const serverAdapter = new DatabaseAdapter(true);

    // 测试基本连接
    const { data: healthCheck, error: healthError } = await serverSupabase
      .from('ac_users')
      .select('count(*)')
      .limit(1);

    const tests: any[] = [];

    // 测试 1: 基本连接
    tests.push({
      name: '基本连接测试',
      success: !healthError,
      error: healthError?.message,
      data: healthCheck
    });

    // 测试 2: 客户端查询（使用 RLS）
    try {
      const clientResult = await adapter.select('ac_icons', {
        select: 'icon_id, name, status',
        where: { status: 'active' },
        limit: 5
      });
      
      tests.push({
        name: '客户端查询测试（RLS）',
        success: !clientResult.error,
        error: clientResult.error?.message,
        recordCount: clientResult.data?.length || 0
      });
    } catch (error: any) {
      tests.push({
        name: '客户端查询测试（RLS）',
        success: false,
        error: error.message
      });
    }

    // 测试 3: 服务端查询（绕过 RLS）
    try {
      const serverResult = await serverAdapter.select('ac_users', {
        select: 'id, email, created_at',
        limit: 5
      });
      
      tests.push({
        name: '服务端查询测试（绕过 RLS）',
        success: !serverResult.error,
        error: serverResult.error?.message,
        recordCount: serverResult.data?.length || 0
      });
    } catch (error: any) {
      tests.push({
        name: '服务端查询测试（绕过 RLS）',
        success: false,
        error: error.message
      });
    }

    // 测试 4: 表存在性检查
    const tableChecks = [
      'ac_users',
      'ac_collages', 
      'ac_credit_transactions',
      'ac_icons',
      'ac_user_sessions'
    ];

    for (const table of tableChecks) {
      try {
        const { data, error } = await serverSupabase
          .from(table)
          .select('count(*)')
          .limit(1);
        
        tests.push({
          name: `表存在性检查: ${table}`,
          success: !error,
          error: error?.message
        });
      } catch (error: any) {
        tests.push({
          name: `表存在性检查: ${table}`,
          success: false,
          error: error.message
        });
      }
    }

    const successfulTests = tests.filter(t => t.success).length;
    const totalTests = tests.length;

    return NextResponse.json({
      success: successfulTests === totalTests,
      message: `Supabase 连接测试完成: ${successfulTests}/${totalTests} 通过`,
      dbType: 'supabase',
      config: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      },
      tests,
      summary: {
        total: totalTests,
        passed: successfulTests,
        failed: totalTests - successfulTests
      }
    });

  } catch (error: any) {
    console.error('Supabase 测试失败:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Supabase 连接测试失败',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? 
        error.stack : '生产环境不显示详细错误'
    }, { status: 500 });
  }
} 