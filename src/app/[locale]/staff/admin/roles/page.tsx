import { getD1Database } from "@/db/d1";
import { getSession } from "@/modules/auth/session";
import { isLocale } from "@/modules/shared/i18n/locales";
import { AdminNav } from "@/modules/staff/admin/admin-nav";
import styles from "@/modules/staff/admin/admin.module.css";
import { getAuditAccess } from "@/modules/staff/admin/audit";
import { listAdminPermissions, listAdminRoles } from "@/modules/staff/admin/repository";
import { requireAnyStaffPermission } from "@/modules/staff/shared/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PermissionMatrixPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "en";
  const session = requireAnyStaffPermission(await getSession(), ["roles.administer", "audit.view"]);
  const database = await getD1Database();
  const [roles, permissions] = await Promise.all([
    listAdminRoles(database),
    listAdminPermissions(database),
  ]);
  const auditAccess =
    session.permissions.includes("audit.view") || session.permissions.includes("audit.view_module")
      ? getAuditAccess(session)
      : null;

  return (
    <div className={styles.adminPage}>
      <header className={styles.adminHeader}>
        <div>
          <p className={styles.eyebrow}>Default-deny authority</p>
          <h1>Permission matrix</h1>
          <p>
            Read-only view of stable roles and explicit server grants. Unlisted actions remain
            denied.
          </p>
        </div>
        <span className={styles.scopeBadge}>{permissions.length} permissions</span>
      </header>
      <AdminNav auditAccess={auditAccess} canReviewAccess locale={safeLocale} />

      <section className={styles.roleGrid} aria-label="Role summaries">
        {roles.map((role) => (
          <article className={styles.roleCard} key={role.key}>
            <h2>{role.name}</h2>
            <p>{role.description}</p>
            <ul className={styles.permissionList}>
              {role.permissions.map((permission) => (
                <li key={permission}>{permission}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <div className={styles.matrixScroller}>
        <table className={styles.matrix}>
          <caption>Exact permission grants by role</caption>
          <thead>
            <tr>
              <th scope="col">Permission</th>
              {roles.map((role) => (
                <th key={role.key} scope="col">
                  {role.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissions.map((permission) => (
              <tr key={permission.key}>
                <th scope="row">
                  <code>{permission.key}</code>
                  <br />
                  <small>{permission.description}</small>
                </th>
                {roles.map((role) => {
                  const granted = role.permissions.includes(permission.key);
                  return (
                    <td
                      aria-label={`${role.name}: ${granted ? "granted" : "denied"}`}
                      className={granted ? styles.granted : styles.denied}
                      key={role.key}
                    >
                      {granted ? "Granted" : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
