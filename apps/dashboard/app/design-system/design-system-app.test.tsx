import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MerkurioThemeProvider } from "@site-platform/ui";
import { describe, expect, it } from "vitest";
import { DesignSystemApp } from "./design-system-app";

describe("DesignSystemApp", () => {
  it("renders the internal design-system route sections", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        MerkurioThemeProvider,
        null,
        React.createElement(DesignSystemApp)
      )
    );

    expect(html).toContain("Merkurio UI Foundation");
    expect(html).toContain("Core Components");
    expect(html).toContain("Editor Components");
    expect(html).toContain("Dual Viewport Preview");
    expect(html).toContain("data-mode=\"side-by-side\"");
  });
});
