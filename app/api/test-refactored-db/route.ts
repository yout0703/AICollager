import { NextRequest, NextResponse } from 'next/server';
import { DatabaseAdapter } from '@/lib/database-adapter';
import { createAIAnalysisCache, findAIAnalysisCache, generateCacheKey } from '@/models/aiAnalysisCache';
import { createOrUpdateDailyAIStats, recordAIRequest } from '@/models/aiUsageStats';

export async function GET(req: NextRequest) {
  try {
    const dbAdapter = new DatabaseAdapter(true);
    const dbType = dbAdapter.getDbType();
    
    console.log('🧪 测试重构后的数据库适配器...');
    console.log('📊 数据库类型:', dbType);
    
    const tests: any[] = [];
    
    // 测试 1: 基本连接和信息获取
    try {
      const timeResult = await dbAdapter.getCurrentTime();
      const versionResult = await dbAdapter.getVersion();
      
      tests.push({
        name: '基本连接测试',
        success: true,
        data: {
          currentTime: timeResult.data?.[0]?.current_time,
          version: versionResult.data?.[0]?.version
        }
      });
    } catch (error) {
      tests.push({
        name: '基本连接测试',
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
    
    // 测试 2: 表查询
    try {
      const tablesResult = await dbAdapter.getTables('public', 'ac_');
      const tables = tablesResult.data?.map(row => row.table_name) || [];
      
      tests.push({
        name: '表查询测试',
        success: true,
        data: {
          tablesFound: tables.length,
          tables: tables.slice(0, 5) // 只显示前5个表
        }
      });
    } catch (error) {
      tests.push({
        name: '表查询测试',
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
    
    // 测试 3: 计数查询
    try {
      const userCount = await dbAdapter.count('ac_users');
      const collageCount = await dbAdapter.count('ac_collages');
      
      tests.push({
        name: '计数查询测试',
        success: true,
        data: {
          userCount,
          collageCount
        }
      });
    } catch (error) {
      tests.push({
        name: '计数查询测试',
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
    
    // 测试 4: AI 缓存操作
    try {
      const testData = { test: 'data', timestamp: Date.now() };
      const cacheKey = generateCacheKey(testData);
      
      // 创建缓存
      const cache = await createAIAnalysisCache({
        cache_key: cacheKey,
        cache_type: 'image_analysis',
        ai_model: 'test-model',
        analysis_result: { result: 'test analysis' },
        expires_days: 1
      });
      
      // 查找缓存
      const foundCache = await findAIAnalysisCache(cacheKey, 'image_analysis');
      
      tests.push({
        name: 'AI 缓存操作测试',
        success: true,
        data: {
          cacheCreated: !!cache,
          cacheFound: !!foundCache,
          cacheKey: cacheKey.substring(0, 16) + '...'
        }
      });
    } catch (error) {
      tests.push({
        name: 'AI 缓存操作测试',
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
    
    // 测试 5: AI 统计操作
    try {
      // 记录一个 AI 请求
      await recordAIRequest({
        type: 'image_analysis',
        success: true,
        cached: false,
        response_time: 1500,
        estimated_cost: 0.01
      });
      
      // 创建/更新统计
      const stats = await createOrUpdateDailyAIStats({
        increment_requests: 1,
        increment_successful: 1,
        increment_image_analysis: 1,
        add_cost: 0.01,
        add_response_time: 1500
      });
      
      tests.push({
        name: 'AI 统计操作测试',
        success: true,
        data: {
          statsCreated: !!stats,
          totalRequests: stats.total_requests,
          estimatedCost: stats.estimated_cost
        }
      });
    } catch (error) {
      tests.push({
        name: 'AI 统计操作测试',
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
    
    // 测试 6: 原始 SQL 查询（仅 PostgreSQL）
    if (dbType === 'postgresql') {
      try {
        const result = await dbAdapter.rawQuery('SELECT 1 as test_value');
        
        tests.push({
          name: '原始 SQL 查询测试',
          success: true,
          data: {
            testValue: result.data?.[0]?.test_value
          }
        });
      } catch (error) {
        tests.push({
          name: '原始 SQL 查询测试',
          success: false,
          error: error instanceof Error ? error.message : '未知错误'
        });
      }
    } else {
      tests.push({
        name: '原始 SQL 查询测试',
        success: false,
        error: 'Supabase 不支持原始 SQL 查询（这是预期的行为）'
      });
    }
    
    const successCount = tests.filter(test => test.success).length;
    const totalTests = tests.length;
    
    return NextResponse.json({
      success: true,
      message: `数据库适配器重构测试完成`,
      dbType,
      summary: {
        totalTests,
        successCount,
        failureCount: totalTests - successCount,
        successRate: `${Math.round((successCount / totalTests) * 100)}%`
      },
      tests,
      note: '所有数据库操作现在都使用统一的抽象接口，无需 if (dbType === "supabase") 判断'
    });
    
  } catch (error) {
    console.error('重构测试失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      message: '数据库适配器重构测试失败'
    }, { status: 500 });
  }
} 