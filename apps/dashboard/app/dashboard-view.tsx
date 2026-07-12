import * as React from "react";
import type { FormEvent } from "react";
import type {
  CreateProjectFormValues,
  CurrentUserResponse,
  ProjectSummary
} from "./dashboard-types";
import { MercurioAppShell } from "./mercurio-shell";

export type DashboardLoadState =
  | {
      readonly status: "loading";
    }
  | {
      readonly status: "error";
      readonly message: string;
    }
  | {
      readonly status: "ready";
      readonly me: CurrentUserResponse;
      readonly projects: readonly ProjectSummary[];
    };

export type CreateProjectFormState = {
  readonly open: boolean;
  readonly values: CreateProjectFormValues;
  readonly submitting: boolean;
  readonly errorMessage: string | undefined;
};

export type DashboardViewProps = {
  readonly state: DashboardLoadState;
  readonly form: CreateProjectFormState;
  readonly onOpenCreateForm: () => void;
  readonly onCloseCreateForm: () => void;
  readonly onFormChange: (values: CreateProjectFormValues) => void;
  readonly onSubmitCreateProject: (
    event: FormEvent<HTMLFormElement>
  ) => void;
  readonly onLogout?: (() => void) | undefined;
  readonly logoutPending?: boolean | undefined;
};

export function DashboardView({
  state,
  form,
  onOpenCreateForm,
  onCloseCreateForm,
  onFormChange,
  onSubmitCreateProject,
  onLogout,
  logoutPending
}: DashboardViewProps) {
  return (
    <MercurioAppShell
      activeArea="projects"
      user={state.status === "ready" ? state.me : undefined}
      onLogout={onLogout}
      logoutPending={logoutPending}
    >
      {state.status === "loading" ? (
        <LoadingState />
      ) : state.status === "error" ? (
        <ErrorState message={state.message} />
      ) : (
        <>
          <header className="topbar">
            <div>
              <p className="eyebrow">Dashboard</p>
              <h1>Проекты</h1>
              <p className="section-description">
                Управляйте своими проектами и запускайте новые сайты.
              </p>
            </div>
            <button className="primary-button" onClick={onOpenCreateForm}>
              <span aria-hidden="true">✦</span>
              Создать сайт
            </button>
          </header>

          <ProjectStats projects={state.projects} />

          {form.open ? (
            <CreateProjectForm
              form={form}
              onClose={onCloseCreateForm}
              onChange={onFormChange}
              onSubmit={onSubmitCreateProject}
            />
          ) : null}

          {state.projects.length === 0 ? (
            <EmptyProjectsState onCreate={onOpenCreateForm} />
          ) : (
            <ProjectGrid projects={state.projects} />
          )}
        </>
      )}
    </MercurioAppShell>
  );
}

function LoadingState() {
  return (
    <div className="center-state">
      <p className="eyebrow">Dashboard</p>
      <h1>Загрузка проектов</h1>
      <p>Подключаемся к API и получаем активную организацию.</p>
    </div>
  );
}

function ErrorState({ message }: { readonly message: string }) {
  return (
    <div className="center-state error-state" role="alert">
      <p className="eyebrow">Ошибка конфигурации</p>
      <h1>Dashboard не готов</h1>
      <p>{message}</p>
    </div>
  );
}

function CreateProjectForm({
  form,
  onClose,
  onChange,
  onSubmit
}: {
  readonly form: CreateProjectFormState;
  readonly onClose: () => void;
  readonly onChange: (values: CreateProjectFormValues) => void;
  readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="create-form" onSubmit={onSubmit}>
      <div className="form-header">
        <div>
          <p className="eyebrow">Новый проект</p>
          <h3>Создать сайт</h3>
        </div>
        <button type="button" className="ghost-button" onClick={onClose}>
          Закрыть
        </button>
      </div>

      <label>
        Название проекта
        <input
          name="name"
          value={form.values.name}
          onChange={(event) =>
            onChange({
              ...form.values,
              name: event.currentTarget.value
            })
          }
          placeholder="Demo Store"
          disabled={form.submitting}
        />
      </label>

      <label>
        Адрес проекта
        <input
          name="slug"
          value={form.values.slug}
          onChange={(event) =>
            onChange({
              ...form.values,
              slug: event.currentTarget.value
            })
          }
          placeholder="demo-store"
          disabled={form.submitting}
        />
      </label>

      {form.errorMessage === undefined ? null : (
        <p className="form-error" role="alert">
          {form.errorMessage}
        </p>
      )}

      <button className="primary-button" type="submit" disabled={form.submitting}>
        {form.submitting ? "Создаем..." : "Создать"}
      </button>
    </form>
  );
}

function EmptyProjectsState({ onCreate }: { readonly onCreate: () => void }) {
  return (
    <section className="empty-state">
      <p className="eyebrow">Пока пусто</p>
      <h3>Проектов еще нет</h3>
      <p>Создайте первый сайт для активной организации.</p>
      <button className="secondary-button" onClick={onCreate}>
        Создать сайт
      </button>
    </section>
  );
}

function ProjectStats({
  projects
}: {
  readonly projects: readonly ProjectSummary[];
}) {
  const activeProjects = projects.filter((project) => project.status === "ACTIVE");
  const draftProjects = projects.filter((project) => project.status === "DRAFT");

  return (
    <section className="project-stats" aria-label="Сводка проектов">
      <article>
        <span className="project-stat-icon" aria-hidden="true">
          □
        </span>
        <strong>{projects.length}</strong>
        <p>Проектов</p>
      </article>
      <article>
        <span className="project-stat-icon" aria-hidden="true">
          ✦
        </span>
        <strong>{activeProjects.length}</strong>
        <p>Опубликовано</p>
      </article>
      <article>
        <span className="project-stat-icon" aria-hidden="true">
          ◷
        </span>
        <strong>{draftProjects.length}</strong>
        <p>Черновиков</p>
      </article>
    </section>
  );
}

function ProjectGrid({
  projects
}: {
  readonly projects: readonly ProjectSummary[];
}) {
  return (
    <section className="project-grid" aria-label="Список проектов">
      {projects.map((project) => (
        <article className="project-card" key={project.id}>
          <div>
            <p className="project-status">{project.status}</p>
            <h3>{project.name}</h3>
            <p className="project-slug">/{project.slug}</p>
          </div>
          <dl>
            <div>
              <dt>Создан</dt>
              <dd>{formatDate(project.createdAt)}</dd>
            </div>
          </dl>
          <a className="ghost-button" href={`/projects/${project.id}`}>
            Открыть
          </a>
        </article>
      ))}
    </section>
  );
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium"
  }).format(new Date(date));
}
