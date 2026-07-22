import { describe, expect, it } from "vitest";

import { csvCell } from "./csv";

describe("attendance CSV cells", () => {
  it.each(["=2+2", "+cmd", "-10+20", "@SUM(A1:A2)"])(
    "neutralizes formula-like legal names: %s",
    (value) => {
      expect(csvCell(value)).toBe(`'${value}`);
    },
  );

  it("neutralizes a formula after leading whitespace and still quotes delimiters", () => {
    expect(csvCell('  =WEBSERVICE("x")')).toBe('"\'  =WEBSERVICE(""x"")"');
  });
});
