import { describe, expect, it } from "vitest";

import type { PortalSession, StaffRole } from "@/modules/auth/types";

import { getAuditAccess, listAuditEvents } from "./audit";

function session(role: StaffRole, permissions: PortalSession["permissions"]): PortalSession {
  return {
    audience: "staff",
    permissions,
    role,
    user: { displayName: "Staff", email: null, id: "user-staff", locale: "en" },
  };
}

function auditDatabase(targetType = "lead") {
  let sql = "";
  let bindings: unknown[] = [];
  const database = {
    prepare(value: string) {
      sql = value;
      return {
        async all() {
          return {
            results: [
              {
                action: "lead.activity.created",
                actorAudience: "staff",
                actorDisplayName: "Dev Liaison",
                actorUserId: "user-staff-003",
                changedFields: '["activity_type","next_action_at"]',
                correlationId: "correlation-safe",
                createdAt: "2026-07-22T12:00:00.000Z",
                id: "audit-001",
                outcome: "success",
                targetId: "lead-001",
                targetType,
              },
            ],
          };
        },
        bind(...values: unknown[]) {
          bindings = values;
          return this;
        },
      };
    },
  } as unknown as D1Database;
  return { bindings: () => bindings, database, sql: () => sql };
}

describe("audit access scope", () => {
  it("gives audit.view a global approved projection", async () => {
    const fake = auditDatabase();
    const administrator = session("system_administrator", ["audit.view"]);
    const result = await listAuditEvents(fake.database, administrator, { limit: 25 });

    expect(result.scope).toEqual({ kind: "global", modules: expect.any(Array) });
    expect(fake.sql()).not.toContain("target_type IN");
    expect(result.events[0]).toEqual({
      action: "lead.activity.created",
      actor: { audience: "staff", displayName: "Dev Liaison", userId: "user-staff-003" },
      changedFields: ["activity_type", "next_action_at"],
      correlationId: "correlation-safe",
      createdAt: "2026-07-22T12:00:00.000Z",
      id: "audit-001",
      module: "admissions",
      outcome: "success",
      target: { id: "lead-001", type: "lead" },
    });
    expect(JSON.stringify(result)).not.toMatch(/body|payload|safeNote|email/i);
  });

  it("enforces a server-owned module allowlist for audit.view_module", async () => {
    const fake = auditDatabase();
    const liaison = session("admissions_family_liaison", ["audit.view_module"]);
    const access = getAuditAccess(liaison);

    expect(access).toEqual({ kind: "module", modules: ["admissions", "notifications"] });
    await listAuditEvents(fake.database, liaison, { limit: 25, module: "admissions" });
    expect(fake.sql()).toContain("target_type IN");
    expect(fake.bindings()).toEqual(expect.arrayContaining(["lead", "duplicate_candidate", 25]));
    expect(fake.bindings()).not.toContain("student");
  });

  it("denies module filters outside the caller's role allowlist", async () => {
    const liaison = session("admissions_family_liaison", ["audit.view_module"]);
    await expect(
      listAuditEvents(auditDatabase().database, liaison, {
        limit: 25,
        module: "student_operations",
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });
  });

  it("denies roles with neither audit permission", () => {
    expect(() => getAuditAccess(session("marketing_outreach", []))).toThrowError(
      "Access is forbidden.",
    );
  });

  it("classifies and scopes the actual attendance_daily audit target", async () => {
    const office = session("office_attendance", ["audit.view_module"]);
    const fake = auditDatabase("attendance_daily");
    const result = await listAuditEvents(fake.database, office, {
      limit: 25,
      module: "student_operations",
    });

    expect(result.events[0].module).toBe("student_operations");
    expect(fake.bindings()).toContain("attendance_daily");
  });
});
