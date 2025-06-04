# AI Collager MVP 项目规划文档
*创建日期: 2025-05-25*

## 项目概览

**项目名称**: AI Collager  
**域名**: https://www.aicollager.com/  
**定位**: 基于AI的智能拼图工具，通过AI自动生成个性化拼图布局  
**核心价值**: "一键拼图"，区别于传统拼图工具的手动操作，提供AI驱动的自动化体验

## 技术栈

基于现有代码库：
- **前端框架**: Next.js 15.3.1 (React 18)
- **样式**: Tailwind CSS + shadcn/ui 组件
- **用户认证**: Clerk
- **国际化**: 基于Next.js国际化路由
- **存储**: Cloudflare R2 (图片存储)
- **数据库**: PostgreSQL + Drizzle ORM
- **AI服务**: Google Gemini API
- **部署**: Vercel
- **包管理**: pnpm

## MVP 核心功能规划

### 1. 积分系统 (Credits System)

#### 1.1 积分管理机制
- **初始积分**: 新用户注册赠送 50 积分
- **邀请奖励**: 
  - 邀请人和被邀请人各获得 20 积分
  - 通过分享链接追踪邀请关系
- **消耗规则**:
  - 一键拼图: 5 积分/次
  - 下载高清图片: 10 积分/次
  - 使用高级布局模板: 15 积分/次

#### 1.2 完整数据库表结构设计

**注意：以下为全新的数据库表结构，建议删除所有现有表后重新创建**

### 6. 数据库结构完善

#### 6.1 Drizzle ORM 集成方案

##### 6.1.1 依赖安装和配置

**安装依赖**:
```bash
pnpm add drizzle-orm @neondatabase/serverless
pnpm add -D drizzle-kit @types/pg
```

**项目结构**:
```
db/
├── schema/                 # 数据库表结构定义
│   ├── users.ts           # 用户相关表
│   ├── credits.ts         # 积分系统表
│   ├── icons.ts           # Icon库表
│   ├── collages.ts        # 拼图相关表
│   ├── ai.ts              # AI服务表
│   ├── orders.ts          # 订单表
│   ├── system.ts          # 系统配置表
│   └── index.ts           # 统一导出
├── migrations/             # 数据库迁移文件
├── seed.ts                # 初始数据填充
└── index.ts               # 数据库连接和配置
```

**Drizzle 配置文件** (`drizzle.config.ts`):
```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './db/schema/*',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
  verbose: true,
  strict: true,
});
```

##### 6.1.2 Schema 定义

**用户和认证相关表** (`db/schema/users.ts`):
```typescript
import { pgTable, serial, uuid, varchar, integer, boolean, timestamptz, text, inet } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// 用户主表
export const acUsers = pgTable('ac_users', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().unique().notNull(),
  clerkUserId: varchar('clerk_user_id', { length: 255 }).unique().notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  username: varchar('username', { length: 100 }),
  displayName: varchar('display_name', { length: 255 }),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  
  // 积分相关
  credits: integer('credits').default(50),
  totalEarnedCredits: integer('total_earned_credits').default(50),
  totalUsedCredits: integer('total_used_credits').default(0),
  
  // 邀请相关
  inviteCode: varchar('invite_code', { length: 50 }).unique().notNull(),
  invitedByCode: varchar('invited_by_code', { length: 50 }),
  invitedByUserId: uuid('invited_by_user_id'),
  
  // AI使用限制
  dailyAiUsage: integer('daily_ai_usage').default(0),
  lastAiUsageDate: varchar('last_ai_usage_date', { length: 10 }), // YYYY-MM-DD
  totalAiUsage: integer('total_ai_usage').default(0),
  
  // 用户设置
  language: varchar('language', { length: 10 }).default('zh-CN'),
  timezone: varchar('timezone', { length: 50 }).default('Asia/Shanghai'),
  emailNotifications: boolean('email_notifications').default(true),
  
  // 状态和时间
  status: varchar('status', { length: 20 }).default('active'),
  lastLoginAt: timestamptz('last_login_at'),
  createdAt: timestamptz('created_at').defaultNow(),
  updatedAt: timestamptz('updated_at').defaultNow(),
});

// 用户会话表
export const acUserSessions = pgTable('ac_user_sessions', {
  id: serial('id').primaryKey(),
  sessionId: varchar('session_id', { length: 100 }).unique().notNull(),
  userId: uuid('user_id'),
  trialUsageCount: integer('trial_usage_count').default(0),
  ipAddress: varchar('ip_address', { length: 45 }), // 支持IPv6
  userAgent: text('user_agent'),
  lastActivityAt: timestamptz('last_activity_at').defaultNow(),
  createdAt: timestamptz('created_at').defaultNow(),
  expiresAt: timestamptz('expires_at'),
});

// Zod 验证 Schema
export const insertUserSchema = createInsertSchema(acUsers, {
  email: z.string().email('邮箱格式不正确'),
  credits: z.number().min(0, '积分不能为负数'),
  language: z.enum(['zh-CN', 'en-US', 'ja-JP', 'ko-KR']),
});

export const selectUserSchema = createSelectSchema(acUsers);

export type User = typeof acUsers.$inferSelect;
export type NewUser = typeof acUsers.$inferInsert;
```

**积分系统表** (`db/schema/credits.ts`):
```typescript
import { pgTable, serial, uuid, integer, varchar, text, jsonb, timestamptz } from 'drizzle-orm/pg-core';
import { acUsers } from './users';

// 积分流水表
export const acCreditTransactions = pgTable('ac_credit_transactions', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().unique().notNull(),
  userId: uuid('user_id').notNull().references(() => acUsers.uuid, { onDelete: 'cascade' }),
  
  // 交易信息
  amount: integer('amount').notNull(), // 正数为获得，负数为消耗
  balanceAfter: integer('balance_after').notNull(),
  transactionType: varchar('transaction_type', { length: 50 }).notNull(),
  
  // 描述和关联
  title: varchar('title', { length: 255 }),
  description: text('description'),
  relatedEntityType: varchar('related_entity_type', { length: 50 }),
  relatedEntityId: uuid('related_entity_id'),
  
  // 元数据
  metadata: jsonb('metadata'),
  
  createdAt: timestamptz('created_at').defaultNow(),
});

// 邀请记录表
export const acInvitations = pgTable('ac_invitations', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().unique().notNull(),
  
  // 邀请关系
  inviterId: uuid('inviter_id').notNull().references(() => acUsers.uuid, { onDelete: 'cascade' }),
  inviteeId: uuid('invitee_id').references(() => acUsers.uuid, { onDelete: 'set null' }),
  inviteCode: varchar('invite_code', { length: 50 }).notNull(),
  
  // 邀请信息
  email: varchar('email', { length: 255 }),
  invitationMethod: varchar('invitation_method', { length: 20 }).default('link'),
  
  // 奖励信息
  inviterReward: integer('inviter_reward').default(20),
  inviteeReward: integer('invitee_reward').default(20),
  
  // 状态追踪
  status: varchar('status', { length: 20 }).default('pending'),
  clickedAt: timestamptz('clicked_at'),
  registeredAt: timestamptz('registered_at'),
  rewardGivenAt: timestamptz('reward_given_at'),
  
  // 元数据
  metadata: jsonb('metadata'),
  
  createdAt: timestamptz('created_at').defaultNow(),
  updatedAt: timestamptz('updated_at').defaultNow(),
  expiresAt: timestamptz('expires_at'),
});

export type CreditTransaction = typeof acCreditTransactions.$inferSelect;
export type NewCreditTransaction = typeof acCreditTransactions.$inferInsert;
export type Invitation = typeof acInvitations.$inferSelect;
export type NewInvitation = typeof acInvitations.$inferInsert;
```

**Icon库表** (`db/schema/icons.ts`):
```typescript
import { pgTable, serial, uuid, varchar, text, integer, boolean, timestamptz, jsonb } from 'drizzle-orm/pg-core';

// Icon分类表
export const acIconCategories = pgTable('ac_icon_categories', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().unique().notNull(),
  
  categoryId: varchar('category_id', { length: 100 }).unique().notNull(),
  categoryName: varchar('category_name', { length: 255 }).notNull(),
  parentCategoryId: varchar('parent_category_id', { length: 100 }),
  
  description: text('description'),
  aiDescription: text('ai_description'),
  aiKeywords: jsonb('ai_keywords').$type<string[]>(),
  
  displayOrder: integer('display_order').default(0),
  iconColor: varchar('icon_color', { length: 20 }).default('#666666'),
  isActive: boolean('is_active').default(true),
  
  iconCount: integer('icon_count').default(0),
  usageCount: integer('usage_count').default(0),
  
  createdAt: timestamptz('created_at').defaultNow(),
  updatedAt: timestamptz('updated_at').defaultNow(),
});

// Icon库表
export const acIcons = pgTable('ac_icons', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().unique().notNull(),
  
  iconId: varchar('icon_id', { length: 100 }).unique().notNull(),
  iconName: varchar('icon_name', { length: 255 }).notNull(),
  categoryId: varchar('category_id', { length: 100 }).notNull(),
  
  svgContent: text('svg_content').notNull(),
  style: varchar('style', { length: 50 }).default('outline'),
  
  sizeVariants: jsonb('size_variants').$type<string[]>().default(['16', '24', '32', '48', '64']),
  colorVariants: jsonb('color_variants').$type<string[]>().default(['currentColor']),
  
  tags: jsonb('tags').$type<string[]>().default([]),
  aiKeywords: jsonb('ai_keywords').$type<string[]>().default([]),
  semanticMeaning: text('semantic_meaning'),
  aiDescription: text('ai_description'),
  
  popularityScore: integer('popularity_score').default(0),
  usageCount: integer('usage_count').default(0),
  lastUsedAt: timestamptz('last_used_at'),
  
  isActive: boolean('is_active').default(true),
  isPremium: boolean('is_premium').default(false),
  
  source: varchar('source', { length: 100 }),
  version: varchar('version', { length: 20 }).default('1.0.0'),
  license: varchar('license', { length: 100 }).default('MIT'),
  metadata: jsonb('metadata'),
  
  createdAt: timestamptz('created_at').defaultNow(),
  updatedAt: timestamptz('updated_at').defaultNow(),
});

export type IconCategory = typeof acIconCategories.$inferSelect;
export type NewIconCategory = typeof acIconCategories.$inferInsert;
export type Icon = typeof acIcons.$inferSelect;
export type NewIcon = typeof acIcons.$inferInsert;
```

**拼图相关表** (`db/schema/collages.ts`):
```typescript
import { pgTable, serial, uuid, varchar, text, integer, boolean, timestamptz, jsonb, decimal } from 'drizzle-orm/pg-core';
import { acUsers } from './users';

// 拼图模板表
export const acTemplates = pgTable('ac_templates', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().unique().notNull(),
  
  templateId: varchar('template_id', { length: 100 }).unique().notNull(),
  templateName: varchar('template_name', { length: 255 }).notNull(),
  description: text('description'),
  
  minImages: integer('min_images').notNull().default(2),
  maxImages: integer('max_images').notNull().default(9),
  aspectRatios: jsonb('aspect_ratios').$type<string[]>().default(['1:1', '4:3', '16:9']),
  
  canvasConfig: jsonb('canvas_config').notNull(),
  layoutStructure: jsonb('layout_structure').notNull(),
  
  category: varchar('category', { length: 100 }).notNull(),
  style: varchar('style', { length: 100 }),
  tags: jsonb('tags').$type<string[]>().default([]),
  
  aiKeywords: jsonb('ai_keywords').$type<string[]>().default([]),
  aiDescription: text('ai_description'),
  aiSuitableThemes: jsonb('ai_suitable_themes').$type<string[]>().default([]),
  
  isPremium: boolean('is_premium').default(false),
  creditsCost: integer('credits_cost').default(0),
  
  usageCount: integer('usage_count').default(0),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0.00'),
  ratingCount: integer('rating_count').default(0),
  
  isActive: boolean('is_active').default(true),
  isFeatured: boolean('is_featured').default(false),
  
  createdAt: timestamptz('created_at').defaultNow(),
  updatedAt: timestamptz('updated_at').defaultNow(),
});

// 拼图主表
export const acCollages = pgTable('ac_collages', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().unique().notNull(),
  
  userId: uuid('user_id').references(() => acUsers.uuid, { onDelete: 'set null' }),
  sessionId: varchar('session_id', { length: 100 }),
  title: varchar('title', { length: 255 }),
  description: text('description'),
  
  canvasConfig: jsonb('canvas_config').notNull(),
  elements: jsonb('elements').notNull(),
  metadata: jsonb('metadata').notNull(),
  
  templateId: varchar('template_id', { length: 100 }),
  generatedStyle: varchar('generated_style', { length: 100 }),
  userPreferences: jsonb('user_preferences'),
  
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
  previewUrl: varchar('preview_url', { length: 500 }),
  fullImageUrl: varchar('full_image_url', { length: 500 }),
  
  aiModel: varchar('ai_model', { length: 100 }),
  aiProcessingTime: integer('ai_processing_time'),
  creditsUsed: integer('credits_used').default(5),
  
  status: varchar('status', { length: 20 }).default('draft'),
  generationStatus: varchar('generation_status', { length: 20 }).default('pending'),
  
  visibility: varchar('visibility', { length: 20 }).default('private'),
  isFeatured: boolean('is_featured').default(false),
  downloadCount: integer('download_count').default(0),
  viewCount: integer('view_count').default(0),
  
  version: integer('version').default(1),
  parentCollageId: uuid('parent_collage_id'),
  
  startedAt: timestamptz('started_at').defaultNow(),
  completedAt: timestamptz('completed_at'),
  lastEditedAt: timestamptz('last_edited_at').defaultNow(),
  createdAt: timestamptz('created_at').defaultNow(),
  updatedAt: timestamptz('updated_at').defaultNow(),
});

// 拼图图片表
export const acCollageImages = pgTable('ac_collage_images', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().unique().notNull(),
  
  collageId: uuid('collage_id').notNull().references(() => acCollages.uuid, { onDelete: 'cascade' }),
  imageIndex: integer('image_index').notNull(),
  elementId: varchar('element_id', { length: 100 }),
  
  originalUrl: varchar('original_url', { length: 500 }).notNull(),
  processedUrl: varchar('processed_url', { length: 500 }),
  fileName: varchar('file_name', { length: 255 }),
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 100 }),
  
  originalDimensions: jsonb('original_dimensions'),
  processedDimensions: jsonb('processed_dimensions'),
  
  aiAnalysis: jsonb('ai_analysis'),
  dominantColors: jsonb('dominant_colors'),
  contentTags: jsonb('content_tags').$type<string[]>(),
  
  processingStatus: varchar('processing_status', { length: 20 }).default('uploaded'),
  
  uploadedAt: timestamptz('uploaded_at').defaultNow(),
  createdAt: timestamptz('created_at').defaultNow(),
});

export type Template = typeof acTemplates.$inferSelect;
export type NewTemplate = typeof acTemplates.$inferInsert;
export type Collage = typeof acCollages.$inferSelect;
export type NewCollage = typeof acCollages.$inferInsert;
export type CollageImage = typeof acCollageImages.$inferSelect;
export type NewCollageImage = typeof acCollageImages.$inferInsert;
```

##### 6.1.3 数据库连接和查询服务

**数据库连接** (`db/index.ts`):
```typescript
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const sql = neon(process.env.POSTGRES_URL!);
export const db = drizzle(sql, { schema });

export type Database = typeof db;
export { schema };
```

**用户服务** (`lib/services/userService.ts`):
```typescript
import { db } from '@/db';
import { acUsers, acCreditTransactions, type User, type NewUser } from '@/db/schema/users';
import { eq, and, sql } from 'drizzle-orm';
import { generateInviteCode } from '@/lib/utils/inviteCode';

export class UserService {
  async createUser(clerkUserId: string, email: string, userData: Partial<NewUser> = {}): Promise<User> {
    const inviteCode = generateInviteCode();
    
    const [user] = await db.insert(acUsers).values({
      clerkUserId,
      email,
      inviteCode,
      ...userData,
    }).returning();
    
    return user;
  }
  
  async getUserByClerkId(clerkUserId: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(acUsers)
      .where(eq(acUsers.clerkUserId, clerkUserId))
      .limit(1);
    
    return user || null;
  }
  
  async getUserByInviteCode(inviteCode: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(acUsers)
      .where(eq(acUsers.inviteCode, inviteCode))
      .limit(1);
    
    return user || null;
  }
  
  async updateUserCredits(userId: string, amount: number, transactionType: string, metadata?: any): Promise<void> {
    await db.transaction(async (tx) => {
      // 更新用户积分
      const [user] = await tx
        .update(acUsers)
        .set({
          credits: sql`${acUsers.credits} + ${amount}`,
          totalEarnedCredits: amount > 0 ? sql`${acUsers.totalEarnedCredits} + ${amount}` : acUsers.totalEarnedCredits,
          totalUsedCredits: amount < 0 ? sql`${acUsers.totalUsedCredits} + ${Math.abs(amount)}` : acUsers.totalUsedCredits,
          updatedAt: new Date(),
        })
        .where(eq(acUsers.uuid, userId))
        .returning({ credits: acUsers.credits });
      
      // 记录积分流水
      await tx.insert(acCreditTransactions).values({
        userId,
        amount,
        balanceAfter: user.credits,
        transactionType,
        metadata,
      });
    });
  }
  
  async checkDailyAiUsage(userId: string): Promise<{ canUse: boolean; remaining: number }> {
    const today = new Date().toISOString().split('T')[0];
    const [user] = await db
      .select({
        dailyAiUsage: acUsers.dailyAiUsage,
        lastAiUsageDate: acUsers.lastAiUsageDate,
      })
      .from(acUsers)
      .where(eq(acUsers.uuid, userId))
      .limit(1);
    
    if (!user) {
      return { canUse: false, remaining: 0 };
    }
    
    const currentUsage = user.lastAiUsageDate === today ? user.dailyAiUsage : 0;
    const remaining = Math.max(0, 20 - currentUsage);
    
    return {
      canUse: remaining > 0,
      remaining,
    };
  }
  
  async incrementAiUsage(userId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    await db
      .update(acUsers)
      .set({
        dailyAiUsage: sql`CASE 
          WHEN ${acUsers.lastAiUsageDate} = ${today} 
          THEN ${acUsers.dailyAiUsage} + 1 
          ELSE 1 
        END`,
        lastAiUsageDate: today,
        totalAiUsage: sql`${acUsers.totalAiUsage} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(acUsers.uuid, userId));
  }
}

export const userService = new UserService();
```

**拼图服务** (`lib/services/collageService.ts`):
```typescript
import { db } from '@/db';
import { acCollages, acCollageImages, type Collage, type NewCollage } from '@/db/schema/collages';
import { eq, and, desc } from 'drizzle-orm';

export class CollageService {
  async createCollage(data: NewCollage): Promise<Collage> {
    const [collage] = await db.insert(acCollages).values(data).returning();
    return collage;
  }
  
  async getCollageById(id: string): Promise<Collage | null> {
    const [collage] = await db
      .select()
      .from(acCollages)
      .where(eq(acCollages.uuid, id))
      .limit(1);
    
    return collage || null;
  }
  
  async getUserCollages(userId: string, limit = 20): Promise<Collage[]> {
    return await db
      .select()
      .from(acCollages)
      .where(eq(acCollages.userId, userId))
      .orderBy(desc(acCollages.createdAt))
      .limit(limit);
  }
  
  async updateCollageStatus(id: string, status: string, metadata?: any): Promise<void> {
    await db
      .update(acCollages)
      .set({
        status,
        metadata,
        updatedAt: new Date(),
      })
      .where(eq(acCollages.uuid, id));
  }
  
  async addCollageImages(collageId: string, images: Array<{
    originalUrl: string;
    fileName: string;
    fileSize?: number;
    imageIndex: number;
  }>): Promise<void> {
    const imageData = images.map(img => ({
      collageId,
      ...img,
    }));
    
    await db.insert(acCollageImages).values(imageData);
  }
}

export const collageService = new CollageService();
```

##### 6.1.4 迁移和部署脚本

**生成迁移文件**:
```bash
# package.json scripts
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx db/seed.ts",
    "db:reset": "tsx scripts/reset-db.ts"
  }
}
```

**数据填充** (`db/seed.ts`):
```typescript
import { db } from './index';
import { acIconCategories, acIcons, acTemplates, acSystemConfigs } from './schema';

async function seed() {
  console.log('开始数据填充...');
  
  // 插入Icon分类
  await db.insert(acIconCategories).values([
    {
      categoryId: 'general',
      categoryName: '通用',
      description: '通用图标分类',
      aiDescription: 'General purpose icons for common UI elements',
      aiKeywords: ['general', 'common', 'basic'],
      displayOrder: 1,
    },
    {
      categoryId: 'travel',
      categoryName: '旅行',
      description: '旅行相关图标',
      aiDescription: 'Travel and transportation related icons',
      aiKeywords: ['travel', 'trip', 'vacation', 'transport'],
      displayOrder: 2,
    },
    // ... 更多分类
  ]);
  
  // 插入系统配置
  await db.insert(acSystemConfigs).values([
    {
      configKey: 'ai_daily_limits',
      configValue: { user_limit: 20, global_limit: 5000 },
      configType: 'ai_limits',
      description: 'AI使用每日限制配置',
    },
    {
      configKey: 'credit_pricing',
      configValue: { collage: 5, download: 10, premium_template: 15 },
      configType: 'pricing',
      description: '积分消耗定价',
    },
  ]);
  
  console.log('数据填充完成！');
}

seed().catch(console.error);
```

##### 6.1.5 类型安全的API路由

**积分查询API** (`app/api/credits/balance/route.ts`):
```typescript
import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { userService } from '@/lib/services/userService';
import { respData, respErr } from '@/lib/utils/response';

export async function GET() {
  try {
    const { userId: clerkUserId } = auth();
    if (!clerkUserId) {
      return respErr('未登录', 401);
    }
    
    const user = await userService.getUserByClerkId(clerkUserId);
    if (!user) {
      return respErr('用户不存在', 404);
    }
    
    return respData({
      credits: user.credits,
      totalEarned: user.totalEarnedCredits,
      totalUsed: user.totalUsedCredits,
    });
  } catch (error) {
    console.error('查询积分余额失败:', error);
    return respErr('查询失败');
  }
}
```

**一键拼图API** (`app/api/collage/generate/route.ts`):
```typescript
import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { userService } from '@/lib/services/userService';
import { collageService } from '@/lib/services/collageService';
import { geminiService } from '@/lib/services/geminiService';
import { respData, respErr } from '@/lib/utils/response';

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = auth();
    if (!clerkUserId) {
      return respErr('未登录', 401);
    }
    
    const user = await userService.getUserByClerkId(clerkUserId);
    if (!user) {
      return respErr('用户不存在', 404);
    }
    
    // 检查积分余额
    if (user.credits < 5) {
      return respErr('积分不足，请邀请朋友获取积分', 402);
    }
    
    // 检查每日AI使用限制
    const { canUse } = await userService.checkDailyAiUsage(user.uuid);
    if (!canUse) {
      return respErr('今日AI使用次数已达上限', 429);
    }
    
    const formData = await req.formData();
    const images = formData.getAll('images') as File[];
    
    if (images.length < 2 || images.length > 20) {
      return respErr('请上传2-20张图片', 400);
    }
    
    // 创建拼图记录
    const collage = await collageService.createCollage({
      userId: user.uuid,
      title: `拼图_${Date.now()}`,
      status: 'processing',
      canvasConfig: {},
      elements: [],
      metadata: {},
    });
    
    // 异步处理AI生成
    generateCollageAsync(collage.uuid, images, user.uuid).catch(console.error);
    
    return respData({
      collageId: collage.uuid,
      status: 'processing',
      message: 'AI正在分析您的图片，请稍候...',
    });
    
  } catch (error) {
    console.error('生成拼图失败:', error);
    return respErr('生成失败，请稍后重试');
  }
}

async function generateCollageAsync(collageId: string, images: File[], userId: string) {
  try {
    // AI分析和生成
    const result = await geminiService.generateCollage({
      images,
      collageId,
    });
    
    // 更新拼图数据
    await collageService.updateCollageStatus(collageId, 'completed', result);
    
    // 扣除积分
    await userService.updateUserCredits(userId, -5, 'collage', { collageId });
    
    // 增加AI使用计数
    await userService.incrementAiUsage(userId);
    
  } catch (error) {
    console.error('AI生成失败:', error);
    await collageService.updateCollageStatus(collageId, 'failed', { error: error.message });
  }
}
```

##### 6.1.6 开发工具和工作流

**开发命令**:
```bash
# 开发环境启动
pnpm dev

# 生成新的迁移文件
pnpm db:generate

# 应用迁移到数据库
pnpm db:migrate

# 启动 Drizzle Studio (数据库管理界面)
pnpm db:studio

# 重置数据库并填充初始数据
pnpm db:reset && pnpm db:seed
```

**环境变量更新** (`.env.local`):
```env
# 数据库连接
POSTGRES_URL="postgresql://username:password@host:port/database"

# Drizzle Studio
DB_VIEWER_PORT=3001

# 现有配置...
```

这样的 Drizzle ORM 集成方案具有以下优势：

1. **类型安全**: 完整的 TypeScript 支持，编译时捕获数据库错误
2. **性能优化**: 只查询需要的字段，自动生成高效SQL
3. **开发体验**: 优秀的IDE支持和自动补全
4. **迁移管理**: 版本化的数据库迁移，支持团队协作
5. **查询构建**: 直观的查询API，避免SQL注入
6. **关系处理**: 自动处理表关系和外键约束

#### 6.2 完整数据库表结构

**注意：以下为全新的数据库表结构，建议删除所有现有表后重新创建**
```sql
-- ================================
-- 用户和认证相关表
-- ================================

-- 用户主表
CREATE TABLE ac_users (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL, -- Clerk用户ID
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100),
    display_name VARCHAR(255),
    avatar_url VARCHAR(500),
    
    -- 积分相关
    credits INT DEFAULT 50, -- 当前积分余额
    total_earned_credits INT DEFAULT 50, -- 累计获得积分
    total_used_credits INT DEFAULT 0, -- 累计使用积分
    
    -- 邀请相关
    invite_code VARCHAR(50) UNIQUE NOT NULL,
    invited_by_code VARCHAR(50), -- 邀请人的邀请码
    invited_by_user_id UUID, -- 邀请人ID
    
    -- AI使用限制
    daily_ai_usage INT DEFAULT 0, -- 今日AI使用次数
    last_ai_usage_date DATE, -- 最后使用AI的日期
    total_ai_usage INT DEFAULT 0, -- 累计AI使用次数
    
    -- 用户设置
    language VARCHAR(10) DEFAULT 'zh-CN',
    timezone VARCHAR(50) DEFAULT 'Asia/Shanghai',
    email_notifications BOOLEAN DEFAULT true,
    
    -- 状态和时间
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'suspended', 'deleted'
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用户会话表（追踪未登录用户的试用次数）
CREATE TABLE ac_user_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    user_id UUID, -- 登录用户关联，未登录时为NULL
    trial_usage_count INT DEFAULT 0, -- 试用次数
    ip_address INET,
    user_agent TEXT,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- ================================
-- 积分系统相关表
-- ================================

-- 积分流水表
CREATE TABLE ac_credit_transactions (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    
    -- 交易信息
    amount INT NOT NULL, -- 正数为获得，负数为消耗
    balance_after INT NOT NULL, -- 交易后余额
    transaction_type VARCHAR(50) NOT NULL, -- 'register', 'invite', 'collage', 'download', 'purchase', 'admin_adjust'
    
    -- 描述和关联
    title VARCHAR(255), -- 交易标题
    description TEXT, -- 详细描述
    related_entity_type VARCHAR(50), -- 关联实体类型 'collage', 'order', 'invitation'
    related_entity_id UUID, -- 关联实体ID
    
    -- 元数据
    metadata JSONB, -- 额外信息，如AI使用详情等
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 邀请记录表
CREATE TABLE ac_invitations (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    
    -- 邀请关系
    inviter_id UUID NOT NULL, -- 邀请人ID
    invitee_id UUID, -- 被邀请人ID（注册后填入）
    invite_code VARCHAR(50) NOT NULL, -- 邀请码
    
    -- 邀请信息
    email VARCHAR(255), -- 被邀请人邮箱（如果通过邮箱邀请）
    invitation_method VARCHAR(20) DEFAULT 'link', -- 'link', 'email', 'social'
    
    -- 奖励信息
    inviter_reward INT DEFAULT 20, -- 邀请人奖励积分
    invitee_reward INT DEFAULT 20, -- 被邀请人奖励积分
    
    -- 状态追踪
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'expired'
    clicked_at TIMESTAMPTZ, -- 点击邀请链接时间
    registered_at TIMESTAMPTZ, -- 注册完成时间
    reward_given_at TIMESTAMPTZ, -- 奖励发放时间
    
    -- 元数据
    metadata JSONB, -- 额外信息，如来源页面等
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- ================================
-- Icon库管理相关表
-- ================================

-- Icon分类表
CREATE TABLE ac_icon_categories (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    
    -- 分类信息
    category_id VARCHAR(100) UNIQUE NOT NULL, -- 分类标识符
    category_name VARCHAR(255) NOT NULL, -- 分类名称
    parent_category_id VARCHAR(100), -- 父分类ID
    
    -- 描述信息
    description TEXT, -- 人类可读描述
    ai_description TEXT, -- AI理解的描述
    ai_keywords TEXT[], -- AI搜索关键词
    
    -- 显示配置
    display_order INT DEFAULT 0, -- 显示顺序
    icon_color VARCHAR(20) DEFAULT '#666666', -- 分类图标颜色
    is_active BOOLEAN DEFAULT true, -- 是否启用
    
    -- 统计信息
    icon_count INT DEFAULT 0, -- 该分类下的Icon数量
    usage_count INT DEFAULT 0, -- 使用次数
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Icon库表
CREATE TABLE ac_icons (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    
    -- Icon基本信息
    icon_id VARCHAR(100) UNIQUE NOT NULL, -- Icon标识符
    icon_name VARCHAR(255) NOT NULL, -- Icon名称
    category_id VARCHAR(100) NOT NULL, -- 所属分类
    
    -- 内容和样式
    svg_content TEXT NOT NULL, -- SVG内容
    style VARCHAR(50) DEFAULT 'outline', -- 'outline', 'filled', 'duotone', 'color'
    
    -- 支持的变体
    size_variants JSONB DEFAULT '["16","24","32","48","64"]', -- 支持的尺寸
    color_variants JSONB DEFAULT '["currentColor"]', -- 支持的颜色
    
    -- AI相关
    tags TEXT[] DEFAULT '{}', -- 标签数组
    ai_keywords TEXT[] DEFAULT '{}', -- AI识别关键词
    semantic_meaning TEXT, -- 语义含义
    ai_description TEXT, -- AI理解的描述
    
    -- 使用统计
    popularity_score INT DEFAULT 0, -- 受欢迎程度评分
    usage_count INT DEFAULT 0, -- 使用次数
    last_used_at TIMESTAMPTZ, -- 最后使用时间
    
    -- 状态和权限
    is_active BOOLEAN DEFAULT true, -- 是否启用
    is_premium BOOLEAN DEFAULT false, -- 是否为高级Icon
    
    -- 元数据
    source VARCHAR(100), -- 来源，如 'heroicons', 'custom'
    version VARCHAR(20) DEFAULT '1.0.0', -- 版本号
    license VARCHAR(100) DEFAULT 'MIT', -- 许可证
    metadata JSONB, -- 额外元数据
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================
-- 拼图相关表
-- ================================

-- 拼图模板表
CREATE TABLE ac_templates (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    
    -- 模板基本信息
    template_id VARCHAR(100) UNIQUE NOT NULL,
    template_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- 模板配置
    min_images INT NOT NULL DEFAULT 2, -- 最少图片数
    max_images INT NOT NULL DEFAULT 9, -- 最多图片数
    aspect_ratios JSONB DEFAULT '["1:1","4:3","16:9"]', -- 支持的宽高比
    
    -- 模板结构
    canvas_config JSONB NOT NULL, -- 画布配置模板
    layout_structure JSONB NOT NULL, -- 布局结构定义
    
    -- 分类和标签
    category VARCHAR(100) NOT NULL, -- 'standard', 'artistic', 'social', 'print'
    style VARCHAR(100), -- 'modern', 'vintage', 'minimal', 'decorative'
    tags TEXT[] DEFAULT '{}',
    
    -- AI相关
    ai_keywords TEXT[] DEFAULT '{}', -- AI选择关键词
    ai_description TEXT, -- AI理解的描述
    ai_suitable_themes TEXT[] DEFAULT '{}', -- 适合的主题
    
    -- 使用配置
    is_premium BOOLEAN DEFAULT false, -- 是否为高级模板
    credits_cost INT DEFAULT 0, -- 使用所需积分
    
    -- 统计信息
    usage_count INT DEFAULT 0, -- 使用次数
    rating DECIMAL(3,2) DEFAULT 0.00, -- 平均评分
    rating_count INT DEFAULT 0, -- 评分次数
    
    -- 状态
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false, -- 是否为特色模板
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 拼图主表
CREATE TABLE ac_collages (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    
    -- 基本信息
    user_id UUID, -- 创建用户ID，未登录用户为NULL
    session_id VARCHAR(100), -- 会话ID，用于未登录用户
    title VARCHAR(255),
    description TEXT,
    
    -- 拼图数据
    canvas_config JSONB NOT NULL, -- 画布配置
    elements JSONB NOT NULL, -- 拼图元素数组
    metadata JSONB NOT NULL, -- 元数据（AI分析结果等）
    
    -- 模板和风格
    template_id VARCHAR(100), -- 使用的模板ID
    generated_style VARCHAR(100), -- AI生成的风格
    user_preferences JSONB, -- 用户偏好设置
    
    -- 图片资源
    thumbnail_url VARCHAR(500), -- 缩略图URL
    preview_url VARCHAR(500), -- 预览图URL
    full_image_url VARCHAR(500), -- 高清图URL
    
    -- AI相关
    ai_model VARCHAR(100), -- 使用的AI模型
    ai_processing_time INT, -- AI处理时间（毫秒）
    credits_used INT DEFAULT 5, -- 消耗的积分
    
    -- 状态管理
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'processing', 'completed', 'failed', 'deleted'
    generation_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'analyzing', 'generating', 'rendering', 'completed'
    
    -- 权限和分享
    visibility VARCHAR(20) DEFAULT 'private', -- 'private', 'public', 'unlisted'
    is_featured BOOLEAN DEFAULT false, -- 是否为精选作品
    download_count INT DEFAULT 0, -- 下载次数
    view_count INT DEFAULT 0, -- 查看次数
    
    -- 版本控制
    version INT DEFAULT 1, -- 版本号
    parent_collage_id UUID, -- 父拼图ID（编辑时）
    
    -- 时间记录
    started_at TIMESTAMPTZ DEFAULT NOW(), -- 开始创建时间
    completed_at TIMESTAMPTZ, -- 完成时间
    last_edited_at TIMESTAMPTZ DEFAULT NOW(), -- 最后编辑时间
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 拼图图片表
CREATE TABLE ac_collage_images (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    
    -- 关联信息
    collage_id UUID NOT NULL, -- 拼图ID
    image_index INT NOT NULL, -- 在拼图中的索引
    element_id VARCHAR(100), -- 对应的元素ID
    
    -- 图片信息
    original_url VARCHAR(500) NOT NULL, -- 原始图片URL
    processed_url VARCHAR(500), -- 处理后图片URL
    file_name VARCHAR(255), -- 原始文件名
    file_size INT, -- 文件大小（字节）
    mime_type VARCHAR(100), -- MIME类型
    
    -- 图片属性
    original_dimensions JSONB, -- 原始尺寸 {width, height}
    processed_dimensions JSONB, -- 处理后尺寸
    
    -- AI分析结果
    ai_analysis JSONB, -- AI分析结果
    dominant_colors JSONB, -- 主色调
    content_tags TEXT[], -- 内容标签
    
    -- 处理状态
    processing_status VARCHAR(20) DEFAULT 'uploaded', -- 'uploaded', 'processing', 'completed', 'failed'
    
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================
-- AI服务相关表
-- ================================

-- AI使用统计表（全站统计）
CREATE TABLE ac_ai_usage_stats (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    
    -- 请求统计
    total_requests INT DEFAULT 0, -- 总请求数
    successful_requests INT DEFAULT 0, -- 成功请求数
    failed_requests INT DEFAULT 0, -- 失败请求数
    
    -- 功能分类统计
    image_analysis_requests INT DEFAULT 0, -- 图片分析请求
    layout_generation_requests INT DEFAULT 0, -- 布局生成请求
    icon_recommendation_requests INT DEFAULT 0, -- Icon推荐请求
    
    -- 成本统计
    total_cost DECIMAL(10,4) DEFAULT 0, -- 总成本（USD）
    avg_cost_per_request DECIMAL(10,4) DEFAULT 0, -- 平均每次请求成本
    
    -- 性能统计
    avg_processing_time INT DEFAULT 0, -- 平均处理时间（毫秒）
    max_processing_time INT DEFAULT 0, -- 最大处理时间
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(date)
);

-- AI分析缓存表
CREATE TABLE ac_ai_analysis_cache (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    
    -- 缓存标识
    cache_key VARCHAR(64) UNIQUE NOT NULL, -- 缓存键（通常是图片hash）
    cache_type VARCHAR(50) NOT NULL, -- 'image_analysis', 'layout_suggestion', 'icon_recommendation'
    
    -- AI模型信息
    ai_model VARCHAR(100) NOT NULL, -- 使用的AI模型
    model_version VARCHAR(50), -- 模型版本
    
    -- 缓存内容
    input_data JSONB, -- 输入数据
    analysis_result JSONB NOT NULL, -- 分析结果
    confidence_score DECIMAL(3,2), -- 置信度评分
    
    -- 使用统计
    use_count INT DEFAULT 1, -- 使用次数
    last_used_at TIMESTAMPTZ DEFAULT NOW(), -- 最后使用时间
    
    -- 有效期
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'), -- 过期时间
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================
-- 订单和支付相关表（为未来扩展准备）
-- ================================

-- 订单表
CREATE TABLE ac_orders (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    order_no VARCHAR(255) UNIQUE NOT NULL, -- 订单号
    
    -- 用户信息
    user_id UUID NOT NULL, -- 购买用户ID
    user_email VARCHAR(255) NOT NULL, -- 用户邮箱
    
    -- 订单内容
    product_type VARCHAR(50) NOT NULL, -- 'credits', 'premium', 'template_pack'
    product_name VARCHAR(255), -- 产品名称
    credits_amount INT DEFAULT 0, -- 积分数量
    
    -- 价格信息
    amount_cents INT NOT NULL, -- 金额（分）
    currency VARCHAR(10) DEFAULT 'USD', -- 货币
    discount_amount_cents INT DEFAULT 0, -- 折扣金额
    final_amount_cents INT NOT NULL, -- 最终金额
    
    -- 支付信息
    payment_provider VARCHAR(50), -- 'stripe', 'paypal', 'alipay'
    payment_session_id VARCHAR(255), -- 支付会话ID
    payment_intent_id VARCHAR(255), -- 支付意图ID
    
    -- 订单状态
    order_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded', 'cancelled'
    payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'succeeded', 'failed'
    fulfillment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'fulfilled', 'failed'
    
    -- 时间记录
    paid_at TIMESTAMPTZ, -- 支付完成时间
    fulfilled_at TIMESTAMPTZ, -- 履行完成时间
    expires_at TIMESTAMPTZ, -- 订单过期时间
    
    -- 元数据
    metadata JSONB, -- 额外信息
    notes TEXT, -- 备注
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================
-- 系统配置和管理表
-- ================================

-- 系统配置表
CREATE TABLE ac_system_configs (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    config_type VARCHAR(50) NOT NULL, -- 'ai_limits', 'pricing', 'features', 'ui'
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 管理员操作日志表
CREATE TABLE ac_admin_logs (
    id SERIAL PRIMARY KEY,
    admin_user_id UUID NOT NULL, -- 管理员用户ID
    action VARCHAR(100) NOT NULL, -- 操作类型
    target_entity_type VARCHAR(50), -- 目标实体类型
    target_entity_id UUID, -- 目标实体ID
    old_data JSONB, -- 操作前数据
    new_data JSONB, -- 操作后数据
    ip_address INET, -- IP地址
    user_agent TEXT, -- 用户代理
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================
-- 外键约束
-- ================================

-- 添加外键约束
ALTER TABLE ac_users ADD CONSTRAINT fk_ac_users_invited_by 
    FOREIGN KEY (invited_by_user_id) REFERENCES ac_users(uuid) ON DELETE SET NULL;

ALTER TABLE ac_user_sessions ADD CONSTRAINT fk_ac_user_sessions_user 
    FOREIGN KEY (user_id) REFERENCES ac_users(uuid) ON DELETE CASCADE;

ALTER TABLE ac_credit_transactions ADD CONSTRAINT fk_ac_credit_transactions_user 
    FOREIGN KEY (user_id) REFERENCES ac_users(uuid) ON DELETE CASCADE;

ALTER TABLE ac_invitations ADD CONSTRAINT fk_ac_invitations_inviter 
    FOREIGN KEY (inviter_id) REFERENCES ac_users(uuid) ON DELETE CASCADE;

ALTER TABLE ac_invitations ADD CONSTRAINT fk_ac_invitations_invitee 
    FOREIGN KEY (invitee_id) REFERENCES ac_users(uuid) ON DELETE SET NULL;

ALTER TABLE ac_icons ADD CONSTRAINT fk_ac_icons_category 
    FOREIGN KEY (category_id) REFERENCES ac_icon_categories(category_id) ON DELETE RESTRICT;

ALTER TABLE ac_collages ADD CONSTRAINT fk_ac_collages_user 
    FOREIGN KEY (user_id) REFERENCES ac_users(uuid) ON DELETE SET NULL;

ALTER TABLE ac_collages ADD CONSTRAINT fk_ac_collages_template 
    FOREIGN KEY (template_id) REFERENCES ac_templates(template_id) ON DELETE SET NULL;

ALTER TABLE ac_collages ADD CONSTRAINT fk_ac_collages_parent 
    FOREIGN KEY (parent_collage_id) REFERENCES ac_collages(uuid) ON DELETE SET NULL;

ALTER TABLE ac_collage_images ADD CONSTRAINT fk_ac_collage_images_collage 
    FOREIGN KEY (collage_id) REFERENCES ac_collages(uuid) ON DELETE CASCADE;

ALTER TABLE ac_orders ADD CONSTRAINT fk_ac_orders_user 
    FOREIGN KEY (user_id) REFERENCES ac_users(uuid) ON DELETE RESTRICT;

-- ================================
-- 索引优化
-- ================================

-- 用户表索引
CREATE INDEX idx_ac_users_clerk_id ON ac_users(clerk_user_id);
CREATE INDEX idx_ac_users_email ON ac_users(email);
CREATE INDEX idx_ac_users_invite_code ON ac_users(invite_code);
CREATE INDEX idx_ac_users_invited_by ON ac_users(invited_by_user_id);
CREATE INDEX idx_ac_users_status ON ac_users(status);
CREATE INDEX idx_ac_users_created_at ON ac_users(created_at);

-- 会话表索引
CREATE INDEX idx_ac_user_sessions_session_id ON ac_user_sessions(session_id);
CREATE INDEX idx_ac_user_sessions_user_id ON ac_user_sessions(user_id);
CREATE INDEX idx_ac_user_sessions_expires_at ON ac_user_sessions(expires_at);

-- 积分交易索引
CREATE INDEX idx_ac_credit_transactions_user_id ON ac_credit_transactions(user_id);
CREATE INDEX idx_ac_credit_transactions_type ON ac_credit_transactions(transaction_type);
CREATE INDEX idx_ac_credit_transactions_created_at ON ac_credit_transactions(created_at);
CREATE INDEX idx_ac_credit_transactions_related ON ac_credit_transactions(related_entity_type, related_entity_id);

-- 邀请记录索引
CREATE INDEX idx_ac_invitations_inviter ON ac_invitations(inviter_id);
CREATE INDEX idx_ac_invitations_invitee ON ac_invitations(invitee_id);
CREATE INDEX idx_ac_invitations_code ON ac_invitations(invite_code);
CREATE INDEX idx_ac_invitations_status ON ac_invitations(status);

-- Icon相关索引
CREATE INDEX idx_ac_icon_categories_parent ON ac_icon_categories(parent_category_id);
CREATE INDEX idx_ac_icon_categories_active ON ac_icon_categories(is_active);
CREATE INDEX idx_ac_icons_category ON ac_icons(category_id);
CREATE INDEX idx_ac_icons_style ON ac_icons(style);
CREATE INDEX idx_ac_icons_active ON ac_icons(is_active);
CREATE INDEX idx_ac_icons_premium ON ac_icons(is_premium);
CREATE INDEX idx_ac_icons_popularity ON ac_icons(popularity_score);
CREATE INDEX idx_ac_icons_tags ON ac_icons USING GIN(tags);
CREATE INDEX idx_ac_icons_ai_keywords ON ac_icons USING GIN(ai_keywords);

-- 模板索引
CREATE INDEX idx_ac_templates_category ON ac_templates(category);
CREATE INDEX idx_ac_templates_style ON ac_templates(style);
CREATE INDEX idx_ac_templates_active ON ac_templates(is_active);
CREATE INDEX idx_ac_templates_premium ON ac_templates(is_premium);
CREATE INDEX idx_ac_templates_featured ON ac_templates(is_featured);
CREATE INDEX idx_ac_templates_usage ON ac_templates(usage_count);

-- 拼图相关索引
CREATE INDEX idx_ac_collages_user_id ON ac_collages(user_id);
CREATE INDEX idx_ac_collages_session_id ON ac_collages(session_id);
CREATE INDEX idx_ac_collages_template_id ON ac_collages(template_id);
CREATE INDEX idx_ac_collages_status ON ac_collages(status);
CREATE INDEX idx_ac_collages_visibility ON ac_collages(visibility);
CREATE INDEX idx_ac_collages_featured ON ac_collages(is_featured);
CREATE INDEX idx_ac_collages_created_at ON ac_collages(created_at);
CREATE INDEX idx_ac_collages_completed_at ON ac_collages(completed_at);

CREATE INDEX idx_ac_collage_images_collage_id ON ac_collage_images(collage_id);
CREATE INDEX idx_ac_collage_images_status ON ac_collage_images(processing_status);

-- AI相关索引
CREATE INDEX idx_ac_ai_usage_stats_date ON ac_ai_usage_stats(date);
CREATE INDEX idx_ac_ai_analysis_cache_key ON ac_ai_analysis_cache(cache_key);
CREATE INDEX idx_ac_ai_analysis_cache_type ON ac_ai_analysis_cache(cache_type);
CREATE INDEX idx_ac_ai_analysis_cache_expires ON ac_ai_analysis_cache(expires_at);

-- 订单索引
CREATE INDEX idx_ac_orders_user_id ON ac_orders(user_id);
CREATE INDEX idx_ac_orders_order_no ON ac_orders(order_no);
CREATE INDEX idx_ac_orders_status ON ac_orders(order_status);
CREATE INDEX idx_ac_orders_payment_status ON ac_orders(payment_status);
CREATE INDEX idx_ac_orders_created_at ON ac_orders(created_at);

-- 系统配置索引
CREATE INDEX idx_ac_system_configs_key ON ac_system_configs(config_key);
CREATE INDEX idx_ac_system_configs_type ON ac_system_configs(config_type);
CREATE INDEX idx_ac_system_configs_active ON ac_system_configs(is_active);

-- 管理日志索引
CREATE INDEX idx_ac_admin_logs_admin_user ON ac_admin_logs(admin_user_id);
CREATE INDEX idx_ac_admin_logs_action ON ac_admin_logs(action);
CREATE INDEX idx_ac_admin_logs_target ON ac_admin_logs(target_entity_type, target_entity_id);
CREATE INDEX idx_ac_admin_logs_created_at ON ac_admin_logs(created_at);

-- ================================
-- 初始化数据
-- ================================

-- 插入默认Icon分类
INSERT INTO ac_icon_categories (category_id, category_name, description, ai_description, ai_keywords, display_order) VALUES
('general', '通用', '通用图标分类', 'General purpose icons for common UI elements', ARRAY['general', 'common', 'basic'], 1),
('travel', '旅行', '旅行相关图标', 'Travel and transportation related icons', ARRAY['travel', 'trip', 'vacation', 'transport'], 2),
('food', '美食', '美食餐饮图标', 'Food, dining and restaurant related icons', ARRAY['food', 'dining', 'restaurant', 'cooking'], 3),
('nature', '自然', '自然环境图标', 'Nature, plants, animals and outdoor icons', ARRAY['nature', 'plants', 'animals', 'outdoor'], 4),
('celebration', '庆祝', '节日庆祝图标', 'Holiday, celebration and party icons', ARRAY['celebration', 'party', 'holiday', 'festival'], 5),
('people', '人物', '人物相关图标', 'People, family and social icons', ARRAY['people', 'family', 'social', 'human'], 6),
('decoration', '装饰', '装饰性图标', 'Decorative elements and ornaments', ARRAY['decoration', 'ornament', 'design', 'border'], 7);

-- 插入系统配置
INSERT INTO ac_system_configs (config_key, config_value, config_type, description) VALUES
('ai_daily_limits', '{"user_limit": 20, "global_limit": 5000}', 'ai_limits', 'AI使用每日限制配置'),
('credit_pricing', '{"collage": 5, "download": 10, "premium_template": 15}', 'pricing', '积分消耗定价'),
('invitation_rewards', '{"inviter": 20, "invitee": 20}', 'pricing', '邀请奖励配置'),
('free_trial_limits', '{"anonymous_usage": 3, "session_duration_days": 30}', 'features', '免费试用限制'),
('ai_models', '{"primary": "gemini-pro-vision", "fallback": "gemini-pro"}', 'ai_limits', 'AI模型配置');
```

### 2. 一键拼图核心功能

#### 2.1 AI智能布局选择
**输入分析**:
- 图片数量 (2-20张)
- 图片尺寸比例分析
- 图片内容识别 (人物、风景、物品等)
- 色彩主题提取

**智能决策**:
- 根据图片数量选择最适合的布局类型
- 基于内容相似度进行图片分组和排列
- 自动确定主图和辅图的位置
- 智能调整图片的裁剪区域

#### 2.2 布局模板系统
**标准模板**:
- 2张: 左右分屏、上下分屏、重叠式
- 3张: L型布局、三角形布局、时间轴式
- 4张: 田字格、不规则四格、故事版式
- 5张: 十字型、花瓣型、阶梯式
- 6-9张: 网格式、蜂窝型、环形布局
- 10+张: 瀑布流、马赛克式、螺旋式

**特色模板**:
- 节日主题 (生日、情人节、圣诞节等)
- 场景主题 (旅行、美食、宠物、家庭等)
- 艺术风格 (复古、现代、手绘、杂志风等)

#### 2.3 智能元素添加与Icon库管理

**Icon库设计理念**：
- 维护一个结构化的Icon库，每个Icon都有详细的元数据
- AI通过Icon的名称、分类、标签和关键词来理解Icon的含义
- 支持多种样式（线条、填充、双色调）和尺寸

**Icon库结构**：
```typescript
interface IconLibrary {
  categories: IconCategory[];
  icons: IconDefinition[];
  aiMapping: AIIconMapping;
}

interface IconCategory {
  id: string;
  name: string;
  parentId?: string;
  aiDescription: string; // AI理解的描述
  iconCount: number;
  popularityScore: number;
}

interface IconDefinition {
  id: string;
  name: string;
  category: string;
  tags: string[];
  aiKeywords: string[]; // AI搜索关键词
  svgContent: string;
  styles: ('outline' | 'filled' | 'duotone')[];
  sizes: number[];
  colorVariants: string[];
  description: string;
  popularityScore: number; // 使用频率评分
  semanticMeaning: string; // 语义含义，便于AI理解
}

// AI与Icon库的映射关系
interface AIIconMapping {
  // 图片内容 -> 推荐Icon
  contentToIcons: Record<string, string[]>;
  
  // 主题 -> Icon集合
  themeToIcons: Record<string, string[]>;
  
  // 情感 -> Icon
  moodToIcons: Record<string, string[]>;
  
  // 季节/时间 -> Icon
  timeToIcons: Record<string, string[]>;
}
```

**智能元素添加流程**：
1. **图片内容分析**: AI识别图片中的物体、人物、场景
2. **主题匹配**: 根据内容和用户偏好确定主题
3. **Icon智能推荐**: 
   - 基于图片内容匹配相关Icon
   - 考虑整体色彩搭配
   - 根据布局位置推荐合适的Icon
4. **文字标签生成**: 自动生成时间、地点、心情等标签
5. **装饰元素**: 智能选择边框、背景效果等

#### 2.4 AI 输出数据模型设计

**核心设计理念**：AI 输出完整的、可编辑的拼图描述数据，前端画板组件基于此数据精准还原效果。

```typescript
// AI拼图请求接口
interface CollageRequest {
  images: ImageFile[];
  preferences?: {
    style?: 'modern' | 'vintage' | 'artistic' | 'minimal';
    theme?: 'travel' | 'family' | 'food' | 'pets' | 'celebration';
    colorScheme?: 'auto' | 'warm' | 'cool' | 'monochrome';
    aspectRatio?: '1:1' | '4:3' | '16:9' | '9:16' | 'auto';
  };
}

// AI 结构化输出格式
interface CollageResult {
  id: string;
  canvas: CanvasConfig;
  elements: CollageElement[];
  metadata: CollageMetadata;
}

// 画布配置
interface CanvasConfig {
  width: number;           // 画布宽度 (px)
  height: number;          // 画布高度 (px)
  background: {
    type: 'solid' | 'gradient' | 'image' | 'pattern';
    color?: string;        // 纯色背景
    gradient?: {           // 渐变背景
      type: 'linear' | 'radial';
      colors: string[];
      direction?: number;  // 角度 (仅linear)
    };
    image?: {             // 图片背景
      url: string;
      opacity: number;
      blendMode: BlendMode;
    };
    pattern?: {           // 纹理背景
      type: string;
      opacity: number;
    };
  };
  padding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

// 拼图元素（核心数据结构）
interface CollageElement {
  id: string;
  type: 'image' | 'icon' | 'text' | 'shape' | 'frame';
  
  // 位置和变换
  transform: {
    x: number;             // X坐标 (px)
    y: number;             // Y坐标 (px)
    width: number;         // 宽度 (px)
    height: number;        // 高度 (px)
    rotation: number;      // 旋转角度 (度)
    scaleX: number;        // X缩放比例
    scaleY: number;        // Y缩放比例
    skewX?: number;        // X倾斜角度
    skewY?: number;        // Y倾斜角度
  };
  
  // 样式属性
  style: {
    opacity: number;       // 透明度 0-1
    zIndex: number;        // 层级
    visible: boolean;      // 是否可见
    locked?: boolean;      // 是否锁定
    blendMode?: BlendMode; // 混合模式
    filter?: FilterEffect[]; // 滤镜效果
    border?: BorderStyle;  // 边框样式
    shadow?: ShadowStyle;  // 阴影效果
  };
  
  // 类型特定属性
  content: ImageContent | IconContent | TextContent | ShapeContent | FrameContent;
  
  // 编辑属性
  editable: {
    movable: boolean;      // 可移动
    resizable: boolean;    // 可调整大小
    rotatable: boolean;    // 可旋转
    deletable: boolean;    // 可删除
    styleable: boolean;    // 可修改样式
  };
  
  // AI 推荐信息
  aiRecommendation?: {
    reason: string;        // AI选择这个元素的原因
    alternatives?: string[]; // 替代选项
    confidence: number;    // 置信度 0-1
  };
}

// 图片内容
interface ImageContent {
  originalUrl: string;     // 原始图片URL
  processedUrl?: string;   // 处理后图片URL
  cropArea?: {            // 裁剪区域
    x: number;
    y: number;
    width: number;
    height: number;
  };
  fit: 'cover' | 'contain' | 'fill' | 'scale-down';
  alignment: {            // 对齐方式
    horizontal: 'left' | 'center' | 'right';
    vertical: 'top' | 'center' | 'bottom';
  };
}

// Icon 内容
interface IconContent {
  iconId: string;         // Icon库中的ID
  iconName: string;       // Icon名称 (便于AI理解)
  category: string;       // Icon分类
  color?: string;         // Icon颜色
  strokeWidth?: number;   // 线条粗细
  filled?: boolean;       // 是否填充
}

// 文字内容
interface TextContent {
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number | string;
  color: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  lineHeight: number;
  letterSpacing?: number;
  textDecoration?: 'none' | 'underline' | 'line-through';
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
}

// 形状内容
interface ShapeContent {
  shapeType: 'rectangle' | 'circle' | 'triangle' | 'star' | 'heart' | 'custom';
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  cornerRadius?: number;  // 仅矩形
  customPath?: string;    // 自定义路径 (SVG path)
}

// 边框内容
interface FrameContent {
  frameType: 'simple' | 'decorative' | 'polaroid' | 'vintage';
  thickness: number;
  color: string;
  pattern?: string;
}

// 辅助类型定义
type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light' | 'hard-light';

interface FilterEffect {
  type: 'blur' | 'brightness' | 'contrast' | 'saturation' | 'hue-rotate' | 'sepia' | 'grayscale';
  value: number;
}

interface BorderStyle {
  width: number;
  color: string;
  style: 'solid' | 'dashed' | 'dotted';
  radius?: number;
}

interface ShadowStyle {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
}

// 元数据
interface CollageMetadata {
  aiModel: string;
  processingTime: number;
  creditsUsed: number;
  templateId?: string;
  generatedAt: string;
  userPrompt?: string;
  aiAnalysis: {
    imageAnalysis: ImageAnalysisResult[];
    layoutReasoning: string;
    colorScheme: ColorScheme;
    suggestedIcons: IconSuggestion[];
  };
}

interface ImageAnalysisResult {
  imageIndex: number;
  dominantColors: string[];
  contentTags: string[];
  faces: number;
  objects: DetectedObject[];
  mood: string;
  style: string;
  quality: number;
}

interface DetectedObject {
  name: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

interface IconSuggestion {
  iconId: string;
  iconName: string;
  reason: string;
  confidence: number;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
}
```

### 3. 用户体验流程

#### 3.1 未登录用户流程
1. **免费体验**: 允许3次一键拼图体验
2. **结果预览**: 可查看拼图效果，添加水印
3. **注册引导**: 下载时引导注册，注册后立即可下载
4. **本地存储**: 使用localStorage追踪使用次数

#### 3.2 登录用户流程
1. **积分显示**: 界面显示当前积分余额
2. **功能使用**: 使用功能时实时扣除积分并显示
3. **积分不足**: 引导用户邀请朋友或查看获取积分的方式
4. **历史记录**: 保存用户的拼图历史和积分流水

### 4. 拼图编辑功能

#### 4.1 图片编辑操作
- **位置调整**: 拖拽移动图片位置
- **尺寸调整**: 等比例或自由缩放
- **旋转翻转**: 90度旋转、水平/垂直翻转
- **裁剪调整**: 调整图片的可见区域
- **透明度**: 调整图片透明度
- **滤镜效果**: 基础滤镜 (黑白、复古、增强等)

#### 4.2 布局调整
- **模板切换**: 可在不同布局模板间切换
- **元素添加**: 手动添加文字、图标、形状
- **图层管理**: 调整元素层级关系
- **背景设置**: 更换背景颜色或纹理

#### 4.3 技术实现
```typescript
// 编辑器组件架构
interface EditorState {
  canvas: {
    width: number;
    height: number;
    background: Background;
  };
  elements: CollageElement[];
  selectedElement?: string;
  history: EditorState[];
  historyIndex: number;
}

// 操作命令系统
interface EditorCommand {
  type: 'move' | 'resize' | 'rotate' | 'add' | 'delete' | 'modify';
  elementId: string;
  oldValue: any;
  newValue: any;
}
```

### 5. 多语言支持

#### 5.1 支持语言
- **已实现**: 项目已实现多语言支持，基于地理位置自动切换
- **支持语言**: 根据现有实现确定具体支持的语言列表

#### 5.2 国际化实现
- **技术方案**: 沿用现有的Next.js国际化架构
- **自动切换**: 基于用户地理位置或国家自动选择语言
- **代码结构**: `/app/[locale]/layout.tsx` 已存在，无需重构

### 6. 数据库结构完善

#### 6.1 Drizzle ORM 集成方案

##### 6.1.1 依赖安装和配置

**安装依赖**:
```bash
pnpm add drizzle-orm @neondatabase/serverless
pnpm add -D drizzle-kit @types/pg
```

**项目结构**:
```
db/
├── schema/                 # 数据库表结构定义
│   ├── users.ts           # 用户相关表
│   ├── credits.ts         # 积分系统表
│   ├── icons.ts           # Icon库表
│   ├── collages.ts        # 拼图相关表
│   ├── ai.ts              # AI服务表
│   ├── orders.ts          # 订单表
│   ├── system.ts          # 系统配置表
│   └── index.ts           # 统一导出
├── migrations/             # 数据库迁移文件
├── seed.ts                # 初始数据填充
└── index.ts               # 数据库连接和配置
```

**Drizzle 配置文件** (`drizzle.config.ts`):
```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './db/schema/*',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
  verbose: true,
  strict: true,
});
```

##### 6.1.2 Schema 定义

**用户和认证相关表** (`db/schema/users.ts`):
```typescript
import { pgTable, serial, uuid, varchar, integer, boolean, timestamptz, text, inet } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// 用户主表
export const acUsers = pgTable('ac_users', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().unique().notNull(),
  clerkUserId: varchar('clerk_user_id', { length: 255 }).unique().notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  username: varchar('username', { length: 100 }),
  displayName: varchar('display_name', { length: 255 }),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  
  // 积分相关
  credits: integer('credits').default(50),
  totalEarnedCredits: integer('total_earned_credits').default(50),
  totalUsedCredits: integer('total_used_credits').default(0),
  
  // 邀请相关
  inviteCode: varchar('invite_code', { length: 50 }).unique().notNull(),
  invitedByCode: varchar('invited_by_code', { length: 50 }),
  invitedByUserId: uuid('invited_by_user_id'),
  
  // AI使用限制
  dailyAiUsage: integer('daily_ai_usage').default(0),
  lastAiUsageDate: varchar('last_ai_usage_date', { length: 10 }), // YYYY-MM-DD
  totalAiUsage: integer('total_ai_usage').default(0),
  
  // 用户设置
  language: varchar('language', { length: 10 }).default('zh-CN'),
  timezone: varchar('timezone', { length: 50 }).default('Asia/Shanghai'),
  emailNotifications: boolean('email_notifications').default(true),
  
  // 状态和时间
  status: varchar('status', { length: 20 }).default('active'),
  lastLoginAt: timestamptz('last_login_at'),
  createdAt: timestamptz('created_at').defaultNow(),
  updatedAt: timestamptz('updated_at').defaultNow(),
});

// 用户会话表
export const acUserSessions = pgTable('ac_user_sessions', {
  id: serial('id').primaryKey(),
  sessionId: varchar('session_id', { length: 100 }).unique().notNull(),
  userId: uuid('user_id'),
  trialUsageCount: integer('trial_usage_count').default(0),
  ipAddress: varchar('ip_address', { length: 45 }), // 支持IPv6
  userAgent: text('user_agent'),
  lastActivityAt: timestamptz('last_activity_at').defaultNow(),
  createdAt: timestamptz('created_at').defaultNow(),
  expiresAt: timestamptz('expires_at'),
});

// Zod 验证 Schema
export const insertUserSchema = createInsertSchema(acUsers, {
  email: z.string().email('邮箱格式不正确'),
  credits: z.number().min(0, '积分不能为负数'),
  language: z.enum(['zh-CN', 'en-US', 'ja-JP', 'ko-KR']),
});

export const selectUserSchema = createSelectSchema(acUsers);

export type User = typeof acUsers.$inferSelect;
export type NewUser = typeof acUsers.$inferInsert;
```

**积分系统表** (`db/schema/credits.ts`):
```typescript
import { pgTable, serial, uuid, integer, varchar, text, jsonb, timestamptz } from 'drizzle-orm/pg-core';
import { acUsers } from './users';

// 积分流水表
export const acCreditTransactions = pgTable('ac_credit_transactions', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().unique().notNull(),
  userId: uuid('user_id').notNull().references(() => acUsers.uuid, { onDelete: 'cascade' }),
  
  // 交易信息
  amount: integer('amount').notNull(), // 正数为获得，负数为消耗
  balanceAfter: integer('balance_after').notNull(),
  transactionType: varchar('transaction_type', { length: 50 }).notNull(),
  
  // 描述和关联
  title: varchar('title', { length: 255 }),
  description: text('description'),
  relatedEntityType: varchar('related_entity_type', { length: 50 }),
  relatedEntityId: uuid('related_entity_id'),
  
  // 元数据
  metadata: jsonb('metadata'),
  
  createdAt: timestamptz('created_at').defaultNow(),
});

// 邀请记录表
export const acInvitations = pgTable('ac_invitations', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().unique().notNull(),
  
  // 邀请关系
  inviterId: uuid('inviter_id').notNull().references(() => acUsers.uuid, { onDelete: 'cascade' }),
  inviteeId: uuid('invitee_id').references(() => acUsers.uuid, { onDelete: 'set null' }),
  inviteCode: varchar('invite_code', { length: 50 }).notNull(),
  
  // 邀请信息
  email: varchar('email', { length: 255 }),
  invitationMethod: varchar('invitation_method', { length: 20 }).default('link'),
  
  // 奖励信息
  inviterReward: integer('inviter_reward').default(20),
  inviteeReward: integer('invitee_reward').default(20),
  
  // 状态追踪
  status: varchar('status', { length: 20 }).default('pending'),
  clickedAt: timestamptz('clicked_at'),
  registeredAt: timestamptz('registered_at'),
  rewardGivenAt: timestamptz('reward_given_at'),
  
  // 元数据
  metadata: jsonb('metadata'),
  
  createdAt: timestamptz('created_at').defaultNow(),
  updatedAt: timestamptz('updated_at').defaultNow(),
  expiresAt: timestamptz('expires_at'),
});

export type CreditTransaction = typeof acCreditTransactions.$inferSelect;
export type NewCreditTransaction = typeof acCreditTransactions.$inferInsert;
export type Invitation = typeof acInvitations.$inferSelect;
export type NewInvitation = typeof acInvitations.$inferInsert;
```

**Icon库表** (`db/schema/icons.ts`):
```typescript
import { pgTable, serial, uuid, varchar, text, integer, boolean, timestamptz, jsonb } from 'drizzle-orm/pg-core';

// Icon分类表
export const acIconCategories = pgTable('ac_icon_categories', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().unique().notNull(),
  
  categoryId: varchar('category_id', { length: 100 }).unique().notNull(),
  categoryName: varchar('category_name', { length: 255 }).notNull(),
  parentCategoryId: varchar('parent_category_id', { length: 100 }),
  
  description: text('description'),
  aiDescription: text('ai_description'),
  aiKeywords: jsonb('ai_keywords').$type<string[]>(),
  
  displayOrder: integer('display_order').default(0),
  iconColor: varchar('icon_color', { length: 20 }).default('#666666'),
  isActive: boolean('is_active').default(true),
  
  iconCount: integer('icon_count').default(0),
  usageCount: integer('usage_count').default(0),
  
  createdAt: timestamptz('created_at').defaultNow(),
  updatedAt: timestamptz('updated_at').defaultNow(),
});

// Icon库表
export const acIcons = pgTable('ac_icons', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().unique().notNull(),
  
  iconId: varchar('icon_id', { length: 100 }).unique().notNull(),
  iconName: varchar('icon_name', { length: 255 }).notNull(),
  categoryId: varchar('category_id', { length: 100 }).notNull(),
  
  svgContent: text('svg_content').notNull(),
  style: varchar('style', { length: 50 }).default('outline'),
  
  sizeVariants: jsonb('size_variants').$type<string[]>().default(['16', '24', '32', '48', '64']),
  colorVariants: jsonb('color_variants').$type<string[]>().default(['currentColor']),
  
  tags: jsonb('tags').$type<string[]>().default([]),
  aiKeywords: jsonb('ai_keywords').$type<string[]>().default([]),
  semanticMeaning: text('semantic_meaning'),
  aiDescription: text('ai_description'),
  
  popularityScore: integer('popularity_score').default(0),
  usageCount: integer('usage_count').default(0),
  lastUsedAt: timestamptz('last_used_at'),
  
  isActive: boolean('is_active').default(true),
  isPremium: boolean('is_premium').default(false),
  
  source: varchar('source', { length: 100 }),
  version: varchar('version', { length: 20 }).default('1.0.0'),
  license: varchar('license', { length: 100 }).default('MIT'),
  metadata: jsonb('metadata'),
  
  createdAt: timestamptz('created_at').defaultNow(),
  updatedAt: timestamptz('updated_at').defaultNow(),
});

export type IconCategory = typeof acIconCategories.$inferSelect;
export type NewIconCategory = typeof acIconCategories.$inferInsert;
export type Icon = typeof acIcons.$inferSelect;
export type NewIcon = typeof acIcons.$inferInsert;
```

**拼图相关表** (`db/schema/collages.ts`):
```typescript
import { pgTable, serial, uuid, varchar, text, integer, boolean, timestamptz, jsonb, decimal } from 'drizzle-orm/pg-core';
import { acUsers } from './users';

// 拼图模板表
export const acTemplates = pgTable('ac_templates', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().unique().notNull(),
  
  templateId: varchar('template_id', { length: 100 }).unique().notNull(),
  templateName: varchar('template_name', { length: 255 }).notNull(),
  description: text('description'),
  
  minImages: integer('min_images').notNull().default(2),
  maxImages: integer('max_images').notNull().default(9),
  aspectRatios: jsonb('aspect_ratios').$type<string[]>().default(['1:1', '4:3', '16:9']),
  
  canvasConfig: jsonb('canvas_config').notNull(),
  layoutStructure: jsonb('layout_structure').notNull(),
  
  category: varchar('category', { length: 100 }).notNull(),
  style: varchar('style', { length: 100 }),
  tags: jsonb('tags').$type<string[]>().default([]),
  
  aiKeywords: jsonb('ai_keywords').$type<string[]>().default([]),
  aiDescription: text('ai_description'),
  aiSuitableThemes: jsonb('ai_suitable_themes').$type<string[]>().default([]),
  
  isPremium: boolean('is_premium').default(false),
  creditsCost: integer('credits_cost').default(0),
  
  usageCount: integer('usage_count').default(0),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0.00'),
  ratingCount: integer('rating_count').default(0),
  
  isActive: boolean('is_active').default(true),
  isFeatured: boolean('is_featured').default(false),
  
  createdAt: timestamptz('created_at').defaultNow(),
  updatedAt: timestamptz('updated_at').defaultNow(),
});

// 拼图主表
export const acCollages = pgTable('ac_collages', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().unique().notNull(),
  
  userId: uuid('user_id').references(() => acUsers.uuid, { onDelete: 'set null' }),
  sessionId: varchar('session_id', { length: 100 }),
  title: varchar('title', { length: 255 }),
  description: text('description'),
  
  canvasConfig: jsonb('canvas_config').notNull(),
  elements: jsonb('elements').notNull(),
  metadata: jsonb('metadata').notNull(),
  
  templateId: varchar('template_id', { length: 100 }),
  generatedStyle: varchar('generated_style', { length: 100 }),
  userPreferences: jsonb('user_preferences'),
  
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
  previewUrl: varchar('preview_url', { length: 500 }),
  fullImageUrl: varchar('full_image_url', { length: 500 }),
  
  aiModel: varchar('ai_model', { length: 100 }),
  aiProcessingTime: integer('ai_processing_time'),
  creditsUsed: integer('credits_used').default(5),
  
  status: varchar('status', { length: 20 }).default('draft'),
  generationStatus: varchar('generation_status', { length: 20 }).default('pending'),
  
  visibility: varchar('visibility', { length: 20 }).default('private'),
  isFeatured: boolean('is_featured').default(false),
  downloadCount: integer('download_count').default(0),
  viewCount: integer('view_count').default(0),
  
  version: integer('version').default(1),
  parentCollageId: uuid('parent_collage_id'),
  
  startedAt: timestamptz('started_at').defaultNow(),
  completedAt: timestamptz('completed_at'),
  lastEditedAt: timestamptz('last_edited_at').defaultNow(),
  createdAt: timestamptz('created_at').defaultNow(),
  updatedAt: timestamptz('updated_at').defaultNow(),
});

// 拼图图片表
export const acCollageImages = pgTable('ac_collage_images', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().unique().notNull(),
  
  collageId: uuid('collage_id').notNull().references(() => acCollages.uuid, { onDelete: 'cascade' }),
  imageIndex: integer('image_index').notNull(),
  elementId: varchar('element_id', { length: 100 }),
  
  originalUrl: varchar('original_url', { length: 500 }).notNull(),
  processedUrl: varchar('processed_url', { length: 500 }),
  fileName: varchar('file_name', { length: 255 }),
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 100 }),
  
  originalDimensions: jsonb('original_dimensions'),
  processedDimensions: jsonb('processed_dimensions'),
  
  aiAnalysis: jsonb('ai_analysis'),
  dominantColors: jsonb('dominant_colors'),
  contentTags: jsonb('content_tags').$type<string[]>(),
  
  processingStatus: varchar('processing_status', { length: 20 }).default('uploaded'),
  
  uploadedAt: timestamptz('uploaded_at').defaultNow(),
  createdAt: timestamptz('created_at').defaultNow(),
});

export type Template = typeof acTemplates.$inferSelect;
export type NewTemplate = typeof acTemplates.$inferInsert;
export type Collage = typeof acCollages.$inferSelect;
export type NewCollage = typeof acCollages.$inferInsert;
export type CollageImage = typeof acCollageImages.$inferSelect;
export type NewCollageImage = typeof acCollageImages.$inferInsert;
```

##### 6.1.3 数据库连接和查询服务

**数据库连接** (`db/index.ts`):
```typescript
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const sql = neon(process.env.POSTGRES_URL!);
export const db = drizzle(sql, { schema });

export type Database = typeof db;
export { schema };
```

**用户服务** (`lib/services/userService.ts`):
```typescript
import { db } from '@/db';
import { acUsers, acCreditTransactions, type User, type NewUser } from '@/db/schema/users';
import { eq, and, sql } from 'drizzle-orm';
import { generateInviteCode } from '@/lib/utils/inviteCode';

export class UserService {
  async createUser(clerkUserId: string, email: string, userData: Partial<NewUser> = {}): Promise<User> {
    const inviteCode = generateInviteCode();
    
    const [user] = await db.insert(acUsers).values({
      clerkUserId,
      email,
      inviteCode,
      ...userData,
    }).returning();
    
    return user;
  }
  
  async getUserByClerkId(clerkUserId: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(acUsers)
      .where(eq(acUsers.clerkUserId, clerkUserId))
      .limit(1);
    
    return user || null;
  }
  
  async getUserByInviteCode(inviteCode: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(acUsers)
      .where(eq(acUsers.inviteCode, inviteCode))
      .limit(1);
    
    return user || null;
  }
  
  async updateUserCredits(userId: string, amount: number, transactionType: string, metadata?: any): Promise<void> {
    await db.transaction(async (tx) => {
      // 更新用户积分
      const [user] = await tx
        .update(acUsers)
        .set({
          credits: sql`${acUsers.credits} + ${amount}`,
          totalEarnedCredits: amount > 0 ? sql`${acUsers.totalEarnedCredits} + ${amount}` : acUsers.totalEarnedCredits,
          totalUsedCredits: amount < 0 ? sql`${acUsers.totalUsedCredits} + ${Math.abs(amount)}` : acUsers.totalUsedCredits,
          updatedAt: new Date(),
        })
        .where(eq(acUsers.uuid, userId))
        .returning({ credits: acUsers.credits });
      
      // 记录积分流水
      await tx.insert(acCreditTransactions).values({
        userId,
        amount,
        balanceAfter: user.credits,
        transactionType,
        metadata,
      });
    });
  }
  
  async checkDailyAiUsage(userId: string): Promise<{ canUse: boolean; remaining: number }> {
    const today = new Date().toISOString().split('T')[0];
    const [user] = await db
      .select({
        dailyAiUsage: acUsers.dailyAiUsage,
        lastAiUsageDate: acUsers.lastAiUsageDate,
      })
      .from(acUsers)
      .where(eq(acUsers.uuid, userId))
      .limit(1);
    
    if (!user) {
      return { canUse: false, remaining: 0 };
    }
    
    const currentUsage = user.lastAiUsageDate === today ? user.dailyAiUsage : 0;
    const remaining = Math.max(0, 20 - currentUsage);
    
    return {
      canUse: remaining > 0,
      remaining,
    };
  }
  
  async incrementAiUsage(userId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    await db
      .update(acUsers)
      .set({
        dailyAiUsage: sql`CASE 
          WHEN ${acUsers.lastAiUsageDate} = ${today} 
          THEN ${acUsers.dailyAiUsage} + 1 
          ELSE 1 
        END`,
        lastAiUsageDate: today,
        totalAiUsage: sql`${acUsers.totalAiUsage} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(acUsers.uuid, userId));
  }
}

export const userService = new UserService();
```

**拼图服务** (`lib/services/collageService.ts`):
```typescript
import { db } from '@/db';
import { acCollages, acCollageImages, type Collage, type NewCollage } from '@/db/schema/collages';
import { eq, and, desc } from 'drizzle-orm';

export class CollageService {
  async createCollage(data: NewCollage): Promise<Collage> {
    const [collage] = await db.insert(acCollages).values(data).returning();
    return collage;
  }
  
  async getCollageById(id: string): Promise<Collage | null> {
    const [collage] = await db
      .select()
      .from(acCollages)
      .where(eq(acCollages.uuid, id))
      .limit(1);
    
    return collage || null;
  }
  
  async getUserCollages(userId: string, limit = 20): Promise<Collage[]> {
    return await db
      .select()
      .from(acCollages)
      .where(eq(acCollages.userId, userId))
      .orderBy(desc(acCollages.createdAt))
      .limit(limit);
  }
  
  async updateCollageStatus(id: string, status: string, metadata?: any): Promise<void> {
    await db
      .update(acCollages)
      .set({
        status,
        metadata,
        updatedAt: new Date(),
      })
      .where(eq(acCollages.uuid, id));
  }
  
  async addCollageImages(collageId: string, images: Array<{
    originalUrl: string;
    fileName: string;
    fileSize?: number;
    imageIndex: number;
  }>): Promise<void> {
    const imageData = images.map(img => ({
      collageId,
      ...img,
    }));
    
    await db.insert(acCollageImages).values(imageData);
  }
}

export const collageService = new CollageService();
```

##### 6.1.4 迁移和部署脚本

**生成迁移文件**:
```bash
# package.json scripts
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx db/seed.ts",
    "db:reset": "tsx scripts/reset-db.ts"
  }
}
```

**数据填充** (`db/seed.ts`):
```typescript
import { db } from './index';
import { acIconCategories, acIcons, acTemplates, acSystemConfigs } from './schema';

async function seed() {
  console.log('开始数据填充...');
  
  // 插入Icon分类
  await db.insert(acIconCategories).values([
    {
      categoryId: 'general',
      categoryName: '通用',
      description: '通用图标分类',
      aiDescription: 'General purpose icons for common UI elements',
      aiKeywords: ['general', 'common', 'basic'],
      displayOrder: 1,
    },
    {
      categoryId: 'travel',
      categoryName: '旅行',
      description: '旅行相关图标',
      aiDescription: 'Travel and transportation related icons',
      aiKeywords: ['travel', 'trip', 'vacation', 'transport'],
      displayOrder: 2,
    },
    // ... 更多分类
  ]);
  
  // 插入系统配置
  await db.insert(acSystemConfigs).values([
    {
      configKey: 'ai_daily_limits',
      configValue: { user_limit: 20, global_limit: 5000 },
      configType: 'ai_limits',
      description: 'AI使用每日限制配置',
    },
    {
      configKey: 'credit_pricing',
      configValue: { collage: 5, download: 10, premium_template: 15 },
      configType: 'pricing',
      description: '积分消耗定价',
    },
  ]);
  
  console.log('数据填充完成！');
}

seed().catch(console.error);
```

##### 6.1.5 类型安全的API路由

**积分查询API** (`app/api/credits/balance/route.ts`):
```typescript
import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { userService } from '@/lib/services/userService';
import { respData, respErr } from '@/lib/utils/response';

export async function GET() {
  try {
    const { userId: clerkUserId } = auth();
    if (!clerkUserId) {
      return respErr('未登录', 401);
    }
    
    const user = await userService.getUserByClerkId(clerkUserId);
    if (!user) {
      return respErr('用户不存在', 404);
    }
    
    return respData({
      credits: user.credits,
      totalEarned: user.totalEarnedCredits,
      totalUsed: user.totalUsedCredits,
    });
  } catch (error) {
    console.error('查询积分余额失败:', error);
    return respErr('查询失败');
  }
}
```

**一键拼图API** (`app/api/collage/generate/route.ts`):
```typescript
import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { userService } from '@/lib/services/userService';
import { collageService } from '@/lib/services/collageService';
import { geminiService } from '@/lib/services/geminiService';
import { respData, respErr } from '@/lib/utils/response';

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = auth();
    if (!clerkUserId) {
      return respErr('未登录', 401);
    }
    
    const user = await userService.getUserByClerkId(clerkUserId);
    if (!user) {
      return respErr('用户不存在', 404);
    }
    
    // 检查积分余额
    if (user.credits < 5) {
      return respErr('积分不足，请邀请朋友获取积分', 402);
    }
    
    // 检查每日AI使用限制
    const { canUse } = await userService.checkDailyAiUsage(user.uuid);
    if (!canUse) {
      return respErr('今日AI使用次数已达上限', 429);
    }
    
    const formData = await req.formData();
    const images = formData.getAll('images') as File[];
    
    if (images.length < 2 || images.length > 20) {
      return respErr('请上传2-20张图片', 400);
    }
    
    // 创建拼图记录
    const collage = await collageService.createCollage({
      userId: user.uuid,
      title: `拼图_${Date.now()}`,
      status: 'processing',
      canvasConfig: {},
      elements: [],
      metadata: {},
    });
    
    // 异步处理AI生成
    generateCollageAsync(collage.uuid, images, user.uuid).catch(console.error);
    
    return respData({
      collageId: collage.uuid,
      status: 'processing',
      message: 'AI正在分析您的图片，请稍候...',
    });
    
  } catch (error) {
    console.error('生成拼图失败:', error);
    return respErr('生成失败，请稍后重试');
  }
}

async function generateCollageAsync(collageId: string, images: File[], userId: string) {
  try {
    // AI分析和生成
    const result = await geminiService.generateCollage({
      images,
      collageId,
    });
    
    // 更新拼图数据
    await collageService.updateCollageStatus(collageId, 'completed', result);
    
    // 扣除积分
    await userService.updateUserCredits(userId, -5, 'collage', { collageId });
    
    // 增加AI使用计数
    await userService.incrementAiUsage(userId);
    
  } catch (error) {
    console.error('AI生成失败:', error);
    await collageService.updateCollageStatus(collageId, 'failed', { error: error.message });
  }
}
```

##### 6.1.6 开发工具和工作流

**开发命令**:
```bash
# 开发环境启动
pnpm dev

# 生成新的迁移文件
pnpm db:generate

# 应用迁移到数据库
pnpm db:migrate

# 启动 Drizzle Studio (数据库管理界面)
pnpm db:studio

# 重置数据库并填充初始数据
pnpm db:reset && pnpm db:seed
```

**环境变量更新** (`.env.local`):
```env
# 数据库连接
POSTGRES_URL="postgresql://username:password@host:port/database"

# Drizzle Studio
DB_VIEWER_PORT=3001

# 现有配置...
```

这样的 Drizzle ORM 集成方案具有以下优势：

1. **类型安全**: 完整的 TypeScript 支持，编译时捕获数据库错误
2. **性能优化**: 只查询需要的字段，自动生成高效SQL
3. **开发体验**: 优秀的IDE支持和自动补全
4. **迁移管理**: 版本化的数据库迁移，支持团队协作
5. **查询构建**: 直观的查询API，避免SQL注入
6. **关系处理**: 自动处理表关系和外键约束

## 关键设计决策总结

### 1. 数据库表前缀策略
**决策**: 使用 `ac_` 前缀（AICollager的缩写）
**理由**:
- ✅ **命名空间隔离**: 避免与系统表或其他服务冲突
- ✅ **功能分组清晰**: 一眼就能识别出表的归属
- ✅ **团队协作友好**: 多人开发时减少命名冲突
- ✅ **未来扩展性**: 便于后期微服务拆分

### 2. AI输出数据模型核心特点
**设计理念**: AI输出完整的、结构化的、可编辑的拼图描述数据

**核心优势**:
- 🎯 **精准还原**: 前端画板组件可以完全按照AI输出精准还原效果
- 🔧 **完全可编辑**: 每个元素都包含详细的变换和样式信息
- 🤖 **AI推荐透明**: 包含AI的推荐理由和置信度
- 📱 **响应式友好**: 支持不同画布尺寸的适配
- 🎨 **丰富元素**: 支持图片、Icon、文字、形状、边框等多种元素

### 3. Icon库与AI集成策略
**Icon库管理**:
- 结构化存储Icon元数据（名称、分类、标签、AI关键词）
- 支持多样式多尺寸（outline/filled/duotone, 16-48px）
- 使用频率评分优化推荐

**AI集成方式**:
- AI通过Icon的语义关键词理解Icon含义
- 基于图片内容、主题、色彩智能推荐匹配Icon
- 支持位置智能布局（角落、中心等）

## 总结

这个MVP版本聚焦于核心的"一键拼图"功能，通过积分系统管理用户使用，通过AI智能化区别于竞品。关键创新点在于AI输出完整的结构化数据模型，使得生成的拼图既智能又完全可编辑。技术栈基于现有代码，开发风险可控。

**关键成功指标**:
- 用户一键拼图的成功率 > 85%
- 用户对AI生成结果的满意度 > 4.0/5.0
- AI推荐元素的采纳率 > 70%
- 平均每用户邀请朋友数 > 1.5
- 积分转化为付费的转化率 > 10%

## 附录：技术实现补充

### A1. 环境变量更新
```env
# AI服务配置
GEMINI_API_KEY=""
GEMINI_MODEL="gemini-pro-vision"

# 每日限制配置
MAX_USER_DAILY_AI_USAGE=20
MAX_GLOBAL_DAILY_AI_USAGE=5000
AI_COST_ALERT_THRESHOLD=100 # USD

# Cloudflare R2存储配置
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME=""
R2_PUBLIC_URL=""  # 自定义域名或R2.dev域名

# 现有配置保持不变
POSTGRES_URL=""
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
# ... 其他现有配置
```

### A2. Gemini API集成示例
```typescript
// services/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export class GeminiService {
  async analyzeImagesForCollage(images: Buffer[]): Promise<CollageAnalysis> {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
    
    const prompt = `
      分析这些图片，提供拼图布局建议：
      1. 识别图片内容和主题
      2. 分析色彩搭配
      3. 推荐最佳布局方案
      4. 建议装饰元素
      请以JSON格式返回结果。
    `;
    
    const result = await model.generateContent([prompt, ...images]);
    return JSON.parse(result.response.text());
  }
}
```

### A3. 每日限制实现
```typescript
// services/dailyLimit.ts
export class DailyLimitService {
  async checkAndIncrementUsage(userId: string): Promise<{
    canUse: boolean;
    message?: string;
  }> {
    // 检查用户每日限制
    const userUsage = await this.getUserDailyUsage(userId);
    if (userUsage >= 20) {
      return { canUse: false, message: '您今日的AI使用次数已达上限' };
    }
    
    // 检查全站限制
    const globalUsage = await this.getGlobalDailyUsage();
    if (globalUsage >= 5000) {
      return { canUse: false, message: '系统繁忙，请稍后再试' };
    }
    
    // 增加使用计数
    await this.incrementUsage(userId);
    return { canUse: true };
  }
} 
```

### A4. Next.js 架构优化建议

#### 推荐继续使用 Next.js 的原因
1. **现有基础扎实**: 项目已有完整的 API Routes、数据库操作、文件上传等核心能力
2. **开发效率高**: 统一技术栈，前后端共享类型定义，减少维护成本
3. **部署简单**: Vercel 无缝集成，无需额外的服务器运维
4. **成本可控**: MVP 阶段无需额外的后端服务器成本

#### 架构优化策略

**1. API 路由结构规划**
```
app/api/
├── auth/                 # 用户认证相关
├── credits/              # 积分系统
│   ├── balance/          # 查询余额
│   ├── transaction/      # 积分流水
│   └── invite/           # 邀请奖励
├── collage/              # 拼图功能
│   ├── analyze/          # AI 图片分析
│   ├── generate/         # 一键生成拼图
│   ├── save/             # 保存拼图
│   └── history/          # 拼图历史
├── admin/                # 管理功能
│   ├── stats/            # 使用统计
│   └── limits/           # 限制管理
└── webhook/              # 第三方回调
```

**2. 性能优化措施**
```typescript
// 异步处理长时间任务
export async function POST(req: Request) {
  // 立即返回任务ID
  const taskId = generateTaskId();
  
  // 异步处理
  processCollageGeneration(taskId, imageData).catch(console.error);
  
  return Response.json({ taskId, status: 'processing' });
}

// 使用流式响应处理大文件
export async function GET(req: Request) {
  const stream = new ReadableStream({
    start(controller) {
      // 分块处理图片数据
    }
  });
  
  return new Response(stream);
}
```

**3. 错误处理和监控**
```typescript
// 统一错误处理
export async function POST(req: Request) {
  try {
    // 业务逻辑
  } catch (error) {
    // 记录错误日志
    await logError(error, req);
    
    // 返回用户友好错误
    return respErr('处理失败，请稍后重试');
  }
}
```

#### 当需要考虑微服务拆分的情况
- **用户量**：日活用户 > 10万
- **AI 调用量**：每日 > 50万次
- **数据量**：拼图记录 > 1000万条
- **团队规模**：后端开发人员 > 3人

在 MVP 阶段，这些情况都不会出现，Next.js 架构完全够用。

#### 未来扩展路径
```
Phase 1 (MVP): Next.js 全栈应用
Phase 2 (成长期): Next.js + Redis 缓存
Phase 3 (扩展期): Next.js + 独立 AI 服务
Phase 4 (成熟期): 微服务架构