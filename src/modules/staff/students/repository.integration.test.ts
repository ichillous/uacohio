// @vitest-environment node

import { getPlatformProxy } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { PortalSession } from "@/modules/auth/types";

import {
  createEnrollment,
  getStudentDetail,
  listStudents,
  updateGuardianLink,
  withdrawEnrollment,
} from "./repository";

const integrationEnabled = process.env.LOCAL_D1_INTEGRATION === "true";

const officeSession: PortalSession = {
  audience: "staff",
  permissions: ["students.view", "students.update", "enrollment.view", "enrollment.update"],
  role: "office_attendance",
  user: {
    displayName: "Dev Office Staff",
    email: "office@local.test",
    id: "user-staff-004",
    locale: "en",
  },
};

const liaisonSession: PortalSession = {
  audience: "staff",
  permissions: ["students.view_applicant_projection", "enrollment.view", "enrollment.update"],
  role: "admissions_family_liaison",
  user: {
    displayName: "Dev Liaison",
    email: "liaison@local.test",
    id: "user-staff-003",
    locale: "en",
  },
};

describe.runIf(integrationEnabled)("student record D1 projections", () => {
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

  it("searches deterministic identifiers and loads the complete authorized detail", async () => {
    const students = await listStudents(database, officeSession, { limit: 10, q: "L00000001" });
    expect(students).toHaveLength(1);
    expect(students[0]).toMatchObject({
      emisStudentId: "100000001",
      id: "student-001",
      localUseId: "L00000001",
      projection: "full",
    });
    expect(students[0]).not.toHaveProperty("ssid");

    const detail = await getStudentDetail(database, officeSession, "student-001");
    expect(detail.projection).toBe("full");
    expect(detail.student).toMatchObject({
      birthDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      emisStudentId: "100000001",
      id: "student-001",
    });
    expect(detail.student).not.toHaveProperty("ssid");
    expect(detail.guardians.length).toBeGreaterThan(0);
    expect(detail.enrollments.length).toBeGreaterThan(0);
    expect(detail.attributes.length).toBeGreaterThan(0);
  });

  it("denies liaison enrollment creation for an unrelated student without writing", async () => {
    const suffix = crypto.randomUUID();
    const enrollmentId = `enrollment-scope-${suffix}`;
    const auditId = `audit-scope-${suffix}`;
    const correlationId = `correlation-scope-${suffix}`;
    const ids = [enrollmentId, auditId, correlationId];
    try {
      await expect(
        createEnrollment(
          database,
          liaisonSession,
          "student-001",
          {
            admissionDate: "2025-09-15",
            admissionReasonCode: "1",
            attendingBuildingIrn: "012345",
            districtRelationshipCode: "1",
            effectiveStart: "2025-09-15",
            gradeLevelCode: "01",
            legalDistrictOfResidence: "043786",
            percentOfTime: 100,
            termId: "term-fall-2025",
          },
          { actorUserId: liaisonSession.user.id, id: () => ids.shift() ?? crypto.randomUUID() },
        ),
      ).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
      const persisted = await database
        .prepare("SELECT COUNT(*) AS count FROM enrollments WHERE id = ?")
        .bind(enrollmentId)
        .first<{ count: number }>();
      expect(Number(persisted?.count ?? 0)).toBe(0);
    } finally {
      await database.prepare("DELETE FROM audit_events WHERE id = ?").bind(auditId).run();
      await database.prepare("DELETE FROM enrollments WHERE id = ?").bind(enrollmentId).run();
    }
  });

  it("allows a liaison to enroll a student assigned through the owned lead", async () => {
    const suffix = crypto.randomUUID();
    const studentId = `student-assigned-${suffix}`;
    const enrollmentId = `enrollment-assigned-${suffix}`;
    const identifier = String(900_000_000 + Math.floor(Math.random() * 99_999_999));
    await database
      .prepare(
        `INSERT INTO students (
           id, prospective_student_id, emis_student_id, legal_first_name, legal_last_name,
           birth_date, gender_code, race_ethnicity_code, native_language_code, status
         ) VALUES (?, 'prospect-001', ?, 'Assigned', 'Applicant', '2018-04-12',
                   'U', '00', 'EN', 'active')`,
      )
      .bind(studentId, identifier)
      .run();
    try {
      const created = await createEnrollment(
        database,
        liaisonSession,
        studentId,
        {
          admissionDate: "2025-09-15",
          admissionReasonCode: "1",
          attendingBuildingIrn: "012345",
          districtRelationshipCode: "1",
          effectiveStart: "2025-09-15",
          gradeLevelCode: "01",
          legalDistrictOfResidence: "043786",
          percentOfTime: 100,
          termId: "term-fall-2025",
        },
        {
          actorUserId: liaisonSession.user.id,
          id: (() => {
            const ids = [
              enrollmentId,
              crypto.randomUUID(),
              crypto.randomUUID(),
              crypto.randomUUID(),
            ];
            return () => ids.shift() ?? crypto.randomUUID();
          })(),
        },
      );
      expect(created).toEqual({ id: enrollmentId });
      const persisted = await database
        .prepare("SELECT student_id AS studentId FROM enrollments WHERE id = ?")
        .bind(enrollmentId)
        .first<{ studentId: string }>();
      expect(persisted?.studentId).toBe(studentId);
    } finally {
      await database
        .prepare("DELETE FROM audit_events WHERE target_type = 'enrollment' AND target_id = ?")
        .bind(enrollmentId)
        .run();
      await database.prepare("DELETE FROM enrollments WHERE id = ?").bind(enrollmentId).run();
      await database.prepare("DELETE FROM students WHERE id = ?").bind(studentId).run();
    }
  });

  it("denies a liaison using a direct unrelated enrollment ID", async () => {
    const enrollment = await database
      .prepare(
        `SELECT status, effective_start AS effectiveStart, effective_end AS effectiveEnd,
                withdrawal_reason_code AS withdrawalReasonCode, withdrawn_to_irn AS withdrawnToIrn
           FROM enrollments WHERE id = 'enrollment-001'`,
      )
      .first<Record<string, string | null>>();
    expect(enrollment).not.toBeNull();
    const now = "2026-07-22T19:00:00.000Z";
    try {
      await expect(
        withdrawEnrollment(
          database,
          liaisonSession,
          "student-001",
          "enrollment-001",
          {
            effectiveEnd: "2025-09-15",
            expectedEffectiveStart: "2025-08-18",
            withdrawalReasonCode: "81",
          },
          { actorUserId: liaisonSession.user.id, id: () => crypto.randomUUID(), now },
        ),
      ).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
    } finally {
      await database
        .prepare(
          `UPDATE enrollments
              SET status = ?, effective_end = ?, withdrawal_reason_code = ?, withdrawn_to_irn = ?
            WHERE id = 'enrollment-001'`,
        )
        .bind(
          enrollment?.status,
          enrollment?.effectiveEnd,
          enrollment?.withdrawalReasonCode,
          enrollment?.withdrawnToIrn,
        )
        .run();
      await database
        .prepare("UPDATE students SET status = 'active' WHERE id = 'student-001'")
        .run();
      await database
        .prepare(
          `DELETE FROM audit_events
            WHERE action = 'student.enrollment.withdrawn'
              AND target_id = 'enrollment-001' AND created_at = ?`,
        )
        .bind(now)
        .run();
    }
  });

  it("rejects a stale guardian timestamp for a link-only revoke", async () => {
    const guardian = await database
      .prepare(
        `SELECT guardians.updated_at AS updatedAt,
                guardian_student_links.status,
                guardian_student_links.effective_end AS effectiveEnd
           FROM guardian_student_links
           INNER JOIN guardians ON guardians.id = guardian_student_links.guardian_id
          WHERE guardian_student_links.id = 'guardian-student-001'`,
      )
      .first<{ effectiveEnd: string | null; status: string; updatedAt: string }>();
    expect(guardian).not.toBeNull();
    const now = "2026-07-22T19:15:00.000Z";
    try {
      await expect(
        updateGuardianLink(
          database,
          officeSession,
          "student-001",
          "guardian-student-001",
          { expectedUpdatedAt: "1900-01-01T00:00:00.000Z", status: "revoked" },
          { actorUserId: officeSession.user.id, id: () => crypto.randomUUID(), now },
        ),
      ).rejects.toMatchObject({ code: "VERSION_CONFLICT", status: 409 });
    } finally {
      await database
        .prepare(
          `UPDATE guardian_student_links SET status = ?, effective_end = ?
            WHERE id = 'guardian-student-001'`,
        )
        .bind(guardian?.status, guardian?.effectiveEnd)
        .run();
      await database
        .prepare(
          `UPDATE guardians SET updated_at = ?
            WHERE id = (SELECT guardian_id FROM guardian_student_links WHERE id = 'guardian-student-001')`,
        )
        .bind(guardian?.updatedAt)
        .run();
      await database
        .prepare(
          `DELETE FROM audit_events
            WHERE action = 'student.guardian_link.updated'
              AND target_id = 'student-001' AND created_at = ?`,
        )
        .bind(now)
        .run();
    }
  });
});
