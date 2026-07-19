# ADR-001: Use a modular full-stack monolith

Status: Proposed  
Date: 2026-07-18

## Context

UAC needs a multilingual public website, admissions capture, content administration, staff authentication, a lead pipeline, notifications, and reporting. Expected scale is modest, and the delivery/operations team is small. The repository is empty, so there is no existing service architecture to preserve.

## Decision drivers

- Minimize deployment, observability, consistency, and on-call complexity.
- Keep public and staff workflows in one transactionally consistent system.
- Preserve explicit boundaries so modules can be extracted later if measured needs emerge.
- Fit Hostinger managed Node.js deployment.
- Keep cost within a small-team budget.

## Options considered

1. Modular Next.js full-stack monolith.
2. Separate React frontend and Express/NestJS API.
3. Multiple microservices.
4. Static public site plus third-party form/CRM.

## Decision

Implement Release 1 as one Next.js application with explicit modules for public content, admissions, identity/RBAC, notifications, reporting, and audit. Modules interact through server-side interfaces and a shared MariaDB database; UI components do not contain business logic.

## Consequences

Positive:

- One deployment and one operational dashboard.
- Straightforward database transactions for lead, consent, activity, outbox, and audit records.
- Shared locale, validation, error, and authorization conventions.
- Low infrastructure cost.

Negative:

- Module boundaries rely on engineering discipline and tests.
- Application and database scale together initially.
- A severe application defect can affect both public and staff routes.

## Reconsider when

- Different teams require independent release schedules.
- One module has materially different scaling or availability requirements.
- Multiple clients need an independently versioned API.
- Hostinger resource limits are reached after optimization.
