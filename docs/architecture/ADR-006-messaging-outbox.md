# ADR-006: Send transactional messages through a provider adapter and database outbox

Status: Proposed  
Date: 2026-07-18

## Context

Inquiry submission must remain durable even when email or a future communications provider is unavailable. Family confirmations, staff alerts, account invites, verification, and password reset require delivery status and retry. Hostinger is a managed single-application environment without a dedicated queue service in the current design.

## Decision drivers

- Do not lose accepted inquiries because a provider call fails.
- Do not tell a family submission failed after the record already committed.
- Support provider replacement and later channels.
- Keep infrastructure simple at initial volume.
- Make failures visible and retryable.

## Options considered

1. Database outbox plus Hostinger scheduled invocation.
2. Send synchronously during the request.
3. External managed queue and worker.
4. In-memory background tasks.

## Decision

Write notification requests to an `outbox_jobs` table in the same transaction as the business record. A protected scheduled process claims bounded batches, sends through a provider adapter, records each attempt, retries transient failures with bounded backoff, and exposes permanent failures to staff.

## Consequences

Positive:

- Atomic business record and notification intent.
- Provider outages do not lose accepted submissions.
- Delivery status and retries are explicit.
- No queue infrastructure is needed initially.

Negative:

- Delivery latency is bounded by the schedule interval.
- Correct claiming, leases, idempotency, and cleanup require careful implementation.
- Database load grows with queue volume.

## Reconsider when

- Queue volume exceeds 1,000 jobs per day or five-minute delivery targets are missed.
- Multiple application instances create coordination pressure.
- WhatsApp/SMS/webhooks require higher throughput or ordering.
- A managed queue materially reduces approved operational risk.

## References

- [Hostinger cron jobs](https://www.hostinger.com/support/hpanel/cron-jobs/)
