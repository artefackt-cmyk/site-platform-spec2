"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  BlockPropsByType,
  BlockType,
  NodePropsByType,
  SectionLayout
} from "@site-platform/editor-core";
import type { MediaAssetSummary } from "./dashboard-types";
import {
  DashboardApiError,
  createDashboardApiClient
} from "./dashboard-api-client";
import { PageEditorView, type PageEditorLoadState } from "./page-editor-view";
import {
  addBlock,
  addHeroSection,
  addSection,
  addTextSection,
  canSaveEditorState,
  convertSelectedSection,
  createEditorState,
  markSaveError,
  markSaved,
  markSaving,
  moveNode,
  removeNodeById,
  selectNode,
  selectImageAssetForSelectedBlock,
  updateSelectedImageExternalUrl,
  updateSelectedNodeProps
} from "./page-editor-state";
import {
  openSavedPreview,
  saveAndOpenPreview,
  shouldWarnBeforePreview
} from "./page-editor-preview-flow";

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
  const [previewWarningOpen, setPreviewWarningOpen] = useState(false);
  const [mediaPicker, setMediaPicker] = useState({
    open: false,
    assets: [] as readonly MediaAssetSummary[],
    loading: false,
    uploading: false,
    errorMessage: null as string | null
  });

  const loadPage = useCallback(async () => {
    setState({
      status: "loading"
    });

    try {
      const [project, page, pageDocument] = await Promise.all([
        apiClient.getProject(projectId),
        apiClient.getProjectPage(projectId, pageId),
        apiClient.getProjectPageDocument(projectId, pageId)
      ]);

      setState({
        status: "ready",
        project,
        page,
        editor: createEditorState(pageDocument)
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

  const updateEditor = useCallback(
    (updater: (editor: Extract<PageEditorLoadState, { status: "ready" }>["editor"]) => Extract<PageEditorLoadState, { status: "ready" }>["editor"]) => {
      setState((currentState) => {
        if (currentState.status !== "ready") {
          return currentState;
        }

        return {
          ...currentState,
          editor: updater(currentState.editor)
        };
      });
    },
    []
  );

  const save = useCallback(async (): Promise<boolean> => {
    if (state.status !== "ready" || !canSaveEditorState(state.editor)) {
      return false;
    }

    const snapshot = {
      document: state.editor.document,
      revision: state.editor.revision
    };

    setState((currentState) => {
      if (currentState.status !== "ready") {
        return currentState;
      }

      return {
        ...currentState,
        editor: markSaving(currentState.editor)
      };
    });

    try {
      const response = await apiClient.saveProjectPageDocument(projectId, pageId, {
        schemaVersion: 2,
        revision: snapshot.revision,
        document: snapshot.document
      });

      updateEditor((editor) => markSaved(editor, response));
      return true;
    } catch (error) {
      updateEditor((editor) =>
        markSaveError(editor, toSaveErrorMessage(error))
      );
      return false;
    }
  }, [apiClient, pageId, projectId, state, updateEditor]);

  const navigateToPreview = useCallback(
    (path: string) => {
      window.location.assign(path);
    },
    []
  );

  const openPreview = useCallback(() => {
    if (state.status !== "ready") {
      return;
    }

    if (shouldWarnBeforePreview(state.editor.saveStatus)) {
      setPreviewWarningOpen(true);
      return;
    }

    openSavedPreview(projectId, pageId, navigateToPreview);
  }, [navigateToPreview, pageId, projectId, state]);

  const loadMediaAssets = useCallback(async () => {
    setMediaPicker((current) => ({
      ...current,
      loading: true,
      errorMessage: null
    }));

    try {
      const response = await apiClient.listProjectMedia(projectId);

      setMediaPicker((current) => ({
        ...current,
        assets: response.assets,
        loading: false
      }));
    } catch (error) {
      setMediaPicker((current) => ({
        ...current,
        loading: false,
        errorMessage: toUserFacingError(error)
      }));
    }
  }, [apiClient, projectId]);

  const openImagePicker = useCallback(() => {
    setMediaPicker((current) => ({
      ...current,
      open: true
    }));
    void loadMediaAssets();
  }, [loadMediaAssets]);

  const uploadImageAsset = useCallback(
    async (file: File) => {
      setMediaPicker((current) => ({
        ...current,
        uploading: true,
        errorMessage: null
      }));

      try {
        const response = await apiClient.uploadProjectMedia(projectId, {
          file
        });

        setMediaPicker((current) => ({
          ...current,
          assets: [response.asset, ...current.assets],
          uploading: false
        }));
      } catch (error) {
        setMediaPicker((current) => ({
          ...current,
          uploading: false,
          errorMessage: toUserFacingError(error)
        }));
      }
    },
    [apiClient, projectId]
  );

  const selectImageAsset = useCallback(
    (asset: MediaAssetSummary) => {
      updateEditor((editor) =>
        selectImageAssetForSelectedBlock(editor, {
          assetId: asset.id,
          url: asset.url,
          altText: asset.altText ?? asset.originalFilename
        })
      );
      setMediaPicker((current) => ({
        ...current,
        open: false
      }));
    },
    [updateEditor]
  );

  const saveBeforePreview = useCallback(async () => {
    const opened = await saveAndOpenPreview({
      projectId,
      pageId,
      save,
      navigate: navigateToPreview
    });

    if (opened) {
      setPreviewWarningOpen(false);
    }
  }, [navigateToPreview, pageId, projectId, save]);

  const openSavedVersion = useCallback(() => {
    setPreviewWarningOpen(false);
    openSavedPreview(projectId, pageId, navigateToPreview);
  }, [navigateToPreview, pageId, projectId]);

  return (
    <PageEditorView
      state={state}
      onAddSection={() => updateEditor((editor) => addSection(editor))}
      onAddHeroSection={() => updateEditor((editor) => addHeroSection(editor))}
      onAddTextSection={() => updateEditor((editor) => addTextSection(editor))}
      onAddBlock={(type: BlockType) => updateEditor((editor) => addBlock(editor, type))}
      onSelectNode={(nodeId) =>
        updateEditor((editor) => selectNode(editor, nodeId))
      }
      onMoveNode={(nodeId, direction) =>
        updateEditor((editor) => moveNode(editor, nodeId, direction))
      }
      onRemoveNode={(nodeId) =>
        updateEditor((editor) => removeNodeById(editor, nodeId))
      }
      onConvertSection={(layout: SectionLayout) =>
        updateEditor((editor) => convertSelectedSection(editor, layout))
      }
      onUpdateSection={(props: Partial<NodePropsByType["section"]>) =>
        updateEditor((editor) => updateSelectedNodeProps(editor, props))
      }
      onUpdateColumn={(props: Partial<NodePropsByType["column"]>) =>
        updateEditor((editor) => updateSelectedNodeProps(editor, props))
      }
      onUpdateHeading={(props: Partial<BlockPropsByType["heading"]>) =>
        updateEditor((editor) => updateSelectedNodeProps(editor, props))
      }
      onUpdateText={(props: Partial<BlockPropsByType["text"]>) =>
        updateEditor((editor) => updateSelectedNodeProps(editor, props))
      }
      onUpdateButton={(props: Partial<BlockPropsByType["button"]>) =>
        updateEditor((editor) => updateSelectedNodeProps(editor, props))
      }
      onUpdateImage={(props: Partial<BlockPropsByType["image"]>) =>
        updateEditor((editor) =>
          props.src === undefined
            ? updateSelectedNodeProps(editor, props)
            : updateSelectedImageExternalUrl(editor, props.src)
        )
      }
      mediaPicker={mediaPicker}
      onOpenImagePicker={openImagePicker}
      onCloseImagePicker={() =>
        setMediaPicker((current) => ({
          ...current,
          open: false
        }))
      }
      onUploadImageAsset={uploadImageAsset}
      onSelectImageAsset={selectImageAsset}
      onUpdateSpacer={(props: Partial<BlockPropsByType["spacer"]>) =>
        updateEditor((editor) => updateSelectedNodeProps(editor, props))
      }
      onSave={save}
      onPreview={openPreview}
      previewWarningOpen={previewWarningOpen}
      onSaveAndPreview={saveBeforePreview}
      onOpenSavedPreview={openSavedVersion}
      onCancelPreview={() => setPreviewWarningOpen(false)}
    />
  );
}

function toSaveErrorMessage(error: unknown): string {
  if (
    error instanceof DashboardApiError &&
    error.code === "PAGE_DOCUMENT_REVISION_CONFLICT"
  ) {
    return "Документ изменился в другой вкладке. Обновите страницу и повторите изменения.";
  }

  return toUserFacingError(error);
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
