import { describe, expect, it } from "vitest";
import {
  PAGE_DOCUMENT_SCHEMA_VERSION,
  PageDocumentMigrationError,
  convertSectionLayout,
  createDefaultBlock,
  createDefaultSection,
  createEmptyPageDocument,
  detectPageDocumentVersion,
  findBlockById,
  findNodeById,
  findParentNode,
  insertBlock,
  insertBlockIntoColumn,
  insertBlockIntoSection,
  insertSection,
  migratePageDocumentToLatest,
  migratePageDocumentV1ToV2,
  moveBlockDown,
  moveBlockToColumn,
  moveBlockUp,
  moveSectionDown,
  moveSectionUp,
  removeNode,
  removeSection,
  collectPageDocumentImageAssetIds,
  updateImageBlockAsset,
  updateImageBlockExternalUrl,
  updateBlockProps,
  updateNodeProps,
  updateSectionProps,
  validatePageDocument,
  type PageDocumentV1,
  type PageDocumentV2
} from "./index";

describe("@site-platform/editor-core", () => {
  it("validates an empty V2 document", () => {
    expect(validatePageDocument(createEmptyPageDocument())).toMatchObject({
      ok: true
    });
  });

  it("rejects unknown block types", () => {
    expect(
      validatePageDocument({
        schemaVersion: 2,
        root: {
          id: "root",
          type: "page",
          children: [
            {
              id: "section-1",
              type: "section",
              props: defaultSectionProps(),
              children: [
                {
                  id: "unknown-1",
                  type: "unknown",
                  props: {}
                }
              ]
            }
          ]
        }
      })
    ).toMatchObject({
      ok: false
    });
  });

  it("rejects duplicate ids across the whole tree", () => {
    const document = createDocumentWithSingleSection([
      {
        ...createDefaultBlock("heading"),
        id: "duplicate"
      },
      {
        ...createDefaultBlock("text"),
        id: "duplicate"
      }
    ]);

    expect(validatePageDocument(document)).toMatchObject({
      ok: false
    });
  });

  it("migrates V1 flat children into one deterministic section", () => {
    const legacyBlock = {
      ...createDefaultBlock("heading"),
      id: "heading-1"
    };
    const legacyDocument: PageDocumentV1 = {
      schemaVersion: 1,
      root: {
        id: "root",
        type: "page",
        children: [legacyBlock]
      }
    };

    const migrated = migratePageDocumentV1ToV2(legacyDocument);

    expect(migrated.schemaVersion).toBe(PAGE_DOCUMENT_SCHEMA_VERSION);
    expect(migrated.root.children).toHaveLength(1);
    expect(migrated.root.children[0]).toMatchObject({
      id: "root-section-v2",
      type: "section",
      props: defaultSectionProps()
    });
    expect(migrated.root.children[0]?.children[0]?.id).toBe("heading-1");
    expect(legacyDocument.root.children[0]).toBe(legacyBlock);
  });

  it("keeps V2 migration idempotent", () => {
    const document = insertBlock(createEmptyPageDocument(), createDefaultBlock("text"));

    expect(migratePageDocumentToLatest(document)).toEqual({
      ok: true,
      document,
      migrated: false
    });
  });

  it("rejects invalid and unknown document versions", () => {
    expect(() => detectPageDocumentVersion({ schemaVersion: 99 })).toThrow(
      PageDocumentMigrationError
    );
    expect(
      migratePageDocumentToLatest({
        schemaVersion: 1,
        root: {
          id: "root",
          type: "page",
          children: [
            {
              id: "bad",
              type: "image",
              props: createDefaultBlock("image").props
            }
          ]
        }
      })
    ).toMatchObject({
      ok: false
    });
  });

  it("validates image URL and alt text rules", () => {
    expect(
      validatePageDocument(
        createDocumentWithSingleSection([
          {
            ...createDefaultBlock("image"),
            id: "draft-image"
          }
        ])
      )
    ).toMatchObject({
      ok: true
    });

    expect(
      validatePageDocument(
        createDocumentWithSingleSection([
          {
            ...createDefaultBlock("image"),
            id: "bad-image",
            props: {
              ...createDefaultBlock("image").props,
              src: "javascript:alert(1)",
              alt: "Bad"
            }
          }
        ])
      )
    ).toMatchObject({
      ok: false
    });

    expect(
      validatePageDocument(
        createDocumentWithSingleSection([
          {
            ...createDefaultBlock("image"),
            id: "missing-alt",
            props: {
              ...createDefaultBlock("image").props,
              src: "https://example.com/image.jpg",
              alt: ""
            }
          }
        ])
      )
    ).toMatchObject({
      ok: false
    });
  });

  it("validates product card and draft product grid blocks", () => {
    const document = createDocumentWithSingleSection([
      createDefaultBlock("product-card"),
      {
        ...createDefaultBlock("product-grid"),
        props: {
          ...createDefaultBlock("product-grid").props,
          selection: "selected",
          productIds: []
        }
      }
    ]);

    expect(validatePageDocument(document)).toMatchObject({
      ok: true
    });
  });

  it("collects image asset ids and clears assetId when switching to external URL", () => {
    const document = insertBlock(createEmptyPageDocument(), {
      ...createDefaultBlock("image"),
      id: "image-1",
      props: {
        ...createDefaultBlock("image").props,
        assetId: "asset-1",
        src: "https://api.example.test/api/projects/project-a/media/asset-1/content",
        alt: "Library asset"
      }
    });

    expect(collectPageDocumentImageAssetIds(document)).toEqual(["asset-1"]);

    const updated = updateImageBlockExternalUrl(
      document,
      "image-1",
      "https://example.com/image.png"
    );
    const image = findBlockById(updated, "image-1");

    expect(image).toMatchObject({
      type: "image",
      props: {
        src: "https://example.com/image.png"
      }
    });
    expect(image?.type === "image" ? image.props.assetId : undefined).toBeUndefined();
  });

  it("sets image asset data and preserves existing alt text", () => {
    const document = insertBlock(createEmptyPageDocument(), {
      ...createDefaultBlock("image"),
      id: "image-1",
      props: {
        ...createDefaultBlock("image").props,
        alt: "Existing alt"
      }
    });

    const updated = updateImageBlockAsset(document, "image-1", {
      assetId: "asset-1",
      src: "https://api.example.test/api/projects/project-a/media/asset-1/content",
      alt: "Asset alt"
    });
    const image = findBlockById(updated, "image-1");

    expect(image).toMatchObject({
      type: "image",
      props: {
        assetId: "asset-1",
        alt: "Existing alt"
      }
    });
  });

  it("enforces root, section and column nesting rules", () => {
    expect(
      validatePageDocument({
        schemaVersion: 2,
        root: {
          id: "root",
          type: "page",
          children: [
            {
              ...createDefaultBlock("heading"),
              id: "not-section"
            }
          ]
        }
      })
    ).toMatchObject({
      ok: false
    });

    expect(
      validatePageDocument({
        schemaVersion: 2,
        root: {
          id: "root",
          type: "page",
          children: [
            {
              id: "section-1",
              type: "section",
              props: {
                ...defaultSectionProps(),
                layout: "two-columns"
              },
              children: [
                {
                  ...createDefaultBlock("text"),
                  id: "text-1"
                }
              ]
            }
          ]
        }
      })
    ).toMatchObject({
      ok: false
    });
  });

  it("inserts and removes sections immutably", () => {
    const document = createEmptyPageDocument();
    const section = {
      ...createDefaultSection(),
      id: "section-1"
    };
    const nextDocument = insertSection(document, section);

    expect(document.root.children).toHaveLength(0);
    expect(nextDocument.root.children).toHaveLength(1);
    expect(removeSection(nextDocument, "section-1").root.children).toHaveLength(0);
  });

  it("moves sections up and down", () => {
    const first = {
      ...createDefaultSection(),
      id: "first"
    };
    const second = {
      ...createDefaultSection(),
      id: "second"
    };
    const document = insertSection(insertSection(createEmptyPageDocument(), first), second);

    const movedUp = moveSectionUp(document, "second");
    expect(movedUp.root.children.map((section) => section.id)).toEqual([
      "second",
      "first"
    ]);

    const movedDown = moveSectionDown(movedUp, "second");
    expect(movedDown.root.children.map((section) => section.id)).toEqual([
      "first",
      "second"
    ]);
  });

  it("converts section layouts without losing leaf blocks", () => {
    const block = {
      ...createDefaultBlock("text"),
      id: "text-1"
    };
    const document = insertBlockIntoSection(
      insertSection(createEmptyPageDocument(), {
        ...createDefaultSection(),
        id: "section-1"
      }),
      "section-1",
      block
    );

    const twoColumns = convertSectionLayout(document, "section-1", "two-columns");
    const section = twoColumns.root.children[0];

    expect(section?.props.layout).toBe("two-columns");
    expect(section?.children[0]?.type).toBe("column");
    expect(findBlockById(twoColumns, "text-1")).toMatchObject({
      id: "text-1"
    });

    const single = convertSectionLayout(twoColumns, "section-1", "single");
    expect(single.root.children[0]?.props.layout).toBe("single");
    expect(single.root.children[0]?.children.map((child) => child.id)).toEqual([
      "text-1"
    ]);
  });

  it("finds nodes and parent nodes in the tree", () => {
    const document = convertSectionLayout(
      insertSection(createEmptyPageDocument(), {
        ...createDefaultSection(),
        id: "section-1"
      }),
      "section-1",
      "two-columns"
    );
    const columnId = document.root.children[0]?.children[0]?.id ?? "";

    expect(findNodeById(document, "section-1")).toMatchObject({
      type: "section"
    });
    expect(findParentNode(document, columnId)).toMatchObject({
      id: "section-1"
    });
  });

  it("moves blocks within parents and to columns", () => {
    const first = {
      ...createDefaultBlock("heading"),
      id: "first"
    };
    const second = {
      ...createDefaultBlock("text"),
      id: "second"
    };
    const document = insertBlock(insertBlock(createEmptyPageDocument(), first), second);

    const movedUp = moveBlockUp(document, second.id);
    expect(movedUp.root.children[0]?.children.map((block) => block.id)).toEqual([
      "second",
      "first"
    ]);

    const movedDown = moveBlockDown(movedUp, second.id);
    expect(movedDown.root.children[0]?.children.map((block) => block.id)).toEqual([
      "first",
      "second"
    ]);

    const twoColumns = convertSectionLayout(movedDown, "root-section-v2", "two-columns");
    const targetColumnId = twoColumns.root.children[0]?.children[1]?.id ?? "";
    const movedToColumn = moveBlockToColumn(twoColumns, "first", targetColumnId);
    const targetColumn = findNodeById(movedToColumn, targetColumnId);

    expect(targetColumn).toMatchObject({
      type: "column",
      children: expect.arrayContaining([
        expect.objectContaining({
          id: "first"
        })
      ])
    });
  });

  it("updates section, node and block props", () => {
    const block = {
      ...createDefaultBlock("heading"),
      id: "heading-1"
    };
    const document = insertBlock(createEmptyPageDocument(), block);
    const withSectionProps = updateSectionProps(document, "root-section-v2", {
      background: "muted"
    });
    const withBlockProps = updateBlockProps(withSectionProps, "heading-1", {
      text: "Updated"
    });
    const withNodeProps = updateNodeProps(withBlockProps, "heading-1", {
      align: "center"
    });

    expect(withNodeProps.root.children[0]?.props.background).toBe("muted");
    expect(findBlockById(withNodeProps, "heading-1")).toMatchObject({
      props: {
        text: "Updated",
        align: "center"
      }
    });
  });

  it("inserts into columns and removes any non-root node", () => {
    const document = convertSectionLayout(
      insertSection(createEmptyPageDocument(), {
        ...createDefaultSection(),
        id: "section-1"
      }),
      "section-1",
      "two-columns"
    );
    const columnId = document.root.children[0]?.children[0]?.id ?? "";
    const block = {
      ...createDefaultBlock("text"),
      id: "text-1"
    };
    const withBlock = insertBlockIntoColumn(document, columnId, block);

    expect(findBlockById(withBlock, "text-1")).toMatchObject({
      id: "text-1"
    });
    expect(removeNode(withBlock, "text-1")).toMatchObject({
      root: {
        children: [
          expect.objectContaining({
            children: [
              expect.objectContaining({
                children: []
              }),
              expect.objectContaining({
                children: []
              })
            ]
          })
        ]
      }
    });
  });

  it("creates valid default blocks", () => {
    for (const type of ["heading", "text", "button", "spacer", "image"] as const) {
      const document = insertBlock(createEmptyPageDocument(), createDefaultBlock(type));

      expect(validatePageDocument(document)).toMatchObject({
        ok: true
      });
    }
  });
});

function createDocumentWithSingleSection(
  children: PageDocumentV2["root"]["children"][number]["children"]
): PageDocumentV2 {
  return {
    schemaVersion: 2,
    root: {
      id: "root",
      type: "page",
      children: [
        {
          id: "section-1",
          type: "section",
          props: defaultSectionProps(),
          children
        }
      ]
    }
  };
}

function defaultSectionProps() {
  return {
    background: "white",
    paddingY: "medium",
    contentWidth: "standard",
    layout: "single",
    columnRatio: "50-50",
    verticalAlign: "start"
  } as const;
}
