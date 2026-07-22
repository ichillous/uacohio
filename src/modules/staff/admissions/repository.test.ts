import { describe, expect, it } from "vitest";

import { StaffApiError } from "../shared/api";
import { flagDuplicateLead, listLeads, reviewDuplicateLead, transitionLead } from "./repository";

type RecordedStatement = { bindings: unknown[]; sql: string };

function fakeDatabase(options?: { changed?: number; version?: number }) {
  const statements: RecordedStatement[] = [];
  const batched: RecordedStatement[][] = [];

  const database = {
    batch: async (batchStatements: RecordedStatement[]) => {
      batched.push(batchStatements);
      return batchStatements.map((_, index) => ({
        meta: { changes: index === 0 ? (options?.changed ?? 1) : 1 },
        results: [],
        success: true,
      }));
    },
    prepare: (sql: string) => {
      const statement: RecordedStatement & {
        bind: (...bindings: unknown[]) => unknown;
        first: () => Promise<unknown>;
      } = {
        bindings: [],
        sql,
        bind(...bindings: unknown[]) {
          statement.bindings = bindings;
          statements.push(statement);
          return statement;
        },
        first: async () => ({ id: "lead-001", stage: "inquiry", version: options?.version ?? 1 }),
      };
      return statement;
    },
  };

  return { batched, database: database as unknown as D1Database, statements };
}

describe("lead transition persistence", () => {
  it("atomically updates the version and writes history, activity, and audit rows", async () => {
    const { batched, database } = fakeDatabase();

    const result = await transitionLead(
      database,
      "lead-001",
      { reason: "Family completed first call", toStage: "contacted", version: 1 },
      { actorUserId: "user-staff-003", id: () => "generated-id", now: "2025-09-16T12:00:00.000Z" },
    );

    expect(result).toMatchObject({ id: "lead-001", stage: "contacted", version: 2 });
    expect(batched).toHaveLength(1);
    expect(batched[0]).toHaveLength(4);
    expect(batched[0][0].sql).toContain("version = version + 1");
    expect(batched[0][0].sql).toContain("WHERE id = ? AND version = ? AND stage = ?");
    expect(batched[0][1].sql).toContain("lead_stage_history");
    expect(batched[0][2].sql).toContain("lead_activities");
    expect(batched[0][3].sql).toContain("audit_events");
  });

  it("rejects stale optimistic versions before writing", async () => {
    const { batched, database } = fakeDatabase({ version: 2 });

    await expect(
      transitionLead(
        database,
        "lead-001",
        { toStage: "contacted", version: 1 },
        {
          actorUserId: "user-staff-003",
          id: () => "generated-id",
          now: "2025-09-16T12:00:00.000Z",
        },
      ),
    ).rejects.toEqual(
      new StaffApiError(409, "VERSION_CONFLICT", "This lead changed. Refresh and try again."),
    );
    expect(batched).toHaveLength(0);
  });

  it("rejects non-adjacent transitions", async () => {
    const { database } = fakeDatabase();

    await expect(
      transitionLead(
        database,
        "lead-001",
        { toStage: "applied", version: 1 },
        {
          actorUserId: "user-staff-003",
          id: () => "generated-id",
          now: "2025-09-16T12:00:00.000Z",
        },
      ),
    ).rejects.toMatchObject({ code: "INVALID_TRANSITION", status: 422 });
  });
});

describe("duplicate review projection", () => {
  const rawLead = {
    campaign: null,
    duplicateCount: 1,
    dueAt: null,
    familyId: "family-001",
    firstName: "Applicant001",
    gradeInterest: "01",
    id: "lead-001",
    lastActivityAt: null,
    lastName: "Family001",
    openFollowUps: 0,
    ownerName: "Dev Liaison",
    pendingDuplicatesJson:
      '[{"id":"duplicate-001","candidateLeadId":"lead-002","signals":["name"]}]',
    preferredLocale: "en",
    source: "website",
    stage: "inquiry",
    updatedAt: "2025-09-15T00:00:00.000Z",
    version: 1,
  };

  function listDatabase() {
    let sql = "";
    const database = {
      prepare(value: string) {
        sql = value;
        return {
          bind() {
            return this;
          },
          async all() {
            return { results: [{ ...rawLead }], success: true };
          },
        };
      },
    } as unknown as D1Database;
    return { database, sql: () => sql };
  }

  it("omits duplicate identifiers and signals without the review projection", async () => {
    const fake = listDatabase();
    const leads = await listLeads(fake.database, { limit: 10 });

    expect(fake.sql()).not.toContain("json_object");
    expect(leads[0]).toMatchObject({ duplicateCount: 1, pendingDuplicates: [] });
    expect(JSON.stringify(leads[0])).not.toContain("duplicate-001");
    expect(JSON.stringify(leads[0])).not.toContain("lead-002");
    expect(JSON.stringify(leads[0])).not.toContain("signals");
  });

  it("projects review details only when explicitly authorized", async () => {
    const fake = listDatabase();
    const leads = await listLeads(fake.database, { limit: 10 }, { includeDuplicateDetails: true });

    expect(fake.sql()).toContain("json_object");
    expect(leads[0].pendingDuplicates).toEqual([
      { candidateLeadId: "lead-002", id: "duplicate-001", signals: ["name"] },
    ]);
  });
});

describe("duplicate resolution concurrency", () => {
  function reviewDatabase(changed: number) {
    const batched: RecordedStatement[][] = [];
    const database = {
      batch: async (statements: RecordedStatement[]) => {
        batched.push(statements);
        return statements.map((_, index) => ({
          meta: { changes: index === 0 ? changed : changed },
          results: [],
          success: true,
        }));
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
    return { batched, database: database as unknown as D1Database };
  }

  it("resolves only pending rows and gates the audit insert on the successful update", async () => {
    const fake = reviewDatabase(1);
    await reviewDuplicateLead(
      fake.database,
      "lead-001",
      "duplicate-001",
      { state: "not_duplicate" },
      { actorUserId: "user-staff-003", id: () => "generated-id", now: "2026-07-22T12:00:00.000Z" },
    );

    expect(fake.batched[0][0].sql).toContain("state = 'pending'");
    expect(fake.batched[0][0].sql).toContain("lead_id = ? OR candidate_lead_id = ?");
    expect(fake.batched[0][1].sql).toContain("changes() = 1");
  });

  it("returns conflict when a counterpart already resolved the review", async () => {
    const fake = reviewDatabase(0);
    await expect(
      reviewDuplicateLead(
        fake.database,
        "lead-002",
        "duplicate-001",
        { state: "duplicate_confirmed" },
        {
          actorUserId: "user-staff-003",
          id: () => "generated-id",
          now: "2026-07-22T12:00:00.000Z",
        },
      ),
    ).rejects.toMatchObject({ code: "VERSION_CONFLICT", status: 409 });
  });
});

describe("duplicate flag concurrency", () => {
  it("maps a canonical-pair unique-index race to a safe conflict", async () => {
    let read = 0;
    const database = {
      async batch() {
        throw new Error(
          "D1_ERROR: UNIQUE constraint failed: index 'duplicate_candidates_canonical_pair_unique'",
        );
      },
      prepare() {
        return {
          bind() {
            return this;
          },
          async first() {
            read += 1;
            return read <= 2 ? { id: `lead-00${read}`, stage: "inquiry", version: 1 } : null;
          },
        };
      },
    } as unknown as D1Database;

    await expect(
      flagDuplicateLead(
        database,
        "lead-001",
        { candidateLeadId: "lead-002", signals: ["name"] },
        { actorUserId: "user-staff-003", id: () => "generated-id" },
      ),
    ).rejects.toMatchObject({
      code: "VERSION_CONFLICT",
      message: "These leads are already under review.",
      status: 409,
    });
  });
});
