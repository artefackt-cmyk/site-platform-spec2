import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PageEditorView, type PageEditorLoadState } from "./page-editor-view";

describe("PageEditorView", () => {
  it("renders the placeholder editor page", () => {
    const html = renderToStaticMarkup(
      React.createElement(PageEditorView, {
        state: createReadyState()
      })
    );

    expect(html).toContain("Главная");
    expect(html).toContain("/home");
    expect(html).toContain("Структура");
    expect(html).toContain("Здесь появится визуальный редактор");
    expect(html).toContain("Настройки блока");
    expect(html).toContain("Назад к страницам");
  });
});

function createReadyState(): PageEditorLoadState {
  return {
    status: "ready",
    project: {
      id: "project-1",
      name: "Demo Store",
      slug: "demo-store",
      status: "DRAFT",
      createdAt: "2026-01-01T00:00:00.000Z"
    },
    page: {
      id: "page-1",
      projectId: "project-1",
      title: "Главная",
      slug: "home",
      status: "DRAFT",
      isHome: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z"
    }
  };
}
