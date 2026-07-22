import { describe, expect, it } from "vitest";

import { fieldErrorsFromIssues } from "../shared/api";
import { auditListQuerySchema, replaceStaffRoleSchema } from "./schemas";

describe("admin request validation", () => {
  it("maps an unknown role into the approved roleKey field error", () => {
    const parsed = replaceStaffRoleSchema.safeParse({ roleKey: "guardian" });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(fieldErrorsFromIssues(parsed.error.issues)).toEqual({
        roleKey: ["Select a valid staff role."],
      });
    }
  });

  it("rejects unknown audit modules and inverted date ranges", () => {
    const unknownModule = auditListQuerySchema.safeParse({ limit: "25", module: "student-id" });
    expect(unknownModule.success).toBe(false);

    const invertedRange = auditListQuerySchema.safeParse({
      from: "2026-07-23T12:00:00.000Z",
      to: "2026-07-22T12:00:00.000Z",
    });
    expect(invertedRange.success).toBe(false);
    if (!invertedRange.success) {
      expect(fieldErrorsFromIssues(invertedRange.error.issues)).toHaveProperty("from");
    }
  });

  it("normalizes offset-equivalent audit ranges to UTC before comparing them", () => {
    const equivalent = auditListQuerySchema.parse({
      from: "2026-07-22T08:00:00-04:00",
      to: "2026-07-22T13:00:00+01:00",
    });
    expect(equivalent.from).toBe("2026-07-22T12:00:00.000Z");
    expect(equivalent.to).toBe("2026-07-22T12:00:00.000Z");

    const chronologicallyInverted = auditListQuerySchema.safeParse({
      from: "2026-07-22T10:00:00-04:00",
      to: "2026-07-22T13:00:00.000Z",
    });
    expect(chronologicallyInverted.success).toBe(false);
  });
});
