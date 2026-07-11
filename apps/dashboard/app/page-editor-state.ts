import {
  createDefaultBlock,
  findBlockById,
  insertBlock,
  moveBlockDown,
  moveBlockUp,
  removeBlock,
  updateBlockProps,
  validatePageDocument,
  type BlockNode,
  type BlockPropsByType,
  type BlockType,
  type PageDocumentV1
} from "@site-platform/editor-core";
import type { PageDocumentResponse } from "./dashboard-types";

export type SaveStatus = "saved" | "dirty" | "saving" | "error";

export type EditorState = {
  readonly document: PageDocumentV1;
  readonly savedDocument: PageDocumentV1;
  readonly selectedBlockId: string | null;
  readonly revision: number;
  readonly saveStatus: SaveStatus;
  readonly errorMessage: string | null;
};

export function createEditorState(response: PageDocumentResponse): EditorState {
  return {
    document: response.document,
    savedDocument: response.document,
    selectedBlockId: response.document.root.children[0]?.id ?? null,
    revision: response.revision,
    saveStatus: "saved",
    errorMessage: null
  };
}

export function selectBlock(
  state: EditorState,
  blockId: string | null
): EditorState {
  return {
    ...state,
    selectedBlockId: blockId
  };
}

export function addBlock(state: EditorState, type: BlockType): EditorState {
  const block = createBlockForType(type);

  return markDirty({
    ...state,
    document: insertBlock(state.document, block),
    selectedBlockId: block.id
  });
}

export function updateSelectedBlockProps<TType extends BlockType>(
  state: EditorState,
  props: Partial<BlockPropsByType[TType]>
): EditorState {
  if (state.selectedBlockId === null) {
    return state;
  }

  return markDirty({
    ...state,
    document: updateBlockProps(state.document, state.selectedBlockId, props)
  });
}

export function removeSelectedBlock(state: EditorState): EditorState {
  if (state.selectedBlockId === null) {
    return state;
  }

  return markDirty({
    ...state,
    document: removeBlock(state.document, state.selectedBlockId),
    selectedBlockId: null
  });
}

export function removeBlockById(state: EditorState, blockId: string): EditorState {
  return markDirty({
    ...state,
    document: removeBlock(state.document, blockId),
    selectedBlockId: state.selectedBlockId === blockId ? null : state.selectedBlockId
  });
}

export function moveBlock(
  state: EditorState,
  blockId: string,
  direction: "up" | "down"
): EditorState {
  return markDirty({
    ...state,
    document:
      direction === "up"
        ? moveBlockUp(state.document, blockId)
        : moveBlockDown(state.document, blockId),
    selectedBlockId: blockId
  });
}

export function getSelectedBlock(state: EditorState): BlockNode | null {
  return state.selectedBlockId === null
    ? null
    : findBlockById(state.document, state.selectedBlockId);
}

export function markSaving(state: EditorState): EditorState {
  return {
    ...state,
    saveStatus: "saving",
    errorMessage: null
  };
}

export function markSaved(
  state: EditorState,
  response: PageDocumentResponse
): EditorState {
  return {
    ...state,
    document: response.document,
    savedDocument: response.document,
    revision: response.revision,
    saveStatus: "saved",
    errorMessage: null
  };
}

export function markSaveError(
  state: EditorState,
  message: string
): EditorState {
  return {
    ...state,
    saveStatus: "error",
    errorMessage: message
  };
}

export function canSaveEditorState(state: EditorState): boolean {
  return state.saveStatus !== "saving" && validatePageDocument(state.document).ok;
}

function markDirty(state: EditorState): EditorState {
  return {
    ...state,
    saveStatus: "dirty",
    errorMessage: null
  };
}

function createBlockForType(type: BlockType): BlockNode {
  switch (type) {
    case "heading":
      return createDefaultBlock("heading");
    case "text":
      return createDefaultBlock("text");
    case "button":
      return createDefaultBlock("button");
    case "spacer":
      return createDefaultBlock("spacer");
  }
}
