import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { insertBlock } from "@site-platform/editor-core";
import { PageEditorView, type PageEditorLoadState } from "./page-editor-view";
import { createEditorState } from "./page-editor-state";

describe("PageEditorView", () => {
  it("renders editor blocks and panels", () => {
    const html = renderEditor();

    expect(html).toContain("Добро пожаловать");
    expect(html).toContain("Блоки страницы");
    expect(html).toContain("Добавить блок");
    expect(html).toContain("Заголовок");
    expect(html).toContain("Инспектор");
  });

  it("renders dirty state", () => {
    const html = renderEditor({
      state: createReadyState("dirty")
    });

    expect(html).toContain("Есть изменения");
    expect(html).toContain("Сохранить");
  });

  it("renders unsaved changes preview warning", () => {
    const html = renderEditor({
      state: createReadyState("dirty"),
      previewWarningOpen: true
    });

    expect(html).toContain(
      "Предпросмотр показывает последнюю сохранённую версию"
    );
    expect(html).toContain("Сохранить и открыть");
    expect(html).toContain("Открыть сохранённую версию");
    expect(html).toContain("Отмена");
  });
});

function renderEditor(input: {
  readonly state?: PageEditorLoadState;
  readonly previewWarningOpen?: boolean;
} = {}): string {
  return renderToStaticMarkup(
    React.createElement(PageEditorView, {
      state: input.state ?? createReadyState("saved"),
      onAddBlock: () => undefined,
      onSelectBlock: () => undefined,
      onMoveBlock: () => undefined,
      onRemoveBlock: () => undefined,
      onUpdateHeading: () => undefined,
      onUpdateText: () => undefined,
      onUpdateButton: () => undefined,
      onUpdateSpacer: () => undefined,
      onSave: () => undefined,
      onPreview: () => undefined,
      previewWarningOpen: input.previewWarningOpen ?? false,
      onSaveAndPreview: () => undefined,
      onOpenSavedPreview: () => undefined,
      onCancelPreview: () => undefined
    })
  );
}

function createReadyState(
  saveStatus: "saved" | "dirty"
): PageEditorLoadState {
  const document = insertBlock(
    {
      schemaVersion: 1,
      root: {
        id: "root",
        type: "page",
        children: []
      }
    },
    {
      id: "heading-1",
      type: "heading",
      props: {
        text: "Добро пожаловать",
        level: 1,
        align: "center"
      }
    }
  );
  const editor = {
    ...createEditorState({
      pageId: "page-1",
      schemaVersion: 1,
      revision: 1,
      document
    }),
    saveStatus
  };

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
    editor
  };
}
