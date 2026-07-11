import { describe, expect, it } from "vitest";
import { createEmptyPageDocument } from "@site-platform/editor-core";
import {
  addBlock,
  createEditorState,
  markSaveError,
  markSaved,
  removeSelectedBlock,
  selectBlock,
  updateSelectedBlockProps
} from "./page-editor-state";

describe("page editor state", () => {
  it("tracks dirty state after adding a heading", () => {
    const state = addBlock(createState(), "heading");

    expect(state.document.root.children[0]?.type).toBe("heading");
    expect(state.saveStatus).toBe("dirty");
    expect(state.selectedBlockId).toBe(state.document.root.children[0]?.id);
  });

  it("updates selected block text", () => {
    const state = addBlock(createState(), "heading");
    const nextState = updateSelectedBlockProps(state, {
      text: "Updated heading"
    });

    expect(nextState.document.root.children[0]).toMatchObject({
      props: {
        text: "Updated heading"
      }
    });
  });

  it("selects a block", () => {
    const state = addBlock(createState(), "heading");
    const blockId = state.document.root.children[0]?.id;

    if (blockId === undefined) {
      throw new Error("Expected block.");
    }

    expect(selectBlock(state, blockId).selectedBlockId).toBe(blockId);
  });

  it("clears selection when removing the selected block", () => {
    const state = addBlock(createState(), "text");
    const nextState = removeSelectedBlock(state);

    expect(nextState.document.root.children).toHaveLength(0);
    expect(nextState.selectedBlockId).toBeNull();
  });

  it("resets dirty state after save success", () => {
    const dirtyState = addBlock(createState(), "spacer");
    const savedState = markSaved(dirtyState, {
      pageId: "page-1",
      schemaVersion: 1,
      revision: 2,
      document: dirtyState.document
    });

    expect(savedState.saveStatus).toBe("saved");
    expect(savedState.revision).toBe(2);
  });

  it("stores conflict error state", () => {
    const state = markSaveError(
      addBlock(createState(), "heading"),
      "Документ изменился в другой вкладке."
    );

    expect(state.saveStatus).toBe("error");
    expect(state.errorMessage).toContain("другой вкладке");
  });
});

function createState() {
  return createEditorState({
    pageId: "page-1",
    schemaVersion: 1,
    revision: 1,
    document: createEmptyPageDocument()
  });
}
