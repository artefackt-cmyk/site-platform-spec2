import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  createEmptyPageDocument,
  insertBlock,
  type BlockNode
} from "@site-platform/editor-core";
import { PageRenderer } from "./index";

describe("@site-platform/renderer", () => {
  it("renders heading blocks", () => {
    const html = renderDocument([
      {
        id: "heading-1",
        type: "heading",
        props: {
          text: "Добро пожаловать",
          level: 1,
          align: "center"
        }
      }
    ]);

    expect(html).toContain("Добро пожаловать");
    expect(html).toContain("<h1");
  });

  it("renders text blocks", () => {
    const html = renderDocument([
      {
        id: "text-1",
        type: "text",
        props: {
          text: "Текст страницы",
          align: "left"
        }
      }
    ]);

    expect(html).toContain("Текст страницы");
  });

  it("renders button blocks", () => {
    const html = renderDocument([
      {
        id: "button-1",
        type: "button",
        props: {
          label: "Перейти",
          href: "/catalog",
          align: "left",
          variant: "primary"
        }
      }
    ]);

    expect(html).toContain("Перейти");
    expect(html).toContain("href=\"/catalog\"");
  });

  it("renders spacer blocks", () => {
    const html = renderDocument([
      {
        id: "spacer-1",
        type: "spacer",
        props: {
          size: "large"
        }
      }
    ]);

    expect(html).toContain("sp-spacer-large");
  });

  it("renders selected state in editor mode", () => {
    const html = renderDocument(
      [
        {
          id: "heading-1",
          type: "heading",
          props: {
            text: "Selected",
            level: 2,
            align: "left"
          }
        }
      ],
      {
        mode: "editor",
        selectedBlockId: "heading-1"
      }
    );

    expect(html).toContain("sp-editor-block-selected");
    expect(html).toContain("data-selected=\"true\"");
  });

  it("rerenders selected editor block as unselected without style warnings", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const blocks: readonly BlockNode[] = [
      {
        id: "heading-1",
        type: "heading",
        props: {
          text: "Selected",
          level: 2,
          align: "left"
        }
      }
    ];

    try {
      const selectedHtml = renderDocument(blocks, {
        mode: "editor",
        selectedBlockId: "heading-1"
      });
      const unselectedHtml = renderDocument(blocks, {
        mode: "editor"
      });

      expect(selectedHtml).toContain("border-width:1px");
      expect(selectedHtml).toContain("border-style:solid");
      expect(selectedHtml).toContain("border-color:#93b4f8");
      expect(selectedHtml).not.toContain("border:1px solid");
      expect(unselectedHtml).toContain("data-selected=\"false\"");
      expect(unselectedHtml).toContain("border-color:transparent");
      expect(consoleError).not.toHaveBeenCalled();
    } finally {
      consoleError.mockRestore();
    }
  });

  it("does not render editor chrome in preview mode", () => {
    const html = renderDocument([
      {
        id: "heading-1",
        type: "heading",
        props: {
          text: "Preview",
          level: 2,
          align: "left"
        }
      }
    ]);

    expect(html).not.toContain("data-editor-chrome");
    expect(html).not.toContain("sp-editor-block-selected");
  });
});

function renderDocument(
  blocks: readonly BlockNode[],
  options: {
    readonly mode?: "editor" | "preview";
    readonly selectedBlockId?: string;
  } = {}
): string {
  const document = blocks.reduce(
    (currentDocument, block) => insertBlock(currentDocument, block),
    createEmptyPageDocument()
  );

  return renderToStaticMarkup(
    React.createElement(PageRenderer, {
      document,
      mode: options.mode ?? "preview",
      selectedBlockId: options.selectedBlockId
    })
  );
}
