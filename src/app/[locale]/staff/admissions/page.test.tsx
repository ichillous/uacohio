import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PortalSession } from "@/modules/auth/types";

const mocks = vi.hoisted(() => ({
  database: {} as D1Database,
  listLeads: vi.fn(),
  session: null as PortalSession | null,
}));

vi.mock("@/db/d1", () => ({ getD1Database: vi.fn(async () => mocks.database) }));
vi.mock("@/modules/auth/session", () => ({ getSession: vi.fn(async () => mocks.session) }));
vi.mock("@/modules/auth/authorization", () => ({
  requireStaffPermission: vi.fn(() => mocks.session),
}));
vi.mock("@/modules/staff/admissions/repository", () => ({
  listLeads: mocks.listLeads,
}));
vi.mock("@/modules/staff/admissions/admissions-pipeline", () => ({
  AdmissionsPipeline: () => null,
}));

import AdmissionsPage from "./page";

const baseSession: PortalSession = {
  audience: "staff",
  permissions: ["leads.view"],
  role: "marketing_outreach",
  user: { displayName: "Outreach", email: null, id: "staff-006", locale: "en" },
};

describe("staff admissions page projection", () => {
  beforeEach(() => {
    mocks.listLeads.mockReset().mockResolvedValue([]);
    mocks.session = baseSession;
  });

  it("does not load duplicate details for an ordinary leads viewer", async () => {
    await AdmissionsPage();

    expect(mocks.listLeads).toHaveBeenCalledWith(
      mocks.database,
      { limit: 100 },
      { includeDuplicateDetails: false },
    );
  });

  it("loads pending duplicate reviews for an authorized reviewer", async () => {
    mocks.session = { ...baseSession, permissions: ["leads.view", "duplicates.review"] };
    await AdmissionsPage();

    expect(mocks.listLeads).toHaveBeenCalledWith(
      mocks.database,
      { limit: 100 },
      { includeDuplicateDetails: true },
    );
  });
});
