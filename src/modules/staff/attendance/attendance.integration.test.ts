// @vitest-environment node

import { getPlatformProxy } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { PortalSession } from "@/modules/auth/types";

import { markAttendanceBatch } from "./repository";

const integrationEnabled = process.env.LOCAL_D1_INTEGRATION === "true";

const officeSession: PortalSession = {
  audience: "staff",
  permissions: ["attendance.view", "attendance.mark", "attendance.export"],
  role: "office_attendance",
  user: {
    displayName: "Dev Office Staff",
    email: "office@local.test",
    id: "user-staff-004",
    locale: "en",
  },
};

describe.runIf(integrationEnabled)("attendance D1 atomicity", () => {
  let database: D1Database;
  let dispose: (() => Promise<void>) | undefined;

  beforeAll(async () => {
    const platform = await getPlatformProxy<{ DB: D1Database }>({
      configPath: "wrangler.jsonc",
      envFiles: [".env.example"],
      persist: true,
      remoteBindings: false,
    });
    database = platform.env.DB;
    dispose = platform.dispose;
  });

  afterAll(async () => {
    await dispose?.();
  });

  it("rolls back the entire batch when one optimistic version is stale", async () => {
    const date = "2025-09-15";
    const before = await database
      .prepare(
        `SELECT student_id AS studentId, status, version
           FROM attendance_daily
          WHERE attendance_date = ? AND student_id IN ('student-001', 'student-002')
          ORDER BY student_id`,
      )
      .bind(date)
      .all<{ status: string; studentId: string; version: number }>();
    expect(before.results).toHaveLength(2);
    const auditBefore = await database
      .prepare(
        `SELECT COUNT(*) AS count FROM audit_events
          WHERE action = 'attendance.marked'
            AND target_id IN (?, ?)`,
      )
      .bind(`student-001:${date}`, `student-002:${date}`)
      .first<{ count: number }>();

    await expect(
      markAttendanceBatch(
        database,
        officeSession,
        {
          attendanceDate: date,
          records: [
            {
              status: before.results[0].status === "present" ? "absent_excused" : "present",
              studentId: "student-001",
              version: Number(before.results[0].version),
            },
            {
              status: "present",
              studentId: "student-002",
              version: Number(before.results[1].version) + 99,
            },
          ],
        },
        { id: () => crypto.randomUUID(), now: "2026-07-22T18:00:00.000Z" },
      ),
    ).rejects.toMatchObject({ code: "VERSION_CONFLICT", status: 409 });

    const after = await database
      .prepare(
        `SELECT student_id AS studentId, status, version
           FROM attendance_daily
          WHERE attendance_date = ? AND student_id IN ('student-001', 'student-002')
          ORDER BY student_id`,
      )
      .bind(date)
      .all<{ status: string; studentId: string; version: number }>();
    const auditAfter = await database
      .prepare(
        `SELECT COUNT(*) AS count FROM audit_events
          WHERE action = 'attendance.marked'
            AND target_id IN (?, ?)`,
      )
      .bind(`student-001:${date}`, `student-002:${date}`)
      .first<{ count: number }>();
    expect(after.results).toEqual(before.results);
    expect(Number(auditAfter?.count ?? 0)).toBe(Number(auditBefore?.count ?? 0));
  });

  it("rolls back eligible rows when another student is not roster-eligible", async () => {
    const date = "2025-09-15";
    const now = "2026-07-22T19:30:00.000Z";
    const before = await database
      .prepare(
        `SELECT id, student_id AS studentId, status, absence_type AS absenceType,
                attended_minutes AS attendedMinutes, absent_minutes AS absentMinutes,
                safe_note AS safeNote, marked_by_user_id AS markedByUserId, source,
                version, updated_at AS updatedAt
           FROM attendance_daily
          WHERE attendance_date = ? AND student_id IN ('student-001', 'student-002')
          ORDER BY student_id`,
      )
      .bind(date)
      .all<Record<string, string | number | null>>();
    expect(before.results).toHaveLength(2);
    await database
      .prepare("UPDATE students SET status = 'withdrawn' WHERE id = 'student-002'")
      .run();
    try {
      await expect(
        markAttendanceBatch(
          database,
          officeSession,
          {
            attendanceDate: date,
            records: before.results.map((row) => ({
              status: row.status === "present" ? "absent_excused" : "present",
              studentId: String(row.studentId),
              version: Number(row.version),
            })),
          },
          { actorUserId: officeSession.user.id, id: () => crypto.randomUUID(), now },
        ),
      ).rejects.toMatchObject({ code: "INVALID_REQUEST", status: 422 });

      const after = await database
        .prepare(
          `SELECT id, student_id AS studentId, status, absence_type AS absenceType,
                  attended_minutes AS attendedMinutes, absent_minutes AS absentMinutes,
                  safe_note AS safeNote, marked_by_user_id AS markedByUserId, source,
                  version, updated_at AS updatedAt
             FROM attendance_daily
            WHERE attendance_date = ? AND student_id IN ('student-001', 'student-002')
            ORDER BY student_id`,
        )
        .bind(date)
        .all<Record<string, string | number | null>>();
      expect(after.results).toEqual(before.results);
    } finally {
      await database
        .prepare("UPDATE students SET status = 'active' WHERE id = 'student-002'")
        .run();
      for (const row of before.results) {
        await database
          .prepare(
            `UPDATE attendance_daily
                SET status = ?, absence_type = ?, attended_minutes = ?, absent_minutes = ?,
                    safe_note = ?, marked_by_user_id = ?, source = ?, version = ?, updated_at = ?
              WHERE id = ?`,
          )
          .bind(
            row.status,
            row.absenceType,
            row.attendedMinutes,
            row.absentMinutes,
            row.safeNote,
            row.markedByUserId,
            row.source,
            row.version,
            row.updatedAt,
            row.id,
          )
          .run();
      }
      await database
        .prepare(
          `DELETE FROM audit_events
            WHERE action = 'attendance.marked' AND created_at = ?
              AND target_id IN (?, ?)`,
        )
        .bind(now, `student-001:${date}`, `student-002:${date}`)
        .run();
    }
  });
});
