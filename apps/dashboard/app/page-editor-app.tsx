"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  BlockPropsByType,
  BlockType,
  NodePropsByType,
  SectionLayout
} from "@site-platform/editor-core";
import type { MediaAssetSummary, PublicationHistoryItem } from "./dashboard-types";
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
  duplicateSectionById,
  insertSectionAdjacent,
  markSaveError,
  markSaved,
  markSaving,
  moveNode,
  removeNodeById,
  removeSectionById,
  renameSectionById,
  selectNode,
  selectImageAssetForSelectedBlock,
  setSectionHiddenById,
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
  const [publicationHistoryOpen, setPublicationHistoryOpen] = useState(false);
  const [publicationHistory, setPublicationHistory] = useState<
    readonly PublicationHistoryItem[]
  >([]);
  const [publicationHistoryLoading, setPublicationHistoryLoading] = useState(false);
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
      const [project, page, pageDocument, publicationStatus] = await Promise.all([
        apiClient.getProject(projectId),
        apiClient.getProjectPage(projectId, pageId),
        apiClient.getProjectPageDocument(projectId, pageId),
        apiClient.getPagePublicationStatus(projectId, pageId)
      ]);
      const products = await apiClient.listProducts(projectId);

      setState({
        status: "ready",
        project,
        page,
        products: products.products,
        publicationStatus,
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

  const refreshPublicationStatus = useCallback(async () => {
    const publicationStatus = await apiClient.getPagePublicationStatus(
      projectId,
      pageId
    );

    setState((current) =>
      current.status !== "ready"
        ? current
        : {
            ...current,
            publicationStatus
          }
    );

    return publicationStatus;
  }, [apiClient, pageId, projectId]);

  const publishSavedRevision = useCallback(
    async (revision: number) => {
      const response = await apiClient.publishPage(projectId, pageId, {
        expectedRevision: revision
      });

      setState((current) =>
        current.status !== "ready"
          ? current
          : {
              ...current,
              publicationStatus: response.publicationStatus
            }
      );

      window.alert(`Страница опубликована: ${response.publicUrl}`);
    },
    [apiClient, pageId, projectId]
  );

  const updatePageSettings = useCallback(
    async (input: {
      readonly title: string;
      readonly slug: string;
      readonly isHome: boolean;
    }): Promise<boolean> => {
      try {
        const response = await apiClient.updateProjectPage(
          projectId,
          pageId,
          input
        );
        const publicationStatus = await apiClient.getPagePublicationStatus(
          projectId,
          pageId
        );

        setState((current) =>
          current.status !== "ready"
            ? current
            : {
                ...current,
                page: response.page,
                publicationStatus,
                editor: {
                  ...current.editor,
                  errorMessage: null
                }
              }
        );

        return true;
      } catch (error) {
        setState((current) =>
          current.status !== "ready"
            ? current
            : {
                ...current,
                editor: markSaveError(
                  current.editor,
                  toUserFacingError(error)
                )
              }
        );

        return false;
      }
    },
    [apiClient, pageId, projectId]
  );

  const publish = useCallback(async () => {
    if (state.status !== "ready") {
      return;
    }

    if (state.editor.saveStatus === "dirty" || state.editor.saveStatus === "error") {
      const shouldSave = window.confirm(
        "Для публикации нужно сначала сохранить изменения. Нажмите OK, чтобы сохранить и опубликовать. Нажмите Отмена, чтобы опубликовать последнюю сохранённую версию."
      );

      if (shouldSave) {
        const saved = await save();

        if (!saved) {
          return;
        }

        const refreshedStatus = await refreshPublicationStatus();
        const refreshedState = await apiClient.getProjectPageDocument(projectId, pageId);

        await publishSavedRevision(refreshedState.revision);
        if (refreshedStatus.status === "published-with-changes") {
          await refreshPublicationStatus();
        }
        return;
      }
    }

    await publishSavedRevision(state.editor.revision);
  }, [
    apiClient,
    pageId,
    projectId,
    publishSavedRevision,
    refreshPublicationStatus,
    save,
    state
  ]);

  const unpublish = useCallback(async () => {
    if (!window.confirm("Снять страницу с публикации? Публичный URL начнет возвращать 404.")) {
      return;
    }

    const response = await apiClient.unpublishPage(projectId, pageId);

    setState((current) =>
      current.status !== "ready"
        ? current
        : {
            ...current,
            publicationStatus: response.publicationStatus
          }
    );
  }, [apiClient, pageId, projectId]);

  const openPublicationHistory = useCallback(async () => {
    setPublicationHistoryOpen(true);
    setPublicationHistoryLoading(true);

    try {
      const response = await apiClient.listPagePublications(projectId, pageId);

      setPublicationHistory(response.publications);
    } finally {
      setPublicationHistoryLoading(false);
    }
  }, [apiClient, pageId, projectId]);

  const rollbackPublication = useCallback(
    async (snapshotId: string) => {
      if (
        !window.confirm(
          "Вернуть эту опубликованную версию? Draft не изменится, а публичная страница переключится на выбранную версию."
        )
      ) {
        return;
      }

      const response = await apiClient.rollbackPagePublication(
        projectId,
        pageId,
        snapshotId
      );

      setState((current) =>
        current.status !== "ready"
          ? current
          : {
              ...current,
              publicationStatus: response.publicationStatus
            }
      );
      const history = await apiClient.listPagePublications(projectId, pageId);
      setPublicationHistory(history.publications);
    },
    [apiClient, pageId, projectId]
  );

  return (
    <PageEditorView
      state={state}
      onAddSection={() => updateEditor((editor) => addSection(editor))}
      onAddHeroSection={() => updateEditor((editor) => addHeroSection(editor))}
      onAddTextSection={() => updateEditor((editor) => addTextSection(editor))}
      onInsertSection={(sectionId, position) =>
        updateEditor((editor) => insertSectionAdjacent(editor, sectionId, position))
      }
      onDuplicateSection={(sectionId) =>
        updateEditor((editor) => duplicateSectionById(editor, sectionId))
      }
      onRenameSection={(sectionId, name) =>
        updateEditor((editor) => renameSectionById(editor, sectionId, name))
      }
      onToggleSectionHidden={(sectionId, isHidden) =>
        updateEditor((editor) => setSectionHiddenById(editor, sectionId, isHidden))
      }
      onRemoveSection={(sectionId) =>
        updateEditor((editor) => removeSectionById(editor, sectionId))
      }
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
      onUpdateProductCard={(props: Partial<BlockPropsByType["product-card"]>) =>
        updateEditor((editor) => updateSelectedNodeProps(editor, props))
      }
      onUpdateProductGrid={(props: Partial<BlockPropsByType["product-grid"]>) =>
        updateEditor((editor) => updateSelectedNodeProps(editor, props))
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
      onPublish={publish}
      onUpdatePageSettings={updatePageSettings}
      onOpenPublicationHistory={openPublicationHistory}
      onUnpublish={unpublish}
      previewWarningOpen={previewWarningOpen}
      publicationHistoryOpen={publicationHistoryOpen}
      publicationHistory={publicationHistory}
      publicationHistoryLoading={publicationHistoryLoading}
      onRollbackPublication={rollbackPublication}
      onClosePublicationHistory={() => setPublicationHistoryOpen(false)}
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
