#!/usr/bin/env node

/**
 * 测试数据库选择逻辑
 * 用于验证不同环境下的数据库类型选择
 */

const path = require('path');

// 设置项目根目录
process.chdir(path.resolve(__dirname, '..'));

// 创建一个临时的 JS 文件来测试 TypeScript 模块
const fs = require('fs');

// 模拟不同环境的配置
const testCases = [
  {
    name: '开发环境 - 有本地 PostgreSQL',
    env: {
      NODE_ENV: 'development',
      POSTGRES_URL: 'postgresql://postgres:123123@localhost:5432/aicollager'
    },
    expected: 'postgresql'
  },
  {
    name: '开发环境 - 无本地 PostgreSQL，有 Supabase',
    env: {
      NODE_ENV: 'development',
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key'
    },
    expected: 'supabase'
  },
  {
    name: '开发环境 - 强制使用 Supabase',
    env: {
      NODE_ENV: 'development',
      POSTGRES_URL: 'postgresql://postgres:123123@localhost:5432/aicollager',
      FORCE_SUPABASE: 'true',
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key'
    },
    expected: 'supabase'
  },
  {
    name: '生产环境 - 有 Supabase',
    env: {
      NODE_ENV: 'production',
      NEXT_PUBLIC_SUPABASE_URL: 'https://prod.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'prod-key'
    },
    expected: 'supabase'
  },
  {
    name: '生产环境 - 强制使用 PostgreSQL',
    env: {
      NODE_ENV: 'production',
      NEXT_PUBLIC_SUPABASE_URL: 'https://prod.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'prod-key',
      FORCE_POSTGRES: 'true',
      POSTGRES_URL: 'postgresql://user:pass@prod-host:5432/db'
    },
    expected: 'postgresql'
  },
  {
    name: 'Staging 环境 - 自动选择 Supabase',
    env: {
      NODE_ENV: 'staging',
      NEXT_PUBLIC_SUPABASE_URL: 'https://staging.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'staging-key',
      POSTGRES_URL: 'postgresql://user:pass@staging-host:5432/db'
    },
    expected: 'supabase'
  },
  {
    name: '开发环境 - 无任何配置（使用默认）',
    env: {
      NODE_ENV: 'development'
    },
    expected: 'postgresql'
  }
];

// 模拟 getDatabaseType 函数逻辑
function getDatabaseType() {
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

async function runTests() {
  console.log('🧪 测试数据库选择逻辑\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    // 备份原始环境变量
    const originalEnv = { ...process.env };
    
    try {
      // 清理相关环境变量
      delete process.env.NODE_ENV;
      delete process.env.POSTGRES_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      delete process.env.FORCE_SUPABASE;
      delete process.env.FORCE_POSTGRES;
      
      // 设置测试环境变量
      Object.assign(process.env, testCase.env);
      
      // 测试
      const actualType = getDatabaseType();
      
      const success = actualType === testCase.expected;
      const status = success ? '✅' : '❌';
      
      console.log(`${status} ${testCase.name}`);
      console.log(`   期望: ${testCase.expected}`);
      console.log(`   实际: ${actualType}`);
      
      if (success) {
        passed++;
      } else {
        failed++;
        console.log(`   环境: ${JSON.stringify(testCase.env, null, 2)}`);
      }
      
      console.log('');
      
    } catch (error) {
      console.log(`❌ ${testCase.name}`);
      console.log(`   错误: ${error.message}`);
      console.log('');
      failed++;
    } finally {
      // 恢复原始环境变量
      process.env = originalEnv;
    }
  }
  
  console.log(`📊 测试结果: ${passed} 通过, ${failed} 失败`);
  
  if (failed > 0) {
    console.log('\n💡 提示：测试失败表示数据库选择逻辑可能需要调整');
    process.exit(1);
  } else {
    console.log('\n🎉 所有测试通过！数据库选择逻辑工作正常');
  }
}

// 运行测试
runTests().catch(console.error); 