"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DashboardApiError,
  createDashboardApiClient
} from "./dashboard-api-client";
import { PageEditorView, type PageEditorLoadState } from "./page-editor-view";

export function PageEditorApp({
  apiUrl,
  projectId,
  pageId
}: {
  readonly apiUrl: string;
  readonly projectId: string;
  readonly pageId: string;
}) {
  const apiClient = useMemo(() => createDashboardApiClient(apiUrl), [apiUrl]);
  const [state, setState] = useState<PageEditorLoadState>({
    status: "loading"
  });

  const loadPage = useCallback(async () => {
    setState({
      status: "loading"
    });

    try {
      const [project, page] = await Promise.all([
        apiClient.getProject(projectId),
        apiClient.getProjectPage(projectId, pageId)
      ]);

      setState({
        status: "ready",
        project,
        page
      });
    } catch (error) {
      setState({
        status: "error",
        message: toUserFacingError(error)
      });
    }
  }, [apiClient, pageId, projectId]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  return <PageEditorView state={state} />;
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
