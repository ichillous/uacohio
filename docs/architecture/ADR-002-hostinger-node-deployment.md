# ADR-002: Deploy Next.js as a Hostinger Node.js Web App

Status: Proposed, contingent on plan verification  
Date: 2026-07-18

## Context

`uacohio.org` is hosted on Hostinger. Hostinger currently supports managed Node.js applications, including Next.js and GitHub deployments, on Business Web Hosting and Cloud plans. The exact UAC plan is not yet confirmed.

## Decision drivers

- Preserve the existing domain and hosting relationship.
- Use GitHub-based automatic builds and deployments.
- Avoid VPS patching, process supervision, firewall, and backup administration.
- Support full Next.js server features rather than a limited static export.

## Options considered

1. Hostinger managed Node.js Web App.
2. Hostinger static HTML/React deployment plus external backend.
3. Hostinger VPS.
4. Move application hosting to another managed provider.

## Decision

Use a Hostinger Node.js Web App with Node.js 22 and a protected GitHub branch. Deploy a full Next.js server using standard build and start scripts. Use a separate Hostinger staging website or temporary domain before production cutover.

## Consequences

Positive:

- Managed build, runtime, restart, logs, environment variables, resource views, and GitHub integration.
- No server patching or custom process manager in Release 1.
- All standard Next.js Node.js features remain available.

Negative:

- Requires Business or Cloud plan.
- Runtime and build behavior are constrained by Hostinger's managed environment.
- Safe database migration execution must be proven.
- Hostinger documents that switching an existing domain to Node.js may require removing and re-adding the website, which creates cutover risk.

## Reconsider when

- The current plan cannot run Node.js and an upgrade is not approved.
- Required migrations, scheduled work, storage, networking, or observability cannot be operated safely.
- Resource use exceeds the managed plan and Cloud upgrade is insufficient.
- A different provider materially lowers operational risk after stakeholder approval.

## References

- [Hostinger Node.js Web App deployment](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/)
- [Hostinger plan parameters](https://www.hostinger.com/support/6976044-parameters-and-limits-of-hosting-plans-in-hostinger/)
