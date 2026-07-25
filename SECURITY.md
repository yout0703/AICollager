# Security Policy

## Supported versions

Security fixes are applied to the default branch (`main`) of this repository. If you self-host, pull latest `main` or pin a known-good commit and track upstream fixes.

## Reporting a vulnerability

**Do not** open a public GitHub issue for security problems (especially auth bypass, RCE, secret exposure, or data leaks).

Please report privately by one of:

1. **GitHub Security Advisories** for this repository (preferred if enabled):  
   Repository → Security → Advisories → Report a vulnerability  
2. **Email the maintainers** listed on the GitHub profile of the repository owner, with subject `[AICollager security]`.

Include:

- Description and impact
- Steps to reproduce or a proof of concept
- Affected commit / version if known
- Whether the issue is already public

We aim to acknowledge reports within a few business days and will coordinate disclosure after a fix is available when practical.

## What to expect after reporting

- Confirmation of receipt
- Clarifying questions if needed
- A fix or mitigation timeline when validated
- Credit in release notes if you want it (optional)

## Security expectations for contributors

- Never commit secrets (`.env.local`, keys, tokens, production DB URLs with passwords).
- Admin capabilities must check `ADMIN_EMAILS` (or a stronger mechanism).
- Uploads must be authenticated, size-limited, and must not write attacker-controlled paths.
- Prefer server-side secrets only (`CLERK_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `R2_SECRET_ACCESS_KEY`, `GEMINI_API_KEY`).

## Secret rotation

If a secret is exposed in git history, public issues, or logs:

1. **Revoke and rotate** the secret at the provider immediately.
2. Update deployment env vars (Vercel, etc.).
3. Optionally rewrite history only after rotation; history rewrite does not make a leaked key safe.
