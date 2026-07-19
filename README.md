# Universal Academy of Columbus

This repository contains the new multilingual UAC website and the source-controlled product, technical, and architecture documents that govern its development.

## Current implementation

- Next.js 16 App Router with strict TypeScript;
- English, Arabic, and Somali routes at `/en`, `/ar`, and `/so`;
- localized Admissions, Academics, Student Life, About, and Contact pages;
- server-rendered RTL document direction for Arabic;
- UAC design tokens and responsive homepage vertical slice;
- liveness and readiness endpoints at `/api/health` and `/api/ready`;
- local MariaDB service and initial Drizzle schema;
- linting, formatting, typechecking, unit tests, production build, and GitHub Actions CI.

The current public copy is a development draft. School facts, translations, addresses, contact details, photography, and claims require content-owner approval before launch.

## Local setup

Use Node.js 22 and pnpm 10.

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Open `http://localhost:3000`; the locale proxy redirects to `/en`.

To start the local MariaDB service:

```bash
docker compose up -d database
```

To run the quality gate:

```bash
pnpm format
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Production boundary

Do not connect this scaffold to production family, student, or staff data. Do not replace the current Hostinger website from an automated task. Follow [the Hostinger Sprint 0 proof runbook](./docs/runbooks/HOSTINGER_SPRINT_0.md) on an isolated staging site first.

## Governing documents

Start with [the documentation index](./docs/README.md), then review the Development Plan, Technical Requirements Document, System Design Document, and architecture decision records before expanding the application.
