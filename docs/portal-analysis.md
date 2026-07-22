# Staff/Admin and Parent Portals: Phase 1 Analysis

Status: **proposed for approval**

Date: 2026-07-22

Implementation gate: **No Phase 2 work starts until this document is approved.**

## 1. Executive decision

Extend the existing multilingual Next.js application as a Cloudflare-native modular monolith. Use one D1 database and one server-side session contract, while preserving domain boundaries for identity, admissions, student operations, notifications, reporting, and governance.

The following are controlling decisions from the build prompt:

- Cloudflare Workers through OpenNext and D1 replace the Hostinger/Node VPS and MariaDB assumptions in older documents.
- Local development uses seeded, passwordless dummy identities. Production Google OAuth is a future adapter, not part of this build.
- Staff authority is permission based and default deny. Guardian authority is a separate audience and is always derived from family/student links.
- The parent portal is new scope. The `PAR-*` requirements below are proposals requiring approval.
- All data is synthetic in local development. No deployment, production credentials, real provider delivery, or production resource changes are part of this phase.

## 2. Evidence and current repository baseline

This analysis used `graphify-out/GRAPH_REPORT.md`, focused graph queries, programmatic queries of `graphify-out/graph.json`, graph-cited plain-text requirement files, targeted EMIS PDF ranges, and the current repository.

### Confirmed implementation

- Next.js 16 App Router, strict TypeScript, React 19, pnpm 10, Vitest, Zod, Drizzle, and OpenNext Cloudflare are installed.
- Public localized routes use `/en`, `/ar`, and `/so`; Arabic already receives `dir="rtl"` through the locale model.
- The repository contains public-site routes/components plus `/api/health` and `/api/ready`. It does not contain portal routes, portal APIs, session handling, RBAC, guardian scoping, or portal seed data.
- `src/db/schema.ts` defines only `system_metadata`, using `mysqlTable`.
- `drizzle/0000_thankful_ricochet.sql` is a MySQL migration for that one table. `drizzle.config.ts`, `mysql2`, `compose.yaml`, `.env.example`, and README instructions are also MySQL/MariaDB oriented.
- `wrangler.jsonc` has OpenNext, R2 incremental-cache, Images, service, and observability configuration, but no D1 binding.
- The admin design reference confirms the main navigation and visual target: Dashboard, Enrollment Pipeline, Students, Attendance, Messages, and Reports. Administration is a functional addition required by the prompt.

### Proposed implementation status

Everything after this section is a Phase 1 design proposal. No schema, API, authentication, portal UI, or seed implementation is claimed here.

## 3. Module and route boundaries

| Domain              | Responsibilities                                                                                                   | Proposed UI routes                                                    | Primary server boundary                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Identity            | Common session contract, dev identity switcher, staff roles, permission grants, guardian audience                  | `/[locale]/dev-login`, `/staff/admin/users`                           | `getSession()`, `requireStaffPermission()`, `requireGuardianScope()` |
| Admissions          | Families, guardians, prospects, inquiries, pipeline, activities, due dates, visits, applications, duplicate review | `/staff/pipeline`, `/staff/pipeline/[leadId]`                         | Admissions repository and transition service                         |
| Student operations  | EMIS-aligned students, guardian links, enrollments, attendance, documents, seat capacity                           | `/staff/students`, `/staff/students/[studentId]`, `/staff/attendance` | Student and attendance repositories                                  |
| Notifications       | Family conversations, messages, announcements, delivery intents/attempts, durable outbox                           | `/staff/messages`, `/staff/announcements`                             | Messaging service and fake local delivery adapter                    |
| Reporting           | Dashboard metrics, funnel and attendance summaries, CSV exports                                                    | `/staff`, `/staff/reports`                                            | Permission-filtered metric/export services                           |
| Governance          | Audit events, sensitive-change history, guardian profile requests                                                  | `/staff/admin/audit`, `/staff/admin/profile-requests`                 | Append-only audit service and approval workflow                      |
| Guardian experience | Linked children/applicants, attendance, messages, announcements, documents, profile requests                       | `/[locale]/parent/**`                                                 | Guardian-scoped repositories only                                    |

Staff routes may default to English, but the shared locale shell remains available. Parent routes must have complete EN/AR/SO message catalogs and Arabic RTL behavior.

## 4. Schema delta and domain model

### 4.1 Delta from the existing schema

The existing runtime schema has one MySQL-shaped table:

| Existing table    | Treatment in D1                                                                                                                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `system_metadata` | Recreate in the new D1 baseline with `key`, `value`, and integer/ISO timestamp fields. Preserve the existing MySQL migration and snapshot unchanged as historical evidence. |

The portal requires the following new SQLite/D1 tables. IDs are application-generated text UUIDs/ULIDs, booleans are integer constrained to `0/1`, and timestamps use one documented UTC representation.

### 4.2 Identity domain

| Table                   | Minimum fields and purpose                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `users`                 | Audience (`staff` or `guardian`), display name, normalized email, locale, status, created/updated timestamps              |
| `auth_identities`       | User FK, provider (`dev` now; `google` later), provider subject, unique provider/subject pair; no passwords               |
| `sessions`              | User FK, opaque session identifier/hash, expiry, revoked time, provider metadata; local adapter only creates dev sessions |
| `staff_profiles`        | User FK, staff persona/role key, optional title, active state                                                             |
| `guardian_accounts`     | User FK, guardian FK, verified-link state and timestamp                                                                   |
| `roles`                 | Stable role key and description                                                                                           |
| `permissions`           | Stable module/action key and description                                                                                  |
| `role_permissions`      | Role/permission pair with unique constraint                                                                               |
| `user_role_assignments` | Staff user/role pair, effective dates, assigning actor                                                                    |

`guardian` is not inserted into `roles`. A guardian session has `audience: "guardian"`, `role: null`, and no staff permission grants.

### 4.3 Admissions domain

| Table                        | Minimum fields and purpose                                                                                        |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `families`                   | Household lifecycle, preferred locale, archive state                                                              |
| `guardians`                  | Family FK, name, approved contact fields, contact preference, preferred language                                  |
| `prospective_students`       | Family FK, minimum approved name fields, grade interest; no birth date until required                             |
| `leads`                      | Family/prospect FK, stage, owner, source/campaign, locale, due date, version, timestamps, close outcome           |
| `lead_stage_history`         | Lead FK, from/to stage, actor, reason, immutable timestamp                                                        |
| `lead_activities`            | Lead FK, type, outcome, safe note, actor, next-action date, immutable timestamp                                   |
| `follow_up_tasks`            | Lead FK, owner, due time, completion state, outcome                                                               |
| `visit_requests`             | Lead/family FK, requested slot, state, notes                                                                      |
| `applications`               | Lead/prospect FK, local application status, submitted time, external reference if later approved                  |
| `guardian_application_links` | Guardian/application FK, relationship, active/revoked state, effective dates; explicit applicant-family authority |
| `consent_records`            | Family/lead FK, policy version, purpose, choice, locale, timestamp, privacy-approved request context              |
| `duplicate_candidates`       | Pair of lead/person references, rule signals, review state, reviewer, resolution; never an automatic merge        |

Allowed primary stages are `inquiry -> contacted -> toured -> applied -> enrolled`. `closed_not_proceeding` is a terminal side path. Every transition uses optimistic version checking and creates stage-history, activity, and audit rows.

### 4.4 Student operations domain

| Table                              | Minimum fields and purpose                                                                                                                   |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `students`                         | Internal ID, distinct EMIS linkage ID/local-use ID/SSID fields, source prospect FK, legal name, birth date, demographic codes, active status |
| `guardian_student_links`           | Guardian FK, student FK, relationship/custody/contact flags, effective dates; unique active relationship                                     |
| `school_years` / `terms`           | Date boundaries, current-state flag, attendance aggregation boundary                                                                         |
| `enrollments`                      | Student/term FK, admission/effective dates and codes, IRNs, grade, percent of time, withdrawal fields, status                                |
| `student_attributes`               | Student FK, effective range, attendance pattern, grade, EL/disability and other approved EMIS-aligned codes                                  |
| `attendance_daily`                 | Student/date FK, local daily status, absence type, attended/absent minutes, note, marker, source, version; source for FM export              |
| `seat_capacity`                    | School year, grade, capacity, approved owner/source, refreshed timestamp                                                                     |
| `student_documents`                | Student FK, type, object key, original filename, media type, size, checksum, uploader, timestamps                                            |
| `document_shares`                  | Document/guardian FK, shared/revoked timestamps and actor                                                                                    |
| `guardian_profile_update_requests` | Guardian/account FK, requested field changes, state, reviewer, decision note, timestamps                                                     |

The database stores document metadata and an object key, not binary file contents. Local object storage should use an offline Wrangler/Miniflare-compatible R2 binding; production storage remains out of scope.

### 4.5 Notifications and governance domains

| Table                   | Minimum fields and purpose                                                                                                        |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `message_threads`       | Family FK, optional student/lead context, subject, state, timestamps                                                              |
| `thread_participants`   | Thread FK plus staff user or guardian FK, participant type, last-read time                                                        |
| `messages`              | Thread FK, sender, original body/locale, optional reviewed translation, immutable timestamp                                       |
| `announcements`         | Author, title/body per locale or translation group, status, publish/expiry times                                                  |
| `announcement_targets`  | Announcement plus all-families, grade, student, family, or guardian target                                                        |
| `notification_intents`  | Message/announcement/lead reference, template version, locale, channel, recipient reference, state                                |
| `notification_attempts` | Intent FK, fake-provider response, attempt number, result, timestamp                                                              |
| `outbox_jobs`           | Kind, aggregate reference, state, attempts, available/locked times, unique idempotency key                                        |
| `audit_events`          | Actor/audience, action, target type/ID, correlation ID, outcome, changed field names, timestamp; no secret or message body copies |

### 4.6 Required constraints and indexes

- Unique normalized identity per provider; unique active staff assignment; no staff role assignment to guardian-audience users.
- Unique effective `guardian_student_links(guardian_id, student_id, effective_start)` and `guardian_application_links(guardian_id, application_id, effective_start)` grants, with indexes in both traversal directions.
- Unique `attendance_daily(student_id, attendance_date)` with an index on date/status for the dashboard.
- Indexed lead stage, owner, due date, grade, locale, source/campaign, normalized contact hashes, and updated time.
- Unique outbox idempotency key and indexed `(state, available_at)` claim queue.
- Foreign keys enabled for local D1, explicit delete behavior, and archive/revoke flows for records whose history must remain auditable.
- Application-level invariant tests accompany database constraints because D1 does not provide PostgreSQL-style row-level-security policies.

## 5. Safe D1 migration plan

1. Leave `drizzle/0000_thankful_ricochet.sql`, its down migration, and `drizzle/meta/**` unchanged.
2. Change the active Drizzle schema to SQLite/D1 primitives and direct new generation to a clearly named D1 migration directory such as `drizzle-d1/`.
3. Create a new D1 baseline migration in that directory. It recreates `system_metadata` in valid SQLite and adds the approved portal schema. This is a new migration lineage, not an edit or attempted execution of the MySQL file.
4. Add a local D1 binding (proposed name `DB`) and use Wrangler local persistence. Do not create or modify a remote D1 resource in this local phase.
5. Add commands that apply migrations and seed only the local database, then prove a clean database can be rebuilt from migrations.
6. Add a checksum/CI guard that detects edits to the frozen historical MySQL migration.
7. Record the legacy-to-D1 cutover in an ADR so later operators cannot accidentally run both migration lineages. Any future transfer from a real MySQL database is a separately approved extraction, reconciliation, cutover, and rollback project.

This resolves the prompt/repository conflict while preserving applied migration evidence.

## 6. Authentication and authorization model

### 6.1 Stable session interface

All UI, route handlers, server actions, and middleware consume one provider-neutral result:

```ts
type PortalSession = {
  user: { id: string; displayName: string; email: string | null; locale: "en" | "ar" | "so" };
  audience: "staff" | "guardian";
  role: StaffRole | null;
  permissions: readonly Permission[];
};

declare function getSession(): Promise<PortalSession | null>;
```

- The local adapter accepts only an opaque seeded user ID, resolves it server-side, and issues a development-only cookie after a one-click choice. A non-local build fails closed if dummy auth is enabled.
- The future Google adapter maps an OAuth subject to a pre-provisioned internal account in `users` and `auth_identities`; it never grants access from client-supplied roles, email matching, or raw claims. No route is allowed to inspect `provider === "dev"` or `provider === "google"`.
- Middleware performs coarse route-group audience checks and redirects. Every data query, mutation, export, document access, and admin action repeats authoritative authorization in server code.

### 6.2 Guardian row-scope invariants

Guardian access is not a permission flag. It is a mandatory relationship predicate derived from the authenticated user:

```text
enrolled child:
active session.user.id -> active users -> verified guardian_accounts.guardian_id
                -> guardian_student_links.student_id -> students.id

applicant child:
active session.user.id -> active users -> verified guardian_accounts.guardian_id
                -> guardian_application_links.application_id
                -> applications -> prospective_students / leads
```

Every guardian repository must satisfy these invariants:

1. Derive the guardian identity from `session.user.id`; require an active user, non-revoked session, and verified active guardian account; never accept a guardian ID from the client as authority.
2. Add the family/student linkage join to the same query that loads or mutates the target row. Do not load first and authorize later.
3. Scope attendance/documents through active student links, applications through active application links, and announcements/threads through their explicit target or participant rows; a household ID alone grants nothing.
4. A thread requires an active guardian participant and the same family scope; a document requires an active `document_shares` row.
5. Return the same not-found response for missing and out-of-scope identifiers to reduce record enumeration.
6. Audit denied sensitive access without copying personal data into logs.
7. Prove isolation with two unrelated families, a guardian with multiple children, revoked links, guessed IDs, list endpoints, direct object endpoints, downloads, messages, and exports.
8. Mark authenticated responses `private`/`no-store` as appropriate; portal data must never enter shared public caches.

## 7. Staff permissions matrix

Legend: `V` view, `C` create, `U` update, `X` export, `P` publish/share, `A` administer/approve, `-` denied. Server permission keys are granular (for example, `attendance.mark`); the matrix groups them for readability.

| Module/action                   | System Administrator | School Leadership | Admissions / Family Liaison | Office / Attendance | Content Publisher / Translator | Marketing / Outreach           |
| ------------------------------- | -------------------- | ----------------- | --------------------------- | ------------------- | ------------------------------ | ------------------------------ |
| Dashboard                       | V                    | V                 | V                           | V                   | limited V                      | campaign V                     |
| Leads/pipeline                  | V/C/U/X              | V/X               | V/C/U/X                     | limited V           | -                              | V/C; source U; de-identified X |
| Duplicate review/merge decision | A                    | V                 | A                           | -                   | -                              | -                              |
| Students/guardians              | V/C/U/X              | V                 | applicant-linked V          | V/C/U               | -                              | -                              |
| Enrollment/withdrawal           | V/C/U                | V                 | applicant handoff U         | V/C/U               | -                              | -                              |
| Attendance                      | V/C/U/X              | V/X               | -                           | V/C/U/X             | -                              | -                              |
| Family messages                 | V/C                  | limited V         | V/C/U                       | V/C                 | translation-only V/U           | -                              |
| Announcements/doc sharing       | V/C/U/P              | V                 | limited V/C                 | limited V/C         | V/C/U/P                        | outreach draft C               |
| Reports                         | V/X                  | V/X               | funnel V/X                  | attendance V/X      | content metrics V              | campaign V/X                   |
| Profile update requests         | A                    | -                 | V/A for assigned families   | V/A                 | -                              | -                              |
| Users/roles/permissions         | A                    | access-review V   | -                           | -                   | -                              | -                              |
| Audit log                       | V/X                  | V                 | own-module V                | own-module V        | own-module V                   | own-module V                   |

Rules:

- Default deny: an unlisted action is forbidden.
- Leadership is read-only except exports; it does not silently inherit administrative power.
- Marketing exports exclude direct contact, child, attendance, and document data.
- Content/translation users see message content only when explicitly assigned for translation; they do not gain family directory access.
- System Administrator access remains auditable and purpose limited; being an administrator does not bypass guardian-family scope when using a guardian identity.

This persona matrix intentionally replaces the older technical role names (`Admissions Manager`, `Admissions Agent`, and similar) because the controlling prompt names the six required staff personas.

Matrix qualifiers map to concrete server controls:

| Matrix text                    | Required permission/scope                                                                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `limited V` on Dashboard       | `dashboard.view_content_metrics`; no family/student detail                                                                                  |
| `campaign V`                   | `dashboard.view_campaign_metrics`; aggregate counts only                                                                                    |
| `applicant-linked V`           | `students.view_applicant_projection` plus an assigned/team lead predicate; excludes SSID, attendance, documents, and unrelated guardians    |
| `source U` / `de-identified X` | `leads.attribution.update` / `reports.outreach.export_deidentified`; exported rows omit direct contact and child fields                     |
| `limited V/C` on Announcements | `announcements.view` plus either `announcements.draft` or `announcements.share_assigned`; publishing still requires `announcements.publish` |
| `translation-only V/U`         | `messages.translate_assigned`; only specifically assigned content and no family directory traversal                                         |
| `own-module V` on Audit        | `audit.view_module` plus a server-enforced module allowlist; not arbitrary target IDs                                                       |

Assignment/team scope is a separate query predicate, not a suffix interpreted by the UI. Permission constants and projection definitions will be centralized and negative-tested in Phase 2.

## 8. API shape and enforcement

Every endpoint uses Zod validation and returns a consistent failure envelope:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have access to this resource.",
    "fieldErrors": {},
    "requestId": "..."
  }
}
```

Proposed route families:

- Session: `GET /api/session`, local-only `POST/DELETE /api/dev/session`.
- Staff dashboard: `GET /api/staff/dashboard`.
- Admissions: `/api/staff/leads`, `/api/staff/leads/:id`, `/transition`, `/activities`, `/tasks`, and `/duplicate-candidates/:id/review`.
- Students: `/api/staff/students`, `/:id`, `/guardians`, `/enrollments`, `/documents`, and document share/revoke actions.
- Attendance: `/api/staff/attendance?date=`, batch mark, student history, and summary endpoints.
- Messaging/content: `/api/staff/threads`, `/messages`, `/announcements`, and outbox/delivery-status views.
- Reporting: `/api/staff/reports/enrollment`, `/attendance`, and `/export.csv`; filters and permissions are reapplied on export.
- Administration: `/api/staff/admin/users`, `/roles`, `/permissions`, `/audit`, and `/profile-requests`.
- Guardian: `/api/parent/home`, `/children`, `/children/:id/attendance`, `/applications`, `/threads`, `/messages`, `/announcements`, `/documents`, `/profile`, and `/profile-update-requests`.

Atomic boundaries:

- Accepting an inquiry creates the lead, consent, initial activity, due task, audit event, notification intent, and outbox job in one D1 batch/transaction boundary.
- Pipeline transitions write the lead version, stage history, activity, and audit event atomically.
- A message and its delivery intent/outbox job commit atomically. Fake-provider I/O occurs after commit and is idempotent.
- Guardian profile approval writes accepted source-of-truth fields, the request decision, and audit event atomically.

## 9. Parent portal proposed specification

These are new `PAR-*` requirements, not claims that the v0.1 documents already specified a parent portal.

| ID      | Proposed requirement                                                                                                                                       | Acceptance evidence                                               |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| PAR-001 | A guardian account links to one guardian record and may reach one or more students through effective guardian-student links.                               | Multi-child and revoked-link tests                                |
| PAR-002 | An applicant guardian reaches a prospective student and family-safe pipeline/application status only through an explicit active guardian-application link. | Cross-family, revoked-link, and applicant-only negative API tests |
| PAR-003 | Home shows each linked enrolled child, applicant, enrollment/application status, and current pipeline stage without internal notes.                        | EN/AR/SO browser tests                                            |
| PAR-004 | Attendance shows only the selected linked child's daily records and summaries.                                                                             | Direct-ID and list-isolation tests                                |
| PAR-005 | Guardians can read and reply in threads in which their guardian/family is an active participant.                                                           | Participant and guessed-thread tests                              |
| PAR-006 | Announcements are visible only when their all-family, grade, family, student, or guardian target matches current scope.                                    | Target matrix tests                                               |
| PAR-007 | A document is downloadable only through an active guardian share; object keys are never treated as public authorization.                                   | Download authorization tests                                      |
| PAR-008 | Profile displays current contact information and creates reviewable update requests; it never directly overwrites staff-controlled records.                | Pending/approve/reject workflow tests                             |
| PAR-009 | Every screen and user-visible validation/error state is complete in EN/AR/SO; Arabic renders RTL without reversing identifiers, dates, or email addresses. | Locale completeness and RTL browser tests                         |
| PAR-010 | Guardian pages expose no staff notes, duplicate signals, role grants, audit internals, other families, or unrestricted exports.                            | Field-projection and enumeration tests                            |
| PAR-011 | A local parent can switch among their linked children without changing identity or authority.                                                              | Multi-child browser/API test                                      |
| PAR-012 | Delivery remains local/stubbed; messages persist and show deterministic queued/sent/failed states without contacting real providers.                       | Offline integration tests                                         |

### Parent scenarios to implement in later phases

1. Enrolled guardian checks yesterday's attendance for one child.
2. Arabic-speaking guardian reads and replies to a liaison thread in Arabic with correct RTL presentation.
3. Multi-child guardian switches children and sees distinct attendance/documents.
4. Applicant family sees `Inquiry -> Contacted -> Toured -> Applied -> Enrolled` progress without staff-only notes.
5. Guardian submits a phone/address update; current source-of-truth data remains unchanged until staff approves.
6. Guardian attempts another family's child, thread, and document IDs and receives no data.

## 10. EMIS-aligned field mapping

The FY26 EMIS manual distinguishes operational student records from state-reporting record layouts. The portal will retain typed source fields and provenance so approved exports can map to EMIS; it will not claim to be the state submission system.

| Portal field                       | Proposed table/column                                  | EMIS alignment                                           | Notes                                                                                    |
| ---------------------------------- | ------------------------------------------------------ | -------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Internal database ID               | `students.id`                                          | No EMIS mapping                                          | Application-generated key; never exported as a state identifier                          |
| EMIS linkage ID                    | `students.emis_student_id`                             | GI050/FS050/FM050 EMIS Student ID                        | Locally assigned linkage across EMIS records; distinct from district-facing local-use ID |
| District local-use ID              | `students.local_use_id`                                | GI610 Local Use Identification Code                      | Optional identifier typically used locally/shared with families                          |
| State student ID                   | `students.ssid`                                        | FS110 SSID                                               | State-assigned, sensitive, restricted and audit viewed                                   |
| Legal name                         | `students.legal_*_name`                                | GI330/GI340/GI350                                        | Do not use preferred/display name for export                                             |
| Birth date                         | `students.birth_date`                                  | GI070                                                    | Date validation and restricted field projection                                          |
| Gender code                        | `students.gender_code`                                 | GI080                                                    | Store approved code, not UI label                                                        |
| Hispanic/Latino and race           | student demographic/race fields                        | GI580, GI090, GJ race detail                             | Preserve detailed selections and derived summary separately                              |
| Native/home language               | demographic language fields                            | GI270 and GI570                                          | Guardian preferred contact language is separate                                          |
| Building IRN                       | student/enrollment IRN fields                          | GI040, FS160/FS170                                       | Six-character text, never numeric arithmetic                                             |
| Admission/effective dates          | `enrollments.admission_date`, `effective_start/end`    | FS070, FS060, FS090                                      | Effective-dated history, not overwritten snapshots                                       |
| Admission source/reason            | enrollment code/IRN fields                             | FS080, FS350                                             | Code and admitted-from IRN stored separately                                             |
| Withdrawal                         | withdrawal date/reason/to-IRN fields                   | FS090, FS100, FS360                                      | Require supporting workflow/audit; code 81 has special prior-year consistency reporting  |
| Legal residence and relationship   | enrollment residence fields                            | FS150, FS140, FS370                                      | Resident district/county kept as text codes                                              |
| Instruction location/time          | enrollment building/percent fields                     | FS160, FS120                                             | Preserve effective date range                                                            |
| Attendance pattern                 | `student_attributes.attendance_pattern_code`           | FD100                                                    | Effective-dated attribute                                                                |
| Grade level                        | `student_attributes.grade_level_code`                  | FD090                                                    | Do not infer solely from age                                                             |
| EL/disability/status attributes    | effective-dated attribute codes                        | FD170, FD130 and related FD fields                       | Access controlled; only approved fields ship                                             |
| Daily operational attendance       | `attendance_daily.status`, absence type, minute fields | FM060/FM090 dates, FM070 type, FM080 detail, FM100 hours | Default export source; daily statuses themselves remain local workflow values            |
| Submission-level attendance totals | derived export rows                                    | FS320/FS330/FS340                                        | Must be zero in a submission that uses FM; nonzero FS totals are the alternate strategy  |
| Next-year/MOA fields               | optional no-date attributes                            | FN080, FN220, FN390/FN400                                | Add only when approved reporting needs require them                                      |

### Attendance export strategy

The FY26 Student Detailed Attendance (FM) record is optional and supplies the detail missing from FS: FM070 uses `AT` (in attendance), `EX` (excused absence), or `UN` (unexcused absence); FM080 uses `AT` for attendance and `AB` for absence; FM100 stores hours over the FM060-FM090 effective range. The manual prohibits mixing FM detail with nonzero FS320/FS330/FS340 attendance values in one submission.

The proposed default is an **FM export strategy** for all students in an export/submission preview:

1. Keep the local operational statuses `present`, `absent_excused`, `absent_unexcused`, `tardy_excused`, `tardy_unexcused`, and `partial`, each with attended and absent minutes.
2. Convert minutes to FM hour rows: attended time becomes `FM070=AT, FM080=AT`; excused absence becomes `EX, AB`; unexcused absence becomes `UN, AB`.
3. Tardy and partial days split into attended and absence rows. There is no invented EMIS `tardy` type.
4. Emit non-overlapping effective ranges and at least one FM row for each applicable FS span; never let an FM row span two FS records.
5. Set FS320/FS330/FS340 to zero for the same submission preview. A future FS-only aggregate export is an explicit alternate mode and cannot be combined with FM.

Phase 3 tests must reconcile daily minutes to FM100 totals, validate effective ranges, and prove the FS/FM mutual-exclusion rule. UAC must approve this default or provide its authoritative SIS/attendance vocabulary and preferred FS-only strategy before attendance implementation.

## 11. Requirement traceability

References are source qualified because PRD and TRD reuse prefixes such as `PIPE-*` and `AUTH-*` with different meanings.

| Module/decision                               | Source requirements                                                                                                                           |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Multilingual family experience and Arabic RTL | BRD `BR-002`, BRD `RULE-04`; `PAR-003` through `PAR-009` are new scope                                                                        |
| Inquiry capture and data minimization         | BRD `BR-003` through `BR-005`; TRD `ADM-001` through `ADM-006`                                                                                |
| Atomic inquiry/outbox                         | TRD `ADM-008` through `ADM-010`; SDD inquiry transaction/outbox pattern                                                                       |
| First response and follow-up                  | BRD `BR-006`, BRD `RULE-03`, TRD `ADM-012`                                                                                                    |
| Pipeline stages, actions, and history         | BRD `BR-007`, BRD `RULE-05`; PRD `PIPE-003` through `PIPE-009`; TRD `PIPE-001` through `PIPE-008`                                             |
| Duplicate handling                            | TRD `ADM-004`, TRD `ADM-011`; PRD `ENR-008`                                                                                                   |
| Dashboard and open seats                      | BRD `BR-008`; PRD `PIPE-001`, `PIPE-002`, `PIPE-010`; TRD `RPT-001`, `RPT-002`                                                                |
| Student directory                             | BRD `BR-015`, BRD `RULE-06`; PRD `OPS-001`, `OPS-002`                                                                                         |
| Attendance                                    | BRD `BR-015`; PRD `OPS-003`, `OPS-004`; FY26 EMIS GI/FS/FD/FM records                                                                         |
| Messages and delivery history                 | BRD `BR-016`; PRD `OPS-004` through `OPS-006`; TRD `ADM-009`, `ADM-010`                                                                       |
| Reports and exports                           | BRD `BR-008`, BRD `BR-014`; PRD `OPS-007`, `OPS-008`, `PIPE-009`; TRD `RPT-001` through `RPT-005`                                             |
| Staff identity/RBAC/audit                     | BRD `BR-010`, BRD `RULE-06`; PRD `AUTH-001` through `AUTH-006`; TRD `AUTH-007` through `AUTH-010`, `SEC-002`, `SEC-003`, `SEC-008`, `SEC-009` |
| Content/announcements                         | BRD `BR-009`, BRD `RULE-07`; parent targeting is new `PAR-006` scope                                                                          |
| Synthetic local data                          | BRD `RULE-08`; PRD `AUTH-006`                                                                                                                 |

## 12. Conflicts resolved

| Conflict                                                                                                                                                                                                  | Resolution                                                                                                                                                                 |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Older SDD/TRD/ADRs prescribe Hostinger, MariaDB/MySQL, Node VPS, cron, and `mysql2`; the prompt mandates Cloudflare/OpenNext/D1.                                                                          | The prompt wins. Preserve historical documents/migration, write a superseding Cloudflare/D1 ADR, and remove MySQL from the active runtime in Phase 2.                      |
| The prompt says an initial migration exists and applied migrations must not be edited, but that migration is MySQL SQL that D1 cannot execute.                                                            | Preserve it unchanged and establish a separate D1 migration lineage with its own baseline. Do not rewrite or run the MySQL migration against D1.                           |
| The v0.1 product scope treats student directory/attendance as optional later integrations and the authoritative systems are unknown; the prompt requires full local modules.                              | Build a synthetic local D1 system of record for this phase behind repository interfaces. Production SIS ownership/integration remains an explicit pre-production decision. |
| Older identity requirements include password and TOTP flows; the prompt requires local dummy auth and defers Google OAuth.                                                                                | Implement no password/TOTP/OAuth mechanism now. Preserve a provider-neutral session interface and provider identity table for the future Google adapter.                   |
| Older technical role names differ from the six staff personas in the prompt.                                                                                                                              | Use the six prompt personas and the matrix in this document. Do not silently inherit broader legacy roles.                                                                 |
| Parent portal is absent from v0.1 scope.                                                                                                                                                                  | Treat `PAR-*`, guardian linkage, profile approval, documents, announcements, and family isolation as proposed new requirements requiring approval.                         |
| The design reference advertises PDF reports, while the current deliverable explicitly requires EMIS-aligned CSV.                                                                                          | CSV is required. PDF remains optional until its definitions and rendering scope are separately approved.                                                                   |
| “Daily marking with EMIS attendance codes” suggests a direct code list, while FY26 defines optional detailed FM records and prohibits combining them with nonzero FS attendance totals in one submission. | Use local daily statuses, default to FM `AT/EX/UN` plus `AT/AB` detail and hours, and zero FS attendance totals in the same export; do not invent an EMIS tardy code.      |

## 13. Approval questions and proposed defaults

Please approve the overall plan and either accept or change these defaults:

1. **Attendance vocabulary/export:** approve the six local daily statuses and default FM strategy (with zero FS attendance totals in the same export), or provide UAC's authoritative SIS/attendance code list and preferred FS-only strategy.
2. **Local source of truth:** use synthetic D1 as the local system of record; keep production SIS import/synchronization behind future adapters and prohibit silent dual writes.
3. **Role matrix:** approve the six-persona permissions matrix, especially leadership read-only access, marketing de-identification, and translator assignment limits.
4. **Guardian relationship lifecycle:** use explicit effective-dated per-guardian/per-application grants for applicants and per-guardian/per-student grants for enrolled children. Approve that staff establish/revoke links, and confirm the rules for shared custody and whether any records should ever be household-wide.
5. **Documents:** default to PDF/JPEG/PNG, 10 MiB per synthetic local file, object metadata in D1, and local R2 emulation; final retention and production file policy remain undecided.
6. **Translation without external services:** store the authored original and human-reviewed/seeded translations. Do not call a machine-translation provider during offline local development.
7. **Announcements:** allow Content Publisher/Translator and System Administrator to author/publish; allow other roles only the limited draft/share actions shown in the matrix.
8. **Parent pipeline projection:** expose a family-safe stage/status and timestamp, but withhold internal notes, staff ownership, duplicate-review state, operational due dates, and audit details.

Approval of this document authorizes Phase 2 foundation work only in the local repository. It does not authorize deployment, remote D1/R2 creation, Google OAuth, real provider delivery, production data, or production credentials.

## 14. Phase 2 entry criteria

Phase 2 may start when:

- this document and its parent `PAR-*` requirements are approved;
- the attendance vocabulary/aggregation and permissions matrix are accepted or revised;
- the D1 lineage strategy is accepted;
- unresolved production SIS, retention, OAuth, and delivery decisions remain explicitly deferred and do not block synthetic local development.
