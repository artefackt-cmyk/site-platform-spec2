import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  convertSectionLayout,
  createEmptyPageDocument,
  insertBlock,
  updateSectionProps,
  type BlockNode
} from "@site-platform/editor-core";
import { PageRenderer, type PageRendererMode } from "./index";

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

  it("renders placeholder storefront button links as disabled non-links", () => {
    const html = renderButton("#", {
      mode: "storefront"
    });

    expect(html).toContain("<span");
    expect(html).not.toContain("<a");
    expect(html).not.toContain("href=");
    expect(html).not.toContain("onClick");
    expect(html).toContain("aria-disabled=\"true\"");
    expect(html).toContain("data-disabled-link=\"true\"");
  });

  it("server-renders placeholder storefront button links without event handlers", () => {
    expect(() =>
      renderButton("#", {
        mode: "storefront"
      })
    ).not.toThrow();
  });

  it("renders placeholder preview button links without event handlers", () => {
    const html = renderButton("#");

    expect(html).toContain("<span");
    expect(html).not.toContain("href=");
    expect(html).not.toContain("onClick");
    expect(html).toContain("aria-disabled=\"true\"");
  });

  it("renders empty button links as disabled non-links", () => {
    const html = renderButton("", {
      mode: "storefront"
    });

    expect(html).toContain("<span");
    expect(html).not.toContain("href=");
    expect(html).toContain("aria-disabled=\"true\"");
    expect(html).toContain("cursor:default");
  });

  it("renders external preview button links safely", () => {
    const html = renderDocument([
      {
        id: "button-1",
        type: "button",
        props: {
          label: "Открыть",
          href: "https://example.com",
          align: "left",
          variant: "primary"
        }
      }
    ]);

    expect(html).toContain("href=\"https://example.com\"");
    expect(html).toContain("target=\"_blank\"");
    expect(html).toContain("rel=\"noopener noreferrer\"");
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

  it("renders sections and two-column layouts", () => {
    const document = convertSectionLayout(
      insertBlock(
        insertBlock(createEmptyPageDocument(), {
          id: "heading-1",
          type: "heading",
          props: {
            text: "Left side",
            level: 2,
            align: "left"
          }
        }),
        {
          id: "text-1",
          type: "text",
          props: {
            text: "Column copy",
            align: "left"
          }
        }
      ),
      "root-section-v2",
      "two-columns"
    );
    const html = renderToStaticMarkup(
      React.createElement(PageRenderer, {
        document,
        mode: "preview"
      })
    );

    expect(html).toContain("sp-section");
    expect(html).toContain("sp-section-columns");
    expect(html).toContain("grid-template-columns:1fr 1fr");
  });

  it("renders image placeholders and safe image URLs", () => {
    const placeholderHtml = renderDocument([
      {
        id: "image-empty",
        type: "image",
        props: {
          src: "",
          alt: "",
          caption: "",
          aspectRatio: "landscape",
          objectFit: "cover",
          borderRadius: "medium",
          align: "center",
          width: "full"
        }
      }
    ]);
    const imageHtml = renderDocument([
      {
        id: "image-1",
        type: "image",
        props: {
          src: "https://example.com/photo.jpg",
          alt: "Photo",
          caption: "Caption",
          aspectRatio: "wide",
          objectFit: "cover",
          borderRadius: "small",
          align: "center",
          width: "medium"
        }
      }
    ]);

    expect(placeholderHtml).toContain("sp-image-placeholder");
    expect(placeholderHtml).toContain("Изображение");
    expect(imageHtml).toContain("src=\"https://example.com/photo.jpg\"");
    expect(imageHtml).toContain("alt=\"Photo\"");
    expect(imageHtml).toContain("Caption");
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

  it("renders selected section state in editor mode", () => {
    const document = updateSectionProps(
      insertBlock(createEmptyPageDocument(), {
        id: "heading-1",
        type: "heading",
        props: {
          text: "Selected",
          level: 2,
          align: "left"
        }
      }),
      "root-section-v2",
      {
        background: "muted"
      }
    );
    const html = renderToStaticMarkup(
      React.createElement(PageRenderer, {
        document,
        mode: "editor",
        selectedNodeId: "root-section-v2"
      })
    );

    expect(html).toContain("sp-editor-section-selected");
    expect(html).toContain("data-editor-chrome=\"section\"");
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

  it("does not render editor chrome in storefront mode", () => {
    const html = renderDocument(
      [
        {
          id: "heading-1",
          type: "heading",
          props: {
            text: "Storefront",
            level: 2,
            align: "left"
          }
        }
      ],
      {
        mode: "storefront",
        selectedBlockId: "heading-1"
      }
    );

    expect(html).toContain("sp-renderer-storefront");
    expect(html).not.toContain("data-editor-chrome");
    expect(html).not.toContain("sp-editor-block-selected");
  });

  it("prefixes internal storefront button links with the site base path", () => {
    const html = renderButton("/catalog", {
      mode: "storefront",
      siteBasePath: "/s/demo-store"
    });

    expect(html).toContain("href=\"/s/demo-store/catalog\"");
  });

  it("does not pass function props to rendered DOM elements", () => {
    const document = insertBlock(
      createEmptyPageDocument(),
      {
        id: "button-1",
        type: "button",
        props: {
          label: "Не переходить",
          href: "#",
          align: "left",
          variant: "secondary"
        }
      }
    );
    const element = React.createElement(PageRenderer, {
      document,
      mode: "storefront"
    });

    expect(() => assertNoFunctionDomProps(element)).not.toThrow();
  });
});

function renderButton(
  href: string,
  options: {
    readonly mode?: PageRendererMode;
    readonly siteBasePath?: string;
  } = {}
): string {
  return renderDocument(
    [
      {
        id: "button-1",
        type: "button",
        props: {
          label: "Перейти",
          href,
          align: "left",
          variant: "primary"
        }
      }
    ],
    options
  );
}

function renderDocument(
  blocks: readonly BlockNode[],
  options: {
    readonly mode?: PageRendererMode;
    readonly selectedBlockId?: string;
    readonly siteBasePath?: string;
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
      selectedBlockId: options.selectedBlockId,
      siteBasePath: options.siteBasePath
    })
  );
}

function assertNoFunctionDomProps(node: React.ReactNode): void {
  if (Array.isArray(node)) {
    for (const child of node) {
      assertNoFunctionDomProps(child);
    }

    return;
  }

  if (!React.isValidElement(node)) {
    return;
  }

  if (typeof node.type === "function") {
    assertNoFunctionDomProps(node.type(node.props));
    return;
  }

  if (typeof node.type === "string") {
    assertPropsHaveNoFunctions(node.props, node.type);
  }

  const children = getChildren(node.props);

  assertNoFunctionDomProps(children);
}

function assertPropsHaveNoFunctions(props: unknown, elementName: string): void {
  if (!isRecord(props)) {
    return;
  }

  for (const [key, value] of Object.entries(props)) {
    if (key === "children") {
      continue;
    }

    expect(typeof value, `${elementName}.${key}`).not.toBe("function");
  }
}

function getChildren(props: unknown): React.ReactNode {
  return isRecord(props) && "children" in props
    ? (props.children as React.ReactNode)
    : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
