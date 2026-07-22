import Link from "next/link";

import { getSession } from "@/modules/auth/session";
import { isLocale } from "@/modules/shared/i18n/locales";
import { getAuditAccess, type AuditAccess } from "@/modules/staff/admin/audit";
import { AdminNav } from "@/modules/staff/admin/admin-nav";
import styles from "@/modules/staff/admin/admin.module.css";
import { requireAnyStaffPermission } from "@/modules/staff/shared/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdministrationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "en";
  const session = requireAnyStaffPermission(await getSession(), [
    "roles.administer",
    "audit.view",
    "audit.view_module",
  ]);
  const canAdminister = session.permissions.includes("roles.administer");
  const canReviewAccess = canAdminister || session.permissions.includes("audit.view");
  let auditAccess: AuditAccess | null = null;
  if (
    session.permissions.includes("audit.view") ||
    session.permissions.includes("audit.view_module")
  ) {
    auditAccess = getAuditAccess(session);
  }

  return (
    <div className={styles.adminPage}>
      <header className={styles.adminHeader}>
        <div>
          <p className={styles.eyebrow}>Governance workspace</p>
          <h1>Administration</h1>
          <p>Review staff authority and the privacy-safe history of sensitive changes.</p>
        </div>
        <span className={styles.scopeBadge}>
          {canAdminister ? "Access administrator" : "Audit review"}
        </span>
      </header>
      <AdminNav auditAccess={auditAccess} canReviewAccess={canReviewAccess} locale={safeLocale} />

      <section className={styles.overviewGrid}>
        {canReviewAccess ? (
          <article className={styles.overviewCard}>
            <h2>Staff access</h2>
            <p>
              {canAdminister
                ? "Replace one active staff role at a time. Guardian identities and inactive accounts cannot receive staff authority."
                : "Review current staff access. Role replacement remains restricted to access administrators."}
            </p>
            <Link href={`/${safeLocale}/staff/admin/users`}>Review staff roles →</Link>
          </article>
        ) : null}
        {canReviewAccess ? (
          <article className={styles.overviewCard}>
            <h2>Permission matrix</h2>
            <p>Inspect each stable role and its exact server permission grants.</p>
            <Link href={`/${safeLocale}/staff/admin/roles`}>Open permission matrix →</Link>
          </article>
        ) : null}
        {auditAccess ? (
          <article className={styles.overviewCard}>
            <h2>Audit events</h2>
            <p>
              {auditAccess.kind === "global"
                ? "Review the approved global audit projection."
                : `Review only ${auditAccess.modules.join(" and ")} events allowed for your role.`}
            </p>
            <Link href={`/${safeLocale}/staff/admin/audit`}>Review audit history →</Link>
          </article>
        ) : null}
      </section>
    </div>
  );
}
