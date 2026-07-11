import * as React from "react";
import type { PageDocumentV1 } from "@site-platform/editor-core";
import { PageRenderer } from "@site-platform/renderer";
import type { ProjectSummary, SitePageSummary } from "./dashboard-types";
import {
  PREVIEW_VIEWPORT_MODES,
  createPageEditorRoute,
  getPreviewCanvasMaxWidth,
  getPreviewCanvasWidth,
  type PreviewViewportMode
} from "./page-preview-model";

export type PagePreviewLoadState =
  | {
      readonly status: "loading";
    }
  | {
      readonly status: "error";
      readonly title: string;
      readonly message: string;
    }
  | {
      readonly status: "ready";
      readonly project: ProjectSummary;
      readonly page: SitePageSummary;
      readonly document: PageDocumentV1;
    };

export type PagePreviewViewProps = {
  readonly state: PagePreviewLoadState;
  readonly viewportMode: PreviewViewportMode;
  readonly onViewportModeChange: (mode: PreviewViewportMode) => void;
};

const viewportLabels = {
  desktop: "Desktop",
  tablet: "Tablet",
  mobile: "Mobile"
} as const;

export function PagePreviewView({
  state,
  viewportMode,
  onViewportModeChange
}: PagePreviewViewProps): React.ReactElement {
  if (state.status === "loading") {
    return (
      <PreviewShell>
        <PreviewState title="Загрузка предпросмотра" message="Получаем страницу." />
      </PreviewShell>
    );
  }

  if (state.status === "error") {
    return (
      <PreviewShell>
        <PreviewState title={state.title} message={state.message} tone="error" />
      </PreviewShell>
    );
  }

  return (
    <main className="preview-shell">
      <header className="preview-toolbar">
        <div className="preview-page-meta">
          <span className="preview-badge">Предпросмотр</span>
          <div>
            <h1>{state.page.title}</h1>
            <p>/{state.page.slug}</p>
          </div>
        </div>

        <div className="preview-toolbar-actions">
          <div className="preview-viewport-toggle" aria-label="Размер предпросмотра">
            {PREVIEW_VIEWPORT_MODES.map((mode) => (
              <button
                key={mode}
                type="button"
                className={
                  mode === viewportMode
                    ? "preview-viewport-button preview-viewport-button-active"
                    : "preview-viewport-button"
                }
                onClick={() => onViewportModeChange(mode)}
              >
                {viewportLabels[mode]}
              </button>
            ))}
          </div>
          <a
            className="preview-back-button"
            href={createPageEditorRoute(state.project.id, state.page.id)}
          >
            Вернуться в редактор
          </a>
        </div>
      </header>

      <section className="preview-stage">
        <div
          className={`preview-canvas preview-canvas-${viewportMode}`}
          style={{
            width: getPreviewCanvasWidth(viewportMode),
            maxWidth: getPreviewCanvasMaxWidth(viewportMode)
          }}
        >
          {state.document.root.children.length === 0 ? (
            <div className="preview-empty-canvas">
              На странице пока нет блоков
            </div>
          ) : (
            <PageRenderer document={state.document} mode="preview" />
          )}
        </div>
      </section>
    </main>
  );
}

function PreviewShell({
  children
}: {
  readonly children: React.ReactNode;
}): React.ReactElement {
  return <main className="preview-shell">{children}</main>;
}

function PreviewState({
  title,
  message,
  tone
}: {
  readonly title: string;
  readonly message: string;
  readonly tone?: "error";
}): React.ReactElement {
  return (
    <section
      className={tone === "error" ? "preview-state preview-state-error" : "preview-state"}
      role={tone === "error" ? "alert" : undefined}
    >
      <p className="eyebrow">Предпросмотр</p>
      <h1>{title}</h1>
      <p>{message}</p>
    </section>
  );
}
