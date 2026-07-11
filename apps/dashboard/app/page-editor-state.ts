import {
  createHeroSectionPreset,
  createTextSectionPreset
} from "@site-platform/block-library";
import {
  convertSectionLayout,
  createDefaultBlock,
  createDefaultSection,
  findNodeById,
  findParentNode,
  insertBlockIntoColumn,
  insertBlockIntoSection,
  insertSection,
  moveBlockWithinParent,
  moveSectionDown,
  moveSectionUp,
  removeNode,
  updateImageBlockAsset,
  updateImageBlockExternalUrl,
  updateNodeProps,
  validatePageDocument,
  type BlockNode,
  type BlockPropsByType,
  type BlockType,
  type EditorNode,
  type NodePropsByType,
  type PageDocumentV2,
  type SectionLayout
} from "@site-platform/editor-core";
import type { PageDocumentResponse } from "./dashboard-types";

export type SaveStatus = "saved" | "dirty" | "saving" | "error";

export type EditorState = {
  readonly document: PageDocumentV2;
  readonly savedDocument: PageDocumentV2;
  readonly selectedNodeId: string | null;
  readonly revision: number;
  readonly saveStatus: SaveStatus;
  readonly errorMessage: string | null;
};

export function createEditorState(response: PageDocumentResponse): EditorState {
  return {
    document: response.document,
    savedDocument: response.document,
    selectedNodeId: response.document.root.children[0]?.id ?? null,
    revision: response.revision,
    saveStatus: "saved",
    errorMessage: null
  };
}

export function selectNode(
  state: EditorState,
  nodeId: string | null
): EditorState {
  return {
    ...state,
    selectedNodeId: nodeId
  };
}

export const selectBlock = selectNode;

export function addSection(state: EditorState): EditorState {
  const section = createDefaultSection();

  return markDirty({
    ...state,
    document: insertSection(state.document, section),
    selectedNodeId: section.id
  });
}

export function addHeroSection(state: EditorState): EditorState {
  const section = createHeroSectionPreset();

  return markDirty({
    ...state,
    document: insertSection(state.document, section),
    selectedNodeId: section.id
  });
}

export function addTextSection(state: EditorState): EditorState {
  const section = createTextSectionPreset();

  return markDirty({
    ...state,
    document: insertSection(state.document, section),
    selectedNodeId: section.id
  });
}

export function addBlock(state: EditorState, type: BlockType): EditorState {
  const block = createBlockForType(type);
  const target = findInsertionTarget(state);

  if (target === null) {
    return {
      ...state,
      errorMessage: "Выберите секцию или колонку, чтобы добавить блок."
    };
  }

  const document =
    target.type === "section"
      ? insertBlockIntoSection(state.document, target.id, block)
      : insertBlockIntoColumn(state.document, target.id, block);

  return markDirty({
    ...state,
    document,
    selectedNodeId: block.id
  });
}

export function updateSelectedNodeProps<TType extends keyof NodePropsByType>(
  state: EditorState,
  props: Partial<NodePropsByType[TType]>
): EditorState {
  if (state.selectedNodeId === null) {
    return state;
  }

  return markDirty({
    ...state,
    document: updateNodeProps(state.document, state.selectedNodeId, props)
  });
}

export function updateSelectedBlockProps<TType extends BlockType>(
  state: EditorState,
  props: Partial<BlockPropsByType[TType]>
): EditorState {
  return updateSelectedNodeProps(
    state,
    props as Partial<NodePropsByType[TType]>
  );
}

export function updateSelectedImageExternalUrl(
  state: EditorState,
  src: string
): EditorState {
  if (state.selectedNodeId === null) {
    return state;
  }

  return markDirty({
    ...state,
    document: updateImageBlockExternalUrl(state.document, state.selectedNodeId, src)
  });
}

export function selectImageAssetForSelectedBlock(
  state: EditorState,
  input: {
    readonly assetId: string;
    readonly url: string;
    readonly altText: string | null;
  }
): EditorState {
  if (state.selectedNodeId === null) {
    return state;
  }

  return markDirty({
    ...state,
    document: updateImageBlockAsset(state.document, state.selectedNodeId, {
      assetId: input.assetId,
      src: input.url,
      alt: input.altText
    })
  });
}

export function convertSelectedSection(
  state: EditorState,
  layout: SectionLayout
): EditorState {
  const selected = getSelectedNode(state);
  const sectionId =
    selected?.type === "section"
      ? selected.id
      : selected === null
        ? null
        : findParentSectionId(state, selected.id);

  if (sectionId === null) {
    return state;
  }

  return markDirty({
    ...state,
    document: convertSectionLayout(state.document, sectionId, layout),
    selectedNodeId: sectionId
  });
}

export function removeSelectedNode(state: EditorState): EditorState {
  if (state.selectedNodeId === null) {
    return state;
  }

  return removeNodeById(state, state.selectedNodeId);
}

export const removeSelectedBlock = removeSelectedNode;

export function removeNodeById(state: EditorState, nodeId: string): EditorState {
  return markDirty({
    ...state,
    document: removeNode(state.document, nodeId),
    selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId
  });
}

export const removeBlockById = removeNodeById;

export function moveNode(
  state: EditorState,
  nodeId: string,
  direction: "up" | "down"
): EditorState {
  const node = findNodeById(state.document, nodeId);

  if (node === null || node.type === "page" || node.type === "column") {
    return state;
  }

  return markDirty({
    ...state,
    document:
      node.type === "section"
        ? direction === "up"
          ? moveSectionUp(state.document, nodeId)
          : moveSectionDown(state.document, nodeId)
        : moveBlockWithinParent(state.document, nodeId, direction),
    selectedNodeId: nodeId
  });
}

export const moveBlock = moveNode;

export function getSelectedNode(state: EditorState): EditorNode | null {
  return state.selectedNodeId === null
    ? null
    : findNodeById(state.document, state.selectedNodeId);
}

export function getSelectedBlock(state: EditorState): BlockNode | null {
  const node = getSelectedNode(state);

  return node !== null &&
    node.type !== "page" &&
    node.type !== "section" &&
    node.type !== "column"
    ? node
    : null;
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

function findInsertionTarget(
  state: EditorState
): { readonly type: "section" | "column"; readonly id: string } | null {
  if (state.selectedNodeId === null) {
    return null;
  }

  const selected = findNodeById(state.document, state.selectedNodeId);

  if (selected?.type === "section" && selected.props.layout === "single") {
    return {
      type: "section",
      id: selected.id
    };
  }

  if (selected?.type === "column") {
    return {
      type: "column",
      id: selected.id
    };
  }

  const parent = findParentNode(state.document, state.selectedNodeId);

  if (parent?.type === "section" && parent.props.layout === "single") {
    return {
      type: "section",
      id: parent.id
    };
  }

  if (parent?.type === "column") {
    return {
      type: "column",
      id: parent.id
    };
  }

  return null;
}

function findParentSectionId(state: EditorState, nodeId: string): string | null {
  let parent = findParentNode(state.document, nodeId);

  while (parent !== null) {
    if (parent.type === "section") {
      return parent.id;
    }

    parent = findParentNode(state.document, parent.id);
  }

  return null;
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
    case "image":
      return createDefaultBlock("image");
  }
}
