import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  DashboardView,
  type CreateProjectFormState,
  type DashboardLoadState
} from "./dashboard-view";

describe("DashboardView", () => {
  it("renders the empty projects state", () => {
    const html = renderDashboard({
      state: createReadyState([])
    });

    expect(html).toContain("Проектов еще нет");
    expect(html).toContain("Создайте первый сайт");
  });

  it("renders a project card", () => {
    const html = renderDashboard({
      state: createReadyState([
        {
          id: "project-1",
          name: "Demo Store",
          slug: "demo-store",
          status: "DRAFT",
          createdAt: "2026-01-01T00:00:00.000Z"
        }
      ])
    });

    expect(html).toContain("Demo Store");
    expect(html).toContain("/demo-store");
    expect(html).toContain("DRAFT");
    expect(html).toContain("Открыть");
  });

  it("renders the create project form", () => {
    const html = renderDashboard({
      form: {
        open: true,
        values: {
          name: "",
          slug: ""
        },
        submitting: false,
        errorMessage: undefined
      }
    });

    expect(html).toContain("Название проекта");
    expect(html).toContain("Адрес проекта");
    expect(html).toContain("Создать");
  });

  it("renders an error message", () => {
    const html = renderDashboard({
      form: {
        open: true,
        values: {
          name: "Demo Store",
          slug: "demo-store"
        },
        submitting: false,
        errorMessage: "Project slug already exists."
      }
    });

    expect(html).toContain("Project slug already exists.");
  });
});

function renderDashboard(input: {
  readonly state?: DashboardLoadState;
  readonly form?: CreateProjectFormState;
}): string {
  return renderToStaticMarkup(
    React.createElement(DashboardView, {
      state: input.state ?? createReadyState([]),
      form: input.form ?? createClosedForm(),
      onOpenCreateForm: () => undefined,
      onCloseCreateForm: () => undefined,
      onFormChange: () => undefined,
      onSubmitCreateProject: () => undefined
    })
  );
}

function createReadyState(
  projects: Extract<DashboardLoadState, { readonly status: "ready" }>["projects"]
): DashboardLoadState {
  return {
    status: "ready",
    me: {
      id: "user-1",
      email: "owner@example.com",
      displayName: "Demo Owner",
      activeOrganization: {
        id: "org-1",
        name: "Demo Brand",
        slug: "demo-brand"
      },
      role: "OWNER"
    },
    projects
  };
}

function createClosedForm(): CreateProjectFormState {
  return {
    open: false,
    values: {
      name: "",
      slug: ""
    },
    submitting: false,
    errorMessage: undefined
  };
}
