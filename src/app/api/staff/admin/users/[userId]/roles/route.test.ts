import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getD1Database: vi.fn(),
  getSession: vi.fn(),
  replaceStaffRole: vi.fn(),
}));

vi.mock("@/db/d1", () => ({ getD1Database: mocks.getD1Database }));
vi.mock("@/modules/auth/session", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/modules/auth/session")>();
  return { ...original, getSession: mocks.getSession };
});
vi.mock("@/modules/staff/admin/repository", () => ({
  replaceStaffRole: mocks.replaceStaffRole,
}));

import { PUT } from "./route";

describe("admin role mutation API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the approved 403 envelope before accessing D1 for a non-admin", async () => {
    mocks.getSession.mockResolvedValue({
      audience: "staff",
      permissions: ["audit.view"],
      role: "school_leadership",
      user: { displayName: "Leader", email: null, id: "user-staff-002", locale: "en" },
    });
    const request = new Request("http://localhost/api/staff/admin/users/user-staff-003/roles", {
      body: JSON.stringify({ roleKey: "office_attendance" }),
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost",
        "X-Request-Id": "request-admin-403",
      },
      method: "PUT",
    });

    const response = await PUT(request, {
      params: Promise.resolve({ userId: "user-staff-003" }),
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: {
        code: "FORBIDDEN",
        fieldErrors: {},
        message: "Access is forbidden.",
        requestId: "request-admin-403",
      },
    });
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(mocks.getD1Database).not.toHaveBeenCalled();
    expect(mocks.replaceStaffRole).not.toHaveBeenCalled();
  });

  it("maps role validation failures to roleKey fieldErrors before accessing D1", async () => {
    mocks.getSession.mockResolvedValue({
      audience: "staff",
      permissions: ["roles.administer"],
      role: "system_administrator",
      user: { displayName: "Admin", email: null, id: "user-staff-001", locale: "en" },
    });
    const request = new Request("http://localhost/api/staff/admin/users/user-staff-003/roles", {
      body: JSON.stringify({ roleKey: "guardian" }),
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost",
        "X-Request-Id": "request-admin-validation",
      },
      method: "PUT",
    });

    const response = await PUT(request, {
      params: Promise.resolve({ userId: "user-staff-003" }),
    });
    const body = (await response.json()) as {
      error: { code: string; fieldErrors: Record<string, string[]> };
    };

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("INVALID_REQUEST");
    expect(body.error.fieldErrors).toEqual({ roleKey: ["Select a valid staff role."] });
    expect(mocks.getD1Database).not.toHaveBeenCalled();
    expect(mocks.replaceStaffRole).not.toHaveBeenCalled();
  });
});
