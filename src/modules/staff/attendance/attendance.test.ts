import { describe, expect, it } from "vitest";

import type { PortalSession } from "@/modules/auth/types";

import { StaffApiError } from "../shared/api";
import { markAttendanceBatch } from "./repository";
import { attendanceBatchSchema, attendanceStatuses, deriveAttendanceValues } from "./rules";

type RecordedStatement = { bindings: unknown[]; sql: string };

function session(permissions: PortalSession["permissions"]): PortalSession {
  return {
    audience: "staff",
    permissions,
    role: permissions.includes("attendance.mark") ? "office_attendance" : "school_leadership",
    user: { displayName: "Test Staff", email: "staff@example.test", id: "staff-1", locale: "en" },
  };
}

function fakeDatabase(options?: { error?: Error }) {
  const batches: RecordedStatement[][] = [];
  const database = {
    async batch(batch: RecordedStatement[]) {
      batches.push(batch);
      if (options?.error) throw options.error;
      return batch.map(() => ({ meta: { changes: 1 }, results: [], success: true }));
    },
    prepare(sql: string) {
      const statement: RecordedStatement & { bind: (...bindings: unknown[]) => unknown } = {
        bindings: [],
        sql,
        bind(...bindings: unknown[]) {
          statement.bindings = bindings;
          return statement;
        },
      };
      return statement;
    },
  };
  return { batches, database: database as unknown as D1Database };
}

describe("attendance calculation rules", () => {
  it("publishes exactly the six approved local statuses", () => {
    expect(attendanceStatuses).toEqual([
      "present",
      "absent_excused",
      "absent_unexcused",
      "tardy_excused",
      "tardy_unexcused",
      "partial",
    ]);
  });

  it("derives consistent absence type and minutes", () => {
    expect(deriveAttendanceValues({ status: "present" })).toEqual({
      absenceType: "none",
      absentMinutes: 0,
      attendedMinutes: 360,
    });
    expect(deriveAttendanceValues({ status: "absent_excused" })).toEqual({
      absenceType: "excused",
      absentMinutes: 360,
      attendedMinutes: 0,
    });
    expect(deriveAttendanceValues({ attendedMinutes: 330, status: "tardy_unexcused" })).toEqual({
      absenceType: "unexcused",
      absentMinutes: 30,
      attendedMinutes: 330,
    });
    expect(
      deriveAttendanceValues({
        absenceType: "excused",
        attendedMinutes: 180,
        status: "partial",
      }),
    ).toEqual({ absenceType: "excused", absentMinutes: 180, attendedMinutes: 180 });
  });

  it("rejects inconsistent partial/tardy input and duplicate student rows", () => {
    const base = { attendanceDate: "2025-09-15", version: 1 };
    expect(
      attendanceBatchSchema.safeParse({
        ...base,
        records: [{ studentId: "student-001", status: "partial", version: 1 }],
      }).success,
    ).toBe(false);
    expect(
      attendanceBatchSchema.safeParse({
        ...base,
        records: [
          { studentId: "student-001", status: "present", version: 1 },
          { studentId: "student-001", status: "absent_excused", version: 1 },
        ],
      }).success,
    ).toBe(false);
  });

  it("rejects impossible normalized calendar dates", () => {
    expect(
      attendanceBatchSchema.safeParse({
        attendanceDate: "2025-02-30",
        records: [{ studentId: "student-001", status: "present", version: 1 }],
      }).success,
    ).toBe(false);
  });
});

describe("attendance atomic batch writes", () => {
  const input = {
    attendanceDate: "2025-09-15",
    records: [
      { studentId: "student-001", status: "present" as const, version: 1 },
      {
        attendedMinutes: 330,
        studentId: "student-002",
        status: "tardy_unexcused" as const,
        version: 1,
      },
    ],
  };

  it("enforces mark permission inside the attendance service", async () => {
    const fake = fakeDatabase();
    await expect(
      markAttendanceBatch(fake.database, session(["attendance.view", "attendance.export"]), input),
    ).rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });
    expect(fake.batches).toHaveLength(0);
  });

  it("writes version-guarded upserts and audits in one D1 batch", async () => {
    const fake = fakeDatabase();
    const result = await markAttendanceBatch(fake.database, session(["attendance.mark"]), input, {
      id: () => "generated-id",
      now: "2026-07-22T12:00:00.000Z",
    });

    expect(result.records).toEqual([
      { studentId: "student-001", version: 2 },
      { studentId: "student-002", version: 2 },
    ]);
    expect(fake.batches).toHaveLength(1);
    expect(
      fake.batches[0].filter((statement) => statement.sql.includes("attendance_daily")),
    ).not.toHaveLength(0);
    expect(fake.batches[0].some((statement) => statement.sql.includes("version = ?"))).toBe(true);
    expect(
      fake.batches[0].some(
        (statement) =>
          statement.sql.includes("enrollments.status = 'active'") &&
          statement.sql.includes("terms.starts_on"),
      ),
    ).toBe(true);
    expect(
      fake.batches[0].filter((statement) => statement.sql.includes("audit_events")),
    ).toHaveLength(2);
  });

  it("maps the atomic stale-version abort to a safe conflict", async () => {
    const fake = fakeDatabase({ error: new Error("D1_ERROR: invalid attendance vocabulary") });
    await expect(
      markAttendanceBatch(fake.database, session(["attendance.mark"]), input),
    ).rejects.toEqual(
      new StaffApiError(409, "VERSION_CONFLICT", "Attendance changed. Refresh and try again."),
    );
  });
});
