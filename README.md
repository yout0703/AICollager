# AICollager

AICollager 是一个基于 AI 的图像处理工具，帮助用户创建精美的拼贴图像和设计作品。

## 快速开始

1. 克隆项目

```shell
git clone <your-repo-url>
cd aicollager
```

2. 安装依赖

```shell
pnpm install
```

3. 初始化数据库

创建您的数据库，可以使用 [本地 PostgreSQL](https://wiki.postgresql.org/wiki/Homebrew)、[vercel-postgres](https://vercel.com/docs/storage/vercel-postgres) 或 [supabase](https://supabase.com/)

使用 `data/install.sql` 中的 SQL 创建表

4. 设置环境变量

在 `aicollager` 根目录下创建 `.env.local` 文件，并设置以下变量

```
OPENAI_API_KEY=""

POSTGRES_URL=""

AWS_AK=""
AWS_SK=""
AWS_REGION=""
AWS_BUCKET=""

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

STRIPE_PUBLIC_KEY=""
STRIPE_PRIVATE_KEY=""

WEB_BASE_URI=""
```

5. 本地开发

```shell
pnpm dev
```

访问 `http://localhost:3000` 预览效果

## 技术栈

- [Next.js](https://nextjs.org/docs) - 全栈开发框架
- [Clerk](https://clerk.com/docs/quickstarts/nextjs) - 用户认证
- [AWS S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/upload-objects.html) - 图像存储
- [Stripe](https://stripe.com/docs/development) - 支付处理
- [node-postgres](https://node-postgres.com/) - 数据处理
- [Tailwind CSS](https://tailwindcss.com/) - 页面构建 