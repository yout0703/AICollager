#!/usr/bin/env node

const { Pool } = require('pg');

// 从环境变量获取数据库连接
const connectionString = process.env.POSTGRES_URL || 'postgresql://postgres:123123@localhost:5432/aicollager';

async function verifyDatabase() {
  const pool = new Pool({ connectionString });
  
  try {
    console.log('🔍 验证数据库结构...\n');
    
    // 检查所有ac_前缀的表
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'ac_%'
      ORDER BY table_name
    `);
    
    console.log('📋 数据库表:');
    tablesResult.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}`);
    });
    
    // 检查用户表结构
    console.log('\n👤 用户表字段:');
    const userColumnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'ac_users' 
      ORDER BY ordinal_position
    `);
    
    userColumnsResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    });
    
    // 检查初始化数据
    console.log('\n📊 初始化数据:');
    
    const iconCategoriesResult = await pool.query('SELECT COUNT(*) as count FROM ac_icon_categories');
    console.log(`  - Icon分类: ${iconCategoriesResult.rows[0].count} 条`);
    
    const systemConfigsResult = await pool.query('SELECT COUNT(*) as count FROM ac_system_configs');
    console.log(`  - 系统配置: ${systemConfigsResult.rows[0].count} 条`);
    
    // 显示Icon分类
    const categoriesResult = await pool.query('SELECT category_id, category_name FROM ac_icon_categories ORDER BY display_order');
    console.log('\n🎨 Icon分类:');
    categoriesResult.rows.forEach(row => {
      console.log(`  - ${row.category_id}: ${row.category_name}`);
    });
    
    // 显示系统配置
    const configsResult = await pool.query('SELECT config_key, config_type FROM ac_system_configs ORDER BY config_key');
    console.log('\n⚙️ 系统配置:');
    configsResult.rows.forEach(row => {
      console.log(`  - ${row.config_key} (${row.config_type})`);
    });
    
    console.log('\n✅ 数据库验证完成！');
    
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  verifyDatabase();
}

module.exports = { verifyDatabase }; 