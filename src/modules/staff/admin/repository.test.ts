import { describe, expect, it } from "vitest";

import { StaffApiError } from "../shared/api";
import { replaceStaffRole } from "./repository";

type RecordedStatement = { bindings: unknown[]; sql: string };

type TargetRow = {
  audience: "guardian" | "staff";
  assignmentId: string | null;
  displayName: string;
  effectiveStart: string | null;
  roleKey: string | null;
  staffActive: number | null;
  status: "active" | "disabled";
  userId: string;
};

function roleDatabase(options: {
  activeAdminCount?: number;
  changed?: number;
  roleExists?: boolean;
  target: TargetRow;
}) {
  const batched: RecordedStatement[][] = [];
  let allCall = 0;
  let firstCall = 0;
  const database = {
    async batch(statements: RecordedStatement[]) {
      batched.push(statements);
      const changed = options.changed ?? 1;
      return statements.map((_, index) => ({
        meta: { changes: index === 0 ? changed : changed === 1 ? 1 : 0 },
        results: [],
        success: true,
      }));
    },
    prepare(sql: string) {
      const statement: RecordedStatement & {
        all: () => Promise<{ results: TargetRow[] }>;
        bind: (...bindings: unknown[]) => unknown;
        first: () => Promise<unknown>;
      } = {
        bindings: [],
        sql,
        async all() {
          allCall += 1;
          return { results: allCall === 1 ? [options.target] : [] };
        },
        bind(...bindings: unknown[]) {
          statement.bindings = bindings;
          return statement;
        },
        async first() {
          firstCall += 1;
          if (firstCall === 1)
            return options.roleExists === false ? null : { key: statement.bindings[0] };
          return { count: options.activeAdminCount ?? 2 };
        },
      };
      return statement;
    },
  };

  return { batched, database: database as unknown as D1Database };
}

const activeLiaison: TargetRow = {
  audience: "staff",
  assignmentId: "assignment-003",
  displayName: "Dev Liaison",
  effectiveStart: "2026-07-01T00:00:00.000Z",
  roleKey: "admissions_family_liaison",
  staffActive: 1,
  status: "active",
  userId: "user-staff-003",
};

describe("staff role replacement", () => {
  it("rejects guardian identities before any write", async () => {
    const fake = roleDatabase({
      target: { ...activeLiaison, audience: "guardian", roleKey: null, staffActive: null },
    });

    await expect(
      replaceStaffRole(fake.database, "user-guardian-001", "office_attendance", {
        actorUserId: "user-staff-001",
      }),
    ).rejects.toMatchObject({
      code: "INVALID_REQUEST",
      fieldErrors: { roleKey: [expect.any(String)] },
      status: 400,
    });
    expect(fake.batched).toHaveLength(0);
  });

  it("rejects disabled users and inactive staff profiles", async () => {
    for (const target of [
      { ...activeLiaison, status: "disabled" as const },
      { ...activeLiaison, staffActive: 0 },
    ]) {
      const fake = roleDatabase({ target });
      await expect(
        replaceStaffRole(fake.database, target.userId, "office_attendance", {
          actorUserId: "user-staff-001",
        }),
      ).rejects.toMatchObject({ code: "INVALID_REQUEST", status: 400 });
      expect(fake.batched).toHaveLength(0);
    }
  });

  it("prevents an administrator from removing their own administrative role", async () => {
    const fake = roleDatabase({
      target: {
        ...activeLiaison,
        assignmentId: "assignment-001",
        roleKey: "system_administrator",
        userId: "user-staff-001",
      },
    });

    await expect(
      replaceStaffRole(fake.database, "user-staff-001", "school_leadership", {
        actorUserId: "user-staff-001",
      }),
    ).rejects.toMatchObject({ code: "VERSION_CONFLICT", status: 409 });
    expect(fake.batched).toHaveLength(0);
  });

  it("preserves the final active system administrator", async () => {
    const fake = roleDatabase({
      activeAdminCount: 1,
      target: { ...activeLiaison, roleKey: "system_administrator" },
    });

    await expect(
      replaceStaffRole(fake.database, activeLiaison.userId, "school_leadership", {
        actorUserId: "user-staff-002",
      }),
    ).rejects.toMatchObject({ code: "VERSION_CONFLICT", status: 409 });
    expect(fake.batched).toHaveLength(0);
  });

  it("atomically closes the prior assignment, inserts the replacement, and writes a safe audit event", async () => {
    const fake = roleDatabase({ target: activeLiaison });

    const result = await replaceStaffRole(
      fake.database,
      activeLiaison.userId,
      "office_attendance",
      {
        actorUserId: "user-staff-001",
        id: () => "generated-id",
        now: "2026-07-22T12:00:00.000Z",
      },
    );

    expect(result).toMatchObject({ changed: true, roleKey: "office_attendance" });
    expect(fake.batched).toHaveLength(1);
    expect(fake.batched[0]).toHaveLength(3);
    expect(fake.batched[0][0].sql).toContain("UPDATE user_role_assignments");
    expect(fake.batched[0][0].sql).toContain("effective_end IS NULL");
    expect(fake.batched[0][0].sql).not.toContain("effective_end >= ?");
    expect(fake.batched[0][0].sql).toContain("users.status = 'active'");
    expect(fake.batched[0][0].bindings).toContain(activeLiaison.effectiveStart);
    expect(fake.batched[0][0].sql).toContain("remaining_assignments.role_key");
    expect(fake.batched[0][1].sql).toContain("WHERE changes() = 1");
    expect(fake.batched[0][2].sql).toContain("INSERT INTO audit_events");
    expect(fake.batched[0][2].sql).toContain("WHERE changes() = 1");
    expect(fake.batched[0][2].bindings).toContain(JSON.stringify(["role_key"]));
    expect(JSON.stringify(fake.batched[0][2].bindings)).not.toContain("admissions_family_liaison");
    expect(JSON.stringify(fake.batched[0][2].bindings)).not.toContain("office_attendance");
  });

  it("maps a lost concurrent update to a conflict without claiming success", async () => {
    const fake = roleDatabase({ changed: 0, target: activeLiaison });
    await expect(
      replaceStaffRole(fake.database, activeLiaison.userId, "office_attendance", {
        actorUserId: "user-staff-001",
      }),
    ).rejects.toEqual(
      new StaffApiError(
        409,
        "VERSION_CONFLICT",
        "This role assignment changed. Refresh and try again.",
      ),
    );
    expect(fake.batched[0][1].sql).toContain("WHERE changes() = 1");
    expect(fake.batched[0][2].sql).toContain("WHERE changes() = 1");
  });

  it("rejects a replacement timestamp that does not follow the current open assignment", async () => {
    const fake = roleDatabase({
      target: { ...activeLiaison, effectiveStart: "2026-07-22T18:00:00.000Z" },
    });

    await expect(
      replaceStaffRole(fake.database, activeLiaison.userId, "office_attendance", {
        actorUserId: "user-staff-001",
        now: "2026-07-22T17:00:00.000Z",
      }),
    ).rejects.toMatchObject({ code: "VERSION_CONFLICT", status: 409 });
    expect(fake.batched).toHaveLength(0);
  });

  it("normalizes offset mutation timestamps before writing assignment chronology", async () => {
    const fake = roleDatabase({ target: activeLiaison });

    await replaceStaffRole(fake.database, activeLiaison.userId, "office_attendance", {
      actorUserId: "user-staff-001",
      now: "2026-07-22T08:00:00-04:00",
    });

    expect(fake.batched[0][0].bindings[0]).toBe("2026-07-22T11:59:59.999Z");
    expect(fake.batched[0][1].bindings).toContain("2026-07-22T12:00:00.000Z");
  });
});
