import { describe, expect, it } from "vitest";

import type { LeadSummary } from "./repository";
import { clearResolvedDuplicate } from "./lead-state";

function lead(id: string, candidateLeadId: string): LeadSummary {
  return {
    campaign: null,
    duplicateCount: 1,
    dueAt: null,
    familyId: `family-${id}`,
    firstName: id,
    gradeInterest: "01",
    id,
    lastActivityAt: null,
    lastName: null,
    openFollowUps: 0,
    ownerName: null,
    pendingDuplicates: [{ candidateLeadId, id: "duplicate-001", signals: ["name"] }],
    preferredLocale: "en",
    source: "website",
    stage: "inquiry",
    updatedAt: "2026-07-22T00:00:00.000Z",
    version: 1,
  };
}

describe("duplicate lead-card state", () => {
  it("clears a resolved pair from both affected lead cards", () => {
    const unrelated = { ...lead("lead-003", "lead-004"), duplicateCount: 2 };
    const result = clearResolvedDuplicate(
      [lead("lead-001", "lead-002"), lead("lead-002", "lead-001"), unrelated],
      "duplicate-001",
      "lead-001",
      "lead-002",
    );

    expect(result[0]).toMatchObject({ duplicateCount: 0, pendingDuplicates: [] });
    expect(result[1]).toMatchObject({ duplicateCount: 0, pendingDuplicates: [] });
    expect(result[2]).toEqual(unrelated);
  });

  it("does not decrement unrelated reviews on either card", () => {
    const first = {
      ...lead("lead-001", "lead-002"),
      duplicateCount: 2,
      pendingDuplicates: [
        { candidateLeadId: "lead-002", id: "duplicate-001", signals: ["name"] },
        { candidateLeadId: "lead-005", id: "duplicate-002", signals: ["phone"] },
      ],
    };
    const result = clearResolvedDuplicate(
      [first, lead("lead-002", "lead-001")],
      "duplicate-001",
      "lead-001",
      "lead-002",
    );

    expect(result[0].duplicateCount).toBe(1);
    expect(result[0].pendingDuplicates).toEqual([
      { candidateLeadId: "lead-005", id: "duplicate-002", signals: ["phone"] },
    ]);
  });
});
