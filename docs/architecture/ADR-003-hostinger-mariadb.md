# ADR-003: Use Hostinger MariaDB as the Release 1 operational database

Status: Superseded for the local portal build by ADR-007
Date: 2026-07-18

## Context

Release 1 needs transactions, relational integrity, staff queries, stage history, consent, notifications, audit, content versions, and reports. Hostinger managed Web and Cloud plans provide MariaDB/MySQL; managed PostgreSQL requires an external service or VPS.

## Decision drivers

- Transactional consistency for accepted inquiries and notification outbox records.
- Relational queries and reporting.
- Use the database included with the Hostinger plan.
- Keep one operational database and minimize vendors.
- Support type-safe schema and versioned SQL migrations.

## Options considered

1. Hostinger MariaDB/MySQL with Drizzle and `mysql2`.
2. External Supabase PostgreSQL.
3. MongoDB Atlas.
4. SQLite in the application filesystem.

## Decision

Use Hostinger MariaDB/MySQL with InnoDB, `utf8mb4`, UTC timestamps, explicit foreign keys, indexes, and bounded connection pooling. Use Drizzle ORM for TypeScript schema and reviewed SQL migrations.

## Consequences

Positive:

- Included managed database and hPanel/phpMyAdmin access.
- Strong transactional fit for admissions and outbox behavior.
- Fewer vendors and credentials.
- Straightforward backup alignment with Hostinger.

Negative:

- Database availability and scaling are tied to the Hostinger plan.
- Some PostgreSQL-specific features are unavailable.
- Migration execution from the managed Node environment must be proven.
- Database connection limits require bounded pooling.

## Reconsider when

- UAC selects a system of record or platform requiring PostgreSQL.
- Hostinger database limits or availability fail measured requirements.
- Managed authentication/CMS benefits justify an approved external platform.
- Reporting or data-integration needs require a separate warehouse.

## References

- [Hostinger MySQL with Node.js](https://www.hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/)
- [Drizzle MySQL support](https://orm.drizzle.team/docs/mysql/get-started-mysql)
