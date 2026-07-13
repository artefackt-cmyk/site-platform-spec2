import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  Button,
  IconButton,
  Tabs,
  Toggle,
  getNextTabIndex
} from "./components";

describe("core UI components", () => {
  it("renders Button states and loading accessibly", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        Button,
        { variant: "primary", size: "lg", loading: true, icon: "publish" },
        "Save"
      )
    );

    expect(html).toContain("ui-button-primary");
    expect(html).toContain("ui-button-lg");
    expect(html).toContain("aria-busy=\"true\"");
    expect(html).toContain("disabled");
    expect(html).toContain("Загрузка");
  });

  it("requires accessible labels for icon buttons", () => {
    const html = renderToStaticMarkup(
      React.createElement(IconButton, {
        label: "Предпросмотр",
        icon: "preview",
        selected: true
      })
    );

    expect(html).toContain("aria-label=\"Предпросмотр\"");
    expect(html).toContain("aria-pressed=\"true\"");
    expect(html).toContain("ui-icon-button-selected");
  });

  it("provides tab keyboard index behavior", () => {
    const items = [
      { id: "content", label: "Контент" },
      { id: "layout", label: "Композиция", disabled: true },
      { id: "style", label: "Стиль" }
    ];

    expect(getNextTabIndex(0, "ArrowRight", items)).toBe(2);
    expect(getNextTabIndex(0, "End", items)).toBe(2);

    const html = renderToStaticMarkup(
      React.createElement(Tabs, {
        label: "Inspector",
        selectedId: "content",
        items
      })
    );

    expect(html).toContain("role=\"tablist\"");
    expect(html).toContain("aria-selected=\"true\"");
  });

  it("renders Toggle as an aria-pressed control", () => {
    const html = renderToStaticMarkup(
      React.createElement(Toggle, { label: "Тёмная тема", pressed: true })
    );

    expect(html).toContain("aria-label=\"Тёмная тема\"");
    expect(html).toContain("aria-pressed=\"true\"");
    expect(html).toContain("ui-toggle-on");
  });
});
