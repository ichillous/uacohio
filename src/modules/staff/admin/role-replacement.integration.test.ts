// @vitest-environment node

import { getPlatformProxy } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { replaceStaffRole } from "./repository";

const integrationEnabled = process.env.LOCAL_D1_INTEGRATION === "true";

describe.runIf(integrationEnabled)("D1 staff role replacement", () => {
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

  async function createStaff(userId: string, roleKey: string) {
    await database.batch([
      database
        .prepare(
          `INSERT INTO users
             (id, audience, display_name, normalized_email, locale, status)
           VALUES (?, 'staff', 'Temporary Admin Test', ?, 'en', 'active')`,
        )
        .bind(userId, `${userId}@example.test`),
      database
        .prepare("INSERT INTO staff_profiles (user_id, title, active) VALUES (?, 'Test', 1)")
        .bind(userId),
      database
        .prepare(
          `INSERT INTO user_role_assignments
             (id, user_id, role_key, assigned_by_user_id, effective_start)
           VALUES (?, ?, ?, 'user-staff-001', '2026-07-01T00:00:00.000Z')`,
        )
        .bind(`assignment-${userId}`, userId, roleKey),
    ]);
  }

  async function cleanupStaff(...userIds: string[]) {
    for (const userId of userIds) {
      await database
        .prepare("DELETE FROM audit_events WHERE target_type = 'user' AND target_id = ?")
        .bind(userId)
        .run();
      await database.prepare("DELETE FROM users WHERE id = ?").bind(userId).run();
    }
  }

  function databaseWithBatchBarrier(participants: number): D1Database {
    let arrived = 0;
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    return {
      batch: async <T = unknown>(statements: D1PreparedStatement[]) => {
        arrived += 1;
        if (arrived === participants) release();
        await gate;
        return database.batch<T>(statements);
      },
      prepare: (query: string) => database.prepare(query),
    } as D1Database;
  }

  it("commits one replacement and its privacy-safe audit event together", async () => {
    const suffix = crypto.randomUUID();
    const userId = `user-admin-test-${suffix}`;
    const now = "2026-07-22T18:00:00.000Z";

    try {
      await createStaff(userId, "admissions_family_liaison");

      await replaceStaffRole(database, userId, "office_attendance", {
        actorUserId: "user-staff-001",
        id: () => crypto.randomUUID(),
        now,
      });

      const active = await database
        .prepare(
          `SELECT role_key AS roleKey
           FROM user_role_assignments
           WHERE user_id = ?
             AND effective_start <= ?
             AND (effective_end IS NULL OR effective_end >= ?)`,
        )
        .bind(userId, now, now)
        .all<{ roleKey: string }>();
      const audit = await database
        .prepare(
          `SELECT action, changed_fields AS changedFields
           FROM audit_events
           WHERE target_type = 'user' AND target_id = ?`,
        )
        .bind(userId)
        .all<{ action: string; changedFields: string }>();

      expect(active.results).toEqual([{ roleKey: "office_attendance" }]);
      expect(audit.results).toEqual([
        {
          action: "identity.staff_role.replaced",
          changedFields: JSON.stringify(["role_key"]),
        },
      ]);
      expect(JSON.stringify(audit.results)).not.toContain("admissions_family_liaison");
      expect(JSON.stringify(audit.results)).not.toContain("office_attendance");
    } finally {
      await cleanupStaff(userId);
    }
  });

  it("rejects a reverse-timestamp sequential replacement without changing the open role", async () => {
    const userId = `user-admin-reverse-${crypto.randomUUID()}`;
    try {
      await createStaff(userId, "admissions_family_liaison");
      await replaceStaffRole(database, userId, "office_attendance", {
        actorUserId: "user-staff-001",
        now: "2026-07-22T18:00:00.000Z",
      });

      await expect(
        replaceStaffRole(database, userId, "marketing_outreach", {
          actorUserId: "user-staff-001",
          now: "2026-07-22T17:00:00.000Z",
        }),
      ).rejects.toMatchObject({ code: "VERSION_CONFLICT", status: 409 });

      const open = await database
        .prepare(
          `SELECT role_key AS roleKey
           FROM user_role_assignments
           WHERE user_id = ? AND effective_end IS NULL`,
        )
        .bind(userId)
        .all<{ roleKey: string }>();
      const counts = await database
        .prepare(
          `SELECT
             (SELECT COUNT(*) FROM user_role_assignments WHERE user_id = ?) AS assignments,
             (SELECT COUNT(*) FROM audit_events WHERE target_type = 'user' AND target_id = ?) AS audits`,
        )
        .bind(userId, userId)
        .first<{ assignments: number; audits: number }>();

      expect(open.results).toEqual([{ roleKey: "office_attendance" }]);
      expect(Number(counts?.assignments)).toBe(2);
      expect(Number(counts?.audits)).toBe(1);
    } finally {
      await cleanupStaff(userId);
    }
  });

  it("allows only one same-target concurrent replacement and rolls back the conflict", async () => {
    const userId = `user-admin-concurrent-${crypto.randomUUID()}`;
    try {
      await createStaff(userId, "admissions_family_liaison");
      const racingDatabase = databaseWithBatchBarrier(2);
      const outcomes = await Promise.allSettled([
        replaceStaffRole(racingDatabase, userId, "office_attendance", {
          actorUserId: "user-staff-001",
          now: "2026-07-22T18:00:00.000Z",
        }),
        replaceStaffRole(racingDatabase, userId, "marketing_outreach", {
          actorUserId: "user-staff-001",
          now: "2026-07-22T17:00:00.000Z",
        }),
      ]);

      expect(outcomes.filter((result) => result.status === "fulfilled")).toHaveLength(1);
      expect(outcomes.filter((result) => result.status === "rejected")).toHaveLength(1);
      expect(outcomes.find((result) => result.status === "rejected")).toMatchObject({
        reason: { code: "VERSION_CONFLICT", status: 409 },
      });

      const counts = await database
        .prepare(
          `SELECT
             (SELECT COUNT(*) FROM user_role_assignments
               WHERE user_id = ? AND effective_end IS NULL) AS openAssignments,
             (SELECT COUNT(*) FROM user_role_assignments WHERE user_id = ?) AS assignments,
             (SELECT COUNT(*) FROM audit_events WHERE target_type = 'user' AND target_id = ?) AS audits`,
        )
        .bind(userId, userId, userId)
        .first<{ assignments: number; audits: number; openAssignments: number }>();
      expect(Number(counts?.openAssignments)).toBe(1);
      expect(Number(counts?.assignments)).toBe(2);
      expect(Number(counts?.audits)).toBe(1);
    } finally {
      await cleanupStaff(userId);
    }
  });

  it("preserves one active administrator when two administrators are demoted concurrently", async () => {
    const firstUserId = `user-admin-race-a-${crypto.randomUUID()}`;
    const secondUserId = `user-admin-race-b-${crypto.randomUUID()}`;
    try {
      await createStaff(firstUserId, "system_administrator");
      await createStaff(secondUserId, "system_administrator");
      await database
        .prepare("UPDATE users SET status = 'disabled' WHERE id = 'user-staff-001'")
        .run();

      const racingDatabase = databaseWithBatchBarrier(2);
      const outcomes = await Promise.allSettled([
        replaceStaffRole(racingDatabase, firstUserId, "school_leadership", {
          actorUserId: "user-staff-002",
          now: "2026-07-22T18:00:00.000Z",
        }),
        replaceStaffRole(racingDatabase, secondUserId, "school_leadership", {
          actorUserId: "user-staff-002",
          now: "2026-07-22T18:00:00.000Z",
        }),
      ]);

      expect(outcomes.filter((result) => result.status === "fulfilled")).toHaveLength(1);
      expect(outcomes.filter((result) => result.status === "rejected")).toHaveLength(1);
      const administrators = await database
        .prepare(
          `SELECT COUNT(*) AS count
           FROM user_role_assignments
           INNER JOIN users ON users.id = user_role_assignments.user_id
           INNER JOIN staff_profiles ON staff_profiles.user_id = users.id
           WHERE user_role_assignments.role_key = 'system_administrator'
             AND user_role_assignments.effective_end IS NULL
             AND users.status = 'active'
             AND staff_profiles.active = 1`,
        )
        .first<{ count: number }>();
      expect(Number(administrators?.count)).toBe(1);
    } finally {
      await database
        .prepare("UPDATE users SET status = 'active' WHERE id = 'user-staff-001'")
        .run();
      await cleanupStaff(firstUserId, secondUserId);
    }
  });

  it("rejects an inactive-target race without closing the role or writing an audit event", async () => {
    const userId = `user-admin-inactive-${crypto.randomUUID()}`;
    try {
      await createStaff(userId, "admissions_family_liaison");
      const racingDatabase = {
        batch: async <T = unknown>(statements: D1PreparedStatement[]) => {
          await database
            .prepare("UPDATE users SET status = 'disabled' WHERE id = ?")
            .bind(userId)
            .run();
          return database.batch<T>(statements);
        },
        prepare: (query: string) => database.prepare(query),
      } as D1Database;

      await expect(
        replaceStaffRole(racingDatabase, userId, "office_attendance", {
          actorUserId: "user-staff-001",
          now: "2026-07-22T18:00:00.000Z",
        }),
      ).rejects.toMatchObject({ code: "VERSION_CONFLICT", status: 409 });

      const state = await database
        .prepare(
          `SELECT
             (SELECT COUNT(*) FROM user_role_assignments
               WHERE user_id = ? AND role_key = 'admissions_family_liaison'
                 AND effective_end IS NULL) AS openOriginal,
             (SELECT COUNT(*) FROM audit_events
               WHERE target_type = 'user' AND target_id = ?) AS audits`,
        )
        .bind(userId, userId)
        .first<{ audits: number; openOriginal: number }>();
      expect(Number(state?.openOriginal)).toBe(1);
      expect(Number(state?.audits)).toBe(0);
    } finally {
      await cleanupStaff(userId);
    }
  });
});
