import { describe, expect, it } from "vitest";

import {
  activitySchema,
  allowedLeadTransitions,
  flagDuplicateSchema,
  followUpSchema,
  isAllowedLeadTransition,
  leadStages,
  reviewDuplicateSchema,
  transitionLeadSchema,
} from "./stages";

describe("admissions pipeline stages", () => {
  it("publishes every approved pipeline stage in business order", () => {
    expect(leadStages).toEqual([
      "inquiry",
      "contacted",
      "toured",
      "applied",
      "enrolled",
      "closed_not_proceeding",
    ]);
  });

  it("allows only adjacent forward moves or closing an active lead", () => {
    expect(allowedLeadTransitions.inquiry).toEqual(["contacted", "closed_not_proceeding"]);
    expect(isAllowedLeadTransition("contacted", "toured")).toBe(true);
    expect(isAllowedLeadTransition("contacted", "applied")).toBe(false);
    expect(isAllowedLeadTransition("enrolled", "contacted")).toBe(false);
    expect(isAllowedLeadTransition("closed_not_proceeding", "inquiry")).toBe(false);
  });

  it("requires a positive optimistic version and a valid target", () => {
    expect(
      transitionLeadSchema.safeParse({ toStage: "contacted", version: 2, reason: "Reached family" })
        .success,
    ).toBe(true);
    expect(transitionLeadSchema.safeParse({ toStage: "applied", version: 0 }).success).toBe(false);
    expect(transitionLeadSchema.safeParse({ toStage: "unknown", version: 1 }).success).toBe(false);
  });

  it("rejects markup in safe activity notes", () => {
    expect(
      activitySchema.safeParse({
        safeNote: "Family requested an Arabic-language call back.",
        type: "call",
      }).success,
    ).toBe(true);
    expect(
      activitySchema.safeParse({
        safeNote: '<img src=x onerror="alert(1)">',
        type: "note",
      }).success,
    ).toBe(false);
    expect(
      activitySchema.safeParse({ safeNote: "Use <script>later</script>", type: "note" }).success,
    ).toBe(false);
  });

  it("validates follow-up timestamps and bounded outcomes", () => {
    expect(followUpSchema.safeParse({ dueAt: "2026-08-01T14:00:00.000Z" }).success).toBe(true);
    expect(followUpSchema.safeParse({ dueAt: "tomorrow" }).success).toBe(false);
    expect(
      followUpSchema.safeParse({
        dueAt: "2026-08-01T14:00:00.000Z",
        outcome: "x".repeat(161),
      }).success,
    ).toBe(false);
  });

  it("requires approved duplicate signals and final review states", () => {
    expect(
      flagDuplicateSchema.safeParse({ candidateLeadId: "lead-002", signals: ["name", "phone"] })
        .success,
    ).toBe(true);
    expect(
      flagDuplicateSchema.safeParse({ candidateLeadId: "lead-002", signals: [] }).success,
    ).toBe(false);
    expect(
      flagDuplicateSchema.safeParse({ candidateLeadId: "lead-002", signals: ["ssid"] }).success,
    ).toBe(false);
    expect(reviewDuplicateSchema.safeParse({ state: "pending" }).success).toBe(false);
  });
});
