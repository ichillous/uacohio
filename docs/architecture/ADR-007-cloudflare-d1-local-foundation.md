# ADR-007: Supersede the MySQL runtime with a separate Cloudflare D1 lineage

Status: Accepted for local development
Date: 2026-07-22

## Context

The historical repository scaffold used a MySQL Drizzle schema and migration. The approved portal build runs on Cloudflare Workers/OpenNext with D1 and prohibits editing applied migrations or changing production resources.

## Decision

- Keep `drizzle/0000_thankful_ricochet.sql`, its down file, and MySQL metadata unchanged as historical evidence.
- Use SQLite Drizzle primitives in `src/db/schema.ts` and generate an independent forward-only D1 lineage under `drizzle-d1/`.
- Bind the local database as `DB` in `wrangler.jsonc`; local commands always include `--local`.
- Use OpenNext's Cloudflare context to access D1 from server-only code.
- Treat any future transfer from an actually deployed MySQL database as a separately approved extraction, reconciliation, cutover, and rollback project.

## Consequences

The new D1 baseline recreates `system_metadata` and the portal schema without pretending that MySQL SQL is SQLite-compatible. A checksum gate protects the frozen lineage. Production database IDs, remote migrations, and deployment remain unresolved and out of scope.

## Production binding addendum

On 2026-07-27, production D1 provisioning and application of the committed
`drizzle-d1` migrations were separately authorized for the `uacohio` Worker.
The `DB` binding points to `uacohio-production`; local database commands address
the same binding name with an explicit `--local` flag and remain isolated from
the remote database. This authorization covers the schema only. Production
school data, synthetic seed data, identity providers, DNS changes, and launch
acceptance remain outside this decision.
