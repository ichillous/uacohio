import { describe, expect, it } from "vitest";

import { isLocale, localeDirection, locales } from "./locales";

describe("locale configuration", () => {
  it("keeps the public locale list intentionally bounded", () => {
    expect(locales).toEqual(["en", "ar", "so"]);
  });

  it("rejects unsupported locale values", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("fr")).toBe(false);
  });

  it("uses right-to-left direction only for Arabic", () => {
    expect(localeDirection("ar")).toBe("rtl");
    expect(localeDirection("en")).toBe("ltr");
    expect(localeDirection("so")).toBe("ltr");
  });
});
