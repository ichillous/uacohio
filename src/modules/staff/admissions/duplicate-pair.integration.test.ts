// @vitest-environment node

import { getPlatformProxy } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { reviewDuplicateLead } from "./repository";

const integrationEnabled = process.env.LOCAL_D1_INTEGRATION === "true";

describe.runIf(integrationEnabled)("canonical duplicate lead pairs", () => {
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

  it("rejects the reverse ordering of an existing pair", async () => {
    const suffix = crypto.randomUUID();
    const firstId = `duplicate-canonical-a-${suffix}`;
    const reverseId = `duplicate-canonical-b-${suffix}`;

    try {
      await database
        .prepare(
          `INSERT INTO duplicate_candidates (id, lead_id, candidate_lead_id, signals, state)
           VALUES (?, 'lead-001', 'lead-002', '["name"]', 'pending')`,
        )
        .bind(firstId)
        .run();

      await expect(
        database
          .prepare(
            `INSERT INTO duplicate_candidates (id, lead_id, candidate_lead_id, signals, state)
             VALUES (?, 'lead-002', 'lead-001', '["name"]', 'pending')`,
          )
          .bind(reverseId)
          .run(),
      ).rejects.toThrow(/UNIQUE constraint failed/);
    } finally {
      await database
        .prepare("DELETE FROM duplicate_candidates WHERE id IN (?, ?)")
        .bind(firstId, reverseId)
        .run();
    }
  });

  it("allows only the first counterpart review and audits it once", async () => {
    const suffix = crypto.randomUUID();
    const duplicateId = `duplicate-review-${suffix}`;
    const now = "2026-07-22T14:00:00.000Z";

    try {
      await database
        .prepare(
          `INSERT INTO duplicate_candidates (id, lead_id, candidate_lead_id, signals, state)
           VALUES (?, 'lead-001', 'lead-002', '["name"]', 'pending')`,
        )
        .bind(duplicateId)
        .run();

      await reviewDuplicateLead(
        database,
        "lead-001",
        duplicateId,
        { state: "not_duplicate" },
        { actorUserId: "user-staff-003", id: () => crypto.randomUUID(), now },
      );
      await expect(
        reviewDuplicateLead(
          database,
          "lead-002",
          duplicateId,
          { state: "duplicate_confirmed" },
          { actorUserId: "user-staff-001", id: () => crypto.randomUUID(), now },
        ),
      ).rejects.toMatchObject({ code: "VERSION_CONFLICT", status: 409 });

      const persisted = await database
        .prepare("SELECT state FROM duplicate_candidates WHERE id = ?")
        .bind(duplicateId)
        .first<{ state: string }>();
      const audit = await database
        .prepare(
          `SELECT COUNT(*) AS count FROM audit_events
           WHERE target_type = 'duplicate_candidate'
             AND target_id = ?
             AND action = 'lead.duplicate.reviewed'`,
        )
        .bind(duplicateId)
        .first<{ count: number }>();

      expect(persisted?.state).toBe("not_duplicate");
      expect(Number(audit?.count)).toBe(1);
    } finally {
      await database
        .prepare(
          "DELETE FROM audit_events WHERE target_type = 'duplicate_candidate' AND target_id = ?",
        )
        .bind(duplicateId)
        .run();
      await database
        .prepare("DELETE FROM duplicate_candidates WHERE id = ?")
        .bind(duplicateId)
        .run();
    }
  });
});
