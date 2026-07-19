# UAC Ohio Development Plan

Document status: Draft for stakeholder review  
Version: 0.1  
Date: 2026-07-18  
Repository: [ichillous/uacohio](https://github.com/ichillous/uacohio)  
Hosting: Hostinger, plan level to be confirmed

## 1. Purpose

This plan turns the approved design direction, BRD, and PRD into an executable delivery sequence for the UAC public website, admissions workflow, and staff portal. It assumes a new implementation in an empty repository.

The plan intentionally separates the public admissions MVP from higher-risk student information, attendance, and translated messaging integrations. Those later modules require confirmed systems of record, privacy decisions, and operational owners.

## 2. Planning assumptions

| Area             | Working assumption                                                                                                                       | Validation needed                                        |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Traffic          | Fewer than 1,000 public visits per day at launch; design capacity of 5,000 visits per day                                                | Confirm analytics or campaign forecast                   |
| Staff            | Up to 25 staff accounts and fewer than 10 concurrent portal users                                                                        | Confirm staff roles and access scope                     |
| Team             | Two developers plus part-time product/design/content support                                                                             | Adjust schedule if only one developer is available       |
| Budget           | Under $100 per month beyond the existing Hostinger plan                                                                                  | Confirm hosting, email, monitoring, and anti-spam budget |
| Hostinger        | Business Web Hosting or Cloud plan with Node.js Web App support                                                                          | Verify in hPanel before Sprint 0 ends                    |
| Languages        | English, Arabic, and Somali at launch                                                                                                    | Confirm translators and approvers                        |
| MVP              | Public site, content administration, inquiry and visit forms, staff authentication, enrollment pipeline, baseline dashboard, and exports | Executive sponsor approval required                      |
| Existing systems | Student information, official enrollment, attendance, transportation, and messaging systems are unknown                                  | Complete system inventory in Discovery                   |

## 3. Delivery strategy

### 3.1 Recommended release boundaries

| Release                                | Outcome                                                                    | Included                                                                                                    | Deferred                                    |
| -------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Release 1A - Public foundation         | UAC can publish an accurate, responsive multilingual website               | Design system, six public pages, SEO, analytics, accessibility, localized content, repository-managed media | Public forms and staff portal               |
| Release 1B - Admissions MVP            | Families can submit an inquiry or request a visit and receive confirmation | Forms, consent, source attribution, anti-spam, notifications, staff queue                                   | Official application processing             |
| Release 1C - Staff operations          | Authorized staff can manage leads and report on the funnel                 | Authentication, 2FA, RBAC, pipeline, activities, tasks, dashboard, CSV/PDF export, audit log                | Student directory and attendance            |
| Release 2 - Optional school operations | Approved operational modules use authoritative school data                 | SIS-backed directory, attendance, routine translated messaging, extended reports                            | Any module without an approved system owner |

### 3.2 Estimated schedule

The baseline is 12 calendar weeks for a two-developer team with timely content and stakeholder decisions. A single developer should plan for approximately 16-20 weeks. Integration uncertainty can extend either estimate.

| Phase                                                     |    Timing | Primary outputs                                                                                                                  | Exit gate                                                    |
| --------------------------------------------------------- | --------: | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Discovery and decision closure                            |    Week 1 | Confirmed scope, hosting plan, owners, content register, data-flow map, integration inventory, accessibility and privacy targets | Release 1 scope signed off                                   |
| Sprint 0 - Foundation                                     |    Week 2 | Repository scaffold, environments, CI, Hostinger deployment spike, database connection spike, coding standards, test harness     | Staging build deploys from GitHub and health check passes    |
| Sprint 1 - Design system and public shell                 | Weeks 3-4 | Tokens, typography, responsive navigation, footer, layouts, shared components, error states                                      | Visual review and accessibility baseline pass                |
| Sprint 2 - Public content and localization                | Weeks 5-6 | Home, Admissions, Academics, Student Life, About, Contact, English/Arabic/Somali, RTL support, metadata                          | Approved content and locale review; no placeholders          |
| Sprint 3 - Admissions workflows                           |    Week 7 | Inquiry and visit forms, server validation, consent, attribution, anti-spam, confirmations, staff notifications                  | End-to-end submission tests pass without PII in analytics    |
| Sprint 4 - Staff identity and pipeline                    | Weeks 8-9 | Invite-only accounts, 2FA, RBAC, lead detail, ownership, stage changes, activities, overdue queue, audit events                  | Negative authorization and workflow acceptance tests pass    |
| Sprint 5 - Dashboard, exports, and content administration |   Week 10 | Metric definitions, dashboard, filtered exports, content editing, preview, review, publish                                       | Dashboard reconciles to records; publishing permissions pass |
| Sprint 6 - Hardening and UAT                              |   Week 11 | Accessibility, localization, security, privacy, performance, backup/restore, browser, failure-mode testing                       | All launch gates accepted or explicitly waived               |
| Launch and stabilization                                  |   Week 12 | Production cutover, smoke tests, monitoring, staff training, support handoff, 72-hour stabilization                              | Sponsor approves launch and operations owns support          |

## 4. Workstreams and epics

### EPIC-01 Product and content governance

- Confirm product owner, executive sponsor, content owners, translators, data owner, privacy reviewer, and support owner.
- Create a verified content register for every contact detail, school claim, statistic, policy, staff profile, image, and enrollment date.
- Define content review, translation, publishing, and expiry workflows.
- Resolve whether the public admissions form is an interest form or an official application.

### EPIC-02 Engineering foundation

- Scaffold Next.js, TypeScript, linting, formatting, tests, and environment validation.
- Establish the modular folder structure and architecture boundaries.
- Configure GitHub branch protection, pull-request checks, dependency updates, and secret scanning.
- Prove Hostinger build, start, environment variable, log, restart, and rollback behavior.
- Prove MariaDB connectivity, migration, backup, and restore behavior.

### EPIC-03 Public website

- Implement the approved visual language from the saved prototype.
- Build responsive, semantic page templates and global navigation.
- Implement metadata, sitemap, robots policy, canonical links, organization schema, and redirect handling.
- Optimize images and fonts; remove all placeholders before launch.

### EPIC-04 Localization and accessibility

- Implement locale-aware routes or equivalent stable locale handling.
- Support Arabic right-to-left layout and language-specific typography.
- Localize navigation, forms, validation, confirmation, metadata, and system states.
- Test keyboard, screen reader, zoom/reflow, contrast, focus, forms, and RTL manually and automatically.

### EPIC-05 Admissions capture

- Implement inquiry and visit request forms with server-side validation.
- Store source, campaign, language, consent version, timestamps, and delivery status.
- Add accessible anti-spam controls, rate limits, duplicate protection, and idempotency.
- Send approved family confirmations and staff alerts through the messaging adapter.
- Provide failure handling and an overdue/unassigned queue.

### EPIC-06 Staff authentication and authorization

- Implement invite-only staff accounts; disable public signup.
- Require verified email and TOTP two-factor authentication for staff.
- Implement server-enforced role and permission checks.
- Add account lifecycle, session revocation, password reset, access review, and audit events.

### EPIC-07 Enrollment pipeline

- Implement lead search, filters, ownership, stage workflow, contact history, notes, next actions, and visit status.
- Define allowed stage transitions and closed outcomes.
- Highlight new, unassigned, overdue, duplicate, and failed-notification records.
- Provide accessible alternatives to any drag-and-drop interaction.

### EPIC-08 Reporting and analytics

- Implement approved metric definitions and data freshness labels.
- Provide funnel, response-time, source, language, grade-interest, and seat-availability views where data is authoritative.
- Export permission-filtered CSV and PDF reports.
- Implement privacy-safe product analytics with no names, emails, phone numbers, child data, notes, or record identifiers in third-party analytics.

### EPIC-09 Operations and launch

- Configure health checks, error reporting, uptime monitoring, runtime logs, and alerts.
- Confirm daily backups or add an external backup process; test restore before launch.
- Prepare staff training, administrator guide, support runbook, incident runbook, migration runbook, and rollback runbook.
- Run a staging launch rehearsal before changing production DNS or replacing the current Hostinger website.

## 5. Repository and branch strategy

Recommended initial structure:

```text
uacohio/
  app/                    Next.js routes and layouts
  components/             Shared UI and design-system components
  modules/
    admissions/           Inquiry, visit, pipeline, activities
    auth/                 Authentication, sessions, RBAC
    content/              Pages, localizations, versions, publishing
    notifications/        Templates, outbox, provider adapters
    reporting/            Metrics, exports, dashboard queries
  db/
    schema/               Drizzle table definitions
    migrations/           Versioned SQL migrations
    seeds/                Synthetic development data only
  lib/                    Cross-cutting utilities and configuration
  public/                 Approved static assets
  tests/                  Unit, integration, accessibility, and E2E tests
  docs/                   Requirements, design, ADRs, and runbooks
  scripts/                Safe operational and verification scripts
```

Branch policy:

- `main` is always deployable and maps to production after launch.
- Pull requests require lint, typecheck, unit tests, integration tests, build, and security checks.
- Staging should deploy from a protected `staging` branch or a dedicated Hostinger staging website, depending on the confirmed plan.
- Direct production pushes are disabled.
- Database changes require a migration file, rollback notes, staging proof, and backup confirmation.

## 6. Environment plan

| Environment  | Purpose                                          | Data policy                                   | Deployment                                          |
| ------------ | ------------------------------------------------ | --------------------------------------------- | --------------------------------------------------- |
| Local        | Development and automated tests                  | Synthetic data only                           | Developer machine                                   |
| Preview / CI | Pull-request validation                          | Ephemeral or synthetic data only              | GitHub Actions; no production secrets               |
| Staging      | UAT, integration, content, and cutover rehearsal | Synthetic data or approved redacted test data | Hostinger temporary domain or `staging.uacohio.org` |
| Production   | Live family and staff use                        | Approved production data                      | Hostinger `uacohio.org` from protected `main`       |

## 7. Quality and release gates

| Gate          | Required evidence                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Requirements  | BRD, PRD, TRD, System Design Document, and relevant ADRs approved                                                              |
| Content       | All facts, translations, media, legal wording, and contact details approved; no placeholder remains                            |
| Functional    | Critical family and staff journeys pass on the supported browser/device matrix                                                 |
| Accessibility | Automated checks plus manual keyboard, screen reader, zoom/reflow, contrast, language, and RTL testing                         |
| Security      | Threat review, dependency scan, secret scan, authorization tests, rate-limit tests, security headers, and vulnerability review |
| Privacy       | Approved data inventory, consent language, retention, vendor list, export controls, and analytics review                       |
| Reliability   | Health check, alerts, notification retry, backup, restore, migration, and rollback tests pass                                  |
| Performance   | Agreed Core Web Vitals and server response targets pass on production-like staging                                             |
| Operations    | Named support owners, training, runbooks, access list, escalation paths, and launch communications are ready                   |

## 8. Production cutover plan

1. Verify the Hostinger plan supports Node.js Web Apps; Business and Cloud plans are currently supported by Hostinger.
2. Create and validate a staging deployment from GitHub before touching the existing production website.
3. Download current Hostinger file and database backups and record the restoration procedure.
4. Complete production environment variables, database, staff accounts, monitoring, and content freeze.
5. Run the full launch checklist against staging and record approval.
6. Schedule a low-traffic cutover window and announce a content freeze.
7. Follow Hostinger's documented process for replacing the existing website only after the backup is verified. This step can be destructive and requires explicit account-owner approval.
8. Deploy `main`, run smoke tests, validate forms and notifications, confirm analytics contains no PII, and verify SSL/DNS.
9. Monitor errors, form success, notifications, and resource use closely for 72 hours.
10. Roll back using the documented Hostinger restore or prior-site procedure if a launch-blocking defect occurs.

## 9. Risks and mitigations

| Risk                                                            | Impact                                         | Mitigation                                                                                                 |
| --------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Hostinger plan does not support Node.js                         | Recommended architecture cannot deploy         | Verify plan in Week 1; upgrade or approve an alternate static/external-backend architecture                |
| Existing domain must be removed/re-added for Node.js deployment | Potential outage or data loss                  | Prove deployment on staging; download backups; require explicit cutover approval                           |
| Source systems are unknown                                      | Duplicate or conflicting student records       | Keep official student and attendance modules out of Release 1                                              |
| Translation or RTL defects                                      | Families receive confusing or unusable content | Qualified review and locale-specific usability testing                                                     |
| One-business-day response promise lacks coverage                | Service promise is missed                      | Define owner, rota, due date, alerts, and escalation before forms launch                                   |
| Custom content administration grows too broad                   | Schedule risk                                  | Limit MVP to approved page schemas and versioned text fields; defer general page builder and media uploads |
| Transactional email delivery is unreliable                      | Families or staff miss notifications           | Use a provider adapter, delivery status, retries, and monitoring; validate volume limits                   |
| Staff portal contains minor or family data                      | Privacy and trust risk                         | Minimize data, enforce RBAC and 2FA, log access, define retention, and complete legal/vendor review        |
| Small team is overloaded                                        | Quality or timeline slips                      | Preserve release boundaries and do not pull Release 2 scope into launch                                    |

## 10. Immediate action items

- Confirm Hostinger plan name and whether a staging Node.js website can be added.
- Name the executive sponsor, product owner, admissions owner, data owner, privacy reviewer, content approvers, and translators.
- Inventory the current production website, DNS, email, databases, files, backups, analytics, and integrations.
- Decide whether the Release 1 admissions form is an interest form or legal application.
- Approve the working architecture and ADRs.
- Create the initial repository scaffold only after the above deployment and data assumptions are confirmed.

## 11. Source references

- [Hostinger: Deploy a Node.js Web App](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/)
- [Hostinger: Connect MySQL to a Node.js application](https://www.hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/)
- [Hostinger: Hosting plan parameters and limits](https://www.hostinger.com/support/6976044-parameters-and-limits-of-hosting-plans-in-hostinger/)
- [Hostinger: Download backups](https://www.hostinger.com/support/5981435-how-to-download-backups-at-hostinger/)
- [Next.js: Installation and requirements](https://nextjs.org/docs/app/getting-started/installation)
- [Next.js: Deployment modes](https://nextjs.org/docs/app/getting-started/deploying)
