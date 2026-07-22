import { describe, expect, it } from "vitest";

import { isDevAuthAllowed, readRuntimeEnvironment, runtimeReadiness } from "./server";

describe("runtime environment", () => {
  it("uses safe local defaults without requiring production secrets", () => {
    const environment = readRuntimeEnvironment({});

    expect(environment.APP_ENV).toBe("development");
    expect(environment.NEXT_PUBLIC_SITE_URL).toBe("http://localhost:3000");
    expect(environment.DEV_AUTH_ENABLED).toBe(false);
  });

  it("requires a working D1 binding for readiness", () => {
    const environment = readRuntimeEnvironment({});

    expect(runtimeReadiness(environment, false)).toEqual({
      databaseAvailable: false,
      ready: false,
    });
    expect(runtimeReadiness(environment, true)).toEqual({ databaseAvailable: true, ready: true });
  });

  it("permits dummy auth only in local or test environments", () => {
    const environment = readRuntimeEnvironment({
      APP_ENV: "development",
      DEV_AUTH_ENABLED: "true",
    });

    expect(isDevAuthAllowed(environment)).toBe(true);
    expect(() =>
      readRuntimeEnvironment({ APP_ENV: "production", DEV_AUTH_ENABLED: "true" }),
    ).toThrow(/DEV_AUTH_ENABLED/);
  });
});
