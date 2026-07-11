import * as React from "react";
import type {
  BlockNode,
  ButtonBlock,
  HeadingBlock,
  PageDocumentV1,
  SpacerBlock,
  TextBlock
} from "@site-platform/editor-core";

export const packageName = "@site-platform/renderer" as const;

export type PageRendererMode = "editor" | "preview";

export type PageRendererProps = {
  readonly document: PageDocumentV1;
  readonly mode: PageRendererMode;
  readonly selectedBlockId?: string | null | undefined;
  readonly onBlockSelect?: ((blockId: string) => void) | undefined;
};

export function PageRenderer({
  document,
  mode,
  selectedBlockId,
  onBlockSelect
}: PageRendererProps): React.ReactElement {
  return React.createElement(
    "div",
    {
      className: `sp-renderer sp-renderer-${mode}`,
      style: rendererStyle
    },
    document.root.children.map((block) =>
      renderBlock({
        block,
        mode,
        selected: selectedBlockId === block.id,
        onBlockSelect
      })
    )
  );
}

function renderBlock(input: {
  readonly block: BlockNode;
  readonly mode: PageRendererMode;
  readonly selected: boolean;
  readonly onBlockSelect?: ((blockId: string) => void) | undefined;
}): React.ReactElement {
  const content = renderBlockContent(input.block, input.mode);

  if (input.mode === "preview") {
    return React.createElement(
      "div",
      {
        key: input.block.id,
        className: "sp-block"
      },
      content
    );
  }

  return React.createElement(
    "div",
    {
      key: input.block.id,
      className: input.selected
        ? "sp-editor-block sp-editor-block-selected"
        : "sp-editor-block",
      "data-editor-chrome": "block",
      "data-selected": input.selected ? "true" : "false",
      onClick: (event: React.MouseEvent<HTMLDivElement>) => {
        event.stopPropagation();
        input.onBlockSelect?.(input.block.id);
      },
      style: {
        ...editorBlockStyle,
        ...(input.selected ? selectedBlockStyle : {})
      }
    },
    content
  );
}

function renderBlockContent(
  block: BlockNode,
  mode: PageRendererMode
): React.ReactElement {
  switch (block.type) {
    case "heading":
      return React.createElement(HeadingRenderer, {
        block
      });
    case "text":
      return React.createElement(TextRenderer, {
        block
      });
    case "button":
      return React.createElement(ButtonRenderer, {
        block,
        mode
      });
    case "spacer":
      return React.createElement(SpacerRenderer, {
        block
      });
    default:
      throw new Error("Unknown block type.");
  }
}

function HeadingRenderer({
  block
}: {
  readonly block: HeadingBlock;
}): React.ReactElement {
  const tag = `h${block.props.level}`;

  return React.createElement(
    tag,
    {
      className: "sp-heading",
      style: {
        margin: "0 0 16px",
        color: "#152033",
        fontSize: block.props.level === 1 ? 42 : block.props.level === 2 ? 32 : 24,
        lineHeight: 1.12,
        textAlign: block.props.align
      }
    },
    block.props.text
  );
}

function TextRenderer({
  block
}: {
  readonly block: TextBlock;
}): React.ReactElement {
  return React.createElement(
    "p",
    {
      className: "sp-text",
      style: {
        margin: "0 0 18px",
        color: "#475467",
        fontSize: 18,
        lineHeight: 1.7,
        whiteSpace: "pre-wrap",
        textAlign: block.props.align
      }
    },
    block.props.text
  );
}

function ButtonRenderer({
  block,
  mode
}: {
  readonly block: ButtonBlock;
  readonly mode: PageRendererMode;
}): React.ReactElement {
  const linkProps = createButtonLinkProps(block, mode);

  return React.createElement(
    "div",
    {
      className: "sp-button-row",
      style: {
        margin: "0 0 20px",
        textAlign: block.props.align
      }
    },
    React.createElement(
      "a",
      {
        className: `sp-button sp-button-${block.props.variant}`,
        ...linkProps,
        style: {
          display: "inline-flex",
          minHeight: 42,
          alignItems: "center",
          borderRadius: 6,
          border:
            block.props.variant === "primary"
              ? "1px solid #2563eb"
              : "1px solid #c8d2e0",
          background: block.props.variant === "primary" ? "#2563eb" : "#ffffff",
          padding: "0 18px",
          color: block.props.variant === "primary" ? "#ffffff" : "#1d4ed8",
          fontWeight: 700,
          textDecoration: "none"
        }
      },
      block.props.label
    )
  );
}

function createButtonLinkProps(
  block: ButtonBlock,
  mode: PageRendererMode
): {
  readonly href: string;
  readonly onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  readonly target?: "_blank";
  readonly rel?: "noreferrer";
  readonly "data-disabled-link"?: "true";
} {
  if (mode === "editor") {
    return {
      href: block.props.href,
      onClick: (event) => {
        event.preventDefault();
      }
    };
  }

  if (block.props.href === "#") {
    return {
      href: block.props.href,
      "data-disabled-link": "true",
      onClick: (event) => {
        event.preventDefault();
      }
    };
  }

  if (isExternalHref(block.props.href)) {
    return {
      href: block.props.href,
      target: "_blank",
      rel: "noreferrer"
    };
  }

  return {
    href: block.props.href
  };
}

function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

function SpacerRenderer({
  block
}: {
  readonly block: SpacerBlock;
}): React.ReactElement {
  const heightBySize = {
    small: 18,
    medium: 36,
    large: 64
  } as const;

  return React.createElement("div", {
    className: `sp-spacer sp-spacer-${block.props.size}`,
    style: {
      height: heightBySize[block.props.size]
    },
    "aria-hidden": true
  });
}

const rendererStyle: React.CSSProperties = {
  color: "#152033",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
};

const editorBlockStyle: React.CSSProperties = {
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "transparent",
  borderRadius: 8,
  padding: 10,
  transition: "border-color 120ms ease, background 120ms ease"
};

const selectedBlockStyle: React.CSSProperties = {
  borderColor: "#93b4f8",
  background: "#f8fbff"
};
