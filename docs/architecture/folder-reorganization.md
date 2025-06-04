# 数据库架构重组方案

## 📊 现状分析

当前项目有三个主要的数据相关文件夹，职责存在重叠和混合：

### 🗂️ 当前结构问题

1. **`@schema`** - 混合了多种职责
   - ✅ Drizzle ORM 表结构定义
   - ❌ Zod 验证 schemas 
   - ❌ TypeScript 类型推断
   - ❌ 业务逻辑验证

2. **`@models`** - 命名不准确
   - ✅ 数据访问逻辑（实际是 repositories/services）
   - ❌ 应该叫 `repositories` 或 `services`

3. **`@types`** - 与 schema 类型重复
   - ✅ 业务领域类型定义
   - ❌ 与数据库 schema 类型存在重复
   - ❌ 缺乏类型分层

## 🎯 重组目标

遵循 **分层架构** 和 **单一职责原则**，明确各层边界：

```
数据库层 (Database Layer) 
    ↓
数据访问层 (Data Access Layer)
    ↓  
业务逻辑层 (Business Logic Layer)
    ↓
表现层 (Presentation Layer)
```

## 🏗️ 新架构方案

### 1. **`db/schema`** - 纯数据库定义层
**职责：** 只负责数据库表结构、关系定义和基础类型推断

```typescript
// ✅ 只包含
- 表结构定义 (pgTable, mysqlTable, sqliteTable)
- 关系定义 (relations)
- 基础类型推断 (.$inferSelect, .$inferInsert)

// ❌ 不包含
- Zod 验证 schemas
- 业务验证逻辑
- 复杂的业务类型
```

**文件结构：**
```
db/schema/
├── index.ts          # 导出所有表和关系
├── users.ts          # 用户表
├── credits.ts        # 积分表
├── collages.ts       # 拼图表
├── icons.ts          # 图标表
└── ai.ts             # AI相关表
```

### 2. **`lib/validations`** - 数据验证层
**职责：** 处理输入验证和数据格式化

```typescript
// ✅ 包含
- Zod schemas (基于 drizzle-zod)
- API 请求/响应验证
- 业务规则验证
- 数据转换逻辑

// ❌ 不包含
- 数据库操作
- 业务逻辑
```

**文件结构：**
```
lib/validations/
├── users.ts          # 用户相关验证
├── credits.ts        # 积分相关验证
├── collages.ts       # 拼图相关验证
├── icons.ts          # 图标相关验证
└── ai.ts             # AI相关验证
```

### 3. **`lib/repositories`** - 数据访问层
**职责：** 封装数据库操作，提供高级数据访问接口

```typescript
// ✅ 包含
- CRUD 操作封装
- 复杂查询逻辑
- 事务处理
- 数据库特定优化

// ❌ 不包含
- 业务规则验证（应该在上层）
- UI 相关逻辑
```

**文件结构：**
```
lib/repositories/
├── users.ts          # 用户数据访问
├── credits.ts        # 积分数据访问
├── collages.ts       # 拼图数据访问
├── icons.ts          # 图标数据访问
└── ai.ts             # AI数据访问
```

### 4. **`lib/services`** - 业务逻辑层
**职责：** 处理复杂业务逻辑，编排多个 repository

```typescript
// ✅ 包含
- 业务规则实现
- 多表操作编排
- 业务流程控制
- 外部服务集成

// ❌ 不包含
- 直接数据库操作（使用 repository）
- UI 状态管理
```

**文件结构：**
```
lib/services/
├── user-service.ts       # 用户业务逻辑
├── credit-service.ts     # 积分业务逻辑
├── collage-service.ts    # 拼图业务逻辑
├── icon-service.ts       # 图标业务逻辑
└── ai-service.ts         # AI业务逻辑
```

### 5. **`types`** - 业务类型定义层
**职责：** 定义业务领域的复杂类型和接口

```typescript
// ✅ 包含
- 业务领域类型
- API 接口类型
- 复杂数据结构
- 前端特定类型

// ❌ 不包含
- 数据库表类型（使用 schema 推断）
- 验证相关类型（在 validations 中）
```

**重构后结构：**
```
types/
├── api.ts             # API 相关类型
├── business.ts        # 业务核心类型
├── ui.ts              # UI 相关类型
└── external.ts        # 外部服务类型
```

## 🔄 迁移策略

### 阶段1: 清理 Schema 层
1. ✅ 从 `db/schema` 移除 Zod schemas
2. ✅ 保留纯净的表定义和类型推断
3. ✅ 重新组织关系定义

### 阶段2: 建立验证层
1. 🔄 创建 `lib/validations` 
2. 🔄 迁移和重构 Zod schemas
3. 🔄 添加业务验证规则

### 阶段3: 重构数据访问层
1. 🔄 重命名 `models` → `repositories`
2. 🔄 拆分复杂的业务逻辑
3. 🔄 标准化数据访问接口

### 阶段4: 建立服务层
1. ⏳ 创建 `lib/services`
2. ⏳ 提取复杂业务逻辑
3. ⏳ 编排多个 repository

### 阶段5: 优化类型系统
1. ⏳ 重构 `types` 文件夹
2. ⏳ 消除类型重复
3. ⏳ 建立类型依赖关系

## 📈 重组收益

### 1. **代码清晰度** ⬆️
- 每个文件夹职责单一明确
- 遵循分层架构原则
- 便于新人理解和维护

### 2. **可维护性** ⬆️
- 修改影响范围可预测
- 测试更容易编写
- 重构风险降低

### 3. **可扩展性** ⬆️
- 新功能容易集成
- 业务逻辑复用性高
- 支持微服务化改造

### 4. **类型安全** ⬆️
- 消除类型重复和冲突
- 更好的 TypeScript 体验
- 编译时错误检查更强

## 🛠️ 开发体验改进

### 导入路径更清晰
```typescript
// ❌ 之前：混乱的导入
import { User } from '@/db/schema'        // 数据库类型
import { UserType } from '@/types/user'   // 业务类型？重复？
import { updateUser } from '@/models/user' // 实际是 repository

// ✅ 现在：清晰的分层导入
import type { User } from '@/db/schema'              // 数据库类型
import type { UserProfile } from '@/types/business'  // 业务类型
import { UserRepository } from '@/lib/repositories'  // 数据访问
import { UserService } from '@/lib/services'        // 业务逻辑
import { updateUserSchema } from '@/lib/validations' // 验证
```

### 更好的开发工具支持
- 更精准的 IntelliSense
- 更准确的类型推断
- 更清晰的依赖图

## 📋 实施检查清单

- [x] 分析现有结构问题
- [x] 设计新架构方案
- [x] 创建重组文档
- [x] 重构 schema 层（移除 Zod）
- [x] 创建 validations 层
- [x] 开始 repositories 层重构
- [ ] 完成 repositories 层
- [ ] 创建 services 层
- [ ] 重构 types 层
- [ ] 更新所有导入路径
- [ ] 编写迁移测试
- [ ] 更新开发文档

## 🎯 下一步行动

1. **完成当前重构**：修复 `lib/repositories/users.ts` 中的类型错误
2. **继续迁移**：按照重组方案继续迁移其他模块
3. **建立规范**：制定新架构的开发规范和最佳实践
4. **团队培训**：确保团队理解新的架构分层和职责划分 