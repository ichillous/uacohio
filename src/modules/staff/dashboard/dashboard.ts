import type { PortalSession } from "@/modules/auth/types";

import { leadStages, type LeadStage } from "../admissions/stages";

export type DashboardScopes = {
  admissions: boolean;
  campaigns: boolean;
  content: boolean;
};

export type StaffDashboardData = {
  generatedAt: string;
  scopes: DashboardScopes;
  admissions: null | {
    attendance: {
      date: string | null;
      percentage: number;
      presentStudents: number;
      studentCount: number;
    };
    newApplications: number;
    openFollowUps: number;
    openSeats: number;
    overdueFollowUps: number;
    stageCounts: Record<LeadStage, number>;
    totalEnrolled: number;
  };
  campaigns: null | {
    sources: ReadonlyArray<{ campaign: string; count: number; source: string }>;
  };
  content: null | {
    draftAnnouncements: number;
    publishedAnnouncements: number;
  };
};

export function dashboardScopesForSession(session: PortalSession): DashboardScopes {
  return {
    admissions: session.permissions.includes("dashboard.view"),
    campaigns: session.permissions.includes("dashboard.view_campaign_metrics"),
    content: session.permissions.includes("dashboard.view_content_metrics"),
  };
}

export function emptyStageCounts(): Record<LeadStage, number> {
  return Object.fromEntries(leadStages.map((stage) => [stage, 0])) as Record<LeadStage, number>;
}

function numeric(value: number | string | undefined): number {
  return Number(value ?? 0);
}

export function attendancePercentage(presentStudents: number, studentCount: number): number {
  if (studentCount <= 0) {
    return 0;
  }

  return Math.round((presentStudents / studentCount) * 1_000) / 10;
}

export function availableSeatCount(totalCapacity: number, enrolledStudents: number): number {
  return Math.max(totalCapacity - enrolledStudents, 0);
}

export async function getStaffDashboard(
  database: D1Database,
  session: PortalSession,
  now = new Date(),
): Promise<StaffDashboardData> {
  const scopes = dashboardScopesForSession(session);
  const stageCounts = emptyStageCounts();
  let admissions: StaffDashboardData["admissions"] = null;
  let campaigns: StaffDashboardData["campaigns"] = null;
  let content: StaffDashboardData["content"] = null;

  if (scopes.admissions) {
    const [
      enrollmentResult,
      applicationResult,
      attendanceResult,
      capacityResult,
      followUpResult,
      stagesResult,
    ] = await database.batch([
      database.prepare(
        "SELECT COUNT(DISTINCT student_id) AS count FROM enrollments WHERE status = 'active'",
      ),
      database.prepare(
        "SELECT COUNT(*) AS count FROM applications WHERE status IN ('submitted', 'review')",
      ),
      database.prepare(
        `WITH latest_attendance AS (
           SELECT MAX(attendance_date) AS attendance_date FROM attendance_daily
         )
         SELECT
           latest_attendance.attendance_date AS attendanceDate,
           COUNT(attendance_daily.id) AS studentCount,
           SUM(CASE WHEN attendance_daily.status IN ('present', 'tardy_excused', 'tardy_unexcused', 'partial') THEN 1 ELSE 0 END) AS presentStudents
         FROM latest_attendance
         LEFT JOIN attendance_daily
           ON attendance_daily.attendance_date = latest_attendance.attendance_date`,
      ),
      database.prepare(
        `SELECT COALESCE(SUM(seat_capacity.capacity), 0) AS totalCapacity
         FROM seat_capacity
         INNER JOIN school_years ON school_years.id = seat_capacity.school_year_id
         WHERE school_years.current = 1`,
      ),
      database
        .prepare(
          `SELECT
             COUNT(*) AS openCount,
             SUM(CASE WHEN due_at < ? THEN 1 ELSE 0 END) AS overdueCount
           FROM follow_up_tasks
           WHERE completed_at IS NULL`,
        )
        .bind(now.toISOString()),
      database.prepare("SELECT stage, COUNT(*) AS count FROM leads GROUP BY stage"),
    ]);

    for (const row of stagesResult.results as Array<{ count: number | string; stage: LeadStage }>) {
      if (leadStages.includes(row.stage)) {
        stageCounts[row.stage] = numeric(row.count);
      }
    }

    const followUps = followUpResult.results[0] as
      { openCount?: number | string; overdueCount?: number | string } | undefined;
    const totalEnrolled = numeric(
      (enrollmentResult.results[0] as { count?: number | string })?.count,
    );
    const attendanceRow = attendanceResult.results[0] as
      | {
          attendanceDate?: string | null;
          presentStudents?: number | string;
          studentCount?: number | string;
        }
      | undefined;
    const presentStudents = numeric(attendanceRow?.presentStudents);
    const studentCount = numeric(attendanceRow?.studentCount);
    const totalCapacity = numeric(
      (capacityResult.results[0] as { totalCapacity?: number | string })?.totalCapacity,
    );
    admissions = {
      attendance: {
        date: attendanceRow?.attendanceDate ?? null,
        percentage: attendancePercentage(presentStudents, studentCount),
        presentStudents,
        studentCount,
      },
      newApplications: numeric(
        (applicationResult.results[0] as { count?: number | string })?.count,
      ),
      openFollowUps: numeric(followUps?.openCount),
      openSeats: availableSeatCount(totalCapacity, totalEnrolled),
      overdueFollowUps: numeric(followUps?.overdueCount),
      stageCounts,
      totalEnrolled,
    };
  }

  if (scopes.campaigns) {
    const result = await database
      .prepare(
        `SELECT source, COALESCE(campaign, 'Unattributed') AS campaign, COUNT(*) AS count
         FROM leads
         GROUP BY source, campaign
         ORDER BY count DESC, source ASC`,
      )
      .all<{ campaign: string; count: number | string; source: string }>();
    campaigns = {
      sources: result.results.map((row) => ({ ...row, count: numeric(row.count) })),
    };
  }

  if (scopes.content) {
    const result = await database
      .prepare(
        `SELECT
           SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS draftCount,
           SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS publishedCount
         FROM announcements`,
      )
      .first<{ draftCount?: number | string; publishedCount?: number | string }>();
    content = {
      draftAnnouncements: numeric(result?.draftCount),
      publishedAnnouncements: numeric(result?.publishedCount),
    };
  }

  return { admissions, campaigns, content, generatedAt: now.toISOString(), scopes };
}
