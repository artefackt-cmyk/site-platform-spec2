"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DashboardApiError,
  createDashboardApiClient
} from "./dashboard-api-client";
import {
  validatePreviewDocument,
  type PreviewViewportMode
} from "./page-preview-model";
import { PagePreviewView, type PagePreviewLoadState } from "./page-preview-view";

export function PagePreviewApp({
  apiUrl,
  projectId,
  siteId,
  pageId
}: {
  readonly apiUrl: string;
  readonly projectId: string;
  readonly siteId?: string;
  readonly pageId: string;
}) {
  const apiClient = useMemo(() => createDashboardApiClient(apiUrl), [apiUrl]);
  const [state, setState] = useState<PagePreviewLoadState>({
    status: "loading"
  });
  const [viewportMode, setViewportMode] =
    useState<PreviewViewportMode>("desktop");

  const loadPreview = useCallback(async () => {
    setState({
      status: "loading"
    });

    try {
      const [project, page, pageDocument] = await Promise.all([
        apiClient.getProject(projectId),
        siteId === undefined
          ? apiClient.getProjectPage(projectId, pageId)
          : apiClient.getSitePage(projectId, siteId, pageId),
        siteId === undefined
          ? apiClient.getProjectPageDocument(projectId, pageId)
          : apiClient.getSitePageDocument(projectId, siteId, pageId)
      ]);
      const documentValidation = validatePreviewDocument(pageDocument);

      if (!documentValidation.ok) {
        setState({
          status: "error",
          title: "Документ не открыт",
          message: documentValidation.message
        });
        return;
      }

      setState({
        status: "ready",
        project,
        siteId,
        page,
        document: documentValidation.document
      });
    } catch (error) {
      setState(toPreviewErrorState(error));
    }
  }, [apiClient, pageId, projectId, siteId]);

  useEffect(() => {
    void loadPreview();
  }, [loadPreview]);

  return (
    <PagePreviewView
      state={state}
      viewportMode={viewportMode}
      onViewportModeChange={setViewportMode}
    />
  );
}

function toPreviewErrorState(error: unknown): PagePreviewLoadState {
  if (error instanceof DashboardApiError && error.status === 404) {
    return {
      status: "error",
      title: "Страница не найдена",
      message: "Страница не найдена или недоступна в текущей организации."
    };
  }

  if (error instanceof DashboardApiError) {
    return {
      status: "error",
      title: "API недоступно",
      message: error.message
    };
  }

  return {
    status: "error",
    title: "API недоступно",
    message: "Не удалось загрузить предпросмотр страницы."
  };
}
