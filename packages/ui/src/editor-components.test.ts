import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  BlockLibraryCard,
  DualViewportPreview,
  SectionNavigatorItem
} from "./editor-components";

describe("editor component foundation", () => {
  it("renders SectionNavigatorItem state classes and compact actions", () => {
    const html = renderToStaticMarkup(
      React.createElement(SectionNavigatorItem, {
        index: 3,
        title: "Каталог",
        type: "Commerce",
        state: "hidden"
      })
    );

    expect(html).toContain("m-section-item-hidden");
    expect(html).toContain("aria-disabled=\"true\"");
    expect(html).toContain("Действия секции");
  });

  it("renders BlockLibraryCard indicators and unavailable state", () => {
    const html = renderToStaticMarkup(
      React.createElement(BlockLibraryCard, {
        name: "Product grid",
        category: "Commerce",
        state: "unavailable",
        commerce: true
      })
    );

    expect(html).toContain("m-block-card-unavailable");
    expect(html).toContain("aria-disabled=\"true\"");
    expect(html).toContain("Product grid");
    expect(html).toContain("Поддержка блока");
  });

  it("supports DualViewportPreview side-by-side and site dark preview", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        DualViewportPreview,
        {
          mode: "side-by-side",
          siteTheme: "dark",
          activeViewport: "mobile",
          editingState: "editingMobileOverride"
        },
        React.createElement("p", null, "Same content")
      )
    );

    expect(html).toContain("data-mode=\"side-by-side\"");
    expect(html).toContain("data-site-theme=\"dark\"");
    expect(html).toContain("data-editing-state=\"editingMobileOverride\"");
    expect(html).toContain("Desktop");
    expect(html).toContain("Mobile");
    expect(html).toContain("Редактируется: Desktop");
    expect(html).toContain("Редактируется: Mobile");
    expect(html).not.toContain(">editingMobileOverride<");
    expect(html).not.toContain(">inheritedMobile<");
    expect(html).toContain("m-viewport-active");
  });
});
