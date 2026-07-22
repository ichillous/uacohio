import Link from "next/link";

import type { AuditAccess } from "./audit";
import styles from "./admin.module.css";

export function AdminNav({
  auditAccess,
  canReviewAccess,
  locale,
}: {
  auditAccess: AuditAccess | null;
  canReviewAccess: boolean;
  locale: string;
}) {
  return (
    <nav aria-label="Administration" className={styles.adminNav}>
      <Link href={`/${locale}/staff/admin`}>Overview</Link>
      {canReviewAccess ? <Link href={`/${locale}/staff/admin/users`}>Staff access</Link> : null}
      {canReviewAccess ? (
        <Link href={`/${locale}/staff/admin/roles`}>Permission matrix</Link>
      ) : null}
      {auditAccess ? <Link href={`/${locale}/staff/admin/audit`}>Audit events</Link> : null}
    </nav>
  );
}
