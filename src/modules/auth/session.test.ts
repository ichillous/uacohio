import { describe, expect, it } from "vitest";

import { buildPortalSession, isSameOriginRequest } from "./session";

const baseIdentity = {
  audience: "staff" as const,
  displayName: "Dev Administrator",
  normalizedEmail: "admin@example.test",
  locale: "en" as const,
  roleKey: "system_administrator",
  sessionProvider: "dev" as const,
  userId: "user-staff-admin",
};

const devEnvironment = {
  APP_ENV: "development" as const,
  DEV_AUTH_ENABLED: true,
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  NODE_ENV: "development" as const,
};

describe("provider-neutral sessions", () => {
  it("accepts one trusted staff role and filters unknown database permission keys", () => {
    expect(
      buildPortalSession([baseIdentity], ["students.view", "invented.grant"], devEnvironment),
    ).toEqual({
      user: {
        id: "user-staff-admin",
        displayName: "Dev Administrator",
        email: "admin@example.test",
        locale: "en",
      },
      audience: "staff",
      role: "system_administrator",
      permissions: ["students.view"],
    });
  });

  it("fails closed for conflicting staff roles", () => {
    expect(
      buildPortalSession(
        [baseIdentity, { ...baseIdentity, roleKey: "school_leadership" }],
        ["students.view"],
        devEnvironment,
      ),
    ).toBeNull();
  });

  it("never assigns staff grants to a guardian session", () => {
    expect(
      buildPortalSession(
        [{ ...baseIdentity, audience: "guardian", roleKey: null }],
        ["students.view"],
        devEnvironment,
      ),
    ).toMatchObject({ audience: "guardian", role: null, permissions: [] });
  });

  it("invalidates an existing dev-provider session when dummy auth is disabled", () => {
    expect(
      buildPortalSession([baseIdentity], ["students.view"], {
        ...devEnvironment,
        DEV_AUTH_ENABLED: false,
      }),
    ).toBeNull();
  });
});

describe("dev session request origin", () => {
  it("accepts exact same-origin mutations", () => {
    expect(
      isSameOriginRequest(
        new Request("http://localhost:3000/api/dev/session", {
          headers: { Origin: "http://localhost:3000" },
          method: "POST",
        }),
      ),
    ).toBe(true);
  });

  it("rejects missing and cross-origin mutation origins", () => {
    expect(isSameOriginRequest(new Request("http://localhost:3000/api/dev/session"))).toBe(false);
    expect(
      isSameOriginRequest(
        new Request("http://localhost:3000/api/dev/session", {
          headers: { Origin: "https://attacker.example" },
          method: "POST",
        }),
      ),
    ).toBe(false);
  });
});
