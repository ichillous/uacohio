import Link from "next/link";

import { getD1Database } from "@/db/d1";
import { getSession } from "@/modules/auth/session";
import { isLocale } from "@/modules/shared/i18n/locales";
import { getStaffDashboard, type StaffDashboardData } from "@/modules/staff/dashboard/dashboard";
import { leadStageLabels, leadStages } from "@/modules/staff/admissions/stages";
import { requireAnyStaffPermission } from "@/modules/staff/shared/api";
import styles from "@/modules/staff/shared/staff-portal.module.css";

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function AdmissionsBrief({
  data,
  locale,
}: {
  data: NonNullable<StaffDashboardData["admissions"]>;
  locale: string;
}) {
  const activePipeline = leadStages
    .filter((stage) => stage !== "closed_not_proceeding")
    .reduce((sum, stage) => sum + data.stageCounts[stage], 0);
  const attendanceDate = data.attendance.date
    ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(
        new Date(`${data.attendance.date}T12:00:00.000Z`),
      )
    : "No records";

  return (
    <>
      <section aria-label="Key measures" className={styles.metricStrip}>
        <article className={styles.primaryMetric}>
          <span>Total enrolled</span>
          <strong>{number(data.totalEnrolled)}</strong>
          <small>Active enrollment records</small>
        </article>
        <article>
          <span>New applications</span>
          <strong>{number(data.newApplications)}</strong>
          <small>Submitted or in review</small>
        </article>
        <article>
          <span>Attendance</span>
          <strong>{data.attendance.percentage}%</strong>
          <small>
            {attendanceDate} · {data.attendance.presentStudents} of {data.attendance.studentCount}
          </small>
        </article>
        <article>
          <span>Open seats</span>
          <strong>{number(data.openSeats)}</strong>
          <small>Approved capacity less enrollment</small>
        </article>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeading}>
          <div>
            <p className={styles.eyebrow}>Admissions docket</p>
            <h2>Where families are today</h2>
            <p>
              {number(activePipeline)} active leads · {number(data.openFollowUps)} follow-ups ·{" "}
              {number(data.overdueFollowUps)} overdue
            </p>
          </div>
          <Link className={styles.textLink} href={`/${locale}/staff/admissions`}>
            Open pipeline <span aria-hidden="true">→</span>
          </Link>
        </div>
        <ol className={styles.stageLedger}>
          {leadStages.map((stage) => (
            <li key={stage}>
              <span>{leadStageLabels[stage]}</span>
              <strong>{data.stageCounts[stage]}</strong>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}

export default async function StaffDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "en";
  const session = requireAnyStaffPermission(await getSession(), [
    "dashboard.view",
    "dashboard.view_content_metrics",
    "dashboard.view_campaign_metrics",
  ]);
  const data = await getStaffDashboard(await getD1Database(), session);
  const date = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    weekday: "long",
  }).format(new Date(data.generatedAt));

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>{date}</p>
          <h1>Good morning, {session.user.displayName.replace(/^Dev /, "").split(" ")[0]}.</h1>
          <p>Here is the school’s working picture, drawn from the local record.</p>
        </div>
        <span className={styles.liveBadge}>
          <i aria-hidden="true" /> Local data
        </span>
      </header>

      {data.admissions ? <AdmissionsBrief data={data.admissions} locale={safeLocale} /> : null}

      {data.campaigns ? (
        <section className={styles.panel}>
          <div className={styles.panelHeading}>
            <div>
              <p className={styles.eyebrow}>Outreach view</p>
              <h2>Lead sources and campaigns</h2>
            </div>
          </div>
          <div className={styles.sourceGrid}>
            {data.campaigns.sources.map((source) => (
              <article key={`${source.source}-${source.campaign}`}>
                <strong>{source.count}</strong>
                <span>{source.source.replaceAll("_", " ")}</span>
                <small>{source.campaign}</small>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {data.content ? (
        <section className={styles.metricStrip}>
          <article className={styles.primaryMetric}>
            <span>Draft announcements</span>
            <strong>{data.content.draftAnnouncements}</strong>
            <small>Ready for editorial work</small>
          </article>
          <article>
            <span>Published announcements</span>
            <strong>{data.content.publishedAnnouncements}</strong>
            <small>Available to families</small>
          </article>
        </section>
      ) : null}
    </div>
  );
}
