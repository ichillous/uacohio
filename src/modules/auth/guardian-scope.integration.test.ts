// @vitest-environment node

import { getPlatformProxy } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createD1GuardianScopeStore } from "./guardian-scope";

const integrationEnabled = process.env.LOCAL_D1_INTEGRATION === "true";

describe.runIf(integrationEnabled)("guardian D1 row scope", () => {
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

  it("loads both children linked to the same verified guardian account", async () => {
    const store = createD1GuardianScopeStore(database, new Date("2026-07-22T12:00:00.000Z"));

    await expect(
      store.findStudentForUser("user-guardian-001", "student-001"),
    ).resolves.toMatchObject({ id: "student-001" });
    await expect(
      store.findStudentForUser("user-guardian-001", "student-002"),
    ).resolves.toMatchObject({ id: "student-002" });
  });

  it("denies another family plus revoked and expired links in the executed SQL", async () => {
    const store = createD1GuardianScopeStore(database, new Date("2026-07-22T12:00:00.000Z"));

    await expect(store.findStudentForUser("user-guardian-001", "student-003")).resolves.toBeNull();
    await expect(store.findStudentForUser("user-guardian-001", "student-004")).resolves.toBeNull();
    await expect(store.findStudentForUser("user-staff-001", "student-001")).resolves.toBeNull();
  });

  it("loads only explicitly linked applications", async () => {
    const store = createD1GuardianScopeStore(database, new Date("2026-07-22T12:00:00.000Z"));

    await expect(
      store.findApplicationForUser("user-guardian-004", "application-004"),
    ).resolves.toMatchObject({ id: "application-004", status: "submitted" });
    await expect(
      store.findApplicationForUser("user-guardian-004", "application-005"),
    ).resolves.toBeNull();
  });

  it("rejects invalid attendance vocabulary and identifier widths at the D1 boundary", async () => {
    try {
      await expect(
        database
          .prepare(
            `INSERT INTO students (
               id, emis_student_id, local_use_id, ssid, legal_first_name, legal_last_name,
               birth_date, gender_code, race_ethnicity_code, native_language_code, status
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            "student-invalid-integration",
            "too-short",
            "also-short",
            "bad",
            "Invalid",
            "Identifier",
            "2015-01-01",
            "F",
            "05",
            "ENG",
            "active",
          )
          .run(),
      ).rejects.toThrow(/nine characters/);

      await expect(
        database
          .prepare(
            `INSERT INTO attendance_daily (
               id, student_id, attendance_date, status, absence_type,
               attended_minutes, absent_minutes, source
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            "attendance-invalid-integration",
            "student-001",
            "2026-01-02",
            "absent",
            "excused",
            0,
            360,
            "integration-test",
          )
          .run(),
      ).rejects.toThrow(/invalid attendance vocabulary/);
    } finally {
      await database
        .prepare("DELETE FROM attendance_daily WHERE id = 'attendance-invalid-integration'")
        .run();
      await database.prepare("DELETE FROM students WHERE id = 'student-invalid-integration'").run();
    }
  });
});
