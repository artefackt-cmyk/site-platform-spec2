import * as React from "react";
import { existsSync, readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { mercurioLogoAssets } from "@site-platform/ui";
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
    expect(html).toContain(mercurioLogoAssets.monogram);
    expect(html).toContain(mercurioLogoAssets.horizontal);
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
    expect(html).toContain("object-fit:contain");
    expect(html).not.toContain("mercurio-logo-mark");
    expect(html).not.toContain("preserveAspectRatio");
    expect(html).not.toContain("width:100%");
    expect(html).not.toContain("height:100vh");
  });

  it("keeps compact logo on desktop and switches topbar to monogram at narrow width", () => {
    const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");

    expect(css).toContain(".mercurio-topbar > .mercurio-logo");
    expect(css).toContain("flex: 0 0 190px");
    expect(css).toContain(".mercurio-topbar-logo-narrow");
    expect(css).toContain("display: none");
    expect(css).toContain("white-space: nowrap");
    expect(css).toContain("@media (max-width: 1120px)");
    expect(css).toContain(".mercurio-topbar-logo-wide {\n    display: none;");
    expect(css).toContain(".mercurio-topbar-logo-narrow {\n    display: inline-flex;");
  });

  it("ships approved Mercurio assets in the dashboard public directory", () => {
    expect(
      existsSync(
        new URL(
          "../public/assets/mercurio/mercurio-monogram.png",
          import.meta.url
        )
      )
    ).toBe(true);
    expect(
      existsSync(
        new URL(
          "../public/assets/mercurio/mercurio-logo-horizontal.png",
          import.meta.url
        )
      )
    ).toBe(true);
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

  it("renders the real project orders route when project navigation is available", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        MercurioAppShell,
        {
          activeArea: "orders",
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

    expect(html).toContain("Заказы");
    expect(html).toContain("/projects/project-1/orders");
    expect(html).toContain("aria-current=\"page\"");
  });
});
