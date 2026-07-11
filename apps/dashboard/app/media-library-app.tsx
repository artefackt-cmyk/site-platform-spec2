"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { MediaAssetSummary, ProjectSummary } from "./dashboard-types";
import {
  DashboardApiError,
  createDashboardApiClient
} from "./dashboard-api-client";
import { MediaLibraryView } from "./media-library-view";

export type MediaLibraryState =
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
      readonly assets: readonly MediaAssetSummary[];
      readonly uploading: boolean;
      readonly errorMessage: string | null;
      readonly successMessage: string | null;
    };

export function MediaLibraryApp({
  apiUrl,
  projectId
}: {
  readonly apiUrl: string;
  readonly projectId: string;
}) {
  const apiClient = useMemo(() => createDashboardApiClient(apiUrl), [apiUrl]);
  const [state, setState] = useState<MediaLibraryState>({
    status: "loading"
  });

  const load = useCallback(async () => {
    setState({
      status: "loading"
    });

    try {
      const [project, media] = await Promise.all([
        apiClient.getProject(projectId),
        apiClient.listProjectMedia(projectId)
      ]);

      setState({
        status: "ready",
        project,
        assets: media.assets,
        uploading: false,
        errorMessage: null,
        successMessage: null
      });
    } catch (error) {
      setState({
        status: "error",
        message: toUserFacingError(error)
      });
    }
  }, [apiClient, projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const upload = useCallback(
    async (file: File) => {
      setState((current) =>
        current.status !== "ready"
          ? current
          : {
              ...current,
              uploading: true,
              errorMessage: null,
              successMessage: null
            }
      );

      try {
        const response = await apiClient.uploadProjectMedia(projectId, {
          file
        });

        setState((current) =>
          current.status !== "ready"
            ? current
            : {
                ...current,
                assets: [response.asset, ...current.assets],
                uploading: false,
                successMessage: "Изображение загружено.",
                errorMessage: null
              }
        );
      } catch (error) {
        setState((current) =>
          current.status !== "ready"
            ? current
            : {
                ...current,
                uploading: false,
                errorMessage: toUserFacingError(error),
                successMessage: null
              }
        );
      }
    },
    [apiClient, projectId]
  );

  const updateAlt = useCallback(
    async (assetId: string, altText: string) => {
      try {
        const response = await apiClient.updateProjectMedia(projectId, assetId, {
          altText
        });

        setState((current) =>
          current.status !== "ready"
            ? current
            : {
                ...current,
                assets: current.assets.map((asset) =>
                  asset.id === assetId ? response.asset : asset
                ),
                successMessage: "Alt обновлен.",
                errorMessage: null
              }
        );
      } catch (error) {
        setState((current) =>
          current.status !== "ready"
            ? current
            : {
                ...current,
                errorMessage: toUserFacingError(error),
                successMessage: null
              }
        );
      }
    },
    [apiClient, projectId]
  );

  const deleteAsset = useCallback(
    async (assetId: string) => {
      try {
        await apiClient.deleteProjectMedia(projectId, assetId);

        setState((current) =>
          current.status !== "ready"
            ? current
            : {
                ...current,
                assets: current.assets.filter((asset) => asset.id !== assetId),
                successMessage: "Файл удален.",
                errorMessage: null
              }
        );
      } catch (error) {
        setState((current) =>
          current.status !== "ready"
            ? current
            : {
                ...current,
                errorMessage: toUserFacingError(error),
                successMessage: null
              }
        );
      }
    },
    [apiClient, projectId]
  );

  return (
    <MediaLibraryView
      state={state}
      onUpload={upload}
      onUpdateAlt={updateAlt}
      onDelete={deleteAsset}
    />
  );
}

function toUserFacingError(error: unknown): string {
  if (error instanceof DashboardApiError) {
    if (error.code === "MEDIA_ASSET_IN_USE") {
      return "Файл используется на страницах проекта и не может быть удален.";
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Не удалось выполнить действие.";
}
