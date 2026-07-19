# UAC Ohio Technical Requirements Document

Document status: Draft for stakeholder review  
Version: 0.1  
Date: 2026-07-18  
Repository: [ichillous/uacohio](https://github.com/ichillous/uacohio)

## 1. Purpose

This Technical Requirements Document defines the implementation, integration, data, security, quality, deployment, and operational requirements for the UAC public website, admissions workflow, content administration, and staff enrollment portal.

It translates the BRD and PRD into engineering requirements. It does not authorize official student, attendance, transportation, academic, or high-stakes messaging integrations; those remain conditional Phase 2 work.

## 2. System context and constraints

### 2.1 Confirmed context

- `ichillous/uacohio` is a new GitHub repository with no commits on `main` as of 2026-07-18.
- The domain `uacohio.org` is hosted at Hostinger.
- Saved design prototypes define a six-page public site and a staff portal concept.
- The BRD and PRD define English, Arabic, and Somali as launch languages and identify privacy, accessibility, security, and content verification as launch gates.

### 2.2 Hostinger constraints

- Hostinger currently supports Next.js and other Node.js applications on Business Web Hosting and Cloud plans, with GitHub-based builds and deployments.
- Hostinger lists Node.js 18, 20, 22, and 24 as supported versions. The project baseline is Node.js 22 because Next.js 16 requires Node.js 20.9 or newer.
- Hostinger managed Web and Cloud hosting provides MySQL/MariaDB, not managed PostgreSQL. The project therefore uses the MySQL protocol and MariaDB-compatible schema.
- Hostinger plan limits vary. CPU, RAM, Node.js site count, database connections, database size, email sending, and backup frequency must be verified in hPanel.
- Replacing an existing Hostinger website with a Node.js Web App can require removing and re-adding the website. Production cutover is therefore a separately approved operation with verified backups and rollback.

### 2.3 Working capacity assumptions

| Dimension               |                                                                        Initial design target |
| ----------------------- | -------------------------------------------------------------------------------------------: |
| Public visits           |                                                           5,000 per day with campaign bursts |
| Public dynamic requests |                         10 requests per second sustained, 25 requests per second short burst |
| Staff accounts          |                                                                 25 initially, design for 100 |
| Concurrent staff users  |                                                                  10 initially, design for 25 |
| Leads                   |                                                25,000 retained records before archive review |
| Content locales         |                                                                      English, Arabic, Somali |
| File/media volume       | Repository-managed launch media; external object storage required before broad staff uploads |

These values are design assumptions, not confirmed forecasts.

## 3. Technology baseline

| Layer           | Requirement                                                         | Baseline                                                              |
| --------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Runtime         | Hostinger-supported maintained Node.js version                      | Node.js 22.x                                                          |
| Application     | Full-stack React framework with server rendering and route handlers | Next.js 16.x App Router                                               |
| Language        | Strictly typed application code                                     | TypeScript 5.x, `strict: true`                                        |
| UI              | Utility styling with centralized tokens and accessible primitives   | Tailwind CSS 4.x plus project components                              |
| Validation      | Shared schema validation on browser and server                      | Zod or approved equivalent                                            |
| Database        | Hostinger-managed relational database                               | MariaDB/MySQL using InnoDB and UTF-8 MB4                              |
| Data access     | Type-safe SQL schema and versioned migrations                       | Drizzle ORM with `mysql2`                                             |
| Authentication  | Invite-only credentials, verified email, secure sessions, TOTP 2FA  | Better Auth with MySQL; exact stable version locked at scaffold       |
| Testing         | Unit, integration, browser E2E, and accessibility                   | Vitest, Testing Library, Playwright, axe-core or approved equivalents |
| Package manager | Deterministic lockfile and CI install                               | pnpm 10.x                                                             |
| Source control  | GitHub pull requests and protected production branch                | GitHub                                                                |
| Hosting         | GitHub-connected managed Node.js application                        | Hostinger Business or Cloud                                           |

Major version changes require a dependency review and, when they alter architecture or operations, an ADR update.

## 4. Architecture requirements

| ID       | Requirement                                                                                                                                                        | Priority | Verification                                  |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | --------------------------------------------- |
| ARCH-001 | The system shall be implemented as one deployable modular full-stack application for Release 1.                                                                    | Must     | Architecture review and module-boundary tests |
| ARCH-002 | Public, admissions, authentication, content, notification, and reporting logic shall be separated into modules with explicit server-side interfaces.               | Must     | Code review and dependency rules              |
| ARCH-003 | Business logic shall not depend directly on UI components or third-party provider SDKs.                                                                            | Must     | Unit tests and provider adapter review        |
| ARCH-004 | All access to identifiable family or staff data shall pass through server-enforced authorization and service-layer validation.                                     | Must     | Negative authorization tests                  |
| ARCH-005 | Official student, attendance, transportation, or academic data shall not be introduced until the system of record and read/write contract are approved.            | Must     | Phase 2 architecture gate                     |
| ARCH-006 | Provider-specific email, SMS, WhatsApp, analytics, anti-spam, and storage code shall be isolated behind adapters.                                                  | Must     | Integration contract tests                    |
| ARCH-007 | The design shall avoid Redis, message brokers, microservices, containers, and additional databases in Release 1 unless a measured requirement justifies them.      | Should   | ADR review                                    |
| ARCH-008 | The application shall expose a lightweight unauthenticated liveness endpoint and a dependency-aware readiness endpoint protected from sensitive detail disclosure. | Must     | Staging health-check tests                    |

## 5. Public website requirements

| ID      | Requirement                                                                                                                                                                            | Priority | Acceptance measure                               |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------ |
| WEB-001 | Implement Home, Admissions, Academics, Student Life, About, and Contact using reusable page sections and approved content schemas.                                                     | Must     | All routes pass visual and content acceptance    |
| WEB-002 | Public pages shall use server rendering, static generation, or revalidation appropriate to content freshness; they shall not require client JavaScript for core reading or navigation. | Must     | JavaScript-disabled content smoke test           |
| WEB-003 | URLs, page titles, descriptions, canonical links, sitemap, robots policy, headings, and organization schema shall be locale-aware and approved.                                        | Must     | Automated metadata tests and crawl review        |
| WEB-004 | All navigation and call-to-action controls shall be semantic, keyboard operable, and visibly focused.                                                                                  | Must     | Keyboard and screen reader test                  |
| WEB-005 | Images shall have approved rights/consent, dimensions, alternative text, responsive formats, and compression.                                                                          | Must     | Media register and performance test              |
| WEB-006 | Production shall contain no placeholder names, contacts, claims, statistics, images, dates, credentials, or sample student records.                                                    | Must     | Automated placeholder scan plus content approval |
| WEB-007 | Unknown routes shall return a branded, accessible 404 response; failures shall return recoverable error states without stack traces.                                                   | Must     | Error-route tests                                |
| WEB-008 | Security and privacy pages shall be linked from every public page.                                                                                                                     | Must     | Navigation test                                  |

## 6. Localization requirements

| ID       | Requirement                                                                                                                                           | Priority | Acceptance measure             |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------ |
| I18N-001 | English, Arabic, and Somali shall have stable locale identifiers and locale-aware URLs or equivalent shareable navigation state.                      | Must     | Deep-link and refresh tests    |
| I18N-002 | Arabic pages shall set document direction to RTL and correctly handle reading order, alignment, directional icons, forms, tables, dates, and numbers. | Must     | Qualified Arabic review        |
| I18N-003 | Language switching shall preserve the current logical page and shall not silently discard form data.                                                  | Must     | E2E test                       |
| I18N-004 | Navigation, headings, body content, labels, help, validation, confirmations, metadata, and system states shall be localized together.                 | Must     | Translation completeness check |
| I18N-005 | Missing translations shall fail the build for required keys or display an explicit controlled fallback in non-production.                             | Must     | CI test                        |
| I18N-006 | Content versions shall link translations to the source revision so stale translations can be identified.                                              | Should   | Content workflow test          |
| I18N-007 | Locale layouts shall work at 200% zoom and with long text without clipping, overlap, or horizontal scroll at 320 CSS pixels.                          | Must     | Accessibility and visual tests |

## 7. Content management requirements

| ID      | Requirement                                                                                                                                                                 | Priority | Acceptance measure            |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------- |
| CMS-001 | Release 1 shall use predefined page and section schemas rather than a general drag-and-drop page builder.                                                                   | Must     | Schema review                 |
| CMS-002 | Authorized users shall be able to edit approved text fields, links, notices, contact information, leadership profiles, program summaries, SEO fields, and media references. | Must     | Role-based content E2E tests  |
| CMS-003 | Content shall support Draft, In Review, Approved, Published, and Archived states.                                                                                           | Must     | Workflow tests                |
| CMS-004 | Publishing shall require the appropriate content role and record actor, timestamp, previous version, source locale revision, and approval metadata.                         | Must     | Audit verification            |
| CMS-005 | Editors shall preview the selected locale and viewport before publication.                                                                                                  | Should   | Preview tests                 |
| CMS-006 | Production media shall be versioned in the repository for the initial release; broad browser uploads require an approved durable object-storage design.                     | Must     | Deployment persistence review |
| CMS-007 | Content shall support effective dates and review/expiry dates for enrollment notices and time-sensitive information.                                                        | Should   | Scheduled review test         |
| CMS-008 | Published content changes shall invalidate or revalidate the affected public pages without restarting the application.                                                      | Must     | Cache invalidation test       |

## 8. Admissions workflow requirements

| ID      | Requirement                                                                                                                                        | Priority | Acceptance measure            |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------- |
| ADM-001 | The inquiry endpoint shall accept only the approved guardian, contact, child/grade-interest, language, notes, attribution, and consent fields.     | Must     | Contract and validation tests |
| ADM-002 | The visit endpoint shall accept only approved contact, requested day/time, message, attribution, language, and consent fields.                     | Must     | Contract and validation tests |
| ADM-003 | Browser validation shall improve usability, but server-side validation is authoritative.                                                           | Must     | Bypass-client-validation test |
| ADM-004 | Each accepted request shall use an idempotency key or equivalent protection to prevent duplicate records from retries and double submissions.      | Must     | Concurrency and retry tests   |
| ADM-005 | The service shall capture first-touch and submission attribution without placing personal data in URLs, cookies, or third-party analytics.         | Must     | Analytics payload review      |
| ADM-006 | Consent records shall include policy/version, purpose, choice, locale, timestamp, and request context approved by privacy review.                  | Must     | Database and E2E verification |
| ADM-007 | The service shall use accessible anti-spam controls, honeypots, server rate limits, and abuse monitoring.                                          | Must     | Abuse and accessibility tests |
| ADM-008 | A valid submission shall create a lead, activity, due date, notification-outbox records, and an immutable submission timestamp in one transaction. | Must     | Transaction integration test  |
| ADM-009 | The family shall receive a localized confirmation that excludes unnecessary child information.                                                     | Must     | Template and delivery test    |
| ADM-010 | Staff alerts and family confirmations shall expose delivery status, retry state, and permanent failure.                                            | Must     | Failure-mode test             |
| ADM-011 | Likely duplicate people shall be flagged for staff review rather than automatically merged.                                                        | Should   | Matching test                 |
| ADM-012 | The system shall calculate overdue status from the approved service-level calendar and time zone, defaulting to America/New_York.                  | Must     | Date/time test                |

## 9. Authentication and authorization requirements

| ID       | Requirement                                                                                                                                                            | Priority | Acceptance measure           |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------- |
| AUTH-001 | Staff registration shall be invite-only; public self-signup shall be disabled.                                                                                         | Must     | API and UI tests             |
| AUTH-002 | Staff email shall be verified before access is granted.                                                                                                                | Must     | Authentication E2E test      |
| AUTH-003 | TOTP two-factor authentication shall be mandatory for staff before production access.                                                                                  | Must     | Enrollment and sign-in tests |
| AUTH-004 | Password policy shall enforce at least 12 characters, breached/common password screening if supported, secure hashing, and rate-limited sign-in/reset flows.           | Must     | Security tests               |
| AUTH-005 | Password reset and verification responses shall resist email enumeration.                                                                                              | Must     | Response comparison test     |
| AUTH-006 | Sessions shall use Secure, HttpOnly, SameSite cookies, rotation, inactivity timeout, absolute timeout, and revocation after password reset or account disablement.     | Must     | Cookie and session tests     |
| AUTH-007 | Roles shall include Super Administrator, Admissions Manager, Admissions Agent, Content Publisher, Content Editor, Report Viewer, and optional later operational roles. | Must     | Permission matrix approval   |
| AUTH-008 | Authorization shall be checked on the server for every record query, mutation, export, and administrative action.                                                      | Must     | Negative tests for each role |
| AUTH-009 | Sensitive events shall record actor, target, action, timestamp, outcome, request correlation ID, and changed field names without recording secrets.                    | Must     | Audit-log test               |
| AUTH-010 | Administrators shall be able to invite, disable, re-enable, revoke sessions, reset 2FA through an approved recovery process, and review access.                        | Must     | Account lifecycle E2E test   |

## 10. Enrollment pipeline requirements

| ID       | Requirement                                                                                                                                                      | Priority | Acceptance measure                 |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------- |
| PIPE-001 | Default stages shall be Inquiry, Contacted, Toured, Applied, Enrolled, and Closed; exact definitions and transitions require UAC approval.                       | Must     | Workflow configuration approval    |
| PIPE-002 | Leads shall support owner, stage, due date, grade interest, preferred language, source, campaign, created time, last activity, and closed outcome filters.       | Must     | Filter integration tests           |
| PIPE-003 | Lead detail shall show approved family/child data, consent, source, assignment, stage history, activities, visit requests, next action, and notification status. | Must     | Role-based E2E test                |
| PIPE-004 | Stage, owner, due date, contact attempt, note, visit, and close actions shall create audit and activity records.                                                 | Must     | Database reconciliation test       |
| PIPE-005 | Internal notes shall reject unsafe markup, enforce length limits, and never appear in public confirmations or third-party analytics.                             | Must     | Security and leakage tests         |
| PIPE-006 | The interface shall highlight new, unassigned, overdue, duplicate, failed-notification, and incomplete-consent records.                                          | Must     | UI acceptance test                 |
| PIPE-007 | Search shall use indexed fields and shall not expose records outside the current user's permission scope.                                                        | Must     | Query plan and authorization tests |
| PIPE-008 | Bulk operations shall require explicit confirmation, permission checks, item limits, and audit events.                                                           | Should   | Bulk-action tests                  |

## 11. Reporting and analytics requirements

| ID      | Requirement                                                                                                                                         | Priority | Acceptance measure              |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------- |
| RPT-001 | Each dashboard metric shall have a stored or documented formula, source, owner, period, refresh time, and duplicate/withdrawal treatment.           | Must     | Metric dictionary approval      |
| RPT-002 | Dashboard values shall reconcile to permission-filtered underlying records.                                                                         | Must     | Automated reconciliation test   |
| RPT-003 | Exports shall apply active filters and permissions, include generation time and report period, and be logged.                                       | Must     | Export authorization test       |
| RPT-004 | Spreadsheet exports shall prevent formula injection and use UTF-8 encoding suitable for Arabic and Somali.                                          | Must     | Malicious-cell and locale tests |
| RPT-005 | PDF exports shall include title, period, data freshness, confidentiality marking, and requesting user.                                              | Should   | PDF snapshot test               |
| RPT-006 | Third-party analytics shall receive no names, email addresses, phone numbers, child data, free text, lead IDs, session IDs, or authentication data. | Must     | Payload inspection              |
| RPT-007 | Analytics consent and cookie behavior shall follow the approved privacy model.                                                                      | Must     | Consent E2E test                |

## 12. Notification and background-job requirements

| ID        | Requirement                                                                                                                                                  | Priority | Acceptance measure        |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ------------------------- |
| NOTIF-001 | Business transactions shall write notification requests to a database outbox instead of calling external providers inside the user transaction.              | Must     | Integration test          |
| NOTIF-002 | A protected scheduled job shall claim queued work, send through the configured provider adapter, and record attempt and provider response metadata.          | Must     | Staging cron test         |
| NOTIF-003 | Jobs shall be idempotent, use bounded exponential retry, stop after a configured maximum, and expose permanent failures to staff.                            | Must     | Retry and duplicate tests |
| NOTIF-004 | Provider credentials shall be stored only in Hostinger environment variables or an approved secret store.                                                    | Must     | Configuration review      |
| NOTIF-005 | Templates shall be versioned, localized, approved, and rendered with escaped data.                                                                           | Must     | Template tests            |
| NOTIF-006 | WhatsApp, SMS, and high-stakes translated messaging shall remain disabled until consent, provider, template, retention, and human-review rules are approved. | Must     | Feature-flag review       |

## 13. Data requirements

### 13.1 Database configuration

- MariaDB/MySQL with InnoDB tables, `utf8mb4` character set, and UTC timestamps.
- Application time-zone display defaults to `America/New_York` while persisted timestamps remain UTC.
- Database credentials are read from validated environment variables and never committed.
- Query traffic uses a bounded connection pool; initial maximum pool size is 10 and must remain below the confirmed Hostinger per-user connection limit.
- Foreign keys, unique constraints, check/application constraints, indexes, and explicit deletion behavior are required.
- Monetary or precise values, if introduced later, use fixed-precision types rather than floating point.

### 13.2 Core data entities

| Entity group            | Required entities                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Identity                | User, Account, Session, Verification, TwoFactor, StaffProfile, Role/Permission mapping                             |
| Content                 | Page, PageLocalization, ContentVersion, ContentApproval, MediaAssetReference                                       |
| Admissions              | Family, Guardian, ProspectiveStudent, Lead, LeadStageHistory, LeadActivity, VisitRequest, Task, DuplicateCandidate |
| Attribution and consent | Campaign, Source, ConsentRecord, PrivacyNoticeVersion                                                              |
| Notifications           | Notification, NotificationAttempt, OutboxJob, TemplateVersion                                                      |
| Governance              | AuditEvent, MetricDefinition, ExportRecord, FeatureFlag                                                            |

### 13.3 Data lifecycle

- The system shall support configurable retention by record class; actual periods remain a UAC/privacy decision.
- Development, CI, demos, documentation, and screenshots shall use synthetic data only.
- Production data shall not be copied to local or preview environments.
- Merge, correction, archive, and approved deletion shall preserve required audit evidence.
- Database exports shall be access-controlled, encrypted in transit, time-limited where practical, and logged.
- Backups shall be treated as sensitive production data and included in retention and access review.

### 13.4 Migration requirements

- Schema source shall be version-controlled Drizzle definitions plus generated/reviewed SQL migrations.
- Every migration shall be tested against a production-like staging copy using synthetic data.
- Destructive or long-running changes require backup confirmation, rollback or roll-forward instructions, and an approved maintenance window.
- Sprint 0 must prove the supported Hostinger migration execution path. Until then, production migration automation remains an open operational decision.

## 14. API requirements

### 14.1 Public endpoints

| Method | Route                    | Purpose                                    | Authentication                     |
| ------ | ------------------------ | ------------------------------------------ | ---------------------------------- |
| GET    | `/api/health/live`       | Process liveness                           | None, no dependency detail         |
| GET    | `/api/health/ready`      | Database and critical dependency readiness | Protected or minimal response      |
| POST   | `/api/v1/inquiries`      | Submit prospective-family inquiry          | Public, anti-spam and rate-limited |
| POST   | `/api/v1/visit-requests` | Submit campus visit request                | Public, anti-spam and rate-limited |

### 14.2 Staff endpoints

| Method    | Route                                  | Purpose                          | Permission                        |
| --------- | -------------------------------------- | -------------------------------- | --------------------------------- |
| GET       | `/api/v1/admin/leads`                  | Search and filter leads          | `lead:read`                       |
| GET       | `/api/v1/admin/leads/{id}`             | Read lead detail                 | `lead:read` with scope            |
| PATCH     | `/api/v1/admin/leads/{id}`             | Update approved lead fields      | `lead:update`                     |
| POST      | `/api/v1/admin/leads/{id}/activities`  | Add contact or work activity     | `activity:create`                 |
| POST      | `/api/v1/admin/leads/{id}/transitions` | Change stage with rules          | `lead:transition`                 |
| POST      | `/api/v1/admin/leads/{id}/assign`      | Assign owner or queue            | `lead:assign`                     |
| GET       | `/api/v1/admin/reports/{type}`         | Generate approved report/export  | `report:export`                   |
| GET/PATCH | `/api/v1/admin/content/{page}`         | Read/edit content                | `content:read` / `content:update` |
| POST      | `/api/v1/admin/content/{page}/publish` | Publish approved content version | `content:publish`                 |

### 14.3 API behavior

- JSON request and response schemas shall be versioned and validated.
- Errors shall use a consistent machine-readable shape with correlation ID, safe code, localized user message where applicable, and no stack trace or secret.
- Mutations shall enforce CSRF protection appropriate to the session model, origin checks, server authorization, and audit.
- Public mutations shall support idempotency and rate limiting.
- Pagination shall be cursor-based or bounded page-based; unbounded list endpoints are prohibited.
- Request bodies, free text, and exports shall have explicit size limits.

## 15. Accessibility requirements

- Target WCAG 2.2 Level AA, subject to UAC approval.
- Conformant semantic structure, landmarks, heading hierarchy, labels, instructions, error summaries, status messages, focus management, and keyboard order.
- No interaction may require pointer precision, drag-and-drop, color perception, or motion.
- Respect reduced-motion, high zoom, reflow, and text-spacing changes.
- Authentication, 2FA, session timeout, forms, tables, filters, exports, and publishing workflows are included in manual accessibility testing.
- Arabic RTL and Somali long-text scenarios are part of accessibility acceptance, not separate visual polish.

## 16. Security requirements

| ID      | Requirement                                                                                                                                |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| SEC-001 | Follow OWASP Top 10 and an agreed OWASP ASVS Level 2 subset for the staff portal and public forms.                                         |
| SEC-002 | Apply least privilege, deny by default, server-side authorization, and explicit record scope.                                              |
| SEC-003 | Validate all input and encode output by context; use parameterized queries through the ORM.                                                |
| SEC-004 | Configure TLS, HSTS after validation, CSP, frame protection, MIME sniffing protection, referrer policy, and permissions policy.            |
| SEC-005 | Protect sign-in, password reset, 2FA, inquiry, visit, export, and search endpoints against abuse.                                          |
| SEC-006 | Run dependency, secret, license, and static analysis checks in CI; review Hostinger vulnerability reports after deployment.                |
| SEC-007 | Keep secrets out of source, logs, analytics, screenshots, support messages, and client bundles.                                            |
| SEC-008 | Redact personal data and credentials from structured logs and error reporting.                                                             |
| SEC-009 | Log security-relevant actions and define alert thresholds for repeated failures, privilege changes, exports, and suspicious request rates. |
| SEC-010 | Complete threat modeling and privacy review before production and after material integration changes.                                      |

## 17. Performance and reliability requirements

### 17.1 Public experience targets

- Core Web Vitals at the 75th percentile on key mobile pages: LCP at or below 2.5 seconds, INP at or below 200 milliseconds, CLS at or below 0.1.
- Initial HTML server response target: p75 TTFB at or below 800 milliseconds from the primary audience region, subject to Hostinger plan and CDN results.
- Public JavaScript and image budgets shall be established in Sprint 0 and enforced in CI for key pages.
- Database-backed portal list queries should complete within 500 milliseconds at p95 under the design dataset on staging.

### 17.2 Reliability targets

| Measure                  |                                                         MVP target | Dependency                              |
| ------------------------ | -----------------------------------------------------------------: | --------------------------------------- |
| Monthly availability     |                         99.5% for public pages and form submission | Hostinger plan and external providers   |
| Inquiry data durability  |                        No accepted request lost after confirmation | Database transaction and backup process |
| Notification processing  | 95% of first attempts within 5 minutes; permanent failures visible | Scheduled job and provider              |
| Recovery point objective |                                                 24 hours or better | Daily database backup required          |
| Recovery time objective  |                       4 hours for application and database restore | Tested runbook and account access       |

If the confirmed Hostinger plan provides only weekly backups, daily backups or an approved external export process is required before forms collect production data.

## 18. Observability and operations requirements

- Structured logs shall include timestamp, level, service, environment, request/correlation ID, route, outcome, duration, and safe identifiers.
- Monitoring shall cover uptime, readiness, error rate, form success rate, database connectivity, outbox backlog, notification failures, authentication failures, exports, and Hostinger CPU/RAM/I/O usage.
- Alerts shall have named owners, severity, threshold, channel, and runbook link.
- Error reporting shall group exceptions and redact personal data.
- Audit logs are not a substitute for application diagnostics, and application logs are not a substitute for immutable audit evidence.
- Support shall have runbooks for deployment, rollback, migration, backup, restore, user access, notification failure, privacy request, and incident response.

## 19. CI/CD requirements

### Pull request checks

1. Deterministic dependency install from lockfile.
2. Formatting and linting.
3. Type checking.
4. Unit and integration tests with coverage thresholds established after Sprint 0.
5. Database migration generation/check and schema drift check.
6. Production build.
7. Accessibility smoke tests and critical Playwright journeys.
8. Dependency, secret, and static security scans.
9. Placeholder and prohibited-PII analytics scan.

### Deployment requirements

- Hostinger GitHub integration shall deploy only protected branches.
- Staging deployment and database migration proof are required before production.
- Environment variables shall be configured in hPanel per environment and validated at startup.
- Deployment shall expose build and runtime logs and support restart and rollback procedures.
- Production deployment shall be blocked if required migrations, content approvals, or backup confirmation are missing.
- The current Hostinger website shall not be removed or replaced by automation without explicit account-owner approval.

## 20. Test requirements

| Test type            | Minimum scope                                                                                             |
| -------------------- | --------------------------------------------------------------------------------------------------------- |
| Unit                 | Domain rules, validation, stage transitions, due dates, permissions, metric formulas, template rendering  |
| Database integration | Transactions, constraints, migrations, filters, pagination, outbox claiming, audit records                |
| API integration      | Validation, idempotency, authorization, rate limits, CSRF/origin, error shape, failure behavior           |
| Component            | Forms, error summaries, tables, filters, modals, locale and RTL behavior                                  |
| E2E                  | Family inquiry, visit request, login/2FA, lead workflow, content publish, export, session expiry          |
| Accessibility        | Automated axe plus manual keyboard, screen reader, zoom/reflow, contrast, focus, RTL                      |
| Security             | Negative authorization, injection, XSS, CSRF, enumeration, brute force, export scope, secret leakage      |
| Performance          | Public page budgets, form load, portal list query, report generation, burst submission                    |
| Recovery             | Backup download, database restore, application rollback, migration failure, notification provider failure |

Production-like E2E tests shall use synthetic identities and synthetic family/student data.

## 21. Traceability summary

| Product area            | PRD identifiers          | TRD identifiers                                                      |
| ----------------------- | ------------------------ | -------------------------------------------------------------------- |
| Public website          | PUB-*                    | WEB-_, I18N-_, CMS-*                                                 |
| Admissions forms        | ENR-*                    | ADM-_, NOTIF-_                                                       |
| Authentication          | AUTH-*                   | AUTH-_, SEC-_                                                        |
| Enrollment pipeline     | PIPE-*                   | PIPE-*, API requirements                                             |
| Optional operations     | OPS-*                    | ARCH-005 and Phase 2 gate                                            |
| Analytics and reporting | NFR / analytics sections | RPT-*, observability                                                 |
| Quality                 | NFR-*                    | Accessibility, security, performance, reliability, test requirements |

## 22. Open technical decisions

| Decision                                                                | Owner                       | Deadline                 |
| ----------------------------------------------------------------------- | --------------------------- | ------------------------ |
| Confirm Hostinger plan and Node.js website capacity                     | Account owner               | Discovery Week 1         |
| Confirm production/staging domain and branch mapping                    | Product owner / engineering | Sprint 0                 |
| Prove safe MariaDB migration execution on Hostinger                     | Engineering                 | Sprint 0                 |
| Select transactional email provider and sending domain configuration    | Communications / IT         | Before Sprint 3          |
| Select analytics platform and consent model                             | Product / privacy           | Before Sprint 2 complete |
| Approve anti-spam provider if rate limits and honeypot are insufficient | Product / privacy           | Before public forms      |
| Confirm content media storage beyond repository-managed launch assets   | Product / engineering       | Before browser uploads   |
| Confirm RPO/RTO and daily backup availability                           | Account owner / IT          | Before production forms  |
| Confirm official systems of record and Phase 2 integration method       | UAC operations / IT         | Before Release 2 design  |

## 23. Source references

- [Hostinger: Deploy a Node.js Web App](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/)
- [Hostinger: Connect MySQL to a Node.js application](https://www.hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/)
- [Hostinger: Hosting plan parameters and limits](https://www.hostinger.com/support/6976044-parameters-and-limits-of-hosting-plans-in-hostinger/)
- [Hostinger: Download backups](https://www.hostinger.com/support/5981435-how-to-download-backups-at-hostinger/)
- [Hostinger: Cron jobs](https://www.hostinger.com/support/hpanel/cron-jobs/)
- [Next.js: Installation and requirements](https://nextjs.org/docs/app/getting-started/installation)
- [Next.js: Deployment modes](https://nextjs.org/docs/app/getting-started/deploying)
- [Better Auth: Email and password](https://better-auth.com/docs/authentication/email-password)
- [Better Auth: MySQL adapter](https://better-auth.com/docs/adapters/mysql)
- [Better Auth: Two-factor authentication](https://better-auth.com/docs/plugins/2fa)
- [Drizzle ORM: MySQL](https://orm.drizzle.team/docs/mysql/get-started-mysql)
- [Drizzle ORM: Migrations](https://orm.drizzle.team/docs/migrations)
