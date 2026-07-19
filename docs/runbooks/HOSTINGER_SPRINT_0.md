# Hostinger Sprint 0 Proof Runbook

Status: local foundation prepared; Hostinger verification not yet executed.

## Safety boundary

Do not remove, replace, rename, or reconfigure the existing `uacohio.org` website during this proof. Use a temporary Hostinger domain or approved staging subdomain. A production cutover requires a verified downloadable backup, a restore rehearsal, a rollback plan, an approved window, and explicit authorization from the Hostinger account owner.

## Required account facts

Record these before creating a staging application:

- exact Hostinger plan and renewal owner;
- Node.js Web App capacity and supported Node 22 runtime;
- staging domain or temporary domain;
- MariaDB/MySQL version, database size, user, and connection limits;
- backup frequency and restore path;
- scheduled task support and minimum interval;
- runtime log and restart controls;
- current DNS, SSL, email, files, databases, analytics, and redirects.

Do not paste passwords, tokens, connection strings, or personal data into this document, GitHub, screenshots, or task logs.

## Deployment proof

1. Create an isolated staging Node.js Web App connected to the GitHub repository.
2. Select Node.js 22 and configure the build command as `pnpm install --frozen-lockfile && pnpm build`.
3. Configure the start command supported by the Hostinger Node.js interface. Prefer `pnpm start` unless the managed interface requires the standalone server entrypoint.
4. Configure only staging environment variables from `.env.example`; use separate staging database credentials.
5. Deploy an approved commit from a protected branch.
6. Confirm `/api/health` returns HTTP 200 without querying the database.
7. Set `REQUIRE_DATABASE=true` and confirm `/api/ready` returns HTTP 200 only when a valid staging database connection is configured in the later database adapter step.
8. Confirm application logs, restart, build failure visibility, and rollback to a previous commit.

## Database proof

The repository contains a local MariaDB service and a minimal `system_metadata` migration. Its reviewed rollback companion is `drizzle/0000_thankful_ricochet.down.sql`. Before production automation is approved:

1. generate and review the SQL migration;
2. apply it only to an isolated staging database;
3. record the migration table and advisory-lock behavior;
4. prove a rollback or restore path;
5. select one operator-controlled migration method from the System Design Document;
6. document connection-pool limits based on the actual Hostinger plan.

## Exit evidence

- staging URL and deployment commit;
- screenshots or exported records of runtime settings with secrets redacted;
- health and readiness responses;
- successful and intentionally failed build logs;
- database migration and restoration evidence;
- backup download and restore-rehearsal evidence;
- named owners for deployment, database, DNS, privacy/security, and rollback.
