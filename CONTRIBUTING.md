# Contributing to AICollager

Thanks for your interest in contributing. This guide covers local setup and how we review changes.

## Development setup

1. Fork and clone the repo.
2. Install dependencies with **pnpm** (`pnpm install`).
3. Copy `env.example` to `.env.local` and fill in keys you need for the area you are working on (Clerk + Postgres is the minimum for most flows; Gemini/R2 for AI/upload).
4. Push schema: `pnpm db:push`.
5. Start the app: `pnpm dev`.

## Before you open a PR

- Run `pnpm lint` and fix new issues you introduced.
- Prefer a successful `pnpm build` for UI/API changes (CI runs lint + typecheck/build when secrets are stubbed).
- Keep PRs focused: one concern per PR when possible.
- Do **not** commit `.env.local`, API keys, personal tokens, or production URLs with credentials.
- Do **not** reintroduce debug/test API routes that dump env or DB state.

## Code style

- TypeScript + App Router conventions already used in the repo.
- Prefer existing patterns in `lib/services` and `lib/repositories` over one-off DB access in route handlers.
- New env vars must be documented in `env.example` and, if user-facing, in the README.

## Commit messages

Clear, imperative summaries work well, for example:

- `fix: enforce admin auth on cleanup API`
- `docs: align README with Gemini and Drizzle setup`

## Pull requests

1. Describe **what** changed and **why**.
2. Note any migration / env changes reviewers must know.
3. Link related issues if any.
4. Expect review on security (authz, uploads, secrets) and docs accuracy.

## Design / planning docs

Historical notes live under `docs/` and `features/`. If you update product behavior, update user-facing docs (README / env.example) first; treat planning docs as optional context.

## Security

Please report vulnerabilities privately via [SECURITY.md](./SECURITY.md) rather than public issues.
