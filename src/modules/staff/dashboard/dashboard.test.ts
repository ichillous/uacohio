import { describe, expect, it } from "vitest";

import type { PortalSession } from "@/modules/auth/types";

import {
  availableSeatCount,
  attendancePercentage,
  dashboardScopesForSession,
  emptyStageCounts,
} from "./dashboard";

const baseSession: PortalSession = {
  audience: "staff",
  permissions: [],
  role: "school_leadership",
  user: { displayName: "Dev Leader", email: null, id: "staff-002", locale: "en" },
};

describe("dashboard role projections", () => {
  it("gives leadership admissions KPIs without campaign or content projections", () => {
    expect(dashboardScopesForSession({ ...baseSession, permissions: ["dashboard.view"] })).toEqual({
      admissions: true,
      campaigns: false,
      content: false,
    });
  });

  it("limits outreach and content personas to their explicitly granted scopes", () => {
    expect(
      dashboardScopesForSession({
        ...baseSession,
        permissions: ["dashboard.view_campaign_metrics"],
        role: "marketing_outreach",
      }),
    ).toEqual({ admissions: false, campaigns: true, content: false });
    expect(
      dashboardScopesForSession({
        ...baseSession,
        permissions: ["dashboard.view_content_metrics"],
        role: "content_publisher_translator",
      }),
    ).toEqual({ admissions: false, campaigns: false, content: true });
  });

  it("keeps all six pipeline stages visible even when a stage has no leads", () => {
    expect(emptyStageCounts()).toEqual({
      applied: 0,
      closed_not_proceeding: 0,
      contacted: 0,
      enrolled: 0,
      inquiry: 0,
      toured: 0,
    });
  });

  it("derives an attendance percentage without dividing by zero", () => {
    expect(attendancePercentage(185, 200)).toBe(92.5);
    expect(attendancePercentage(0, 0)).toBe(0);
  });

  it("never reports negative open seats", () => {
    expect(availableSeatCount(585, 200)).toBe(385);
    expect(availableSeatCount(10, 12)).toBe(0);
  });
});
