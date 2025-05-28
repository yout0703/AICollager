#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// 从环境变量获取数据库连接
const connectionString = process.env.POSTGRES_URL || 'postgresql://postgres:123123@localhost:5432/aicollager';

async function migrate() {
  const pool = new Pool({ connectionString });
  
  try {
    console.log('🚀 开始数据库迁移...');
    
    // 读取SQL文件
    const sqlPath = path.join(__dirname, '../data/new_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // 执行迁移
    await pool.query(sql);
    
    console.log('✅ 数据库迁移完成！');
    
    // 验证表是否创建成功
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'ac_%'
      ORDER BY table_name
    `);
    
    console.log('\n📋 已创建的表:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // 检查初始化数据
    const iconCategoriesResult = await pool.query('SELECT COUNT(*) as count FROM ac_icon_categories');
    const systemConfigsResult = await pool.query('SELECT COUNT(*) as count FROM ac_system_configs');
    
    console.log('\n📊 初始化数据:');
    console.log(`  - Icon分类: ${iconCategoriesResult.rows[0].count} 条`);
    console.log(`  - 系统配置: ${systemConfigsResult.rows[0].count} 条`);
    
  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  migrate();
}

module.exports = { migrate }; 