import Link from "next/link";

import { getD1Database } from "@/db/d1";
import { getSession } from "@/modules/auth/session";
import { isLocale } from "@/modules/shared/i18n/locales";
import { getStudentDetail } from "@/modules/staff/students/repository";
import styles from "@/modules/staff/students/records.module.css";
import { StudentManagement } from "@/modules/staff/students/student-management";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function text(value: unknown) {
  return value === null || value === undefined || value === "" ? "—" : String(value);
}

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ locale: string; studentId: string }>;
}) {
  const { locale, studentId } = await params;
  const safeLocale = isLocale(locale) ? locale : "en";
  const session = await getSession();
  const detail = await getStudentDetail(await getD1Database(), session, studentId);
  const student = detail.student as Record<string, unknown>;

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Student record</p>
          <h1>
            {text(student.legalFirstName)} {text(student.legalLastName)}
          </h1>
          <p>
            {detail.projection === "full"
              ? "Full staff-authorized record projection."
              : "Applicant handoff projection; protected identifiers and family data are excluded."}
          </p>
        </div>
        <Link className={styles.backLink} href={`/${safeLocale}/staff/students`}>
          Back to students
        </Link>
      </header>

      <StudentManagement
        canManageEnrollment={session?.permissions.includes("enrollment.update") ?? false}
        canManageStudent={session?.permissions.includes("students.update") ?? false}
        enrollments={detail.enrollments}
        guardians={detail.guardians}
        student={student}
      />

      <div className={styles.detailGrid}>
        <article className={`${styles.panel} ${styles.panelWide}`}>
          <h2>Identity and demographics</h2>
          <dl className={styles.facts}>
            <div>
              <dt>Status</dt>
              <dd>{text(student.status)}</dd>
            </div>
            <div>
              <dt>EMIS student ID</dt>
              <dd>{text(student.emisStudentId)}</dd>
            </div>
            <div>
              <dt>Local-use ID</dt>
              <dd>{text(student.localUseId)}</dd>
            </div>
            <div>
              <dt>Birth date</dt>
              <dd>{text(student.birthDate)}</dd>
            </div>
            <div>
              <dt>Gender code</dt>
              <dd>{text(student.genderCode)}</dd>
            </div>
            <div>
              <dt>Race / ethnicity code</dt>
              <dd>{text(student.raceEthnicityCode)}</dd>
            </div>
            <div>
              <dt>Native / home language</dt>
              <dd>
                {text(student.nativeLanguageCode)} / {text(student.homeLanguageCode)}
              </dd>
            </div>
          </dl>
        </article>

        <article className={styles.panel}>
          <h2>Active guardians</h2>
          <ul className={styles.recordList}>
            {detail.guardians.map((raw, index) => {
              const guardian = raw as Record<string, unknown>;
              return (
                <li key={text(guardian.linkId) + index}>
                  <strong>
                    {text(guardian.firstName)} {text(guardian.lastName)}
                  </strong>
                  <span>
                    {text(guardian.relationship)} · preferred {text(guardian.preferredLanguage)} ·
                    family locale {text(guardian.familyPreferredLocale)}
                  </span>
                  <span>
                    {text(guardian.normalizedEmail)} · {text(guardian.normalizedPhone)}
                  </span>
                </li>
              );
            })}
          </ul>
          {detail.guardians.length === 0 ? (
            <p className={styles.empty}>No visible guardian links.</p>
          ) : null}
        </article>

        <article className={styles.panel}>
          <h2>Enrollment history</h2>
          <ul className={styles.recordList}>
            {detail.enrollments.map((raw, index) => {
              const enrollment = raw as Record<string, unknown>;
              return (
                <li key={text(enrollment.id) + index}>
                  <strong>
                    Grade {text(enrollment.gradeLevelCode)} · {text(enrollment.status)}
                  </strong>
                  <span>
                    {text(enrollment.schoolYear)} / {text(enrollment.term)} · effective{" "}
                    {text(enrollment.effectiveStart)}
                    {enrollment.effectiveEnd ? ` to ${text(enrollment.effectiveEnd)}` : ""}
                  </span>
                  <span>
                    Admission {text(enrollment.admissionReasonCode)} · withdrawal{" "}
                    {text(enrollment.withdrawalReasonCode)}
                  </span>
                </li>
              );
            })}
          </ul>
          {detail.enrollments.length === 0 ? (
            <p className={styles.empty}>No visible enrollments.</p>
          ) : null}
        </article>

        <article className={styles.panel}>
          <h2>Effective attributes</h2>
          <ul className={styles.recordList}>
            {detail.attributes.map((raw, index) => {
              const attribute = raw as Record<string, unknown>;
              return (
                <li key={text(attribute.id) + index}>
                  <strong>
                    Grade {text(attribute.gradeLevelCode)} · pattern{" "}
                    {text(attribute.attendancePatternCode)}
                  </strong>
                  <span>
                    EL {text(attribute.englishLearnerCode)} · disability{" "}
                    {text(attribute.disabilityConditionCode)}
                  </span>
                  <span>Effective {text(attribute.effectiveStart)}</span>
                </li>
              );
            })}
          </ul>
          {detail.attributes.length === 0 ? (
            <p className={styles.empty}>No visible attributes.</p>
          ) : null}
        </article>

        <article className={styles.panel}>
          <h2>Document metadata</h2>
          <ul className={styles.recordList}>
            {detail.documents.map((raw, index) => {
              const document = raw as Record<string, unknown>;
              return (
                <li key={text(document.id) + index}>
                  <strong>{text(document.originalFilename)}</strong>
                  <span>
                    {text(document.type)} · {text(document.mediaType)} · {text(document.sizeBytes)}{" "}
                    bytes
                  </span>
                  <span>Object key: {text(document.objectKey)}</span>
                </li>
              );
            })}
          </ul>
          {detail.documents.length === 0 ? (
            <p className={styles.empty}>No document metadata.</p>
          ) : null}
        </article>
      </div>
    </section>
  );
}
