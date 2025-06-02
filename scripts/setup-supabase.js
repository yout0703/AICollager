#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Supabase 数据库设置指南');
console.log('================================\n');

// 检查环境变量
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
  'SUPABASE_SERVICE_ROLE_KEY'
];

console.log('📋 1. 检查环境变量配置');
console.log('--------------------------------');

let missingVars = [];
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${varName.includes('URL') ? value : '已配置'}`);
  } else {
    console.log(`❌ ${varName}: 未配置`);
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  console.log('\n⚠️  缺少必要的环境变量！');
  console.log('请在 Vercel 项目设置中添加以下环境变量：');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log('\n📖 获取这些值的方法：');
  console.log('   1. 登录 Supabase Dashboard: https://supabase.com/dashboard');
  console.log('   2. 选择你的项目');
  console.log('   3. 进入 Settings > API');
  console.log('   4. 复制相应的值到 Vercel 环境变量中');
  console.log('');
}

// 读取 schema.sql
console.log('📄 2. 数据库 Schema 准备');
console.log('--------------------------------');

const schemaPath = path.join(__dirname, '../database/supabase/schema.sql');

try {
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  console.log(`✅ Schema 文件已找到: ${schemaPath}`);
  console.log(`📊 文件大小: ${(schemaContent.length / 1024).toFixed(1)} KB`);
  
  // 分析 schema 内容
  const tableMatches = schemaContent.match(/CREATE TABLE\s+(\w+)/gi);
  if (tableMatches) {
    console.log(`📋 将创建 ${tableMatches.length} 个表:`);
    tableMatches.forEach(match => {
      const tableName = match.replace(/CREATE TABLE\s+/i, '');
      console.log(`   - ${tableName}`);
    });
  }
  
  console.log('\n🔧 3. 在 Supabase 中执行 Schema');
  console.log('--------------------------------');
  console.log('请按照以下步骤在 Supabase 中创建数据库表：\n');
  
  console.log('方法一：使用 Supabase Dashboard (推荐)');
  console.log('1. 访问 Supabase Dashboard: https://supabase.com/dashboard');
  console.log('2. 选择你的项目');
  console.log('3. 点击左侧菜单的 "SQL Editor"');
  console.log('4. 点击 "New query"');
  console.log('5. 复制以下 SQL 内容并粘贴到编辑器中：');
  console.log('6. 点击 "Run" 执行\n');
  
  console.log('方法二：使用 Supabase CLI');
  console.log('1. 登录: supabase login');
  console.log('2. 链接项目: supabase link --project-ref YOUR_PROJECT_REF');
  console.log('3. 推送 schema: supabase db push\n');
  
  // 将 schema 内容写入临时文件，方便复制
  const tempSchemaPath = path.join(__dirname, '../temp_schema_for_supabase.sql');
  fs.writeFileSync(tempSchemaPath, schemaContent);
  console.log(`📋 Schema 内容已复制到: ${tempSchemaPath}`);
  console.log('你可以直接复制这个文件的内容到 Supabase SQL Editor 中执行。\n');
  
} catch (error) {
  console.log(`❌ 无法读取 schema 文件: ${error.message}`);
}

console.log('🧪 4. 验证设置');
console.log('--------------------------------');
console.log('执行 schema 后，你可以通过以下方式验证：');
console.log('1. 访问你的调试页面: https://你的域名/debug');
console.log('2. 检查数据库连接状态');
console.log('3. 测试用户设置流程');
console.log('');

console.log('🎯 5. 常见问题');
console.log('--------------------------------');
console.log('如果遇到权限错误：');
console.log('- 确保使用的是 service_role key 而不是 anon key');
console.log('- 检查 RLS (Row Level Security) 策略');
console.log('');
console.log('如果表已存在：');
console.log('- 可以先删除现有表：DROP TABLE IF EXISTS table_name CASCADE;');
console.log('- 或者使用 CREATE TABLE IF NOT EXISTS');
console.log('');

console.log('✨ 设置完成后，重新访问你的应用进行测试！'); 