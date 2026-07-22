# UAC Staff/Admin + Parent Portals Plans

Created: 2026-07-22

The attached build prompt is the scope authority. Phase 1 is an approval gate: no portal implementation begins until the analysis is approved.

---

## Phase 1: Graph-driven analysis and approval

| Task | Content                                                                         | DoD                                                                                                                                                                                                                            | Depends | Status            |
| ---- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- | ----------------- |
| 1.1  | Produce the staff/admin and parent portal analysis in `docs/portal-analysis.md` | The document covers the existing-schema delta, module boundaries, role/action permissions, guardian-student authorization, parent spec, EMIS mapping, BR/ADM traceability, resolved conflicts, and explicit approval questions | -       | cc:完了 [2525f39] |

## Phase 2: Local foundation

| Task | Content                                                                                                            | DoD                                                                                                                                                                                                  | Depends      | Status  |
| ---- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------- |
| 2.1  | Establish the Cloudflare D1/SQLite Drizzle schema and additive migration path                                      | Fresh local D1 migrations apply successfully without modifying the historical migration, and schema documentation matches the generated database                                                     | 1.1 approval | cc:完了 |
| 2.2  | Implement the session-provider abstraction, dummy staff/guardian switcher, RBAC, and guardian row-scope primitives | Local users can switch identities without passwords, every protected server path consumes the common session contract, and permission/family-isolation tests pass                                    | 2.1          | cc:完了 |
| 2.3  | Add deterministic synthetic seed data and one-command local startup                                                | The local database contains about 200 students, every staff persona, linked guardians including a multi-child household, pipeline stages, and a term of attendance; documented startup works offline | 2.1, 2.2     | cc:完了 |

## Phase 3: Staff portal modules

| Task | Content                                                           | DoD                                                                                                                                                                                      | Depends | Status  |
| ---- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------- |
| 3.1  | Implement dashboard and enrollment pipeline APIs and UI           | Authorized staff can view seeded KPIs, progress leads through valid stages, record activities/follow-ups, and flag duplicates without auto-merging; validation and transition tests pass | Phase 2 | cc:TODO |
| 3.2  | Implement student records and attendance APIs and UI              | Authorized staff can manage EMIS-aligned student/guardian/enrollment data and mark daily attendance with tested server-side permissions                                                  | 3.1     | cc:TODO |
| 3.3  | Implement messages and stubbed outbox delivery                    | Authorized staff can exchange persisted messages with families; deterministic delivery attempts are logged without external email/SMS                                                    | 3.2     | cc:TODO |
| 3.4  | Implement reports and EMIS-aligned CSV exports                    | Authorized roles can generate funnel/attendance summaries and CSV exports whose fields match the approved EMIS mapping                                                                   | 3.2     | cc:TODO |
| 3.5  | Implement administration, permissions management, and audit views | Only authorized administrators can manage staff grants, and every sensitive mutation creates a privacy-safe audit event                                                                  | 3.1     | cc:TODO |

## Phase 4: Parent portal

| Task | Content                                                                             | DoD                                                                                                                                                                   | Depends | Status  |
| ---- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------- |
| 4.1  | Implement multilingual guardian home, enrollment, and attendance experiences        | EN/AR/SO guardian routes render correctly including Arabic RTL, and server tests prove a guardian can access only linked children and related applications/attendance | Phase 3 | cc:TODO |
| 4.2  | Implement guardian messaging, announcements, documents, and profile update requests | Guardians can read/reply to scoped threads, view shared items, and submit staff-reviewed profile changes without directly overwriting system-of-record fields         | 4.1     | cc:TODO |

## Phase 5: End-to-end flows and local acceptance

| Task | Content                                                                              | DoD                                                                                                                                                                                     | Depends | Status  |
| ---- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------- |
| 5.1  | Document and implement one complete journey per staff persona and parent scenario    | `docs/user-flows.md` maps each persona/scenario to runnable seeded steps and every flow passes local browser/API verification                                                           | Phase 4 | cc:TODO |
| 5.2  | Finish API documentation, README commands, accessibility, RTL, and regression checks | `docs/api.md` documents all endpoints/error shapes; README covers install/migrate/seed/run/login; format, lint, typecheck, unit/integration tests, build, and local browser checks pass | 5.1     | cc:TODO |

## Deferred production work

Google OAuth implementation, real email/SMS delivery, deployment, DNS/resource changes, paid services, and production credentials remain out of scope for this local phase.
