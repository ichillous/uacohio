import { describe, expect, it } from "vitest";

import { homeContent } from "./home";
import { publicPageContent } from "./pages";

describe("public-facing content", () => {
  it("keeps internal production language out of the published copy", () => {
    const copy = JSON.stringify({ homeContent, publicPageContent });

    expect(copy).not.toMatch(
      /coming next|coming after|pending|placeholder|in development|developing|mission draft|content review|workflow review|before launch|prototype|sample contact information|website will/i,
    );
  });

  it("includes the requested knowledge quotation and welcome message", () => {
    expect(homeContent.en.values).toMatchObject({
      attribution: "Prophet Muhammad ﷺ — Sunan Ibn Majah, Hadith 224",
      quote: "Seeking knowledge is an obligation upon every Muslim.",
    });
    expect(homeContent.en.welcome).toMatchObject({
      title: "Welcome to UAC",
      body: expect.stringContaining("nurturing the whole child"),
    });
  });

  it("publishes complete contact information", () => {
    expect(publicPageContent.en.contact.contactDetails).toEqual([
      { label: "Address", lines: ["1843 E Hudson St.", "Columbus, OH 43211"] },
      { href: "tel:+16148455184", label: "Phone", lines: ["(614) 845-5184"] },
      { href: "mailto:contact@uacohio.org", label: "Email", lines: ["contact@uacohio.org"] },
      { label: "Office Hours", lines: ["Monday - Friday", "8:00 AM - 4:00 PM"] },
    ]);
    expect(publicPageContent.en.contact.callout).toMatchObject({
      title: "Schedule a Visit",
      body: "We’d love to show you around our campus and answer any questions you may have.",
    });
  });

  it("keeps homepage value statements distinct from the language switcher", () => {
    expect(homeContent.en.hero.highlights).toHaveLength(2);
    expect(homeContent.en.trustItems).toContain("Inclusive and diverse");
    expect(homeContent.en.pillars.items[2]).toMatchObject({
      title: "Whole-child growth",
    });
  });
});
