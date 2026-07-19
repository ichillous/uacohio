import { describe, expect, it } from "vitest";

import { readRuntimeEnvironment, runtimeReadiness } from "./server";

describe("runtime environment", () => {
  it("uses safe local defaults without requiring production secrets", () => {
    const environment = readRuntimeEnvironment({});

    expect(environment.APP_ENV).toBe("development");
    expect(environment.NEXT_PUBLIC_SITE_URL).toBe("http://localhost:3000");
    expect(runtimeReadiness(environment).ready).toBe(true);
  });

  it("fails readiness when a required database is not configured", () => {
    const environment = readRuntimeEnvironment({ REQUIRE_DATABASE: "true" });

    expect(runtimeReadiness(environment)).toEqual({
      databaseConfigured: false,
      ready: false,
    });
  });

  it("never exposes the database URL in readiness output", () => {
    const environment = readRuntimeEnvironment({
      DATABASE_URL: "mysql://example:secret@localhost/uac",
      REQUIRE_DATABASE: "true",
    });

    expect(runtimeReadiness(environment)).toEqual({
      databaseConfigured: true,
      ready: true,
    });
  });
});
