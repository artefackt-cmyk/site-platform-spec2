import * as React from "react";
import type { ProjectSummary, SitePageSummary } from "./dashboard-types";

export type PageEditorLoadState =
  | {
      readonly status: "loading";
    }
  | {
      readonly status: "error";
      readonly message: string;
    }
  | {
      readonly status: "ready";
      readonly project: ProjectSummary;
      readonly page: SitePageSummary;
    };

export function PageEditorView({
  state
}: {
  readonly state: PageEditorLoadState;
}) {
  return (
    <main className="dashboard-shell">
      <section className="dashboard-panel">
        {state.status === "loading" ? (
          <EditorCenterState
            title="Загрузка страницы"
            text="Получаем данные страницы проекта."
          />
        ) : state.status === "error" ? (
          <EditorCenterState
            title="Страница не открыта"
            text={state.message}
            tone="error"
          />
        ) : (
          <>
            <header className="topbar workspace-topbar">
              <div>
                <nav className="breadcrumb" aria-label="Навигация">
                  <a href={`/projects/${state.project.id}`}>Страницы</a>
                  <span>/</span>
                  <span>{state.page.title}</span>
                </nav>
                <p className="eyebrow">Placeholder редактора</p>
                <h1>{state.page.title}</h1>
                <p className="project-slug">/{state.page.slug}</p>
              </div>
              <div className="workspace-actions">
                <span className="project-status">{state.page.status}</span>
                <a className="ghost-button" href={`/projects/${state.project.id}`}>
                  Назад к страницам
                </a>
              </div>
            </header>

            <section className="editor-placeholder-layout">
              <aside className="editor-side-panel">
                <p className="eyebrow">Структура</p>
                <h2>Структура</h2>
              </aside>
              <section className="editor-canvas-placeholder">
                <p>Здесь появится визуальный редактор</p>
              </section>
              <aside className="editor-side-panel">
                <p className="eyebrow">Параметры</p>
                <h2>Настройки блока</h2>
              </aside>
            </section>
          </>
        )}
      </section>
    </main>
  );
}

function EditorCenterState({
  title,
  text,
  tone
}: {
  readonly title: string;
  readonly text: string;
  readonly tone?: "error";
}) {
  return (
    <div
      className={tone === "error" ? "center-state error-state" : "center-state"}
      role={tone === "error" ? "alert" : undefined}
    >
      <p className="eyebrow">Page editor</p>
      <h1>{title}</h1>
      <p>{text}</p>
    </div>
  );
}
