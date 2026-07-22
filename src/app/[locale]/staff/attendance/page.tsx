import { getD1Database } from "@/db/d1";
import { getSession } from "@/modules/auth/session";
import { AttendanceWorkspace } from "@/modules/staff/attendance/attendance-workspace";
import styles from "@/modules/staff/attendance/attendance.module.css";
import {
  getAttendanceRoster,
  getAttendanceSummary,
  getDefaultAttendanceDate,
} from "@/modules/staff/attendance/repository";
import { attendanceDateQuerySchema } from "@/modules/staff/attendance/rules";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const [database, session, rawQuery] = await Promise.all([
    getD1Database(),
    getSession(),
    searchParams,
  ]);
  const parsed = attendanceDateQuerySchema.safeParse(rawQuery);
  const attendanceDate = parsed.success
    ? parsed.data.date
    : await getDefaultAttendanceDate(database, session);
  const [roster, summary] = await Promise.all([
    getAttendanceRoster(database, session, attendanceDate),
    getAttendanceSummary(database, session, { from: attendanceDate, to: attendanceDate }),
  ]);
  const canMark = session?.permissions.includes("attendance.mark") ?? false;
  const canExport = session?.permissions.includes("attendance.export") ?? false;

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Student operations</p>
          <h1>Daily attendance</h1>
          <p>
            Review the enrolled roster, mark approved local statuses, and export a private daily
            record.
          </p>
        </div>
        <div className={styles.headerActions}>
          <form className={styles.dateForm}>
            <label htmlFor="attendance-date">Attendance date</label>
            <input defaultValue={attendanceDate} id="attendance-date" name="date" type="date" />
            <button type="submit">Load date</button>
          </form>
          {canExport ? (
            <a
              className={styles.exportLink}
              href={`/api/staff/attendance/export?date=${attendanceDate}`}
            >
              Export CSV
            </a>
          ) : null}
        </div>
      </header>

      <div className={styles.summary}>
        <article className={styles.metric}>
          <span>Roster</span>
          <strong>{roster.length}</strong>
        </article>
        <article className={styles.metric}>
          <span>Present</span>
          <strong>{summary.present}</strong>
        </article>
        <article className={styles.metric}>
          <span>Absent</span>
          <strong>{summary.absent}</strong>
        </article>
        <article className={styles.metric}>
          <span>Tardy</span>
          <strong>{summary.tardy}</strong>
        </article>
        <article className={styles.metric}>
          <span>Rate</span>
          <strong>
            {summary.attendanceRate === null
              ? "—"
              : `${(summary.attendanceRate * 100).toFixed(1)}%`}
          </strong>
        </article>
      </div>

      <AttendanceWorkspace
        attendanceDate={attendanceDate}
        canMark={canMark}
        initialRoster={roster}
        key={attendanceDate}
      />
    </section>
  );
}
