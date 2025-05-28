# Week 2: 用户系统和积分系统

## 概述

Week 2 完成了完整的用户系统和积分系统，包括用户注册、登录、积分管理、邀请系统等核心功能。

## 已完成功能

### 1. 数据模型层 (Models)

#### 用户模型 (`models/user.ts`)
- 用户CRUD操作
- 用户查找（通过email、UUID、Clerk ID等）
- 用户信息更新
- AI使用次数统计

#### 会话模型 (`models/session.ts`)
- 用户会话管理
- 未登录用户试用功能
- 会话过期处理

#### 积分模型 (`models/credits.ts`)
- 积分交易记录
- 积分余额查询
- 积分扣除和增加（原子操作）

#### 邀请模型 (`models/invitation.ts`)
- 邀请码生成和管理
- 邀请状态跟踪
- 邀请奖励发放

### 2. 服务层 (Services)

#### 用户服务 (`services/userService.ts`)
- 用户注册和初始化
- 用户信息管理
- AI使用限制检查
- 会话管理

#### 积分服务 (`services/creditService.ts`)
- 积分余额查询
- 积分消费和获得
- 积分历史记录
- 积分统计

#### 邀请服务 (`services/invitationService.ts`)
- 邀请链接生成
- 邀请码验证
- 邀请奖励处理
- 邀请历史管理

### 3. API路由

#### 用户认证相关
- `GET/PUT /api/auth/profile` - 用户信息查询和更新
- `GET/POST /api/auth/setup` - 用户初始化设置

#### 积分系统
- `GET /api/credits/balance` - 查询积分余额
- `GET /api/credits/transactions` - 积分交易历史

#### 邀请系统
- `POST /api/invitations/generate` - 生成邀请链接
- `GET /api/invitations/history` - 邀请历史
- `GET/POST /api/invitations/validate/[code]` - 验证邀请码

#### 管理功能
- `POST /api/admin/cleanup` - 清理过期数据

## 数据库结构

### 主要表结构

1. **ac_users** - 用户表
   - 基本信息：email, username, display_name
   - 积分信息：credits, total_earned_credits, total_used_credits
   - 邀请信息：invite_code, invited_by_code
   - AI使用：daily_ai_usage, total_ai_usage
   - 设置：language, timezone, email_notifications

2. **ac_user_sessions** - 用户会话表
   - 会话管理：session_id, user_id
   - 试用功能：trial_usage_count
   - 过期控制：expires_at

3. **ac_credit_transactions** - 积分交易表
   - 交易信息：amount, balance_after, transaction_type
   - 关联信息：related_entity_type, related_entity_id
   - 元数据：metadata (JSONB)

4. **ac_invitations** - 邀请表
   - 邀请关系：inviter_id, invitee_id, invite_code
   - 奖励信息：inviter_reward, invitee_reward
   - 状态跟踪：status, clicked_at, registered_at, reward_given_at

## 核心功能流程

### 用户注册流程
1. 用户通过Clerk完成认证
2. 调用 `/api/auth/setup` 创建用户记录
3. 处理邀请码（如果有）
4. 发放注册奖励和邀请奖励
5. 初始化用户设置

### 积分系统流程
1. 用户获得积分（注册、邀请奖励等）
2. 用户消费积分（AI生成、下载等）
3. 所有操作都有完整的交易记录
4. 支持积分余额查询和历史查询

### 邀请系统流程
1. 用户生成邀请链接
2. 被邀请人点击链接（记录点击）
3. 被邀请人注册（完成邀请）
4. 系统自动发放双方奖励

## 使用示例

### 查询用户积分余额
```typescript
const response = await fetch('/api/credits/balance');
const { balance } = await response.json();
```

### 生成邀请链接
```typescript
const response = await fetch('/api/invitations/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    method: 'link',
    custom_reward: { inviterReward: 30, inviteeReward: 30 }
  })
});
const { invite_url } = await response.json();
```

### 获取积分交易历史
```typescript
const response = await fetch('/api/credits/transactions?limit=20&include_stats=true');
const { transactions, stats } = await response.json();
```

## 安全考虑

1. **权限验证**：所有API都通过Clerk进行身份验证
2. **数据隔离**：用户只能访问自己的数据
3. **原子操作**：积分操作使用数据库事务确保一致性
4. **输入验证**：所有用户输入都进行验证和清理
5. **过期处理**：会话和邀请都有过期机制

## 性能优化

1. **数据库索引**：为常用查询字段创建索引
2. **分页查询**：历史记录支持分页
3. **缓存策略**：可以在Redis中缓存用户信息（待实现）
4. **清理任务**：定期清理过期数据

## 下一步计划

1. 添加Redis缓存层
2. 实现管理员权限系统
3. 添加积分充值功能
4. 实现邮件邀请功能
5. 添加用户行为分析

## 部署说明

1. 运行数据库初始化脚本：`scripts/init-database.sql`
2. 配置环境变量（数据库连接、Clerk配置等）
3. 设置定期清理任务（可选）
4. 部署应用

## 测试

建议创建以下测试用例：
- 用户注册和登录流程
- 积分获得和消费
- 邀请链接生成和使用
- 数据清理任务
- API权限验证 