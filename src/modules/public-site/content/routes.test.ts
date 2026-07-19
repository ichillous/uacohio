import { describe, expect, it } from "vitest";

import { isPublicPageSlug, publicPageSlugs } from "./routes";

describe("public page routes", () => {
  it("keeps the primary route set explicit", () => {
    expect(publicPageSlugs).toEqual([
      "admissions",
      "academics",
      "student-life",
      "about",
      "contact",
    ]);
  });

  it("rejects unknown routes", () => {
    expect(isPublicPageSlug("contact")).toBe(true);
    expect(isPublicPageSlug("admin")).toBe(false);
  });
});
