import { getD1Database } from "@/db/d1";
import { getSession } from "@/modules/auth/session";
import { isLocale } from "@/modules/shared/i18n/locales";
import { AdminNav } from "@/modules/staff/admin/admin-nav";
import styles from "@/modules/staff/admin/admin.module.css";
import { getAuditAccess } from "@/modules/staff/admin/audit";
import { listAdminRoles, listAdminUsers } from "@/modules/staff/admin/repository";
import { UserRoleManager } from "@/modules/staff/admin/user-role-manager";
import { requireAnyStaffPermission } from "@/modules/staff/shared/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StaffAccessPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "en";
  const session = requireAnyStaffPermission(await getSession(), ["roles.administer", "audit.view"]);
  const canAdminister = session.permissions.includes("roles.administer");
  const database = await getD1Database();
  const [users, roles] = await Promise.all([listAdminUsers(database), listAdminRoles(database)]);
  const auditAccess =
    session.permissions.includes("audit.view") || session.permissions.includes("audit.view_module")
      ? getAuditAccess(session)
      : null;

  return (
    <div className={styles.adminPage}>
      <header className={styles.adminHeader}>
        <div>
          <p className={styles.eyebrow}>Identity governance</p>
          <h1>Staff access</h1>
          <p>
            Each active staff identity has exactly one role. Every replacement is atomic and
            recorded without role values or personal data in the audit payload.
          </p>
        </div>
        <span className={styles.scopeBadge}>{users.length} staff accounts</span>
      </header>
      <AdminNav auditAccess={auditAccess} canReviewAccess locale={safeLocale} />
      <UserRoleManager
        canAdminister={canAdminister}
        currentUserId={session.user.id}
        initialUsers={users}
        roles={roles}
      />
    </div>
  );
}
