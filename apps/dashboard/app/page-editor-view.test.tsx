import * as React from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createEmptyPageDocument, insertBlock } from "@site-platform/editor-core";
import { PageEditorView, type PageEditorLoadState } from "./page-editor-view";
import { createEditorState } from "./page-editor-state";

type ReadyPageEditorState = Extract<PageEditorLoadState, { readonly status: "ready" }>;

describe("PageEditorView", () => {
  it("renders editor blocks and panels", () => {
    const html = renderEditor();

    expect(html).toContain("Добро пожаловать");
    expect(html).toContain("Структура");
    expect(html).toContain("Добавить секцию");
    expect(html).toContain("Добавить блок");
    expect(html).toContain("Заголовок");
    expect(html).toContain("Инспектор");
  });

  it("renders page settings when no node is selected", () => {
    const html = renderEditor({
      state: createReadyState("saved", null)
    });

    expect(html).toContain("Настройки");
    expect(html).toContain("Главная страница");
  });

  it("renders section presets and image controls", () => {
    const html = renderEditor();

    expect(html).toContain("Hero");
    expect(html).toContain("Изображение");
  });

  it("renders dirty state", () => {
    const html = renderEditor({
      state: createReadyState("dirty")
    });

    expect(html).toContain("Есть изменения");
    expect(html).toContain("Сохранить");
  });

  it("renders simplified editor topbar with overflow publication actions", () => {
    const html = renderEditor({
      state: createReadyState("saved", undefined, {
        status: "published-with-changes",
        publicUrl: "https://example.test/demo",
        activeSnapshotId: "snapshot-1",
        activeVersion: 1,
        publishedAt: "2026-01-01T00:00:00.000Z"
      })
    });

    expect(html).toContain("editor-overflow-menu");
    expect(html).toContain("Дополнительные действия");
    expect(html).toContain("Открыть сайт");
    expect(html).toContain("История публикаций");
    expect(html).toContain("Снять с публикации");
    expect(html).toContain("Сохранено");
    expect(html).toContain("Есть неопубликованные изменения");
    expect(html).not.toContain(">DRAFT<");
  });

  it("keeps editor layout bounded for usable panels and center scroll", () => {
    const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");

    expect(css).toContain(
      "grid-template-columns: minmax(260px, 280px) minmax(0, 1fr) minmax(300px, 320px)"
    );
    expect(css).toContain("overflow: auto");
    expect(css).toContain("min-width: 0");
    expect(css).toContain("editor-overflow-menu");
    expect(css).toContain("rgba(59, 76, 99");
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
      onAddSection: () => undefined,
      onAddHeroSection: () => undefined,
      onAddTextSection: () => undefined,
      onInsertSection: () => undefined,
      onDuplicateSection: () => undefined,
      onRenameSection: () => undefined,
      onToggleSectionHidden: () => undefined,
      onRemoveSection: () => undefined,
      onAddBlock: () => undefined,
      onSelectNode: () => undefined,
      onMoveNode: () => undefined,
      onRemoveNode: () => undefined,
      onConvertSection: () => undefined,
      onUpdateSection: () => undefined,
      onUpdateColumn: () => undefined,
      onUpdateHeading: () => undefined,
      onUpdateText: () => undefined,
      onUpdateButton: () => undefined,
      onUpdateImage: () => undefined,
      onUpdateProductCard: () => undefined,
      onUpdateProductGrid: () => undefined,
      mediaPicker: {
        open: false,
        assets: [],
        loading: false,
        uploading: false,
        errorMessage: null
      },
      onOpenImagePicker: () => undefined,
      onCloseImagePicker: () => undefined,
      onUploadImageAsset: () => undefined,
      onSelectImageAsset: () => undefined,
      onUpdateSpacer: () => undefined,
      onSave: () => undefined,
      onPreview: () => undefined,
      onPublish: () => undefined,
      onUpdatePageSettings: () => Promise.resolve(true),
      onOpenPublicationHistory: () => undefined,
      onUnpublish: () => undefined,
      previewWarningOpen: input.previewWarningOpen ?? false,
      publicationHistoryOpen: false,
      publicationHistory: [],
      publicationHistoryLoading: false,
      onRollbackPublication: () => undefined,
      onClosePublicationHistory: () => undefined,
      onSaveAndPreview: () => undefined,
      onOpenSavedPreview: () => undefined,
      onCancelPreview: () => undefined
    })
  );
}

function createReadyState(
  saveStatus: "saved" | "dirty",
  selectedNodeId?: string | null,
  publicationStatus?: ReadyPageEditorState["publicationStatus"]
): PageEditorLoadState {
  const document = insertBlock(
    createEmptyPageDocument(),
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
      schemaVersion: 2,
      revision: 1,
      document
    }),
    saveStatus,
    ...(selectedNodeId === undefined ? {} : { selectedNodeId })
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
    siteId: "site-1",
    title: "Главная",
      slug: "home",
      status: "DRAFT",
      isHome: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z"
    },
    products: [],
    publicationStatus: publicationStatus ?? {
      status: "never-published",
      publicUrl: null,
      activeSnapshotId: null,
      activeVersion: null,
      publishedAt: null
    },
    editor
  };
}
