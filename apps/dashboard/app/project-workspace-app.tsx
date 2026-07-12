"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  DashboardApiError,
  createDashboardApiClient
} from "./dashboard-api-client";
import type {
  CreatePageFormValues,
  ProjectSiteSettingsResponse
} from "./dashboard-types";
import { validateCreatePageForm } from "./page-form-model";
import {
  ProjectWorkspaceView,
  type CreatePageFormState,
  type ProjectWorkspaceLoadState,
  type ProjectWorkspaceSection
} from "./project-workspace-view";

const initialPageFormValues: CreatePageFormValues = {
  title: "",
  slug: "",
  isHome: false
};

export function ProjectWorkspaceApp({
  apiUrl,
  projectId
}: {
  readonly apiUrl: string;
  readonly projectId: string;
}) {
  const apiClient = useMemo(() => createDashboardApiClient(apiUrl), [apiUrl]);
  const [state, setState] = useState<ProjectWorkspaceLoadState>({
    status: "loading"
  });
  const [activeSection, setActiveSection] =
    useState<ProjectWorkspaceSection>("pages");
  const [form, setForm] = useState<CreatePageFormState>({
    open: false,
    values: initialPageFormValues,
    submitting: false,
    errorMessage: undefined
  });

  const loadWorkspace = useCallback(async () => {
    setState({
      status: "loading"
    });

    try {
      const [project, pagesResponse, siteSettings] = await Promise.all([
        apiClient.getProject(projectId),
        apiClient.listProjectPages(projectId),
        apiClient.getProjectSiteSettings(projectId)
      ]);

      setState({
        status: "ready",
        project,
        pages: pagesResponse.pages,
        siteSettings
      });
    } catch (error) {
      setState({
        status: "error",
        message: toUserFacingError(error)
      });
    }
  }, [apiClient, projectId]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const openCreatePageForm = useCallback(() => {
    setForm((currentForm) => ({
      ...currentForm,
      open: true,
      errorMessage: undefined
    }));
  }, []);

  const closeCreatePageForm = useCallback(() => {
    setForm({
      open: false,
      values: initialPageFormValues,
      submitting: false,
      errorMessage: undefined
    });
  }, []);

  const changePageForm = useCallback((values: CreatePageFormValues) => {
    setForm((currentForm) => ({
      ...currentForm,
      values,
      errorMessage: undefined
    }));
  }, []);

  const submitCreatePage = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const validation = validateCreatePageForm(form.values);

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
        await apiClient.createProjectPage(projectId, validation.values);
        const pagesResponse = await apiClient.listProjectPages(projectId);

        setState((currentState) => {
          if (currentState.status !== "ready") {
            return currentState;
          }

          return {
            ...currentState,
            pages: pagesResponse.pages
          };
        });

        setForm({
          open: false,
          values: initialPageFormValues,
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
    [apiClient, form.values, projectId]
  );

  const updateSiteSettings = useCallback(
    async (settings: ProjectSiteSettingsResponse): Promise<boolean> => {
      try {
        const updated = await apiClient.updateProjectSiteSettings(projectId, settings);

        setState((currentState) =>
          currentState.status !== "ready"
            ? currentState
            : {
                ...currentState,
                siteSettings: updated
              }
        );

        return true;
      } catch (error) {
        window.alert(toUserFacingError(error));
        return false;
      }
    },
    [apiClient, projectId]
  );

  return (
    <ProjectWorkspaceView
      state={state}
      activeSection={activeSection}
      form={form}
      onSelectSection={setActiveSection}
      onOpenCreatePageForm={openCreatePageForm}
      onCloseCreatePageForm={closeCreatePageForm}
      onPageFormChange={changePageForm}
      onSubmitCreatePage={submitCreatePage}
      onUpdateSiteSettings={updateSiteSettings}
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
