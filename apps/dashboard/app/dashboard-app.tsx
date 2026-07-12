"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  DashboardApiError,
  createDashboardApiClient
} from "./dashboard-api-client";
import type { CreateProjectFormValues } from "./dashboard-types";
import {
  DashboardView,
  type CreateProjectFormState,
  type DashboardLoadState
} from "./dashboard-view";
import { validateCreateProjectForm } from "./project-form-model";

const initialFormValues: CreateProjectFormValues = {
  name: "",
  slug: ""
};

export function DashboardApp({ apiUrl }: { readonly apiUrl: string }) {
  const apiClient = useMemo(() => createDashboardApiClient(apiUrl), [apiUrl]);
  const [state, setState] = useState<DashboardLoadState>({
    status: "loading"
  });
  const [form, setForm] = useState<CreateProjectFormState>({
    open: false,
    values: initialFormValues,
    submitting: false,
    errorMessage: undefined
  });
  const [logoutPending, setLogoutPending] = useState(false);

  const loadDashboard = useCallback(async () => {
    setState({
      status: "loading"
    });

    try {
      const [me, projectsResponse] = await Promise.all([
        apiClient.getSession(),
        apiClient.listProjects()
      ]);

      if (!me.onboarding.completed) {
        window.location.assign("/onboarding");
        return;
      }

      setState({
        status: "ready",
        me,
        projects: projectsResponse.projects
      });
    } catch (error) {
      if (error instanceof DashboardApiError) {
        if (error.status === 401) {
          window.location.assign("/login");
          return;
        }

        if (error.code === "AUTH_ONBOARDING_REQUIRED") {
          window.location.assign("/onboarding");
          return;
        }
      }

      setState({
        status: "error",
        message: toUserFacingError(error)
      });
    }
  }, [apiClient]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const openCreateForm = useCallback(() => {
    setForm((currentForm) => ({
      ...currentForm,
      open: true,
      errorMessage: undefined
    }));
  }, []);

  const closeCreateForm = useCallback(() => {
    setForm({
      open: false,
      values: initialFormValues,
      submitting: false,
      errorMessage: undefined
    });
  }, []);

  const changeForm = useCallback((values: CreateProjectFormValues) => {
    setForm((currentForm) => ({
      ...currentForm,
      values,
      errorMessage: undefined
    }));
  }, []);

  const submitCreateProject = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const validation = validateCreateProjectForm(form.values);

      if (!validation.ok) {
        setForm((currentForm) => ({
          ...currentForm,
          errorMessage: validation.message
        }));
        return;
      }

      setForm((currentForm) => ({
        ...currentForm,
        submitting: true,
        errorMessage: undefined
      }));

      try {
        const response = await apiClient.createProject(validation.values);

        setState((currentState) => {
          if (currentState.status !== "ready") {
            return currentState;
          }

          return {
            ...currentState,
            projects: [...currentState.projects, response.project]
          };
        });

        setForm({
          open: false,
          values: initialFormValues,
          submitting: false,
          errorMessage: undefined
        });
      } catch (error) {
        setForm((currentForm) => ({
          ...currentForm,
          submitting: false,
          errorMessage: toUserFacingError(error)
        }));
      }
    },
    [apiClient, form.values]
  );

  const logout = useCallback(async () => {
    setLogoutPending(true);

    try {
      await apiClient.logout();
      window.location.assign("/login");
    } catch (error) {
      setLogoutPending(false);
      setState({
        status: "error",
        message: toUserFacingError(error)
      });
    }
  }, [apiClient]);

  return (
    <DashboardView
      state={state}
      form={form}
      onLogout={logout}
      logoutPending={logoutPending}
      onOpenCreateForm={openCreateForm}
      onCloseCreateForm={closeCreateForm}
      onFormChange={changeForm}
      onSubmitCreateProject={submitCreateProject}
    />
  );
}

function toUserFacingError(error: unknown): string {
  if (error instanceof DashboardApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Не удалось выполнить действие.";
}
