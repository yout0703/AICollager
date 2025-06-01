# AI Collager 数据库版本控制使用指南

## 🚀 快速开始

### 1. 查看迁移状态
```bash
npm run db:migrate:status
```

### 2. 执行所有待处理迁移
```bash
npm run db:migrate
```

### 3. 回滚最后一次迁移
```bash
npm run db:rollback
```

## 📝 创建新迁移

### 步骤 1: 创建迁移文件
按照命名规范创建新的迁移文件：
```
database/migrations/004_add_new_feature_up.sql
database/migrations/004_add_new_feature_down.sql
```

### 步骤 2: 编写迁移内容
**向上迁移文件 (004_add_new_feature_up.sql):**
```sql
-- =====================================
-- Migration: 004_add_new_feature
-- Description: 添加新功能相关表和字段
-- Author: 你的名字
-- Date: 2025-01-25
-- Dependencies: 003_add_ai_features
-- =====================================

-- 添加新表
CREATE TABLE ac_new_feature (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 添加索引
CREATE INDEX idx_ac_new_feature_name ON ac_new_feature(name);

COMMIT;
```

**向下迁移文件 (004_add_new_feature_down.sql):**
```sql
-- =====================================
-- Rollback: 004_add_new_feature
-- Description: 回滚新功能相关表和字段
-- Author: 你的名字
-- Date: 2025-01-25
-- =====================================

-- 删除索引
DROP INDEX IF EXISTS idx_ac_new_feature_name;

-- 删除表
DROP TABLE IF EXISTS ac_new_feature CASCADE;

COMMIT;
```

### 步骤 3: 执行迁移
```bash
npm run db:migrate
```

## 🔄 常用操作

### 执行特定版本的迁移
```bash
node database/scripts/migrate.js up 004
```

### 回滚到特定版本
```bash
node database/scripts/rollback.js 003
```

### 创建数据库备份
```bash
npm run db:backup
```

### 验证数据完整性
```bash
npm run db:validate
```

## 🌍 环境管理

### 开发环境
```bash
NODE_ENV=development npm run db:migrate
```

### 测试环境
```bash
NODE_ENV=staging npm run db:migrate
```

### 生产环境
```bash
NODE_ENV=production npm run db:migrate
```

## ⚠️ 最佳实践

### 1. 迁移文件编写
- **原子性**: 每个迁移只做一件事
- **可逆性**: 确保每个 up 迁移都有对应的 down 迁移
- **幂等性**: 迁移可以安全地重复执行
- **测试优先**: 在开发环境充分测试后再部署

### 2. 命名规范
- 使用三位数字版本号：001, 002, 003...
- 描述性名称：`add_user_preferences`, `fix_index_performance`
- 明确的文件后缀：`_up.sql`, `_down.sql`

### 3. 安全考虑
- 生产环境迁移前自动创建备份
- 破坏性操作需要确认
- 保留迁移历史记录

### 4. 团队协作
- 迁移文件提交到版本控制
- 详细的迁移说明和依赖关系
- 代码审查包含数据库变更

## 🛠️ 故障排除

### 迁移失败
1. 检查数据库连接配置
2. 查看错误日志
3. 验证SQL语法
4. 检查依赖关系

### 回滚失败
1. 确认回滚文件存在
2. 检查数据依赖关系
3. 手动清理数据（如需要）

### 连接问题
1. 验证数据库服务状态
2. 检查连接参数
3. 确认用户权限

## 📊 监控和维护

### 定期检查
- 迁移执行状态
- 数据库性能指标
- 备份文件完整性

### 清理策略
- 定期清理旧备份文件
- 归档历史迁移记录
- 优化数据库性能

## 🔗 相关文档

- [数据库结构文档](./schemas/current.sql)
- [迁移配置说明](./config/migration.json)
- [备份恢复指南](./scripts/backup.js)

---

如有问题，请查看日志文件或联系开发团队。 