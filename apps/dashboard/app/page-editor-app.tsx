"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { BlockPropsByType, BlockType } from "@site-platform/editor-core";
import {
  DashboardApiError,
  createDashboardApiClient
} from "./dashboard-api-client";
import { PageEditorView, type PageEditorLoadState } from "./page-editor-view";
import {
  addBlock,
  canSaveEditorState,
  createEditorState,
  markSaveError,
  markSaved,
  markSaving,
  moveBlock,
  removeBlockById,
  selectBlock,
  updateSelectedBlockProps
} from "./page-editor-state";

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

  const save = useCallback(async () => {
    if (state.status !== "ready" || !canSaveEditorState(state.editor)) {
      return;
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
        schemaVersion: 1,
        revision: snapshot.revision,
        document: snapshot.document
      });

      updateEditor((editor) => markSaved(editor, response));
    } catch (error) {
      updateEditor((editor) =>
        markSaveError(editor, toSaveErrorMessage(error))
      );
    }
  }, [apiClient, pageId, projectId, state, updateEditor]);

  return (
    <PageEditorView
      state={state}
      onAddBlock={(type: BlockType) => updateEditor((editor) => addBlock(editor, type))}
      onSelectBlock={(blockId) =>
        updateEditor((editor) => selectBlock(editor, blockId))
      }
      onMoveBlock={(blockId, direction) =>
        updateEditor((editor) => moveBlock(editor, blockId, direction))
      }
      onRemoveBlock={(blockId) =>
        updateEditor((editor) => removeBlockById(editor, blockId))
      }
      onUpdateHeading={(props: Partial<BlockPropsByType["heading"]>) =>
        updateEditor((editor) => updateSelectedBlockProps(editor, props))
      }
      onUpdateText={(props: Partial<BlockPropsByType["text"]>) =>
        updateEditor((editor) => updateSelectedBlockProps(editor, props))
      }
      onUpdateButton={(props: Partial<BlockPropsByType["button"]>) =>
        updateEditor((editor) => updateSelectedBlockProps(editor, props))
      }
      onUpdateSpacer={(props: Partial<BlockPropsByType["spacer"]>) =>
        updateEditor((editor) => updateSelectedBlockProps(editor, props))
      }
      onSave={save}
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
