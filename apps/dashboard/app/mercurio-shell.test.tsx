import * as React from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MercurioAppShell } from "./mercurio-shell";

describe("MercurioAppShell", () => {
  it("renders brand shell and real project navigation", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        MercurioAppShell,
        {
          activeArea: "products",
          project: {
            id: "project-1",
            name: "Demo Store",
            slug: "demo-store",
            status: "DRAFT",
            createdAt: "2026-01-01T00:00:00.000Z"
          }
        },
        React.createElement("p", null, "Content")
      )
    );

    expect(html).toContain("MERCURIO");
    expect(html).toContain("/projects/project-1/products");
    expect(html).toContain("aria-current=\"page\"");
  });

  it("renders bounded sidebar and topbar logos", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        MercurioAppShell,
        {
          activeArea: "projects"
        },
        React.createElement("p", null, "Content")
      )
    );

    expect(html).toContain("mercurio-logo-icon");
    expect(html).toContain("style=\"width:40px");
    expect(html).toContain("mercurio-logo-compact");
    expect(html).toContain("style=\"width:190px");
    expect(html).toContain("preserveAspectRatio=\"xMidYMid meet\"");
    expect(html).not.toContain("width:100%");
    expect(html).not.toContain("height:100vh");
  });

  it("keeps compact wordmark visible on desktop and hides only the word at narrow width", () => {
    const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");

    expect(css).toContain(".mercurio-topbar > .mercurio-logo");
    expect(css).toContain("flex: 0 0 190px");
    expect(css).toContain(".mercurio-logo-word");
    expect(css).toContain("white-space: nowrap");
    expect(css).toContain("@media (max-width: 1120px)");
    expect(css).toContain(".mercurio-logo-word {\n    display: none;");
  });

  it("does not render fake commerce navigation links", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        MercurioAppShell,
        {
          activeArea: "projects"
        },
        React.createElement("p", null, "Content")
      )
    );

    expect(html).not.toContain("Заказы");
    expect(html).not.toContain("Клиенты");
    expect(html).not.toContain("Аналитика");
  });
});
