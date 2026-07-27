import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { schoolUniformStoreUrl } from "@/modules/shared/school-resources";

import { SiteChrome } from "./site-chrome";

describe("public site chrome", () => {
  it("offers the localized uniform store as a safe external family resource", () => {
    render(
      <SiteChrome locale="so">
        <main id="main-content">Home</main>
      </SiteChrome>,
    );

    expect(screen.getByText("Khayraadka qoyska")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Iibso dharka dugsiga UAC" })).toHaveAttribute(
      "href",
      schoolUniformStoreUrl,
    );
    expect(screen.getByRole("link", { name: "Iibso dharka dugsiga UAC" })).toHaveAttribute(
      "target",
      "_blank",
    );
    expect(screen.getByRole("link", { name: "Iibso dharka dugsiga UAC" })).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
  });
});
