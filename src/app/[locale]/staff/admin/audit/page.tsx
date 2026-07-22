import Link from "next/link";

import { getD1Database } from "@/db/d1";
import { getSession } from "@/modules/auth/session";
import { isLocale } from "@/modules/shared/i18n/locales";
import { AdminNav } from "@/modules/staff/admin/admin-nav";
import styles from "@/modules/staff/admin/admin.module.css";
import { listAuditEvents } from "@/modules/staff/admin/audit";
import { auditListQuerySchema } from "@/modules/staff/admin/schemas";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function firstValues(values: Record<string, string | string[] | undefined>) {
  return Object.fromEntries(
    Object.entries(values).flatMap(([key, value]) => {
      const first = Array.isArray(value) ? value[0] : value;
      return first === undefined || first === "" ? [] : [[key, first]];
    }),
  );
}

function displayDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AuditEventsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale }, rawFilters, session] = await Promise.all([params, searchParams, getSession()]);
  const safeLocale = isLocale(locale) ? locale : "en";
  const parsed = auditListQuerySchema.safeParse(firstValues(rawFilters));
  const filters = parsed.success ? parsed.data : { limit: 50 };
  const result = await listAuditEvents(await getD1Database(), session, filters);

  return (
    <div className={styles.adminPage}>
      <header className={styles.adminHeader}>
        <div>
          <p className={styles.eyebrow}>Privacy-safe governance record</p>
          <h1>Audit events</h1>
          <p>
            Event metadata only. Secret values, message bodies, internal notes, and raw request
            payloads are never projected here.
          </p>
        </div>
        <span className={styles.scopeBadge}>
          {result.scope.kind === "global" ? "Global approved view" : "Role-scoped view"}
        </span>
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

      <form className={styles.filterPanel} method="GET">
        <label>
          Module
          <select defaultValue={filters.module ?? ""} name="module">
            <option value="">All allowed modules</option>
            {result.scope.modules.map((module) => (
              <option key={module} value={module}>
                {module.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label>
          Outcome
          <select defaultValue={filters.outcome ?? ""} name="outcome">
            <option value="">Any outcome</option>
            <option value="success">Success</option>
            <option value="denied">Denied</option>
            <option value="failed">Failed</option>
          </select>
        </label>
        <label>
          Action key
          <input
            defaultValue={filters.action ?? ""}
            name="action"
            placeholder="lead.activity.created"
          />
        </label>
        <label>
          Limit
          <select defaultValue={String(filters.limit)} name="limit">
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </label>
        <button type="submit">Apply filters</button>
      </form>
      {!parsed.success ? (
        <p className={styles.statusError}>One or more filters were invalid and were reset.</p>
      ) : null}

      <div className={styles.auditScroller}>
        <table className={styles.auditTable}>
          <caption>{result.events.length} privacy-safe events</caption>
          <thead>
            <tr>
              <th scope="col">When</th>
              <th scope="col">Module / action</th>
              <th scope="col">Actor</th>
              <th scope="col">Target</th>
              <th scope="col">Outcome</th>
              <th scope="col">Detail</th>
            </tr>
          </thead>
          <tbody>
            {result.events.map((event) => (
              <tr key={event.id}>
                <td>{displayDate(event.createdAt)}</td>
                <td>
                  {event.module.replaceAll("_", " ")}
                  <br />
                  <code>{event.action}</code>
                </td>
                <td>{event.actor.displayName ?? event.actor.audience}</td>
                <td>
                  <code>{event.target.type}</code>
                  <br />
                  <code>{event.target.id}</code>
                </td>
                <td>{event.outcome}</td>
                <td>
                  <Link href={`/${safeLocale}/staff/admin/audit/${event.id}`}>Review</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
