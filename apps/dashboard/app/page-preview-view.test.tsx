import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PageDocumentV1 } from "@site-platform/editor-core";
import { PagePreviewView, type PagePreviewLoadState } from "./page-preview-view";

describe("PagePreviewView", () => {
  it("renders heading, text and button blocks", () => {
    const html = renderPreview();

    expect(html).toContain("Добро пожаловать");
    expect(html).toContain("Описание страницы");
    expect(html).toContain("Перейти");
    expect(html).toContain("href=\"/catalog\"");
  });

  it("renders preview mode without editor chrome", () => {
    const html = renderPreview();

    expect(html).not.toContain("data-editor-chrome");
    expect(html).not.toContain("sp-editor-block-selected");
    expect(html).not.toContain("Инспектор");
  });

  it("changes canvas width for desktop, tablet and mobile modes", () => {
    expect(renderPreview({ viewportMode: "desktop" })).toContain("width:100%");
    expect(renderPreview({ viewportMode: "desktop" })).toContain(
      "max-width:1440px"
    );
    expect(renderPreview({ viewportMode: "tablet" })).toContain("width:768px");
    expect(renderPreview({ viewportMode: "mobile" })).toContain("width:390px");
  });

  it("links back to the editor route", () => {
    const html = renderPreview();

    expect(html).toContain(
      "href=\"/projects/project-1/pages/page-1\""
    );
    expect(html).toContain("Вернуться в редактор");
  });

  it("renders an empty document state inside the canvas", () => {
    const html = renderPreview({
      state: createReadyState(createEmptyDocument())
    });

    expect(html).toContain("На странице пока нет блоков");
  });

  it("renders a user-facing error state", () => {
    const html = renderPreview({
      state: {
        status: "error",
        title: "API недоступно",
        message: "Не удалось загрузить предпросмотр страницы."
      }
    });

    expect(html).toContain("API недоступно");
    expect(html).toContain("Не удалось загрузить предпросмотр страницы.");
    expect(html).not.toContain("Error:");
  });
});

function renderPreview(input: {
  readonly state?: PagePreviewLoadState;
  readonly viewportMode?: "desktop" | "tablet" | "mobile";
} = {}): string {
  return renderToStaticMarkup(
    React.createElement(PagePreviewView, {
      state: input.state ?? createReadyState(createFilledDocument()),
      viewportMode: input.viewportMode ?? "desktop",
      onViewportModeChange: () => undefined
    })
  );
}

function createReadyState(document: PageDocumentV1): PagePreviewLoadState {
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
    },
    document
  };
}

function createEmptyDocument(): PageDocumentV1 {
  return {
    schemaVersion: 1,
    root: {
      id: "root",
      type: "page",
      children: []
    }
  };
}

function createFilledDocument(): PageDocumentV1 {
  return {
    schemaVersion: 1,
    root: {
      id: "root",
      type: "page",
      children: [
        {
          id: "heading-1",
          type: "heading",
          props: {
            text: "Добро пожаловать",
            level: 1,
            align: "center"
          }
        },
        {
          id: "text-1",
          type: "text",
          props: {
            text: "Описание страницы",
            align: "left"
          }
        },
        {
          id: "button-1",
          type: "button",
          props: {
            label: "Перейти",
            href: "/catalog",
            align: "left",
            variant: "primary"
          }
        }
      ]
    }
  };
}
