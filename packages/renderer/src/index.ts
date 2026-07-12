import * as React from "react";
import type {
  BlockNode,
  ButtonBlock,
  ColumnNode,
  HeadingBlock,
  ImageBlock,
  PageDocument,
  PageDocumentV2,
  ProductCardBlock,
  ProductGridBlock,
  SectionNode,
  SpacerBlock,
  TextBlock
} from "@site-platform/editor-core";

export const packageName = "@site-platform/renderer" as const;

export type PageRendererMode = "editor" | "preview" | "storefront";

export type ProductRenderModel = {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly shortDescription: string | null;
  readonly primaryImage: {
    readonly url: string;
    readonly altText: string | null;
  } | null;
  readonly images?: readonly {
    readonly id: string;
    readonly url: string;
    readonly altText: string | null;
    readonly width: number | null;
    readonly height: number | null;
    readonly position: number;
    readonly isPrimary: boolean;
  }[];
  readonly price: {
    readonly amountMinor: number;
    readonly currency: "RUB";
    readonly formatted: string;
  } | null;
  readonly availability: "in-stock" | "out-of-stock" | "preorder";
  readonly publicUrl?: string | undefined;
};

export type PageRendererContext = {
  readonly siteBasePath?: string | undefined;
  readonly products?: Readonly<Record<string, ProductRenderModel>> | undefined;
  readonly productList?: readonly ProductRenderModel[] | undefined;
};

export type PageRendererProps = {
  readonly document: PageDocument;
  readonly mode: PageRendererMode;
  readonly selectedNodeId?: string | null | undefined;
  readonly selectedBlockId?: string | null | undefined;
  readonly siteBasePath?: string | undefined;
  readonly context?: PageRendererContext | undefined;
};

export function PageRenderer({
  document,
  mode,
  selectedNodeId,
  selectedBlockId,
  siteBasePath,
  context
}: PageRendererProps): React.ReactElement {
  const selectedId = selectedNodeId ?? selectedBlockId ?? null;
  const rendererContext = {
    ...context,
    siteBasePath: context?.siteBasePath ?? siteBasePath
  };

  return React.createElement(
    "div",
    {
      className: `sp-renderer sp-renderer-${mode}`,
      style: rendererStyle
    },
    React.createElement("style", {
      dangerouslySetInnerHTML: {
        __html:
          "@media (max-width: 768px) {.sp-section-columns{grid-template-columns:1fr!important;}}"
      }
    }),
    document.root.children.map((section) =>
      renderSection({
        section,
        mode,
        selectedId,
        context: rendererContext
      })
    )
  );
}

function renderSection(input: {
  readonly section: SectionNode;
  readonly mode: PageRendererMode;
  readonly selectedId: string | null;
  readonly context: PageRendererContext;
}): React.ReactElement {
  const content = React.createElement(
    "div",
    {
      className:
        input.section.props.layout === "two-columns"
          ? "sp-section-inner sp-section-columns"
          : "sp-section-inner",
      style: createSectionInnerStyle(input.section)
    },
    input.section.children.map((child) =>
      child.type === "column"
        ? renderColumn({
            column: child,
            mode: input.mode,
            selectedId: input.selectedId,
            context: input.context
          })
        : renderLeafBlock({
            block: child,
            mode: input.mode,
            selectedId: input.selectedId,
            context: input.context
          })
    )
  );

  if (input.mode !== "editor") {
    return React.createElement(
      "section",
      {
        key: input.section.id,
        className: `sp-section sp-section-${input.section.props.background}`,
        style: createSectionStyle(input.section)
      },
      content
    );
  }

  const selected = input.selectedId === input.section.id;

  return React.createElement(
    "section",
    {
      key: input.section.id,
      className: selected
        ? "sp-editor-section sp-editor-section-selected"
        : "sp-editor-section",
      "data-editor-chrome": "section",
      "data-renderer-node-id": input.section.id,
      "data-selected": selected ? "true" : "false",
      style: {
        ...createSectionStyle(input.section),
        ...editorSectionStyle,
        ...(selected ? selectedChromeStyle : {})
      }
    },
    content
  );
}

function renderColumn(input: {
  readonly column: ColumnNode;
  readonly mode: PageRendererMode;
  readonly selectedId: string | null;
  readonly context: PageRendererContext;
}): React.ReactElement {
  const content = input.column.children.map((block) =>
    renderLeafBlock({
      block,
      mode: input.mode,
      selectedId: input.selectedId,
      context: input.context
    })
  );

  if (input.mode !== "editor") {
    return React.createElement(
      "div",
      {
        key: input.column.id,
        className: "sp-column",
        style: createColumnStyle(input.column)
      },
      content
    );
  }

  const selected = input.selectedId === input.column.id;

  return React.createElement(
    "div",
    {
      key: input.column.id,
      className: selected ? "sp-editor-column sp-editor-column-selected" : "sp-editor-column",
      "data-editor-chrome": "column",
      "data-renderer-node-id": input.column.id,
      "data-selected": selected ? "true" : "false",
      style: {
        ...createColumnStyle(input.column),
        ...editorBlockStyle,
        minHeight: 64,
        ...(selected ? selectedChromeStyle : {})
      }
    },
    content.length === 0
      ? React.createElement(
          "div",
          {
            className: "sp-empty-column",
            style: emptyStateStyle
          },
          "Пустая колонка"
        )
      : content
  );
}

function renderLeafBlock(input: {
  readonly block: BlockNode;
  readonly mode: PageRendererMode;
  readonly selectedId: string | null;
  readonly context: PageRendererContext;
}): React.ReactElement {
  const content = renderBlockContent(input.block, input.mode, input.context);

  if (input.mode !== "editor") {
    return React.createElement(
      "div",
      {
        key: input.block.id,
        className: "sp-block"
      },
      content
    );
  }

  const selected = input.selectedId === input.block.id;

  return React.createElement(
    "div",
    {
      key: input.block.id,
      className: selected
        ? "sp-editor-block sp-editor-block-selected"
        : "sp-editor-block",
      "data-editor-chrome": "block",
      "data-renderer-node-id": input.block.id,
      "data-selected": selected ? "true" : "false",
      style: {
        ...editorBlockStyle,
        ...(selected ? selectedChromeStyle : {})
      }
    },
    content
  );
}

function renderBlockContent(
  block: BlockNode,
  mode: PageRendererMode,
  context: PageRendererContext
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
        mode,
        siteBasePath: context.siteBasePath
      });
    case "spacer":
      return React.createElement(SpacerRenderer, {
        block
      });
    case "image":
      return React.createElement(ImageRenderer, {
        block
      });
    case "product-card":
      return React.createElement(ProductCardRenderer, {
        block,
        context
      });
    case "product-grid":
      return React.createElement(ProductGridRenderer, {
        block,
        context
      });
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
        color: "inherit",
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
        color: "inherit",
        fontSize: 18,
        lineHeight: 1.7,
        opacity: 0.82,
        whiteSpace: "pre-wrap",
        textAlign: block.props.align
      }
    },
    block.props.text
  );
}

function ButtonRenderer({
  block,
  mode,
  siteBasePath
}: {
  readonly block: ButtonBlock;
  readonly mode: PageRendererMode;
  readonly siteBasePath?: string | undefined;
}): React.ReactElement {
  const buttonTarget = createButtonTarget(block, mode, siteBasePath);
  const buttonStyle = createButtonStyle(block, buttonTarget.disabled);

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
      buttonTarget.element,
      {
        className: `sp-button sp-button-${block.props.variant}`,
        ...buttonTarget.props,
        style: buttonStyle
      },
      block.props.label
    )
  );
}

function ImageRenderer({
  block
}: {
  readonly block: ImageBlock;
}): React.ReactElement {
  const src = block.props.src.trim();
  const canRenderImage = src !== "" && isAllowedImageUrl(src);
  const placeholder = React.createElement(
    "div",
    {
      className: "sp-image-placeholder",
      style: {
        ...createImageBoxStyle(block),
        display: canRenderImage ? "none" : "flex",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: "#b8c4d5",
        background: "#f3f6fa",
        color: "#667085",
        fontSize: 14
      }
    },
    "Изображение"
  );

  return React.createElement(
    "figure",
    {
      className: "sp-image",
      style: {
        margin: "0 0 20px",
        textAlign: block.props.align
      }
    },
    canRenderImage
      ? React.createElement("img", {
          src,
          alt: block.props.alt,
          style: createImageBoxStyle(block)
        })
      : null,
    placeholder,
    block.props.caption === undefined || block.props.caption.trim() === ""
      ? null
      : React.createElement(
          "figcaption",
          {
            className: "sp-image-caption",
            style: {
              marginTop: 8,
              color: "#667085",
              fontSize: 14
            }
          },
          block.props.caption
        )
  );
}

function ProductCardRenderer({
  block,
  context
}: {
  readonly block: ProductCardBlock;
  readonly context: PageRendererContext;
}): React.ReactElement {
  const product =
    block.props.productId === null
      ? null
      : context.products?.[block.props.productId] ?? null;

  return React.createElement(ProductCardShell, {
    product,
    showImage: block.props.showImage,
    showDescription: block.props.showDescription,
    showPrice: block.props.showPrice,
    buttonLabel: block.props.buttonLabel,
    layout: block.props.layout,
    siteBasePath: context.siteBasePath
  });
}

function ProductGridRenderer({
  block,
  context
}: {
  readonly block: ProductGridBlock;
  readonly context: PageRendererContext;
}): React.ReactElement {
  const products =
    block.props.selection === "selected"
      ? block.props.productIds
          .map((productId) => context.products?.[productId] ?? null)
          .filter((product): product is ProductRenderModel => product !== null)
      : (context.productList ?? []).slice(0, block.props.limit);

  if (products.length === 0) {
    return React.createElement(ProductEmptyState, {
      text: "Товары не выбраны"
    });
  }

  return React.createElement(
    "div",
    {
      className: "sp-product-grid",
      style: {
        display: "grid",
        gridTemplateColumns: `repeat(${block.props.columns}, minmax(0, 1fr))`,
        gap: 20,
        margin: "0 0 24px"
      }
    },
    products.map((product) =>
      React.createElement(ProductCardShell, {
        key: product.id,
        product,
        showImage: true,
        showDescription: block.props.showDescription,
        showPrice: block.props.showPrice,
        buttonLabel: block.props.buttonLabel,
        layout: "vertical",
        siteBasePath: context.siteBasePath
      })
    )
  );
}

function ProductCardShell({
  product,
  showImage,
  showDescription,
  showPrice,
  buttonLabel,
  layout,
  siteBasePath
}: {
  readonly product: ProductRenderModel | null;
  readonly showImage: boolean;
  readonly showDescription: boolean;
  readonly showPrice: boolean;
  readonly buttonLabel: string;
  readonly layout: "vertical" | "horizontal";
  readonly siteBasePath?: string | undefined;
}): React.ReactElement {
  if (product === null) {
    return React.createElement(ProductEmptyState, {
      text: "Товар не выбран"
    });
  }

  const href = createProductHref(product, siteBasePath);

  return React.createElement(
    "article",
    {
      className: `sp-product-card sp-product-card-${layout}`,
      style: {
        display: "grid",
        gridTemplateColumns: layout === "horizontal" ? "160px minmax(0, 1fr)" : "1fr",
        gap: 16,
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: "#d6dee9",
        borderRadius: 8,
        padding: 16,
        background: "#ffffff",
        color: "#152033"
      }
    },
    showImage
      ? React.createElement(ProductImage, {
          product
        })
      : null,
    React.createElement(
      "div",
      {
        className: "sp-product-card-body",
        style: {
          display: "grid",
          alignContent: "start",
          gap: 10
        }
      },
      React.createElement(
        "h3",
        {
          className: "sp-product-card-title",
          style: {
            margin: 0,
            fontSize: 22,
            lineHeight: 1.2
          }
        },
        product.title
      ),
      showDescription && product.shortDescription !== null
        ? React.createElement(
            "p",
            {
              className: "sp-product-card-description",
              style: {
                margin: 0,
                color: "#667085",
                lineHeight: 1.55
              }
            },
            product.shortDescription
          )
        : null,
      showPrice
        ? React.createElement(
            "p",
            {
              className: "sp-product-card-price",
              style: {
                margin: 0,
                fontWeight: 800
              }
            },
            product.price === null ? "Цена не указана" : product.price.formatted
          )
        : null,
      React.createElement(
        "a",
        {
          className: "sp-product-card-link",
          href,
          style: {
            justifySelf: "start",
            borderRadius: 6,
            background: "#2563eb",
            padding: "10px 14px",
            color: "#ffffff",
            fontWeight: 700,
            textDecoration: "none"
          }
        },
        buttonLabel.trim() === "" ? "Подробнее" : buttonLabel
      )
    )
  );
}

function ProductImage({
  product
}: {
  readonly product: ProductRenderModel;
}): React.ReactElement {
  if (product.primaryImage === null) {
    return React.createElement(
      "div",
      {
        className: "sp-product-image-placeholder",
        style: productImagePlaceholderStyle
      },
      "Изображение товара"
    );
  }

  return React.createElement("img", {
    className: "sp-product-image",
    src: product.primaryImage.url,
    alt: product.primaryImage.altText ?? product.title,
    style: {
      width: "100%",
      aspectRatio: "4 / 3",
      objectFit: "cover",
      borderRadius: 6,
      background: "#f3f6fa"
    }
  });
}

function ProductEmptyState({
  text
}: {
  readonly text: string;
}): React.ReactElement {
  return React.createElement(
    "div",
    {
      className: "sp-product-empty",
      style: {
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: "#b8c4d5",
        borderRadius: 8,
        padding: 18,
        background: "#f8fafc",
        color: "#667085",
        textAlign: "center"
      }
    },
    text
  );
}

type ButtonTarget =
  | {
      readonly element: "a";
      readonly disabled: false;
      readonly props: {
        readonly href: string;
        readonly target?: "_blank";
        readonly rel?: "noopener noreferrer";
      };
    }
  | {
      readonly element: "span";
      readonly disabled: true;
      readonly props: {
        readonly "aria-disabled": "true";
        readonly "data-disabled-link": "true";
      };
    };

function createButtonTarget(
  block: ButtonBlock,
  mode: PageRendererMode,
  siteBasePath: string | undefined
): ButtonTarget {
  const href = block.props.href.trim();

  if (mode === "editor" || href === "" || href === "#") {
    return {
      element: "span",
      disabled: true,
      props: {
        "aria-disabled": "true",
        "data-disabled-link": "true"
      }
    };
  }

  if (isExternalHref(href)) {
    return {
      element: "a",
      disabled: false,
      props: {
        href,
        target: "_blank",
        rel: "noopener noreferrer"
      }
    };
  }

  if (mode === "storefront" && href.startsWith("/")) {
    return {
      element: "a",
      disabled: false,
      props: {
        href: `${siteBasePath?.replace(/\/$/, "") ?? ""}${href}`
      }
    };
  }

  return {
    element: "a",
    disabled: false,
    props: {
      href
    }
  };
}

function createButtonStyle(
  block: ButtonBlock,
  disabled: boolean
): React.CSSProperties {
  return {
    display: "inline-flex",
    minHeight: 42,
    alignItems: "center",
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: block.props.variant === "primary" ? "#2563eb" : "#c8d2e0",
    background: block.props.variant === "primary" ? "#2563eb" : "#ffffff",
    padding: "0 18px",
    color: block.props.variant === "primary" ? "#ffffff" : "#1d4ed8",
    cursor: disabled ? "default" : "pointer",
    fontWeight: 700,
    textDecoration: "none"
  };
}

function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

function createProductHref(
  product: ProductRenderModel,
  siteBasePath: string | undefined
): string {
  if (product.publicUrl !== undefined) {
    return product.publicUrl;
  }

  const basePath = siteBasePath?.replace(/\/$/, "") ?? "";

  return `${basePath}/products/${encodeURIComponent(product.slug)}`;
}

function isAllowedImageUrl(src: string): boolean {
  try {
    const url = new URL(src);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
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

function createSectionStyle(section: SectionNode): React.CSSProperties {
  return {
    ...backgroundStyleByName[section.props.background],
    paddingTop: paddingYByName[section.props.paddingY],
    paddingBottom: paddingYByName[section.props.paddingY]
  };
}

function createSectionInnerStyle(section: SectionNode): React.CSSProperties {
  return {
    display: section.props.layout === "two-columns" ? "grid" : "block",
    gridTemplateColumns:
      section.props.layout === "two-columns"
        ? columnRatioByName[section.props.columnRatio]
        : undefined,
    gap: section.props.layout === "two-columns" ? 32 : undefined,
    alignItems: section.props.verticalAlign,
    width: "100%",
    maxWidth: contentWidthByName[section.props.contentWidth],
    margin: "0 auto"
  };
}

function createColumnStyle(column: ColumnNode): React.CSSProperties {
  return {
    textAlign: column.props.align
  };
}

function createImageBoxStyle(block: ImageBlock): React.CSSProperties {
  return {
    width: imageWidthByName[block.props.width],
    maxWidth: "100%",
    aspectRatio:
      block.props.aspectRatio === "auto"
        ? undefined
        : imageAspectRatioByName[block.props.aspectRatio],
    objectFit: block.props.objectFit,
    borderRadius: imageBorderRadiusByName[block.props.borderRadius],
    display: "inline-flex"
  };
}

const rendererStyle: React.CSSProperties = {
  color: "#152033",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
};

const editorSectionStyle: React.CSSProperties = {
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "transparent",
  borderRadius: 8,
  marginBottom: 12,
  transition: "border-color 120ms ease, background 120ms ease"
};

const editorBlockStyle: React.CSSProperties = {
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "transparent",
  borderRadius: 8,
  padding: 10,
  transition: "border-color 120ms ease, background 120ms ease"
};

const selectedChromeStyle: React.CSSProperties = {
  borderColor: "#3b4c63",
  background: "#f3f6fa"
};

const emptyStateStyle: React.CSSProperties = {
  padding: 16,
  color: "#667085",
  fontSize: 14,
  textAlign: "center"
};

const productImagePlaceholderStyle: React.CSSProperties = {
  display: "grid",
  width: "100%",
  aspectRatio: "4 / 3",
  placeItems: "center",
  borderRadius: 6,
  background: "#f3f6fa",
  color: "#667085",
  fontSize: 14
};

const paddingYByName = {
  small: 24,
  medium: 48,
  large: 80
} as const;

const contentWidthByName = {
  narrow: 720,
  standard: 1040,
  wide: 1240
} as const;

const columnRatioByName = {
  "50-50": "1fr 1fr",
  "40-60": "2fr 3fr",
  "60-40": "3fr 2fr"
} as const;

const backgroundStyleByName = {
  white: {
    background: "#ffffff",
    color: "#152033"
  },
  muted: {
    background: "#f3f6fa",
    color: "#152033"
  },
  dark: {
    background: "#101828",
    color: "#ffffff"
  },
  accent: {
    background: "#eff6ff",
    color: "#102a56"
  }
} as const satisfies Record<SectionNode["props"]["background"], React.CSSProperties>;

const imageAspectRatioByName = {
  square: "1 / 1",
  portrait: "4 / 5",
  landscape: "4 / 3",
  wide: "16 / 9"
} as const;

const imageBorderRadiusByName = {
  none: 0,
  small: 4,
  medium: 8,
  large: 16
} as const;

const imageWidthByName = {
  small: 280,
  medium: 520,
  full: "100%"
} as const;

export type { PageDocumentV2 };
