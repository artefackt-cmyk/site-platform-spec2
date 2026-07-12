import * as React from "react";
import type { FormEvent } from "react";
import type {
  CreatePageFormValues,
  ProjectSummary,
  SitePageSummary
} from "./dashboard-types";

export const WORKSPACE_SECTIONS = [
  {
    id: "overview",
    label: "Обзор"
  },
  {
    id: "pages",
    label: "Страницы"
  },
  {
    id: "design",
    label: "Дизайн"
  },
  {
    id: "settings",
    label: "Настройки"
  },
  {
    id: "domain",
    label: "Домен"
  }
] as const;

export type ProjectWorkspaceSection = (typeof WORKSPACE_SECTIONS)[number]["id"];

export type ProjectWorkspaceLoadState =
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
      readonly pages: readonly SitePageSummary[];
    };

export type CreatePageFormState = {
  readonly open: boolean;
  readonly values: CreatePageFormValues;
  readonly submitting: boolean;
  readonly errorMessage: string | undefined;
};

export type ProjectWorkspaceViewProps = {
  readonly state: ProjectWorkspaceLoadState;
  readonly activeSection: ProjectWorkspaceSection;
  readonly form: CreatePageFormState;
  readonly onSelectSection: (section: ProjectWorkspaceSection) => void;
  readonly onOpenCreatePageForm: () => void;
  readonly onCloseCreatePageForm: () => void;
  readonly onPageFormChange: (values: CreatePageFormValues) => void;
  readonly onSubmitCreatePage: (event: FormEvent<HTMLFormElement>) => void;
};

export function ProjectWorkspaceView({
  state,
  activeSection,
  form,
  onSelectSection,
  onOpenCreatePageForm,
  onCloseCreatePageForm,
  onPageFormChange,
  onSubmitCreatePage
}: ProjectWorkspaceViewProps) {
  return (
    <main className="dashboard-shell">
      <section className="dashboard-panel">
        {state.status === "loading" ? (
          <WorkspaceCenterState
            title="Загрузка проекта"
            text="Получаем проект и страницы сайта."
          />
        ) : state.status === "error" ? (
          <WorkspaceCenterState
            title="Проект не открыт"
            text={state.message}
            tone="error"
          />
        ) : (
          <>
            <ProjectWorkspaceTopbar project={state.project} />
            <div className="workspace-layout">
              <WorkspaceNavigation
                activeSection={activeSection}
                onSelectSection={onSelectSection}
              />
              <section className="workspace-main">
                {activeSection === "pages" ? (
                  <PagesSection
                    project={state.project}
                    pages={state.pages}
                    form={form}
                    onOpenCreatePageForm={onOpenCreatePageForm}
                    onCloseCreatePageForm={onCloseCreatePageForm}
                    onPageFormChange={onPageFormChange}
                    onSubmitCreatePage={onSubmitCreatePage}
                  />
                ) : (
                  <PlaceholderSection section={activeSection} />
                )}
              </section>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function ProjectWorkspaceTopbar({
  project
}: {
  readonly project: ProjectSummary;
}) {
  return (
    <header className="topbar workspace-topbar">
      <div>
        <a className="back-link" href="/">
          Назад к проектам
        </a>
        <p className="eyebrow">Рабочая область проекта</p>
        <h1>{project.name}</h1>
      </div>
      <div className="workspace-actions">
        <a className="ghost-button" href={`/projects/${project.id}/products`}>
          Товары
        </a>
        <a className="ghost-button" href={`/projects/${project.id}/media`}>
          Медиа
        </a>
        <span className="project-status">{project.status}</span>
        <button className="ghost-button" disabled>
          Предпросмотр
        </button>
        <button className="primary-button" disabled>
          Опубликовать
        </button>
      </div>
    </header>
  );
}

function WorkspaceNavigation({
  activeSection,
  onSelectSection
}: {
  readonly activeSection: ProjectWorkspaceSection;
  readonly onSelectSection: (section: ProjectWorkspaceSection) => void;
}) {
  return (
    <nav className="workspace-nav" aria-label="Разделы проекта">
      {WORKSPACE_SECTIONS.map((section) => (
        <button
          key={section.id}
          className={
            activeSection === section.id
              ? "workspace-nav-item workspace-nav-item-active"
              : "workspace-nav-item"
          }
          type="button"
          onClick={() => onSelectSection(section.id)}
        >
          {section.label}
        </button>
      ))}
    </nav>
  );
}

function PagesSection({
  project,
  pages,
  form,
  onOpenCreatePageForm,
  onCloseCreatePageForm,
  onPageFormChange,
  onSubmitCreatePage
}: {
  readonly project: ProjectSummary;
  readonly pages: readonly SitePageSummary[];
  readonly form: CreatePageFormState;
  readonly onOpenCreatePageForm: () => void;
  readonly onCloseCreatePageForm: () => void;
  readonly onPageFormChange: (values: CreatePageFormValues) => void;
  readonly onSubmitCreatePage: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <>
      <div className="workspace-section-heading">
        <div>
          <p className="eyebrow">Структура сайта</p>
          <h2>Страницы сайта</h2>
        </div>
        <button className="primary-button" onClick={onOpenCreatePageForm}>
          Добавить страницу
        </button>
      </div>

      {form.open ? (
        <CreatePageForm
          form={form}
          onClose={onCloseCreatePageForm}
          onChange={onPageFormChange}
          onSubmit={onSubmitCreatePage}
        />
      ) : null}

      {pages.length === 0 ? (
        <section className="empty-state">
          <p className="eyebrow">Пока пусто</p>
          <h3>Страниц еще нет</h3>
          <p>Добавьте первую страницу сайта.</p>
          <button className="secondary-button" onClick={onOpenCreatePageForm}>
            Добавить страницу
          </button>
        </section>
      ) : (
        <PageList project={project} pages={pages} />
      )}
    </>
  );
}

function CreatePageForm({
  form,
  onClose,
  onChange,
  onSubmit
}: {
  readonly form: CreatePageFormState;
  readonly onClose: () => void;
  readonly onChange: (values: CreatePageFormValues) => void;
  readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="create-form" onSubmit={onSubmit}>
      <div className="form-header">
        <div>
          <p className="eyebrow">Новая страница</p>
          <h3>Добавить страницу</h3>
        </div>
        <button type="button" className="ghost-button" onClick={onClose}>
          Закрыть
        </button>
      </div>

      <label>
        Название страницы
        <input
          name="title"
          value={form.values.title}
          onChange={(event) =>
            onChange({
              ...form.values,
              title: event.currentTarget.value
            })
          }
          placeholder="О бренде"
          disabled={form.submitting}
        />
      </label>

      <label>
        Адрес страницы
        <input
          name="slug"
          value={form.values.slug}
          onChange={(event) =>
            onChange({
              ...form.values,
              slug: event.currentTarget.value
            })
          }
          placeholder="about"
          disabled={form.submitting}
        />
      </label>

      <label className="checkbox-row">
        <input
          name="isHome"
          type="checkbox"
          checked={form.values.isHome}
          onChange={(event) =>
            onChange({
              ...form.values,
              isHome: event.currentTarget.checked
            })
          }
          disabled={form.submitting}
        />
        Сделать главной
      </label>

      {form.errorMessage === undefined ? null : (
        <p className="form-error" role="alert">
          {form.errorMessage}
        </p>
      )}

      <button className="primary-button" type="submit" disabled={form.submitting}>
        {form.submitting ? "Добавляем..." : "Добавить"}
      </button>
    </form>
  );
}

function PageList({
  project,
  pages
}: {
  readonly project: ProjectSummary;
  readonly pages: readonly SitePageSummary[];
}) {
  return (
    <section className="page-list" aria-label="Список страниц">
      {pages.map((page) => (
        <article className="page-row" key={page.id}>
          <div>
            <div className="page-title-line">
              <h3>{page.title}</h3>
              {page.isHome ? <span className="home-badge">Главная</span> : null}
            </div>
            <p className="project-slug">/{page.slug}</p>
          </div>
          <div className="page-row-meta">
            <span className="project-status">{page.status}</span>
            <span>{formatDate(page.updatedAt)}</span>
            <a
              className="ghost-button"
              href={`/projects/${project.id}/pages/${page.id}`}
            >
              Открыть
            </a>
          </div>
        </article>
      ))}
    </section>
  );
}

function PlaceholderSection({
  section
}: {
  readonly section: ProjectWorkspaceSection;
}) {
  const title = WORKSPACE_SECTIONS.find((item) => item.id === section)?.label;

  return (
    <section className="workspace-placeholder">
      <p className="eyebrow">{title}</p>
      <h2>{title}</h2>
      <p>Этот раздел пока подготовлен как каркас рабочей области проекта.</p>
    </section>
  );
}

function WorkspaceCenterState({
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
      <p className="eyebrow">Project workspace</p>
      <h1>{title}</h1>
      <p>{text}</p>
    </div>
  );
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium"
  }).format(new Date(date));
}
