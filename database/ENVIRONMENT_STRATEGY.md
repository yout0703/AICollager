# 数据库环境策略

本项目支持根据不同环境自动选择数据库类型，实现开发环境和生产环境的最佳配置。

## 🎯 策略概述

| 环境 | 默认数据库 | 原因 |
|------|-----------|------|
| 🔧 **开发环境** | PostgreSQL（本地） | 便于调试、无网络依赖、快速迭代 |
| 🚀 **生产环境** | Supabase（云端） | 高可用、自动备份、性能监控、无运维负担 |
| 🔄 **其他环境** | 自动检测 | 根据配置灵活选择 |

## 🛠️ 环境配置

### 开发环境（推荐配置）

```bash
# .env.local
NODE_ENV=development
POSTGRES_URL=postgresql://postgres:123123@localhost:5432/aicollager

# 其他配置...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
GEMINI_API_KEY=your_key
```

**特点：**
- ✅ 无需网络连接即可开发
- ✅ 数据完全本地控制
- ✅ 调试和测试更方便
- ✅ 支持传统数据库工具

### 生产环境（推荐配置）

```bash
# 生产环境变量（如 Vercel）
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 其他生产环境配置...
```

**特点：**
- ✅ 零运维云数据库
- ✅ 自动备份和恢复
- ✅ 内置监控和告警
- ✅ 全球 CDN 分发
- ✅ 行级安全（RLS）

## 🔧 强制覆盖

如果需要在特定环境中使用非默认数据库：

### 在开发环境使用 Supabase

```bash
# 临时使用
FORCE_SUPABASE=true npm run dev

# 或者在 .env.local 中设置
FORCE_SUPABASE=true
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

### 在生产环境使用 PostgreSQL

```bash
# 生产环境环境变量
FORCE_POSTGRES=true
POSTGRES_URL=your_production_postgres_url
```

## 📊 自动检测逻辑

```mermaid
graph TD
    A[应用启动] --> B{FORCE_SUPABASE?}
    B -->|是| C[使用 Supabase]
    B -->|否| D{FORCE_POSTGRES?}
    D -->|是| E[使用 PostgreSQL]
    D -->|否| F{NODE_ENV?}
    
    F -->|development| G{有 POSTGRES_URL?}
    G -->|是| H[使用本地 PostgreSQL ✅]
    G -->|否| I{有 Supabase 配置?}
    I -->|是| J[使用 Supabase]
    I -->|否| K[使用默认 PostgreSQL]
    
    F -->|production| L{有 Supabase 配置?}
    L -->|是| M[使用 Supabase ✅]
    L -->|否| N{有 POSTGRES_URL?}
    N -->|是| O[使用 PostgreSQL]
    N -->|否| P[抛出错误]
    
    F -->|其他| Q{有 Supabase 配置?}
    Q -->|是| R[使用 Supabase]
    Q -->|否| S[使用 PostgreSQL]
```

## 🧪 测试和验证

### 测试数据库选择逻辑

```bash
# 运行自动化测试
npm run test:db-selection

# 检查当前使用的数据库类型
curl http://localhost:3000/api/test-db
```

### 手动验证

```bash
# 1. 启动应用并观察控制台输出
npm run dev
# 应该看到：🔧 开发环境：使用本地 PostgreSQL 数据库

# 2. 强制切换到 Supabase 测试
FORCE_SUPABASE=true npm run dev
# 需要先配置 Supabase 环境变量

# 3. 测试生产环境配置
NODE_ENV=production npm run build
```

## 🔄 数据迁移

### 从开发到生产

```bash
# 1. 导出开发环境数据
pg_dump -h localhost -U postgres -d aicollager --data-only > dev_data.sql

# 2. 导入到 Supabase
psql "postgresql://postgres:your_password@your_supabase_host:5432/postgres" -f dev_data.sql
```

### 从 Supabase 到本地

```bash
# 1. 从 Supabase 导出
pg_dump "postgresql://postgres:your_password@your_supabase_host:5432/postgres" --data-only > prod_data.sql

# 2. 导入到本地
psql -h localhost -U postgres -d aicollager -f prod_data.sql
```

## 📈 性能对比

| 特性 | 本地 PostgreSQL | Supabase |
|------|----------------|----------|
| 连接延迟 | < 1ms | 10-50ms |
| 调试便利性 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 运维负担 | 需要自己管理 | 零运维 |
| 备份恢复 | 手动 | 自动 |
| 监控告警 | 需要配置 | 内置 |
| 扩展性 | 受限于硬件 | 弹性扩容 |
| 安全性 | 自己负责 | 企业级 |
| 成本 | 硬件+人力 | 按量付费 |

## 🚀 最佳实践

### 开发流程

1. **本地开发**：使用 PostgreSQL，快速迭代
2. **功能测试**：偶尔切换到 Supabase 验证兼容性
3. **部署测试**：staging 环境使用 Supabase
4. **生产发布**：生产环境使用 Supabase

### 环境同步

1. **架构同步**：定期将生产环境架构同步到本地
2. **数据同步**：定期导入生产数据到开发环境（脱敏）
3. **测试覆盖**：关键功能在两种数据库上都要测试

### 故障转移

1. **监控告警**：生产环境配置数据库监控
2. **快速切换**：准备 PostgreSQL 备用方案
3. **数据备份**：多重备份策略

## 📝 配置检查清单

### 开发环境 ✅

- [ ] 安装并启动 PostgreSQL
- [ ] 创建 `aicollager` 数据库
- [ ] 运行 `npm run db:migrate`
- [ ] 测试 `npm run test:db`

### 生产环境 ✅

- [ ] 创建 Supabase 项目
- [ ] 配置环境变量
- [ ] 执行数据库架构
- [ ] 测试 API 连接
- [ ] 配置 RLS 策略

### 通用检查 ✅

- [ ] 运行 `npm run test:db-selection`
- [ ] 验证环境切换功能
- [ ] 测试数据库适配器
- [ ] 确认日志输出正确

## 🔗 相关文档

- [Supabase 迁移指南](./supabase/README.md)
- [数据库适配器文档](../lib/database-adapter.ts)
- [环境变量配置](../.env.development.example)
- [部署指南](../README.md#部署) 