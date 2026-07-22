import { describe, expect, it } from "vitest";

import { AuthorizationError, hasPermission, requireStaffPermission } from "./authorization";
import type { PortalSession } from "./types";

const staffSession: PortalSession = {
  user: {
    id: "user-staff-admin",
    displayName: "Dev Administrator",
    email: "admin@example.test",
    locale: "en",
  },
  audience: "staff",
  role: "system_administrator",
  permissions: ["students.view", "roles.administer"],
};

describe("staff authorization", () => {
  it("grants only permissions loaded into the trusted session", () => {
    expect(hasPermission(staffSession, "students.view")).toBe(true);
    expect(hasPermission(staffSession, "attendance.mark")).toBe(false);
  });

  it("defaults to deny when the session is absent or belongs to a guardian", () => {
    expect(hasPermission(null, "students.view")).toBe(false);
    expect(
      hasPermission({ ...staffSession, audience: "guardian", role: null }, "students.view"),
    ).toBe(false);
  });

  it("distinguishes unauthenticated and forbidden requests without granting access", () => {
    expect(() => requireStaffPermission(null, "students.view")).toThrow(
      new AuthorizationError("UNAUTHENTICATED", 401),
    );
    expect(() => requireStaffPermission(staffSession, "attendance.mark")).toThrow(
      new AuthorizationError("FORBIDDEN", 403),
    );
  });
});
