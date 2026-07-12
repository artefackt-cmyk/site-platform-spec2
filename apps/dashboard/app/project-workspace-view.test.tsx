import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  ProjectWorkspaceView,
  type CreatePageFormState,
  type ProjectWorkspaceLoadState
} from "./project-workspace-view";

describe("ProjectWorkspaceView", () => {
  it("renders the project workspace name", () => {
    const html = renderWorkspace();

    expect(html).toContain("Demo Store");
    expect(html).toContain("Рабочая область проекта");
  });

  it("renders the project pages list", () => {
    const html = renderWorkspace();

    expect(html).toContain("Страницы сайта");
    expect(html).toContain("Главная");
    expect(html).toContain("/home");
  });

  it("keeps only real workspace actions in the project topbar", () => {
    const html = renderWorkspace();

    expect(html).toContain("Товары");
    expect(html).toContain("Медиа");
    expect(html).not.toContain("Предпросмотр");
    expect(html).not.toContain("Опубликовать");
  });

  it("renders the home page badge", () => {
    const html = renderWorkspace();

    expect(html).toContain("Главная");
  });

  it("renders the create page form", () => {
    const html = renderWorkspace({
      form: {
        open: true,
        values: {
          title: "",
          slug: "",
          isHome: false
        },
        submitting: false,
        errorMessage: undefined
      }
    });

    expect(html).toContain("Название страницы");
    expect(html).toContain("Адрес страницы");
    expect(html).toContain("Сделать главной");
  });
});

function renderWorkspace(input: {
  readonly state?: ProjectWorkspaceLoadState;
  readonly form?: CreatePageFormState;
} = {}): string {
  return renderToStaticMarkup(
    React.createElement(ProjectWorkspaceView, {
      state: input.state ?? createReadyState(),
      activeSection: "pages",
      form: input.form ?? createClosedForm(),
      onSelectSection: () => undefined,
      onOpenCreatePageForm: () => undefined,
      onCloseCreatePageForm: () => undefined,
      onPageFormChange: () => undefined,
      onSubmitCreatePage: () => undefined
    })
  );
}

function createReadyState(): ProjectWorkspaceLoadState {
  return {
    status: "ready",
    project: {
      id: "project-1",
      name: "Demo Store",
      slug: "demo-store",
      status: "DRAFT",
      createdAt: "2026-01-01T00:00:00.000Z"
    },
    pages: [
      {
        id: "page-1",
        projectId: "project-1",
        title: "Главная",
        slug: "home",
        status: "DRAFT",
        isHome: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z"
      }
    ]
  };
}

function createClosedForm(): CreatePageFormState {
  return {
    open: false,
    values: {
      title: "",
      slug: "",
      isHome: false
    },
    submitting: false,
    errorMessage: undefined
  };
}
