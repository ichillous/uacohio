# ADR-005: Use bounded content schemas and repository-managed launch media

Status: Proposed  
Date: 2026-07-18

## Context

UAC needs staff-editable multilingual content, approval, versioning, and publication. The public design uses known page sections. Hostinger deployment persistence for browser-uploaded files has not been proven, and a general headless CMS would add another vendor and permission model.

## Decision drivers

- Give approved staff control over text and known page fields.
- Preserve design quality and prevent arbitrary code/layout injection.
- Track source revisions and translated versions.
- Keep initial deployment deterministic.
- Avoid committing to unproven writable filesystem persistence.

## Options considered

1. Custom bounded content module in the Next.js application plus repository-managed launch media.
2. General headless CMS.
3. Git-only Markdown/JSON content.
4. Full drag-and-drop page builder.

## Decision

Store validated page-section content and localized versions in MariaDB with draft/review/approval/publish states. Editors modify only approved fields and media references. Keep launch media in the repository under `public/`. Do not enable broad browser media uploads until durable object storage is selected and reviewed.

## Consequences

Positive:

- Strong control over content shape, accessibility, translation, and security.
- Publication and translation revisions are auditable.
- Deterministic initial media deployment.
- No additional CMS vendor for Release 1.

Negative:

- Engineering must build and maintain the bounded editorial UI.
- Adding a new page section can require code and schema work.
- Staff cannot independently upload arbitrary media in the first release.

## Reconsider when

- Editorial volume or team size exceeds the bounded workflow.
- UAC requires non-developer media uploads.
- A headless CMS passes budget, privacy, localization, and operational review.
- A durable S3-compatible or managed media store is approved.
