import { describe, expect, it } from "vitest";
import { createEmptyPageDocument } from "@site-platform/editor-core";
import {
  addBlock,
  addHeroSection,
  addSection,
  addTextSection,
  convertSelectedSection,
  createEditorState,
  markSaveError,
  markSaved,
  removeSelectedNode,
  selectNode,
  updateSelectedNodeProps
} from "./page-editor-state";

describe("page editor state", () => {
  it("adds a section before adding blocks", () => {
    const state = addSection(createState());

    expect(state.document.root.children[0]?.type).toBe("section");
    expect(state.saveStatus).toBe("dirty");
    expect(state.selectedNodeId).toBe(state.document.root.children[0]?.id);
  });

  it("adds hero and text section presets", () => {
    const heroState = addHeroSection(createState());
    const textState = addTextSection(heroState);

    expect(heroState.document.root.children[0]).toMatchObject({
      type: "section",
      props: {
        layout: "two-columns"
      }
    });
    expect(textState.document.root.children).toHaveLength(2);
  });

  it("adds a heading to the selected section", () => {
    const state = addBlock(addSection(createState()), "heading");
    const section = state.document.root.children[0];

    expect(section?.children[0]).toMatchObject({
      type: "heading"
    });
    expect(state.selectedNodeId).toBe(section?.children[0]?.id);
  });

  it("updates selected block text", () => {
    const state = addBlock(addSection(createState()), "heading");
    const nextState = updateSelectedNodeProps(state, {
      text: "Updated heading"
    });

    expect(nextState.document.root.children[0]?.children[0]).toMatchObject({
      props: {
        text: "Updated heading"
      }
    });
  });

  it("converts selected section and can add into a selected column", () => {
    const sectionState = addSection(createState());
    const twoColumnState = convertSelectedSection(sectionState, "two-columns");
    const columnId = twoColumnState.document.root.children[0]?.children[0]?.id;

    if (columnId === undefined) {
      throw new Error("Expected column.");
    }

    const blockState = addBlock(selectNode(twoColumnState, columnId), "image");

    expect(blockState.document.root.children[0]?.children[0]).toMatchObject({
      type: "column",
      children: [expect.objectContaining({ type: "image" })]
    });
  });

  it("selects a node", () => {
    const state = addSection(createState());
    const sectionId = state.document.root.children[0]?.id;

    if (sectionId === undefined) {
      throw new Error("Expected section.");
    }

    expect(selectNode(state, sectionId).selectedNodeId).toBe(sectionId);
  });

  it("clears selection when removing the selected node", () => {
    const state = addBlock(addSection(createState()), "text");
    const nextState = removeSelectedNode(state);

    expect(nextState.document.root.children[0]?.children).toHaveLength(0);
    expect(nextState.selectedNodeId).toBeNull();
  });

  it("resets dirty state after save success", () => {
    const dirtyState = addBlock(addSection(createState()), "spacer");
    const savedState = markSaved(dirtyState, {
      pageId: "page-1",
      schemaVersion: 2,
      revision: 2,
      document: dirtyState.document
    });

    expect(savedState.saveStatus).toBe("saved");
    expect(savedState.revision).toBe(2);
  });

  it("stores conflict error state", () => {
    const state = markSaveError(
      addBlock(addSection(createState()), "heading"),
      "Документ изменился в другой вкладке."
    );

    expect(state.saveStatus).toBe("error");
    expect(state.errorMessage).toContain("другой вкладке");
  });
});

function createState() {
  return createEditorState({
    pageId: "page-1",
    schemaVersion: 2,
    revision: 1,
    document: createEmptyPageDocument()
  });
}
