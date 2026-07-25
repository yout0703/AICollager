# AICollager

[![CI](https://github.com/yout0703/AICollager/actions/workflows/ci.yml/badge.svg)](https://github.com/yout0703/AICollager/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

AI-powered photo collage app built with Next.js. Upload images, get layout suggestions from Google Gemini, and export polished collages.

中文说明见 [README_CN.md](./README_CN.md).

## Features

- Multi-image collage workspace with layout tools
- AI analysis / layout suggestions (Google Gemini)
- Auth via Clerk, credits & invitations
- Object storage on Cloudflare R2
- i18n: `en`, `zh`, `es`, `fr`, `de`, `ja`, `ko`

## Stack

| Layer | Tech |
|--------|------|
| App | Next.js 15 (App Router), React 18, Tailwind |
| Auth | [Clerk](https://clerk.com) |
| AI | [Google Gemini](https://ai.google.dev) |
| DB | PostgreSQL + [Drizzle ORM](https://orm.drizzle.team) (Supabase / Neon / local) |
| Storage | [Cloudflare R2](https://developers.cloudflare.com/r2/) |

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io) 9+
- PostgreSQL (local Docker, Supabase, or Neon)
- Clerk, Gemini, and R2 credentials (see below)

## Quick start

```bash
git clone https://github.com/yout0703/AICollager.git
cd AICollager
pnpm install
cp env.example .env.local
# Edit .env.local with your keys
```

### Database

1. Create a Postgres database (example with Docker is in `env.example`).
2. Set `POSTGRES_URL` in `.env.local`.
3. Apply schema:

```bash
pnpm db:push
# or: pnpm db:migrate
```

Optional seed:

```bash
pnpm db:seed
```

### Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Copy **`env.example`** → **`.env.local`**. Never commit real secrets.

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_CLERK_*` / `CLERK_SECRET_KEY` | Yes | Auth |
| `GEMINI_API_KEY` | Yes (AI features) | Gemini |
| `POSTGRES_URL` | Yes | Database |
| `NEXT_PUBLIC_SUPABASE_*` / `SUPABASE_SERVICE_ROLE_KEY` | If using Supabase client | Supabase |
| `R2_*` | Yes (uploads) | Cloudflare R2 |
| `NEXT_PUBLIC_APP_URL` | Recommended | Public origin for invite links |
| `ADMIN_EMAILS` | For admin APIs | Comma-separated admin emails |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | No | Set `true` to enable Vercel Analytics |
| `ALLOW_LOCAL_UPLOAD` | No | Dev disk upload; keep `false` in production |

Full comments live in `env.example`.

## Scripts

```bash
pnpm dev          # local dev server
pnpm build        # production build
pnpm start        # run production build
pnpm lint         # ESLint
pnpm db:push      # push Drizzle schema
pnpm db:migrate   # run migrations
pnpm db:studio    # Drizzle Studio
pnpm db:seed      # seed data
```

## Security notes

- `/api/admin/*` requires a signed-in user whose email is listed in `ADMIN_EMAILS`.
- `/api/upload-image` is **dev-oriented** (auth + size limits; disabled in production unless `ALLOW_LOCAL_UPLOAD=true`). Prefer R2 via the collage flow.
- Report vulnerabilities privately — see [SECURITY.md](./SECURITY.md).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

Licensed under the [Apache License 2.0](./LICENSE).

## Disclaimer

`docs/` and `features/` contain design notes and historical planning. They may lag the running code; prefer this README and `env.example` for setup.
