# UAC Ohio Project Documentation

Status: Draft for stakeholder review  
Repository: `ichillous/uacohio`  
Repository baseline: Empty `main` branch as of 2026-07-18

## Core documents

- [Development Plan](./DEVELOPMENT_PLAN.md)
- [Technical Requirements Document](./TECHNICAL_REQUIREMENTS_DOCUMENT.md)
- [System Design Document](./SYSTEM_DESIGN_DOCUMENT.md)

## Architecture decisions

- [ADR-001: Modular full-stack monolith](./architecture/ADR-001-modular-full-stack-monolith.md)
- [ADR-002: Hostinger Node.js deployment](./architecture/ADR-002-hostinger-node-deployment.md)
- [ADR-003: Hostinger MariaDB as the operational database](./architecture/ADR-003-hostinger-mariadb.md)
- [ADR-004: Invite-only staff authentication and RBAC](./architecture/ADR-004-staff-authentication-rbac.md)
- [ADR-005: Repository-first media and bounded content management](./architecture/ADR-005-content-and-media.md)
- [ADR-006: Transactional messaging through an adapter and outbox](./architecture/ADR-006-messaging-outbox.md)

## Requirement hierarchy

1. BRD defines business outcomes and constraints.
2. PRD defines user-facing behavior and acceptance criteria.
3. TRD defines technical, operational, security, and quality requirements.
4. System Design Document defines the proposed implementation architecture.
5. ADRs record material architecture choices and their triggers for reconsideration.

The BRD and PRD are maintained in the project workspace under `output/doc/` until their source versions are added to this repository.
