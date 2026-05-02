# 拼图服务重构说明

原来的 `CollageService` 类有1400多行代码，承担了太多职责。现在已经按照单一职责原则拆分为以下5个专门的服务：

## 服务架构

```
lib/services/collage/
├── index.ts                     # 统一入口，导出所有服务
├── collageValidationService.ts  # 用户验证和使用限制检查
├── collageImageService.ts       # 图片上传、分析处理
├── collageLayoutService.ts      # 布局生成、Icon推荐
├── collageCrudService.ts        # 数据库CRUD操作
├── collageGenerationService.ts  # 拼图生成核心流程
└── README.md                    # 本说明文档
```

## 各服务职责

### 1. CollageValidationService
- **职责**: 用户身份验证和使用限制检查
- **主要方法**:
  - `validateUserAndLimits()` - 验证用户和限制
  - `consumeUserCredits()` - 扣除用户积分

### 2. CollageImageService
- **职责**: 图片处理相关操作
- **主要方法**:
  - `analyzeImages()` - 上传并分析图片
  - `uploadImageToR2()` - 上传图片到R2存储
  - `fileToBuffer()` - 文件格式转换

### 3. CollageLayoutService
- **职责**: 布局生成和视觉元素推荐
- **主要方法**:
  - `generateLayout()` - 生成AI布局建议
  - `recommendIcons()` - 当前返回空数组；Icon 功能已从公开产品路径移除
  - `generateFinalCollageData()` - 生成最终拼图数据
  - 各种私有布局生成方法

### 4. CollageCrudService
- **职责**: 拼图数据的增删改查操作
- **主要方法**:
  - `getCollageById()` - 获取拼图详情
  - `getUserCollages()` - 获取用户拼图列表
  - `updateCollage()` - 更新拼图
  - `deleteCollage()` - 删除拼图
  - `downloadCollage()` - 下载拼图
  - `getFeaturedCollages()` - 获取精选拼图

### 5. CollageGenerationService
- **职责**: 拼图生成的核心流程编排
- **主要方法**:
  - `generateCollage()` - 主要生成流程（整合所有步骤）
  - `createInitialCollage()` - 创建初始拼图记录
  - `completeCollage()` - 完成拼图创建

## 向后兼容性

为了保持向后兼容，在 `index.ts` 中提供了一个包装的 `CollageService` 类，它整合了生成和CRUD功能，API接口保持不变。

旧的 `lib/services/collageService.ts` 兼容入口已移除，新代码统一从 `@/lib/services/collage` 引入。

## 优势

1. **单一职责**: 每个服务类只负责一个特定领域
2. **易于测试**: 可以独立测试每个服务
3. **易于维护**: 修改某个功能只需要关注对应的服务
4. **代码复用**: 其他地方可以直接使用特定的服务而不需要整个大类
5. **依赖清晰**: 服务之间的依赖关系更加明确

## 使用方式

```typescript
// 使用整合的服务（向后兼容）
import { collageService } from '@/lib/services/collage';
const result = await collageService.generateCollage(request);

// 使用特定的服务（推荐）
import { collageGenerationService } from '@/lib/services/collage';
const result = await collageGenerationService.generateCollage(request);

// 使用CRUD服务
import { collageCrudService } from '@/lib/services/collage';
const collage = await collageCrudService.getCollageById(id, userId);
```

# Collage Service Layer

这个目录包含了拼图功能的业务逻辑层，采用了单一职责原则将原本的大型 `CollageService` 拆分为多个专门的服务。

## 架构设计

### 统一数据模型设计决策

我们采用了**数据库模型作为统一接口**的设计，主要考虑：

#### ✅ 优势
- **消除转换开销**：避免在每个数据访问点进行模型转换
- **减少重复代码**：不需要维护多套类型定义和转换逻辑
- **简化开发流程**：开发者只需要了解一套数据模型
- **降低出错风险**：避免转换过程中的字段映射错误
- **提高性能**：减少对象创建和属性复制的性能开销

#### 💡 设计原则
- **数据库为单一数据源**：所有数据模型以数据库 schema 为准
- **统一命名约定**：全部使用驼峰命名（camelCase）
- **类型安全**：通过 TypeScript 确保类型一致性
- **最小化抽象**：避免不必要的抽象层

#### 📋 字段命名统一
```typescript
// 统一使用驼峰命名
interface Collage {
  userId: string;         // ✅ 不是 user_id
  sessionId: string;      // ✅ 不是 session_id
  canvasConfig: object;   // ✅ 不是 canvas_config
  createdAt: Date;        // ✅ 不是 created_at
}
```

### 服务分层

```
Controller Layer
      ↓
Service Layer (这里)
      ↓
Repository Layer
      ↓
Database Layer
```

## 服务列表

### 1. CollageValidationService
**职责**：用户权限验证、使用限制检查
- 用户身份验证
- 积分消耗验证
- 使用频率限制
- 权限检查

### 2. CollageImageService
**职责**：图片处理和存储
- 图片上传到 R2 存储
- 图片压缩和优化
- AI 图片分析
- 图片元数据提取

### 3. CollageLayoutService
**职责**：AI 布局生成
- 调用 AI 模型生成布局
- 图标推荐
- 布局策略选择
- 模板应用

### 4. CollageCrudService
**职责**：数据库 CRUD 操作
- 拼图数据的增删改查
- 权限验证
- 数据完整性检查
- 状态管理

### 5. CollageGenerationService
**职责**：协调整个拼图生成流程
- 整合所有子服务
- 错误处理和回滚
- 状态跟踪
- 结果返回

## 数据流示例

```typescript
// 前端调用
const result = await collageGenerationService.generateCollage(request);

// 内部数据流
┌─────────────────────────────────────────────────────────────┐
│ CollageGenerationService.generateCollage()                 │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│ │ Validation      │ │ Image Processing │ │ Layout Generation││
│ │ Service         │ │ Service          │ │ Service         ││
│ └─────────────────┘ └─────────────────┘ └─────────────────┘│
│                            │                               │
│                     ┌─────────────────┐                    │
│                     │ CRUD Service    │                    │
│                     │ (数据持久化)       │                    │
│                     └─────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

## 类型安全

所有服务都使用统一的 `Collage` 类型（来自 `types/collage.ts`），该类型与数据库模型 `DbCollage` 保持一致：

```typescript
// 类型别名确保一致性
export type Collage = DbCollage;
```

## 错误处理

每个服务都有明确的错误处理策略：
- **ValidationService**: 抛出验证错误
- **ImageService**: 处理上传和处理错误
- **LayoutService**: 处理 AI 服务错误
- **CrudService**: 处理数据库错误
- **GenerationService**: 统一错误处理和回滚

## 扩展性

这种设计支持：
- **独立测试**：每个服务可以独立进行单元测试
- **功能扩展**：新功能可以添加新的服务
- **性能优化**：可以针对特定服务进行优化
- **代码复用**：服务可以在不同场景下复用
