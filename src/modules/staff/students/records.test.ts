import { describe, expect, it } from "vitest";

import type { PortalSession } from "@/modules/auth/types";

import { StaffApiError } from "../shared/api";
import { createStudent, listStudents, updateGuardianLink, updateStudent } from "./repository";
import { createStudentSchema, updateStudentSchema, withdrawEnrollmentSchema } from "./schemas";

type RecordedStatement = { bindings: unknown[]; sql: string };

function session(
  permissions: PortalSession["permissions"],
  role: PortalSession["role"] = "office_attendance",
): PortalSession {
  return {
    audience: "staff",
    permissions,
    role,
    user: { displayName: "Test Staff", email: "staff@example.test", id: "staff-1", locale: "en" },
  };
}

function fakeDatabase(options?: { changed?: number; rows?: Record<string, unknown>[] }) {
  const statements: RecordedStatement[] = [];
  const batches: RecordedStatement[][] = [];
  const database = {
    async batch(batch: RecordedStatement[]) {
      batches.push(batch);
      return batch.map((_, index) => ({
        meta: { changes: index === 0 ? (options?.changed ?? 1) : 1 },
        results: [],
        success: true,
      }));
    },
    prepare(sql: string) {
      const statement: RecordedStatement & {
        all: () => Promise<{ results: Record<string, unknown>[]; success: true }>;
        bind: (...bindings: unknown[]) => unknown;
      } = {
        bindings: [],
        sql,
        async all() {
          return { results: options?.rows ?? [], success: true };
        },
        bind(...bindings: unknown[]) {
          statement.bindings = bindings;
          statements.push(statement);
          return statement;
        },
      };
      return statement;
    },
  };
  return { batches, database: database as unknown as D1Database, statements };
}

const validStudent = {
  birthDate: "2018-04-12",
  emisStudentId: "100000999",
  genderCode: "M",
  homeLanguageCode: "EN",
  legalFirstName: "Amina",
  legalLastName: "Test",
  localUseId: "L00000999",
  nativeLanguageCode: "EN",
  raceEthnicityCode: "05",
  ssid: "200000999",
  status: "active" as const,
};

describe("student record validation", () => {
  it("accepts bounded EMIS-aligned fields and rejects malformed identifiers", () => {
    expect(createStudentSchema.safeParse(validStudent).success).toBe(true);
    expect(createStudentSchema.safeParse({ ...validStudent, ssid: "123" }).success).toBe(false);
    expect(
      createStudentSchema.safeParse({ ...validStudent, birthDate: "04/12/2018" }).success,
    ).toBe(false);
  });

  it("requires an optimistic timestamp for updates", () => {
    expect(
      updateStudentSchema.safeParse({ legalFirstName: "Amira", updatedAt: "2026-07-22 12:00:00" })
        .success,
    ).toBe(true);
    expect(updateStudentSchema.safeParse({ legalFirstName: "Amira" }).success).toBe(false);
  });

  it("rejects normalized impossible dates and backward withdrawals", () => {
    expect(
      createStudentSchema.safeParse({ ...validStudent, birthDate: "2025-02-30" }).success,
    ).toBe(false);
    expect(
      withdrawEnrollmentSchema.safeParse({
        effectiveEnd: "2025-08-17",
        expectedEffectiveStart: "2025-08-18",
        withdrawalReasonCode: "81",
      }).success,
    ).toBe(false);
  });
});

describe("student projections and permissions", () => {
  it("keeps SSID out of every directory projection", async () => {
    const full = fakeDatabase();
    await listStudents(full.database, session(["students.view"]), { limit: 25, q: "100000999" });
    expect(full.statements[0].sql).toContain("students.emis_student_id AS emisStudentId");
    expect(full.statements[0].sql).not.toContain("students.ssid");

    const applicant = fakeDatabase();
    await listStudents(
      applicant.database,
      session(["students.view_applicant_projection"], "admissions_family_liaison"),
      { limit: 25, q: "Amina" },
    );
    expect(applicant.statements[0].sql).not.toContain(" AS ssid");
    expect(applicant.statements[0].sql).not.toContain(" AS emisStudentId");
    expect(applicant.statements[0].sql).toContain("leads.owner_user_id = ?");
  });

  it("enforces write permission inside the repository", async () => {
    const fake = fakeDatabase();
    await expect(
      createStudent(fake.database, session(["students.view"], "school_leadership"), validStudent),
    ).rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });
    expect(fake.batches).toHaveLength(0);
  });
});

describe("student sensitive writes", () => {
  it("creates the student and privacy-safe audit event in one batch", async () => {
    const fake = fakeDatabase();
    const result = await createStudent(fake.database, session(["students.create"]), validStudent, {
      id: () => "generated-id",
      now: "2026-07-22T12:00:00.000Z",
    });

    expect(result).toEqual({ id: "generated-id" });
    expect(fake.batches[0]).toHaveLength(2);
    expect(fake.batches[0][0].sql).toContain("INSERT INTO students");
    expect(fake.batches[0][1].sql).toContain("INSERT INTO audit_events");
    expect(fake.batches[0][1].bindings).not.toContain(validStudent.birthDate);
    expect(fake.batches[0][1].bindings).not.toContain(validStudent.ssid);
  });

  it("returns a conflict when an optimistic update changes no row", async () => {
    const fake = fakeDatabase({ changed: 0 });
    await expect(
      updateStudent(
        fake.database,
        session(["students.update"]),
        "student-001",
        { legalFirstName: "Amira", updatedAt: "2026-07-22 12:00:00" },
        { id: () => "generated-id", now: "2026-07-22T12:30:00.000Z" },
      ),
    ).rejects.toEqual(
      new StaffApiError(409, "VERSION_CONFLICT", "This student changed. Refresh and try again."),
    );
    expect(fake.batches[0][0].sql).toContain("updated_at = ?");
  });

  it("advances the guardian aggregate timestamp before a link-only update", async () => {
    const fake = fakeDatabase();
    await updateGuardianLink(
      fake.database,
      session(["students.update"]),
      "student-001",
      "guardian-student-001",
      { expectedUpdatedAt: "2026-07-22 12:00:00", receivesContact: false },
      { id: () => "generated-id", now: "2026-07-22T12:30:00.000Z" },
    );

    expect(fake.batches[0][0].sql).toContain("UPDATE guardians");
    expect(fake.batches[0][0].sql).toContain("updated_at = ?");
    expect(fake.batches[0][0].sql).toContain("guardian_student_links");
    expect(
      fake.batches[0].some((statement) => statement.sql.includes("UPDATE guardian_student_links")),
    ).toBe(true);
  });
});
