import Link from "next/link";
import type { ReactNode } from "react";

import type { PortalSession } from "@/modules/auth/types";
import { OfficialLogo } from "@/modules/public-site/components/official-logo";

import { StaffSignOut } from "./staff-sign-out";
import styles from "./staff-portal.module.css";

const roleLabels = {
  admissions_family_liaison: "Admissions & family liaison",
  content_publisher_translator: "Publisher & translator",
  marketing_outreach: "Marketing & outreach",
  office_attendance: "Office & attendance",
  school_leadership: "School leadership",
  system_administrator: "System administrator",
} as const;

export function StaffShell({
  children,
  locale,
  session,
}: {
  children: ReactNode;
  locale: string;
  session: PortalSession;
}) {
  const canSeeDashboard = session.permissions.some((permission) =>
    [
      "dashboard.view",
      "dashboard.view_campaign_metrics",
      "dashboard.view_content_metrics",
    ].includes(permission),
  );
  const canSeeAdmissions = session.permissions.includes("leads.view");

  return (
    <div className={styles.portalFrame}>
      <a className={styles.skipLink} href="#staff-content">
        Skip to workspace
      </a>
      <aside className={styles.rail}>
        <Link className={styles.brand} href={`/${locale}/staff`}>
          <OfficialLogo className={styles.logo} priority sizes="50px" />
          <span>
            <strong>UAC</strong>
            <small>Staff workspace</small>
          </span>
        </Link>

        <nav aria-label="Staff workspace" className={styles.navigation}>
          <p>Workspace</p>
          {canSeeDashboard ? (
            <Link href={`/${locale}/staff`}>
              <span aria-hidden="true">◫</span> Morning brief
            </Link>
          ) : null}
          {canSeeAdmissions ? (
            <Link href={`/${locale}/staff/admissions`}>
              <span aria-hidden="true">◇</span> Enrollment pipeline
            </Link>
          ) : null}
          <p>Coming next</p>
          <span aria-disabled="true" className={styles.disabledNav}>
            <span aria-hidden="true">○</span> Student records
          </span>
          <span aria-disabled="true" className={styles.disabledNav}>
            <span aria-hidden="true">□</span> Attendance
          </span>
        </nav>

        <div className={styles.railFooter}>
          <span className={styles.avatar}>{session.user.displayName.slice(0, 1)}</span>
          <div>
            <strong>{session.user.displayName}</strong>
            <span>{session.role ? roleLabels[session.role] : "Staff"}</span>
          </div>
          <StaffSignOut locale={locale} />
        </div>
      </aside>

      <main className={styles.workspace} id="staff-content">
        {children}
      </main>
    </div>
  );
}
