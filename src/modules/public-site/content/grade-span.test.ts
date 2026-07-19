import { describe, expect, it } from "vitest";

import { locales } from "@/modules/shared/i18n/locales";

import { homeContent } from "./home";
import { publicPageContent } from "./pages";

describe("school grade span", () => {
  it.each(locales)("keeps %s homepage content aligned to K-8", (locale) => {
    const gradeSpan = homeContent[locale].hero.highlights[0]?.value;

    expect(gradeSpan).toBe("K-8");
  });

  it.each(locales)("keeps %s academic pathways within K-8", (locale) => {
    const markers = publicPageContent[locale].academics.cards.map((card) => card.marker);

    expect(markers).toEqual(["K-2", "3-5", "6-8"]);
  });
});
