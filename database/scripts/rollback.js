#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const readline = require('readline');

// 加载配置
const dbConfig = require('../config/database.json');
const migrationConfig = require('../config/migration.json');

// 当前环境
const environment = process.env.NODE_ENV || 'development';
const config = dbConfig[environment];

if (!config) {
  console.error(`❌ 环境配置 "${environment}" 不存在`);
  process.exit(1);
}

// 数据库连接池
const pool = new Pool(config);

// 获取已执行的迁移
async function getExecutedMigrations() {
  const result = await pool.query(
    `SELECT version, name FROM ${migrationConfig.migrationTable} 
     WHERE success = true 
     ORDER BY version DESC`
  );
  return result.rows;
}

// 执行回滚SQL文件
async function executeRollbackFile(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  const statements = sql.split(';').filter(stmt => stmt.trim());
  
  const startTime = Date.now();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    for (const statement of statements) {
      if (statement.trim()) {
        await client.query(statement);
      }
    }
    
    await client.query('COMMIT');
    const executionTime = Date.now() - startTime;
    
    return { success: true, executionTime };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// 删除迁移记录
async function removeMigrationRecord(version) {
  await pool.query(
    `DELETE FROM ${migrationConfig.migrationTable} WHERE version = $1`,
    [version]
  );
}

// 用户确认
function askConfirmation(message) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question(`${message} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// 创建备份
async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(__dirname, '..', 'backups', `rollback_backup_${timestamp}.sql`);
  
  // 确保备份目录存在
  const backupDir = path.dirname(backupFile);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  console.log('📦 创建回滚前备份...');
  
  const { spawn } = require('child_process');
  return new Promise((resolve, reject) => {
    const args = [
      '-h', config.host,
      '-p', config.port.toString(),
      '-U', config.username,
      '-d', config.database,
      '-f', backupFile,
      '--no-password',
      '--verbose'
    ];
    
    const pgDump = spawn('pg_dump', args, {
      env: { ...process.env, PGPASSWORD: config.password }
    });
    
    pgDump.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ 备份已创建: ${backupFile}`);
        resolve(backupFile);
      } else {
        reject(new Error(`备份失败，退出码: ${code}`));
      }
    });
    
    pgDump.on('error', reject);
  });
}

// 执行回滚
async function rollbackMigration(targetVersion = null) {
  try {
    console.log(`⬅️ 开始数据库回滚 (环境: ${environment})`);
    
    // 获取已执行的迁移
    const executedMigrations = await getExecutedMigrations();
    
    if (executedMigrations.length === 0) {
      console.log('✅ 没有可回滚的迁移');
      return;
    }
    
    // 确定要回滚的迁移
    let migrationsToRollback = [];
    if (targetVersion) {
      // 回滚到指定版本
      migrationsToRollback = executedMigrations.filter(m => m.version > targetVersion);
    } else {
      // 回滚最后一个迁移
      migrationsToRollback = [executedMigrations[0]];
    }
    
    if (migrationsToRollback.length === 0) {
      console.log('✅ 没有需要回滚的迁移');
      return;
    }
    
    console.log(`📋 将回滚以下迁移:`);
    migrationsToRollback.forEach(m => {
      console.log(`   - ${m.version}: ${m.name}`);
    });
    
    // 生产环境需要确认
    const envConfig = migrationConfig.environments[environment];
    if (envConfig.requireConfirmation) {
      const confirmed = await askConfirmation('⚠️ 确认执行这些回滚？');
      if (!confirmed) {
        console.log('❌ 回滚已取消');
        return;
      }
    }
    
    // 创建备份
    if (envConfig.requireBackup || migrationConfig.backupBeforeMigration) {
      await createBackup();
    }
    
    // 执行回滚
    for (const migration of migrationsToRollback) {
      const rollbackFile = path.join(__dirname, '..', 'migrations', `${migration.version}_*_down.sql`);
      
      // 查找实际的回滚文件
      const migrationDir = path.join(__dirname, '..', 'migrations');
      const files = fs.readdirSync(migrationDir);
      const rollbackFileName = files.find(file => file.startsWith(migration.version) && file.endsWith('_down.sql'));
      
      if (!rollbackFileName) {
        throw new Error(`找不到回滚文件: ${migration.version}_*_down.sql`);
      }
      
      const rollbackFilePath = path.join(migrationDir, rollbackFileName);
      
      console.log(`⚡ 回滚迁移: ${migration.version} - ${migration.name}`);
      
      try {
        const result = await executeRollbackFile(rollbackFilePath);
        await removeMigrationRecord(migration.version);
        
        console.log(`✅ 回滚成功: ${migration.version} (耗时: ${result.executionTime}ms)`);
      } catch (error) {
        console.error(`❌ 回滚失败: ${migration.version}`);
        console.error('错误:', error.message);
        throw error;
      }
    }
    
    console.log('🎉 回滚执行完成！');
    
  } catch (error) {
    console.error('💥 回滚过程中发生错误:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// 主程序
async function main() {
  const target = process.argv[2];
  
  await rollbackMigration(target);
}

// 运行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  rollbackMigration
}; 