import { requireStaffPermission } from "@/modules/auth/authorization";
import type { PortalSession } from "@/modules/auth/types";

import { StaffApiError } from "../shared/api";
import type { AttendanceBatchInput, AttendanceStatus } from "./rules";
import { deriveAttendanceValues } from "./rules";

type MutationContext = { actorUserId?: string; id?: () => string; now?: string };

export type AttendanceRosterRow = {
  absenceType: "excused" | "none" | "unexcused" | null;
  absentMinutes: number | null;
  attendedMinutes: number | null;
  gradeLevelCode: string;
  legalFirstName: string;
  legalLastName: string;
  safeNote: string | null;
  status: AttendanceStatus | null;
  studentId: string;
  version: number;
};

function mutationValues(context: MutationContext, session: PortalSession) {
  return {
    actorUserId: context.actorUserId ?? session.user.id,
    id: context.id ?? (() => crypto.randomUUID()),
    now: context.now ?? new Date().toISOString(),
  };
}

async function loadRoster(database: D1Database, attendanceDate: string) {
  const result = await database
    .prepare(
      `SELECT students.id AS studentId,
              students.legal_first_name AS legalFirstName,
              students.legal_last_name AS legalLastName,
              enrollments.grade_level_code AS gradeLevelCode,
              attendance_daily.status,
              attendance_daily.absence_type AS absenceType,
              attendance_daily.attended_minutes AS attendedMinutes,
              attendance_daily.absent_minutes AS absentMinutes,
              attendance_daily.safe_note AS safeNote,
              COALESCE(attendance_daily.version, 0) AS version
         FROM students
         INNER JOIN enrollments
           ON enrollments.id = (
             SELECT current_enrollment.id
               FROM enrollments AS current_enrollment
               INNER JOIN terms ON terms.id = current_enrollment.term_id
              WHERE current_enrollment.student_id = students.id
                AND current_enrollment.status = 'active'
                AND current_enrollment.effective_start <= ?
                AND (current_enrollment.effective_end IS NULL
                     OR current_enrollment.effective_end >= ?)
                AND terms.starts_on <= ? AND terms.ends_on >= ?
              ORDER BY current_enrollment.effective_start DESC LIMIT 1
           )
         LEFT JOIN attendance_daily
           ON attendance_daily.student_id = students.id
          AND attendance_daily.attendance_date = ?
        WHERE students.status = 'active'
        ORDER BY enrollments.grade_level_code, students.legal_last_name,
                 students.legal_first_name, students.id`,
    )
    .bind(attendanceDate, attendanceDate, attendanceDate, attendanceDate, attendanceDate)
    .all<AttendanceRosterRow>();
  return result.results.map((row) => ({ ...row, version: Number(row.version) }));
}

export async function getDefaultAttendanceDate(
  database: D1Database,
  portalSession: PortalSession | null,
): Promise<string> {
  requireStaffPermission(portalSession, "attendance.view");
  const row = await database
    .prepare("SELECT MAX(attendance_date) AS attendanceDate FROM attendance_daily")
    .first<{ attendanceDate: string | null }>();
  return row?.attendanceDate ?? new Date().toISOString().slice(0, 10);
}

export async function getAttendanceRoster(
  database: D1Database,
  portalSession: PortalSession | null,
  attendanceDate: string,
) {
  requireStaffPermission(portalSession, "attendance.view");
  return loadRoster(database, attendanceDate);
}

export async function getAttendanceHistory(
  database: D1Database,
  portalSession: PortalSession | null,
  studentId: string,
  filters: { from?: string; limit: number; to?: string },
) {
  requireStaffPermission(portalSession, "attendance.view");
  const conditions = ["attendance_daily.student_id = ?"];
  const bindings: unknown[] = [studentId];
  if (filters.from) {
    conditions.push("attendance_daily.attendance_date >= ?");
    bindings.push(filters.from);
  }
  if (filters.to) {
    conditions.push("attendance_daily.attendance_date <= ?");
    bindings.push(filters.to);
  }
  const student = await database
    .prepare(
      "SELECT legal_first_name AS legalFirstName, legal_last_name AS legalLastName FROM students WHERE id = ? LIMIT 1",
    )
    .bind(studentId)
    .first<{ legalFirstName: string; legalLastName: string }>();
  if (!student) throw new StaffApiError(404, "NOT_FOUND", "Student not found.");
  const result = await database
    .prepare(
      `SELECT id, attendance_date AS attendanceDate, status,
              absence_type AS absenceType, attended_minutes AS attendedMinutes,
              absent_minutes AS absentMinutes, safe_note AS safeNote,
              source, version, updated_at AS updatedAt
         FROM attendance_daily
        WHERE ${conditions.join(" AND ")}
        ORDER BY attendance_date DESC
        LIMIT ?`,
    )
    .bind(...bindings, filters.limit)
    .all<Record<string, unknown>>();
  return { records: result.results, student: { id: studentId, ...student } };
}

export async function getAttendanceSummary(
  database: D1Database,
  portalSession: PortalSession | null,
  range: { from: string; to: string },
) {
  requireStaffPermission(portalSession, "attendance.view");
  const result = await database
    .prepare(
      `SELECT
         COUNT(*) AS markedRecords,
         COUNT(DISTINCT attendance_date) AS schoolDays,
         SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present,
         SUM(CASE WHEN status IN ('absent_excused', 'absent_unexcused') THEN 1 ELSE 0 END) AS absent,
         SUM(CASE WHEN status IN ('tardy_excused', 'tardy_unexcused') THEN 1 ELSE 0 END) AS tardy,
         SUM(CASE WHEN status = 'partial' THEN 1 ELSE 0 END) AS partial,
         SUM(attended_minutes) AS attendedMinutes,
         SUM(absent_minutes) AS absentMinutes
       FROM attendance_daily
       WHERE attendance_date BETWEEN ? AND ?`,
    )
    .bind(range.from, range.to)
    .first<Record<string, number | null>>();
  const summary = rowNumbers(result ?? {});
  const totalMinutes = summary.attendedMinutes + summary.absentMinutes;
  return {
    ...summary,
    attendanceRate: totalMinutes === 0 ? null : summary.attendedMinutes / totalMinutes,
    from: range.from,
    to: range.to,
  };
}

function rowNumbers(row: Record<string, number | null>) {
  return {
    absent: Number(row.absent ?? 0),
    absentMinutes: Number(row.absentMinutes ?? 0),
    attendedMinutes: Number(row.attendedMinutes ?? 0),
    markedRecords: Number(row.markedRecords ?? 0),
    partial: Number(row.partial ?? 0),
    present: Number(row.present ?? 0),
    schoolDays: Number(row.schoolDays ?? 0),
    tardy: Number(row.tardy ?? 0),
  };
}

export async function getAttendanceExport(
  database: D1Database,
  portalSession: PortalSession | null,
  attendanceDate: string,
) {
  requireStaffPermission(portalSession, "attendance.export");
  return loadRoster(database, attendanceDate);
}

export async function markAttendanceBatch(
  database: D1Database,
  portalSession: PortalSession | null,
  input: AttendanceBatchInput,
  context: MutationContext = {},
) {
  const session = requireStaffPermission(portalSession, "attendance.mark");
  const { actorUserId, id, now } = mutationValues(context, session);
  const statements: D1PreparedStatement[] = [];
  const nextVersions: Array<{ studentId: string; version: number }> = [];
  for (const record of input.records) {
    const values = deriveAttendanceValues(record);
    const attendanceId = id();
    const correlationId = id();
    statements.push(
      database
        .prepare(
          `INSERT INTO students (
             id, emis_student_id, legal_first_name, legal_last_name, birth_date,
             gender_code, race_ethnicity_code, native_language_code, status
           )
           SELECT ?, 'invalid', 'Roster', 'Guard', '2000-01-01', 'U', '00', 'EN', 'active'
            WHERE NOT EXISTS (
              SELECT 1 FROM students
              INNER JOIN enrollments ON enrollments.student_id = students.id
              INNER JOIN terms ON terms.id = enrollments.term_id
               WHERE students.id = ?
                 AND students.status = 'active'
                 AND enrollments.status = 'active'
                 AND enrollments.effective_start <= ?
                 AND (enrollments.effective_end IS NULL OR enrollments.effective_end >= ?)
                 AND terms.starts_on <= ? AND terms.ends_on >= ?
            )`,
        )
        .bind(
          `attendance-roster-conflict-${id()}`,
          record.studentId,
          input.attendanceDate,
          input.attendanceDate,
          input.attendanceDate,
          input.attendanceDate,
        ),
      database
        .prepare(
          `INSERT INTO attendance_daily (
             id, student_id, attendance_date, status, absence_type,
             attended_minutes, absent_minutes, safe_note, marked_by_user_id,
             source, version, created_at, updated_at
           )
           SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, 'local', 1, ?, ?
            WHERE EXISTS (
              SELECT 1 FROM students
              INNER JOIN enrollments ON enrollments.student_id = students.id
              INNER JOIN terms ON terms.id = enrollments.term_id
               WHERE students.id = ?
                 AND students.status = 'active'
                 AND enrollments.status = 'active'
                 AND enrollments.effective_start <= ?
                 AND (enrollments.effective_end IS NULL OR enrollments.effective_end >= ?)
                 AND terms.starts_on <= ? AND terms.ends_on >= ?
            )
              AND (
                ? = 0 OR EXISTS (
                  SELECT 1 FROM attendance_daily
                   WHERE student_id = ? AND attendance_date = ? AND version = ?
                )
              )
           ON CONFLICT(student_id, attendance_date) DO UPDATE SET
             status = excluded.status,
             absence_type = excluded.absence_type,
             attended_minutes = excluded.attended_minutes,
             absent_minutes = excluded.absent_minutes,
             safe_note = excluded.safe_note,
             marked_by_user_id = excluded.marked_by_user_id,
             source = excluded.source,
             version = attendance_daily.version + 1,
             updated_at = excluded.updated_at
           WHERE attendance_daily.version = ?`,
        )
        .bind(
          attendanceId,
          record.studentId,
          input.attendanceDate,
          record.status,
          values.absenceType,
          values.attendedMinutes,
          values.absentMinutes,
          record.safeNote ?? null,
          actorUserId,
          now,
          now,
          record.studentId,
          input.attendanceDate,
          input.attendanceDate,
          input.attendanceDate,
          input.attendanceDate,
          record.version,
          record.studentId,
          input.attendanceDate,
          record.version,
          record.version,
        ),
      database
        .prepare(
          `INSERT INTO attendance_daily (
             id, student_id, attendance_date, status, absence_type,
             attended_minutes, absent_minutes, marked_by_user_id, source, version
           )
           SELECT ?, ?, ?, '__version_conflict__', 'none', 0, 0, ?, 'conflict-guard', 1
            WHERE changes() <> 1`,
        )
        .bind(id(), record.studentId, input.attendanceDate, actorUserId),
      database
        .prepare(
          `INSERT INTO audit_events (
             id, actor_user_id, actor_audience, action, target_type, target_id,
             correlation_id, outcome, changed_fields, created_at
           ) VALUES (?, ?, 'staff', 'attendance.marked', 'attendance_daily', ?, ?, 'success', ?, ?)`,
        )
        .bind(
          id(),
          actorUserId,
          `${record.studentId}:${input.attendanceDate}`,
          correlationId,
          JSON.stringify([
            "status",
            "absenceType",
            "attendedMinutes",
            "absentMinutes",
            ...(record.safeNote !== undefined ? ["safeNote"] : []),
            "version",
          ]),
          now,
        ),
    );
    nextVersions.push({ studentId: record.studentId, version: record.version + 1 });
  }
  try {
    await database.batch(statements);
  } catch (error) {
    if (
      /student identifiers must be nine characters/i.test(
        error instanceof Error ? error.message : String(error),
      )
    ) {
      throw new StaffApiError(
        422,
        "INVALID_REQUEST",
        "Every attendance record must belong to the active roster for this date.",
        { records: ["Remove students who are not actively enrolled for this term and date."] },
      );
    }
    if (
      /invalid attendance vocabulary/i.test(error instanceof Error ? error.message : String(error))
    ) {
      throw new StaffApiError(
        409,
        "VERSION_CONFLICT",
        "Attendance changed. Refresh and try again.",
      );
    }
    throw error;
  }
  return { attendanceDate: input.attendanceDate, records: nextVersions };
}
