# Supabase 迁移指南

本指南将帮助您将 AI Collager 项目从传统 PostgreSQL 迁移到 Supabase。

**环境策略：**
- 🔧 **开发环境**：优先使用本地 PostgreSQL 数据库
- 🚀 **生产环境**：优先使用 Supabase 云数据库
- 🔄 **其他环境**：根据配置自动选择

## 1. 创建 Supabase 项目

1. 访问 [Supabase Dashboard](https://database.new)
2. 创建新项目
3. 选择合适的区域（推荐选择离用户最近的区域）
4. 设置数据库密码

## 2. 环境变量配置

### 开发环境 (.env.local)

开发环境优先使用本地 PostgreSQL，无需配置 Supabase：

```bash
# 开发环境 - 本地 PostgreSQL（优先）
POSTGRES_URL=postgresql://postgres:123123@localhost:5432/aicollager

***REMOVED*** 认证
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret

***REMOVED*** AI
GEMINI_API_KEY=your_gemini_key

# Cloudflare R2 存储
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=your_r2_public_url

# 应用配置
NEXT_PUBLIC_APP_URL=http://localhost:3000

# 可选：在开发环境强制使用 Supabase
# FORCE_SUPABASE=true
# NEXT_PUBLIC_SUPABASE_URL=your_project_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 生产环境

生产环境使用 Supabase 云数据库：

```bash
# 生产环境 - Supabase（推荐）
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 其他生产环境变量...
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# 可选：在生产环境强制使用 PostgreSQL
# FORCE_POSTGRES=true
# POSTGRES_URL=your_production_postgres_url
```

### 环境变量说明

您可以在 Supabase 项目设置中找到这些值：
- 项目 URL：Settings > API > Project URL
- Anon Key：Settings > API > anon public
- Service Role Key：Settings > API > service_role (需要谨慎保管)

### 强制数据库选择

如果需要覆盖默认的环境策略：

```bash
# 强制使用 Supabase（任何环境）
FORCE_SUPABASE=true

# 强制使用 PostgreSQL（任何环境）
FORCE_POSTGRES=true
```

## 3. 开发环境设置

### 本地 PostgreSQL 设置

1. 安装 PostgreSQL
2. 创建数据库：`createdb aicollager`
3. 运行迁移：`npm run db:migrate`
4. 启动开发服务器：`npm run dev`

### 在开发环境中测试 Supabase

如果想在开发环境中测试 Supabase：

```bash
# 临时使用 Supabase
FORCE_SUPABASE=true npm run dev
```

## 4. 执行数据库迁移

### 本地 PostgreSQL

```bash
# 运行现有的迁移脚本
npm run db:migrate
```

### Supabase

#### 方法一：使用 Supabase SQL Editor

1. 在 Supabase Dashboard 中，进入 SQL Editor
2. 创建新查询
3. 复制 `database/supabase/schema.sql` 的内容
4. 执行 SQL 脚本

#### 方法二：使用 Supabase CLI（推荐）

```bash
# 安装 Supabase CLI
npm install -g supabase

# 登录 Supabase
supabase login

# 链接到您的项目
supabase link --project-ref your_project_ref

# 应用数据库架构
supabase db push
```

## 5. 数据迁移（开发到生产）

当需要将开发环境的数据迁移到生产环境时：

### 从本地 PostgreSQL 导出数据

```bash
# 导出数据到 SQL 文件
pg_dump -h localhost -p 5432 -U postgres -d aicollager --data-only --no-owner --no-privileges > data_export.sql
```

### 导入到 Supabase

```bash
# 使用 psql 连接到 Supabase 并导入数据
psql "postgresql://postgres:your_password@your_supabase_host:5432/postgres" -f data_export.sql
```

## 6. 应用代码使用

应用代码会自动检测环境并选择合适的数据库：

```typescript
import { DatabaseAdapter } from '@/lib/database-adapter';
import { getDatabaseType } from '@/models/db';

// 自动检测数据库类型
const dbType = getDatabaseType(); // 'postgresql' 或 'supabase'
const db = new DatabaseAdapter();

// 查询数据（API 相同，自动适配）
const result = await db.select('ac_users', {
  where: { clerk_id: 'user123' },
  limit: 10
});
```

## 7. 测试和验证

### 检查当前数据库类型

```bash
# 开发环境
npm run dev
# 控制台会显示：🔧 开发环境：使用本地 PostgreSQL 数据库

# 测试数据库连接
curl http://localhost:3000/api/test-db
curl http://localhost:3000/api/test-supabase
```

### 强制切换测试

```bash
# 在开发环境测试 Supabase
FORCE_SUPABASE=true npm run dev

# 在生产环境测试 PostgreSQL
FORCE_POSTGRES=true npm run build
```

## 8. 部署配置

### Vercel 部署

在 Vercel 项目设置中配置环境变量：

```bash
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# ... 其他生产环境变量
```

### 其他部署平台

确保在生产环境中设置：
- `NODE_ENV=production`
- Supabase 相关环境变量
- 其他必要的生产环境配置

## 9. 监控和维护

### 开发环境

- 使用本地 PostgreSQL 的标准监控工具
- 定期备份本地开发数据
- 保持与生产环境架构同步

### 生产环境

- 使用 Supabase Dashboard 监控
- 配置告警和通知
- 利用 Supabase 的自动备份功能

## 10. 故障排除

### 常见问题

1. **数据库连接失败**
   ```bash
   # 检查当前使用的数据库类型
   node -e "console.log(require('./models/db').getDatabaseType())"
   ```

2. **环境切换问题**
   ```bash
   # 清理缓存重启
   rm -rf .next
   npm run dev
   ```

3. **强制使用特定数据库**
   ```bash
   # 临时覆盖
   FORCE_SUPABASE=true npm run dev
   FORCE_POSTGRES=true npm run dev
   ```

### 回滚策略

- **开发环境**：默认使用本地 PostgreSQL，无需特殊回滚
- **生产环境**：设置 `FORCE_POSTGRES=true` 并配置 `POSTGRES_URL`

## 11. 最佳实践

1. **开发流程**：
   - 本地开发使用 PostgreSQL
   - 定期同步生产环境 Supabase 架构
   - 关键功能在两种数据库上都进行测试

2. **数据同步**：
   - 定期将生产数据导入开发环境
   - 使用种子数据保持开发环境一致性

3. **环境隔离**：
   - 严格区分开发和生产环境配置
   - 使用不同的 API 密钥和数据库

## 支持

如遇到问题，请参考：
- [Supabase 官方文档](https://supabase.com/docs)
- [PostgreSQL 官方文档](https://www.postgresql.org/docs/)
- 项目 Issues 