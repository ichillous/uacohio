// @vitest-environment node

import { getPlatformProxy } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const integrationEnabled = process.env.LOCAL_D1_INTEGRATION === "true";

describe.runIf(integrationEnabled)("Phase 3 D1 invariants", () => {
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

  it("rejects unsupported lead stages and non-positive versions", async () => {
    await expect(
      database
        .prepare(
          `INSERT INTO leads (
             id, family_id, prospective_student_id, stage, source, preferred_locale, version
           ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          "lead-invalid-integration",
          "family-001",
          "prospect-001",
          "waitlisted",
          "integration-test",
          "en",
          0,
        )
        .run(),
    ).rejects.toThrow(/invalid lead stage or version/);
  });

  it("rejects self-referential duplicate candidates", async () => {
    await expect(
      database
        .prepare(
          `INSERT INTO duplicate_candidates (
             id, lead_id, candidate_lead_id, signals, state
           ) VALUES (?, ?, ?, ?, ?)`,
        )
        .bind("duplicate-invalid-integration", "lead-001", "lead-001", "[]", "pending")
        .run(),
    ).rejects.toThrow(/must be distinct/);
  });

  it("requires exactly one identity for every thread participant", async () => {
    await expect(
      database
        .prepare(
          `INSERT INTO thread_participants (
             id, thread_id, staff_user_id, guardian_id, status
           ) VALUES (?, ?, ?, ?, ?)`,
        )
        .bind("participant-invalid-integration", "thread-missing", null, null, "active")
        .run(),
    ).rejects.toThrow(/exactly one identity/);
  });

  it("prevents assigning staff roles to guardian accounts", async () => {
    await expect(
      database
        .prepare(
          `INSERT INTO user_role_assignments (
             id, user_id, role_key, assigned_by_user_id, effective_start
           ) VALUES (?, ?, ?, ?, ?)`,
        )
        .bind(
          "assignment-invalid-integration",
          "user-guardian-001",
          "system_administrator",
          "user-staff-001",
          "2026-07-22T12:00:00.000Z",
        )
        .run(),
    ).rejects.toThrow(/active staff user/);
  });
});
