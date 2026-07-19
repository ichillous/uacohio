# ADR-004: Use invite-only staff authentication with mandatory 2FA and server RBAC

Status: Proposed, security review required  
Date: 2026-07-18

## Context

The staff portal contains prospective-family and potentially minor-related data. It requires unique accounts, reliable recovery, least privilege, audit, and a small number of staff users. UAC's existing identity provider is unknown.

## Decision drivers

- No public portal registration.
- Mandatory second factor for sensitive staff access.
- MySQL compatibility and Next.js integration.
- Fine-grained server-side permissions.
- Account disablement and session revocation.
- Low recurring cost while avoiding bespoke cryptography/session code.

## Options considered

1. Better Auth with MySQL, email/password, TOTP 2FA, and custom RBAC.
2. Managed identity provider such as Auth0, Clerk, or Microsoft Entra ID.
3. Fully custom credentials and sessions.
4. Passwordless email-only authentication.

## Decision

Use Better Auth with Hostinger MySQL for invite-only email/password accounts, verified email, password reset, secure sessions, and TOTP 2FA. Disable public signup. Maintain application roles and permissions for admissions, content, reports, and administration, enforced on the server for every record and action.

## Consequences

Positive:

- Compatible with the selected database and framework.
- Built-in email/password, MySQL, and 2FA capabilities.
- No per-user identity subscription at initial scale.
- Fine-grained application permissions remain under UAC control.

Negative:

- UAC owns identity configuration, recovery, security updates, and access-review operations.
- Email delivery becomes a critical dependency for invites and reset.
- Future SSO requires additional work.

## Reconsider when

- UAC already uses Entra ID, Google Workspace, or another approved staff identity provider.
- Compliance/security review prefers managed SSO and centralized lifecycle.
- Staff count or support burden grows materially.
- Better Auth compatibility or security maintenance becomes unacceptable.

## References

- [Better Auth email/password](https://better-auth.com/docs/authentication/email-password)
- [Better Auth MySQL](https://better-auth.com/docs/adapters/mysql)
- [Better Auth two-factor authentication](https://better-auth.com/docs/plugins/2fa)
