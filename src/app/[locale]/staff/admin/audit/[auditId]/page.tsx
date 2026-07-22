import { getD1Database } from "@/db/d1";
import { getSession } from "@/modules/auth/session";
import { isLocale } from "@/modules/shared/i18n/locales";
import { AdminNav } from "@/modules/staff/admin/admin-nav";
import styles from "@/modules/staff/admin/admin.module.css";
import { getAuditEvent } from "@/modules/staff/admin/audit";
import { StaffApiError } from "@/modules/staff/shared/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AuditEventPage({
  params,
}: {
  params: Promise<{ auditId: string; locale: string }>;
}) {
  const { auditId, locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "en";
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(auditId)) {
    throw new StaffApiError(404, "NOT_FOUND", "Audit event not found.");
  }
  const session = await getSession();
  const result = await getAuditEvent(await getD1Database(), session, auditId);
  const event = result.event;

  return (
    <div className={styles.adminPage}>
      <header className={styles.adminHeader}>
        <div>
          <p className={styles.eyebrow}>Audit event detail</p>
          <h1>{event.action}</h1>
          <p>Approved metadata projection for one scope-checked event.</p>
        </div>
        <span className={styles.scopeBadge}>{event.outcome}</span>
      </header>
      <AdminNav
        auditAccess={result.scope}
        canReviewAccess={
          session?.permissions.some((permission) =>
            ["roles.administer", "audit.view"].includes(permission),
          ) ?? false
        }
        locale={safeLocale}
      />
      <article className={styles.auditDetail}>
        <h2>Event record</h2>
        <dl>
          <dt>Event ID</dt>
          <dd>
            <code>{event.id}</code>
          </dd>
          <dt>Created</dt>
          <dd>{new Date(event.createdAt).toLocaleString("en-US")}</dd>
          <dt>Module</dt>
          <dd>{event.module.replaceAll("_", " ")}</dd>
          <dt>Actor</dt>
          <dd>{event.actor.displayName ?? event.actor.audience}</dd>
          <dt>Target</dt>
          <dd>
            <code>
              {event.target.type} / {event.target.id}
            </code>
          </dd>
          <dt>Changed fields</dt>
          <dd>
            {event.changedFields.length > 0 ? event.changedFields.join(", ") : "None recorded"}
          </dd>
          <dt>Correlation ID</dt>
          <dd>
            <code>{event.correlationId}</code>
          </dd>
        </dl>
      </article>
    </div>
  );
}
