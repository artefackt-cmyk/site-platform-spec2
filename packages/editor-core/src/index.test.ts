import { describe, expect, it } from "vitest";
import {
  createDefaultBlock,
  createEmptyPageDocument,
  findBlockById,
  insertBlock,
  moveBlockDown,
  moveBlockUp,
  removeBlock,
  updateBlockProps,
  validatePageDocument,
  type PageDocumentV1
} from "./index";

describe("@site-platform/editor-core", () => {
  it("validates an empty document", () => {
    expect(validatePageDocument(createEmptyPageDocument())).toMatchObject({
      ok: true
    });
  });

  it("rejects unknown block types", () => {
    expect(
      validatePageDocument({
        schemaVersion: 1,
        root: {
          id: "root",
          type: "page",
          children: [
            {
              id: "unknown-1",
              type: "unknown",
              props: {}
            }
          ]
        }
      })
    ).toMatchObject({
      ok: false
    });
  });

  it("rejects duplicate block ids", () => {
    const block = {
      ...createDefaultBlock("heading"),
      id: "duplicate"
    };

    expect(
      validatePageDocument(
        insertBlock(insertBlock(createEmptyPageDocument(), block), {
          ...block,
          props: {
            ...block.props,
            text: "Copy"
          }
        })
      )
    ).toMatchObject({
      ok: false
    });
  });

  it("inserts blocks immutably", () => {
    const document = createEmptyPageDocument();
    const block = createDefaultBlock("heading");
    const nextDocument = insertBlock(document, block);

    expect(document.root.children).toHaveLength(0);
    expect(nextDocument.root.children).toHaveLength(1);
    expect(nextDocument.root.children[0]).toBe(block);
  });

  it("updates block props immutably", () => {
    const block = createDefaultBlock("heading");
    const document = insertBlock(createEmptyPageDocument(), block);
    const nextDocument = updateBlockProps(document, block.id, {
      text: "Updated"
    });

    expect(findBlockById(document, block.id)).toMatchObject({
      props: {
        text: "Новый заголовок"
      }
    });
    expect(findBlockById(nextDocument, block.id)).toMatchObject({
      props: {
        text: "Updated"
      }
    });
  });

  it("removes blocks", () => {
    const block = createDefaultBlock("text");
    const document = insertBlock(createEmptyPageDocument(), block);

    expect(removeBlock(document, block.id).root.children).toHaveLength(0);
  });

  it("moves blocks up and down", () => {
    const first = {
      ...createDefaultBlock("heading"),
      id: "first"
    };
    const second = {
      ...createDefaultBlock("text"),
      id: "second"
    };
    const document: PageDocumentV1 = insertBlock(
      insertBlock(createEmptyPageDocument(), first),
      second
    );

    const movedUp = moveBlockUp(document, second.id);
    expect(movedUp.root.children.map((block) => block.id)).toEqual([
      "second",
      "first"
    ]);

    const movedDown = moveBlockDown(movedUp, second.id);
    expect(movedDown.root.children.map((block) => block.id)).toEqual([
      "first",
      "second"
    ]);
  });

  it("creates valid default blocks", () => {
    for (const type of ["heading", "text", "button", "spacer"] as const) {
      const document = insertBlock(createEmptyPageDocument(), createDefaultBlock(type));

      expect(validatePageDocument(document)).toMatchObject({
        ok: true
      });
    }
  });
});
