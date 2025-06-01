# AI Collager 数据库版本控制方案

## 📋 目录结构

```
database/
├── README.md                    # 数据库版本控制说明
├── migrations/                  # 数据库迁移文件
│   ├── 001_initial_schema.sql  # 初始化表结构
│   ├── 002_add_credits_system.sql
│   ├── 003_add_ai_features.sql
│   └── 004_fix_ai_stats_table.sql
├── seeds/                       # 种子数据
│   ├── development/             # 开发环境种子数据
│   ├── staging/                 # 测试环境种子数据
│   └── production/              # 生产环境种子数据
├── schemas/                     # 数据库结构定义
│   ├── current.sql              # 当前最新的完整结构
│   └── versions/                # 历史版本结构快照
├── rollbacks/                   # 回滚脚本
│   ├── 004_rollback.sql
│   └── 003_rollback.sql
├── scripts/                     # 管理脚本
│   ├── migrate.js               # 迁移执行脚本
│   ├── rollback.js              # 回滚脚本
│   ├── backup.js                # 备份脚本
│   └── validate.js              # 数据完整性验证
└── config/                      # 配置文件
    ├── database.json            # 数据库连接配置
    └── migration.json           # 迁移配置
```

## 🚀 版本控制策略

### 分支策略
- **main**: 生产环境数据库结构
- **develop**: 开发环境数据库结构  
- **feature/xxx**: 功能开发分支

### 迁移文件命名规范
```
{版本号}_{描述}_{类型}.sql
例如：
001_initial_schema_up.sql       # 初始化（向上迁移）
001_initial_schema_down.sql     # 初始化回滚（向下迁移）
002_add_users_table_up.sql      # 添加用户表
002_add_users_table_down.sql    # 删除用户表（回滚）
```

### 版本号规范
- 三位数字格式：001, 002, 003...
- 按时间顺序递增
- 每个版本包含 up（迁移）和 down（回滚）脚本

## 📝 迁移文件编写规范

### 1. 文件头部注释
```sql
-- =====================================
-- Migration: 002_add_credits_system
-- Description: 添加积分系统相关表
-- Author: 开发者姓名
-- Date: 2025-01-25
-- Dependencies: 001_initial_schema
-- =====================================
```

### 2. 向上迁移（up）
- 添加新表、字段、索引
- 数据转换和迁移
- 外键约束创建

### 3. 向下迁移（down）  
- 删除表、字段、索引
- 数据恢复（如果可能）
- 约束删除

### 4. 数据验证
- 每个迁移后验证数据完整性
- 检查约束和索引是否正确创建

## 🔄 迁移执行流程

### 开发环境
1. 创建新的迁移文件
2. 在本地执行并测试
3. 提交到 feature 分支
4. 合并到 develop 分支

### 测试环境
1. 从 develop 分支部署
2. 自动执行迁移脚本
3. 运行数据验证测试
4. 性能基准测试

### 生产环境
1. 从 main 分支部署
2. 创建数据库备份
3. 执行迁移（支持回滚）
4. 验证数据完整性
5. 监控系统性能

## 🛡️ 安全和备份策略

### 备份策略
- **迁移前**: 自动创建完整备份
- **每日**: 增量备份
- **每周**: 完整备份归档

### 回滚策略
- 提供快速回滚脚本
- 数据一致性检查
- 应用程序兼容性验证

## 🏷️ 最佳实践

1. **原子性**: 每个迁移文件只做一件事
2. **可逆性**: 每个 up 迁移都要有对应的 down 迁移
3. **幂等性**: 迁移可以安全地重复执行
4. **测试优先**: 在开发环境充分测试后再部署
5. **文档化**: 详细记录每次迁移的目的和影响

## 🔧 使用方法

### 执行迁移
```bash
npm run db:migrate                    # 执行所有待处理迁移
npm run db:migrate:up 002            # 执行指定版本迁移
npm run db:migrate:status            # 查看迁移状态
```

### 回滚操作
```bash
npm run db:rollback                  # 回滚最后一次迁移  
npm run db:rollback 002              # 回滚到指定版本
```

### 备份和恢复
```bash
npm run db:backup                    # 创建备份
npm run db:restore backup_file.sql   # 从备份恢复
``` 