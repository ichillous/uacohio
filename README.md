# Universal Academy of Columbus

This repository contains the multilingual UAC public website and the local-first foundation for staff/admin and parent portals.

## Current implementation

- Next.js 16 App Router with strict TypeScript and OpenNext for Cloudflare Workers;
- English, Arabic, and Somali public routes, with server-rendered RTL direction for Arabic;
- a Cloudflare D1/SQLite schema covering identity, admissions, students, attendance, messaging, notifications, and audit history;
- provider-neutral sessions, server-side staff permissions, and guardian relationship scoping;
- a development-only, passwordless identity switcher at `/en/dev-login`;
- deterministic synthetic data with 200 students, six staff personas, linked guardians, 30 leads across all pipeline stages, and 9,000 daily attendance rows;
- liveness and D1-backed readiness endpoints at `/api/health` and `/api/ready`.

The current public copy and every seeded portal record are development data. School facts, translations, addresses, contact details, photography, and claims require content-owner approval before launch.

## Local setup

Use Node.js 22 and pnpm 10. Wrangler simulates the D1 binding locally; Docker and MariaDB are not required.

```bash
cp .env.example .env.local
pnpm install
pnpm dev:local
```

`pnpm dev:local` applies local-only D1 migrations, replaces local data with the deterministic seed, verifies its invariants, and starts Next.js. Open `http://localhost:3000/en/dev-login` and choose any seeded staff or guardian identity.

The seed command is intentionally destructive only to the local Wrangler database. It refuses to run when `APP_ENV` is anything other than `development` or `test`.

Useful database commands:

```bash
pnpm db:migrate:local
pnpm db:seed:local
pnpm db:verify:local
pnpm db:setup:local
```

New D1 migrations are generated in `drizzle-d1/`. The older files in `drizzle/` are frozen MySQL migration evidence and are guarded by checksums; do not run or edit them.

## Quality gate

```bash
pnpm format
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

The combined gate is `pnpm check`. Local success does not establish staging or production readiness.

## Production boundary

The production Worker has an explicitly approved D1 binding with the committed
schema only. Do not load production family, student, or staff data, run the
synthetic local seed remotely, change DNS, configure Google OAuth, or replace the
current website without separate approval. Production identity, data migration,
provider delivery, and staging acceptance remain separately approved work.

## Governing documents

Start with [the documentation index](./docs/README.md), [the approved portal analysis](./docs/portal-analysis.md), and [the D1 schema notes](./docs/schema.md) before expanding the application.
