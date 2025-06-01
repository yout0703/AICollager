#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const readline = require('readline');

// 加载配置
const dbConfigRaw = require('../config/database.json');
const migrationConfig = require('../config/migration.json');

// 当前环境
const environment = process.env.NODE_ENV || 'development';
const configTemplate = dbConfigRaw[environment];

if (!configTemplate) {
  console.error(`❌ 环境配置 "${environment}" 不存在`);
  process.exit(1);
}

// 处理环境变量替换
function resolveConfig(config) {
  const resolved = {};
  for (const [key, value] of Object.entries(config)) {
    if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
      const envVar = value.slice(2, -1);
      resolved[key] = process.env[envVar] || value;
    } else {
      resolved[key] = value;
    }
  }
  return resolved;
}

const config = resolveConfig(configTemplate);

console.log(`🔍 数据库连接配置 (${environment}):`, {
  host: config.host,
  port: config.port,
  database: config.database,
  username: config.username,
  password: '***'
});

// 数据库连接池
const pool = new Pool({
  host: config.host,
  port: config.port,
  database: config.database,
  user: config.username,
  password: config.password,
  ssl: config.ssl,
  max: config.max,
  idleTimeoutMillis: config.idleTimeoutMillis,
  connectionTimeoutMillis: config.connectionTimeoutMillis
});

// 创建迁移记录表
async function createMigrationTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS ${migrationConfig.migrationTable} (
      id SERIAL PRIMARY KEY,
      version VARCHAR(10) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      checksum VARCHAR(64) NOT NULL,
      executed_at TIMESTAMPTZ DEFAULT NOW(),
      execution_time INTEGER NOT NULL,
      success BOOLEAN NOT NULL DEFAULT true
    );
    
    CREATE INDEX IF NOT EXISTS idx_schema_migrations_version 
    ON ${migrationConfig.migrationTable}(version);
  `;
  
  await pool.query(createTableSQL);
}

// 获取已执行的迁移
async function getExecutedMigrations() {
  const result = await pool.query(
    `SELECT version FROM ${migrationConfig.migrationTable} WHERE success = true ORDER BY version`
  );
  return result.rows.map(row => row.version);
}

// 获取所有迁移文件
function getAllMigrations() {
  const migrationDir = path.join(__dirname, '..', 'migrations');
  const files = fs.readdirSync(migrationDir);
  const pattern = new RegExp(migrationConfig.migrationPattern);
  
  const migrations = [];
  files.forEach(file => {
    const match = file.match(pattern);
    if (match && match[3] === 'up') {
      const [, version, name] = match;
      migrations.push({
        version,
        name,
        upFile: file,
        downFile: file.replace('_up.sql', '_down.sql')
      });
    }
  });
  
  return migrations.sort((a, b) => a.version.localeCompare(b.version));
}

// 计算文件校验和
function calculateChecksum(filePath) {
  const crypto = require('crypto');
  const content = fs.readFileSync(filePath, 'utf8');
  return crypto.createHash('sha256').update(content).digest('hex');
}

// 执行SQL文件
async function executeSQLFile(filePath) {
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

// 记录迁移执行结果
async function recordMigration(migration, checksum, executionTime, success = true) {
  await pool.query(
    `INSERT INTO ${migrationConfig.migrationTable} 
     (version, name, checksum, execution_time, success) 
     VALUES ($1, $2, $3, $4, $5)`,
    [migration.version, migration.name, checksum, executionTime, success]
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
  if (!migrationConfig.backupBeforeMigration) return null;
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(__dirname, '..', 'backups', `backup_${timestamp}.sql`);
  
  // 确保备份目录存在
  const backupDir = path.dirname(backupFile);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  console.log('📦 创建数据库备份...');
  
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

// 执行迁移
async function runMigrations(targetVersion = null) {
  try {
    console.log(`🚀 开始执行数据库迁移 (环境: ${environment})`);
    
    // 创建迁移记录表
    await createMigrationTable();
    
    // 获取已执行和待执行的迁移
    const executedMigrations = await getExecutedMigrations();
    const allMigrations = getAllMigrations();
    const pendingMigrations = allMigrations.filter(
      m => !executedMigrations.includes(m.version) && 
           (!targetVersion || m.version <= targetVersion)
    );
    
    if (pendingMigrations.length === 0) {
      console.log('✅ 没有待执行的迁移');
      return;
    }
    
    console.log(`📋 发现 ${pendingMigrations.length} 个待执行的迁移:`);
    pendingMigrations.forEach(m => {
      console.log(`   - ${m.version}: ${m.name}`);
    });
    
    // 生产环境需要确认
    const envConfig = migrationConfig.environments[environment];
    if (envConfig.requireConfirmation) {
      const confirmed = await askConfirmation('确认执行这些迁移？');
      if (!confirmed) {
        console.log('⚠️ 迁移已取消');
        return;
      }
    }
    
    // 创建备份
    if (envConfig.requireBackup || migrationConfig.backupBeforeMigration) {
      await createBackup();
    }
    
    // 执行迁移
    for (const migration of pendingMigrations) {
      const migrationFile = path.join(__dirname, '..', 'migrations', migration.upFile);
      
      if (!fs.existsSync(migrationFile)) {
        throw new Error(`迁移文件不存在: ${migrationFile}`);
      }
      
      console.log(`⚡ 执行迁移: ${migration.version} - ${migration.name}`);
      
      const checksum = calculateChecksum(migrationFile);
      
      try {
        const result = await executeSQLFile(migrationFile);
        await recordMigration(migration, checksum, result.executionTime, true);
        
        console.log(`✅ 迁移成功: ${migration.version} (耗时: ${result.executionTime}ms)`);
      } catch (error) {
        console.error(`❌ 迁移失败: ${migration.version}`);
        console.error('错误:', error.message);
        
        await recordMigration(migration, checksum, 0, false);
        throw error;
      }
    }
    
    console.log('🎉 所有迁移执行完成！');
    
  } catch (error) {
    console.error('💥 迁移过程中发生错误:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// 查看迁移状态
async function showStatus() {
  try {
    await createMigrationTable();
    
    const executedMigrations = await getExecutedMigrations();
    const allMigrations = getAllMigrations();
    
    console.log('\n📊 数据库迁移状态:\n');
    console.log('版本    状态    名称');
    console.log('────────────────────────────────────');
    
    allMigrations.forEach(migration => {
      const isExecuted = executedMigrations.includes(migration.version);
      const status = isExecuted ? '✅ 已执行' : '⏸️  待执行';
      console.log(`${migration.version}   ${status}   ${migration.name}`);
    });
    
    console.log(`\n已执行: ${executedMigrations.length}/${allMigrations.length} 个迁移\n`);
    
  } catch (error) {
    console.error('❌ 获取迁移状态失败:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// 主程序
async function main() {
  const command = process.argv[2];
  const target = process.argv[3];
  
  switch (command) {
    case 'up':
      await runMigrations(target);
      break;
    case 'status':
      await showStatus();
      break;
    default:
      console.log(`
使用方法:
  node migrate.js up [version]     # 执行迁移到指定版本（可选）
  node migrate.js status           # 查看迁移状态
      `);
      break;
  }
}

// 运行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  runMigrations,
  showStatus,
  createMigrationTable
}; 