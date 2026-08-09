# AICollager

[![CI](https://github.com/yout0703/AICollager/actions/workflows/ci.yml/badge.svg)](https://github.com/yout0703/AICollager/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

基于 OpenAI gpt-image-2 的提示词驱动 AI 图像生成应用（Next.js）。输入提示词、选择风格与场景即可直接生成图像；支持上传参考图（图生图）与多轮提示词精修。

English docs: [README.md](./README.md).

## 功能概览

- 提示词驱动出图（OpenAI gpt-image-2），支持文生图与图生图
- 预设风格库与场景模板，AI 智能编排最优提示词
- 多轮提示词精修与完整历史版本回退
- Clerk 登录、积分与邀请
- Cloudflare R2 对象存储
- 多语言：`en` / `zh` / `es` / `fr` / `de` / `ja` / `ko`

## 技术栈

| 层级 | 技术 |
|------|------|
| 应用 | Next.js 15（App Router）、React 18、Tailwind |
| 认证 | [Clerk](https://clerk.com) |
| AI | [OpenAI gpt-image-2](https://developers.openai.com/api/docs/models/gpt-image-2) |
| 数据库 | PostgreSQL + [Drizzle ORM](https://orm.drizzle.team) |
| 存储 | [Cloudflare R2](https://developers.cloudflare.com/r2/) |

## 环境要求

- Node.js 20+
- [pnpm](https://pnpm.io) 9+
- PostgreSQL（本地 Docker / Supabase / Neon 等）
- Clerk、Gemini、R2 等密钥（见下）

## 快速开始

```bash
git clone https://github.com/yout0703/AICollager.git
cd AICollager
pnpm install
cp env.example .env.local
# 编辑 .env.local，填入真实配置
```

### 数据库

1. 准备 Postgres（`env.example` 中有 Docker 示例）。
2. 在 `.env.local` 设置 `POSTGRES_URL`。
3. 同步表结构：

```bash
pnpm db:push
# 或: pnpm db:migrate
```

可选种子数据：

```bash
pnpm db:seed
```

### 启动

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000)。

## 环境变量

将 **`env.example`** 复制为 **`.env.local`**，**不要**把真实密钥提交到 Git。

| 变量 | 是否必需 | 用途 |
|------|----------|------|
| `NEXT_PUBLIC_CLERK_*` / `CLERK_SECRET_KEY` | 是 | 登录 |
| `OPENAI_API_KEY` | AI 功能需要 | OpenAI gpt-image-2（需完成 API 组织验证） |
| `POSTGRES_URL` | 是 | 数据库 |
| Supabase 相关 | 使用 Supabase 客户端时 | Supabase |
| `R2_*` | 上传需要 | R2 |
| `NEXT_PUBLIC_APP_URL` | 建议 | 邀请链接等绝对地址 |
| `ADMIN_EMAILS` | 管理接口需要 | 管理员邮箱（逗号分隔） |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | 否 | 设为 `true` 启用 Vercel Analytics |
| `ALLOW_LOCAL_UPLOAD` | 否 | 本地磁盘上传；生产保持 `false` |

完整注释见 `env.example`。

## 常用命令

```bash
pnpm dev          # 开发
pnpm build        # 构建
pnpm start        # 生产启动
pnpm lint         # ESLint
pnpm db:push      # 推送 schema
pnpm db:migrate   # 执行迁移
pnpm db:studio    # Drizzle Studio
pnpm db:seed      # 种子数据
```

## 安全说明

- `/api/admin/*` 仅允许 `ADMIN_EMAILS` 中的已登录用户。
- `/api/upload-image` 面向本地开发（需登录、有大小限制；生产默认关闭）。生产请走 R2 拼贴上传流程。
- 漏洞请私下报告，见 [SECURITY.md](./SECURITY.md)。

## 贡献

见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 许可证

[Apache License 2.0](./LICENSE)。

## 说明

`docs/`、`features/` 含设计与历史规划，可能与当前代码不同步；**以本 README 与 `env.example` 为准**。
