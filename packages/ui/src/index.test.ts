import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Button, MercurioLogo, Modal, mercurioTokens } from "./index";

describe("@site-platform/ui Mercurio primitives", () => {
  it("renders Mercurio logo variants without client-only behavior", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {
      return undefined;
    });
    const html = renderToStaticMarkup(
      React.createElement(MercurioLogo, { variant: "lockup" })
    );

    expect(html).toContain("MERCURIO");
    expect(html).toContain("mercurio-logo-mark");
    expect(html).toContain("preserveAspectRatio=\"xMidYMid meet\"");
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("renders icon logo with bounded intrinsic dimensions", () => {
    const html = renderToStaticMarkup(
      React.createElement(MercurioLogo, { variant: "icon" })
    );

    expect(html).toContain("mercurio-logo-icon");
    expect(html).toContain("style=\"width:40px");
    expect(html).toContain("height:40px");
    expect(html).toContain("width=\"40px\"");
    expect(html).toContain("height=\"40px\"");
    expect(html).not.toContain("width:100%");
  });

  it("renders compact logo with bounded horizontal dimensions", () => {
    const html = renderToStaticMarkup(
      React.createElement(MercurioLogo, { variant: "compact" })
    );

    expect(html).toContain("mercurio-logo-compact");
    expect(html).toContain("style=\"width:190px");
    expect(html).toContain("max-width:190px");
    expect(html).toContain("width=\"32px\"");
    expect(html).toContain("height=\"32px\"");
    expect(html).not.toContain("width:100%");
  });

  it("renders button variants and loading state accessibly", () => {
    const html = renderToStaticMarkup(
      React.createElement(Button, { variant: "primary", loading: true }, "Save")
    );

    expect(html).toContain("ui-button-primary");
    expect(html).toContain("aria-busy=\"true\"");
    expect(html).toContain("disabled");
  });

  it("renders modal with dialog semantics", () => {
    const html = renderToStaticMarkup(
      React.createElement(Modal, { title: "Confirm" }, "Body")
    );

    expect(html).toContain("role=\"dialog\"");
    expect(html).toContain("aria-modal=\"true\"");
    expect(html).toContain("Confirm");
  });

  it("exposes stable Mercurio design tokens", () => {
    expect(mercurioTokens.color.graphite).toBe("#0B0F13");
    expect(mercurioTokens.font.brand).toContain("Prata");
  });
});
