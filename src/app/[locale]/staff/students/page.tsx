import Link from "next/link";

import { getD1Database } from "@/db/d1";
import { getSession } from "@/modules/auth/session";
import { isLocale } from "@/modules/shared/i18n/locales";
import { listStudents } from "@/modules/staff/students/repository";
import { listStudentsQuerySchema } from "@/modules/staff/students/schemas";
import styles from "@/modules/staff/students/records.module.css";
import { StudentCreateForm } from "@/modules/staff/students/student-management";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StudentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const [{ locale }, rawFilters] = await Promise.all([params, searchParams]);
  const safeLocale = isLocale(locale) ? locale : "en";
  const parsed = listStudentsQuerySchema.safeParse({ ...rawFilters, limit: 100 });
  const filters = parsed.success ? parsed.data : { limit: 100 };
  const session = await getSession();
  const students = await listStudents(await getD1Database(), session, filters);

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Student operations</p>
          <h1>Student records</h1>
          <p>Search EMIS-aligned enrollment records with access tailored to your staff role.</p>
        </div>
        <Link className={styles.backLink} href={`/${safeLocale}/staff/attendance`}>
          Open attendance
        </Link>
      </header>

      <StudentCreateForm canCreate={session?.permissions.includes("students.create") ?? false} />

      <form className={styles.search}>
        <label>
          Search name or authorized identifier
          <input defaultValue={filters.q ?? ""} maxLength={80} name="q" type="search" />
        </label>
        <label>
          Student status
          <select defaultValue={filters.status ?? ""} name="status">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="withdrawn">Withdrawn</option>
            <option value="graduated">Graduated</option>
          </select>
        </label>
        <button type="submit">Search records</button>
      </form>

      <p className={styles.count}>{students.length} records shown</p>
      <div className={styles.grid}>
        {students.map((student) => (
          <Link
            className={styles.card}
            href={`/${safeLocale}/staff/students/${student.id}`}
            key={student.id}
          >
            <div className={styles.cardTop}>
              <span>{student.localUseId ?? student.id}</span>
              <span className={styles.status}>{student.status}</span>
            </div>
            <h2>
              {student.legalFirstName} {student.legalLastName}
            </h2>
            <div className={styles.cardMeta}>
              <span>Grade {student.gradeLevelCode ?? "—"}</span>
              <span>{student.projection === "full" ? "Full record" : "Applicant handoff"}</span>
            </div>
          </Link>
        ))}
      </div>
      {students.length === 0 ? <p className={styles.empty}>No matching students.</p> : null}
    </section>
  );
}
