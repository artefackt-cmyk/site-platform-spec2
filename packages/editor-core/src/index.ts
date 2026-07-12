import { z } from "zod";

export const packageName = "@site-platform/editor-core" as const;

export const PAGE_DOCUMENT_V1_SCHEMA_VERSION = 1 as const;
export const PAGE_DOCUMENT_SCHEMA_VERSION = 2 as const;
export const PAGE_DOCUMENT_LATEST_SCHEMA_VERSION = PAGE_DOCUMENT_SCHEMA_VERSION;
export const PAGE_DOCUMENT_MAX_DEPTH = 4 as const;

export const LEAF_BLOCK_TYPES = [
  "heading",
  "text",
  "button",
  "spacer",
  "image",
  "product-card",
  "product-grid"
] as const;
export const BLOCK_TYPES = LEAF_BLOCK_TYPES;
export const TEXT_ALIGNMENTS = ["left", "center", "right"] as const;
export const HEADING_LEVELS = [1, 2, 3] as const;
export const BUTTON_VARIANTS = ["primary", "secondary"] as const;
export const SPACER_SIZES = ["small", "medium", "large"] as const;
export const SECTION_BACKGROUNDS = ["white", "muted", "dark", "accent"] as const;
export const SECTION_PADDING_Y = ["small", "medium", "large"] as const;
export const SECTION_CONTENT_WIDTHS = ["narrow", "standard", "wide"] as const;
export const SECTION_LAYOUTS = ["single", "two-columns"] as const;
export const SECTION_COLUMN_RATIOS = ["50-50", "40-60", "60-40"] as const;
export const SECTION_VERTICAL_ALIGNS = ["start", "center", "end"] as const;
export const IMAGE_ASPECT_RATIOS = [
  "auto",
  "square",
  "portrait",
  "landscape",
  "wide"
] as const;
export const IMAGE_OBJECT_FITS = ["cover", "contain"] as const;
export const IMAGE_BORDER_RADII = ["none", "small", "medium", "large"] as const;
export const IMAGE_WIDTHS = ["small", "medium", "full"] as const;
export const PRODUCT_CARD_LAYOUTS = ["vertical", "horizontal"] as const;
export const PRODUCT_GRID_SELECTIONS = ["all-active", "selected"] as const;
export const PRODUCT_GRID_COLUMNS = [2, 3, 4] as const;
export const PRODUCT_GRID_LIMITS = [4, 8, 12] as const;

export type LeafBlockType = (typeof LEAF_BLOCK_TYPES)[number];
export type BlockType = LeafBlockType;
export type TextAlignment = (typeof TEXT_ALIGNMENTS)[number];
export type HeadingLevel = (typeof HEADING_LEVELS)[number];
export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];
export type SpacerSize = (typeof SPACER_SIZES)[number];
export type SectionBackground = (typeof SECTION_BACKGROUNDS)[number];
export type SectionPaddingY = (typeof SECTION_PADDING_Y)[number];
export type SectionContentWidth = (typeof SECTION_CONTENT_WIDTHS)[number];
export type SectionLayout = (typeof SECTION_LAYOUTS)[number];
export type SectionColumnRatio = (typeof SECTION_COLUMN_RATIOS)[number];
export type SectionVerticalAlign = (typeof SECTION_VERTICAL_ALIGNS)[number];
export type ImageAspectRatio = (typeof IMAGE_ASPECT_RATIOS)[number];
export type ImageObjectFit = (typeof IMAGE_OBJECT_FITS)[number];
export type ImageBorderRadius = (typeof IMAGE_BORDER_RADII)[number];
export type ImageWidth = (typeof IMAGE_WIDTHS)[number];
export type ProductCardLayout = (typeof PRODUCT_CARD_LAYOUTS)[number];
export type ProductGridSelection = (typeof PRODUCT_GRID_SELECTIONS)[number];
export type ProductGridColumns = (typeof PRODUCT_GRID_COLUMNS)[number];
export type ProductGridLimit = (typeof PRODUCT_GRID_LIMITS)[number];

const NodeIdSchema = z.string().trim().min(1);
const TextAlignmentSchema = z.enum(TEXT_ALIGNMENTS);

export const HeadingBlockPropsSchema = z
  .object({
    text: z.string(),
    level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    align: TextAlignmentSchema
  })
  .strict();

export const TextBlockPropsSchema = z
  .object({
    text: z.string(),
    align: TextAlignmentSchema
  })
  .strict();

export const ButtonBlockPropsSchema = z
  .object({
    label: z.string(),
    href: z.string(),
    align: TextAlignmentSchema,
    variant: z.enum(BUTTON_VARIANTS)
  })
  .strict();

export const SpacerBlockPropsSchema = z
  .object({
    size: z.enum(SPACER_SIZES)
  })
  .strict();

export const ImageBlockPropsSchema = z
  .object({
    assetId: z.string().trim().min(1).optional(),
    src: z.string(),
    alt: z.string(),
    caption: z.string().optional(),
    aspectRatio: z.enum(IMAGE_ASPECT_RATIOS),
    objectFit: z.enum(IMAGE_OBJECT_FITS),
    borderRadius: z.enum(IMAGE_BORDER_RADII),
    align: TextAlignmentSchema,
    width: z.enum(IMAGE_WIDTHS)
  })
  .strict()
  .superRefine((props, context) => {
    if (props.src.trim() === "") {
      return;
    }

    if (!isAllowedImageUrl(props.src)) {
      context.addIssue({
        code: "custom",
        path: ["src"],
        message: "Image src must be an http or https URL."
      });
    }

    if (props.alt.trim() === "") {
      context.addIssue({
        code: "custom",
        path: ["alt"],
        message: "Image alt is required when src is set."
      });
    }
  });

export const ProductCardBlockPropsSchema = z
  .object({
    productId: z.string().trim().min(1).nullable(),
    showImage: z.boolean(),
    showDescription: z.boolean(),
    showPrice: z.boolean(),
    buttonLabel: z.string(),
    layout: z.enum(PRODUCT_CARD_LAYOUTS)
  })
  .strict();

export const ProductGridBlockPropsSchema = z
  .object({
    selection: z.enum(PRODUCT_GRID_SELECTIONS),
    productIds: z.array(z.string().trim().min(1)),
    columns: z.union([z.literal(2), z.literal(3), z.literal(4)]),
    showDescription: z.boolean(),
    showPrice: z.boolean(),
    buttonLabel: z.string(),
    limit: z.union([z.literal(4), z.literal(8), z.literal(12)])
  })
  .strict();

export const SectionNodePropsSchema = z
  .object({
    background: z.enum(SECTION_BACKGROUNDS),
    paddingY: z.enum(SECTION_PADDING_Y),
    contentWidth: z.enum(SECTION_CONTENT_WIDTHS),
    layout: z.enum(SECTION_LAYOUTS),
    columnRatio: z.enum(SECTION_COLUMN_RATIOS),
    verticalAlign: z.enum(SECTION_VERTICAL_ALIGNS)
  })
  .strict();

export const ColumnNodePropsSchema = z
  .object({
    align: TextAlignmentSchema
  })
  .strict();

export const HeadingBlockSchema = z
  .object({
    id: NodeIdSchema,
    type: z.literal("heading"),
    props: HeadingBlockPropsSchema
  })
  .strict();

export const TextBlockSchema = z
  .object({
    id: NodeIdSchema,
    type: z.literal("text"),
    props: TextBlockPropsSchema
  })
  .strict();

export const ButtonBlockSchema = z
  .object({
    id: NodeIdSchema,
    type: z.literal("button"),
    props: ButtonBlockPropsSchema
  })
  .strict();

export const SpacerBlockSchema = z
  .object({
    id: NodeIdSchema,
    type: z.literal("spacer"),
    props: SpacerBlockPropsSchema
  })
  .strict();

export const ImageBlockSchema = z
  .object({
    id: NodeIdSchema,
    type: z.literal("image"),
    props: ImageBlockPropsSchema
  })
  .strict();

export const ProductCardBlockSchema = z
  .object({
    id: NodeIdSchema,
    type: z.literal("product-card"),
    props: ProductCardBlockPropsSchema
  })
  .strict();

export const ProductGridBlockSchema = z
  .object({
    id: NodeIdSchema,
    type: z.literal("product-grid"),
    props: ProductGridBlockPropsSchema
  })
  .strict();

export const LeafBlockNodeSchema = z.discriminatedUnion("type", [
  HeadingBlockSchema,
  TextBlockSchema,
  ButtonBlockSchema,
  SpacerBlockSchema,
  ImageBlockSchema,
  ProductCardBlockSchema,
  ProductGridBlockSchema
]);

export const LegacyBlockNodeSchema = z.discriminatedUnion("type", [
  HeadingBlockSchema,
  TextBlockSchema,
  ButtonBlockSchema,
  SpacerBlockSchema
]);

export const ColumnNodeSchema = z
  .object({
    id: NodeIdSchema,
    type: z.literal("column"),
    props: ColumnNodePropsSchema,
    children: z.array(LeafBlockNodeSchema)
  })
  .strict();

export const SectionNodeSchema = z
  .object({
    id: NodeIdSchema,
    type: z.literal("section"),
    props: SectionNodePropsSchema,
    children: z.array(z.union([LeafBlockNodeSchema, ColumnNodeSchema]))
  })
  .strict()
  .superRefine((section, context) => {
    if (section.props.layout === "single") {
      for (const [index, child] of section.children.entries()) {
        if (child.type === "column") {
          context.addIssue({
            code: "custom",
            path: ["children", index],
            message: "Single section cannot contain columns."
          });
        }
      }
      return;
    }

    if (section.children.length !== 2) {
      context.addIssue({
        code: "custom",
        path: ["children"],
        message: "Two-column section must contain exactly two columns."
      });
      return;
    }

    for (const [index, child] of section.children.entries()) {
      if (child.type !== "column") {
        context.addIssue({
          code: "custom",
          path: ["children", index],
          message: "Two-column section children must be columns."
        });
      }
    }
  });

export const PageDocumentV1Schema = z
  .object({
    schemaVersion: z.literal(PAGE_DOCUMENT_V1_SCHEMA_VERSION),
    root: z
      .object({
        id: NodeIdSchema,
        type: z.literal("page"),
        children: z.array(LegacyBlockNodeSchema)
      })
      .strict()
  })
  .strict()
  .superRefine((document, context) => {
    addDuplicateIdIssues(collectV1Nodes(document), context);
  });

export const PageDocumentV2Schema = z
  .object({
    schemaVersion: z.literal(PAGE_DOCUMENT_SCHEMA_VERSION),
    root: z
      .object({
        id: NodeIdSchema,
        type: z.literal("page"),
        children: z.array(SectionNodeSchema)
      })
      .strict()
  })
  .strict()
  .superRefine((document, context) => {
    addDuplicateIdIssues(collectV2Nodes(document), context);
    addDepthIssues(document, context);
  });

export type HeadingBlockProps = z.infer<typeof HeadingBlockPropsSchema>;
export type TextBlockProps = z.infer<typeof TextBlockPropsSchema>;
export type ButtonBlockProps = z.infer<typeof ButtonBlockPropsSchema>;
export type SpacerBlockProps = z.infer<typeof SpacerBlockPropsSchema>;
export type ImageBlockProps = z.infer<typeof ImageBlockPropsSchema>;
export type ProductCardBlockProps = z.infer<typeof ProductCardBlockPropsSchema>;
export type ProductGridBlockProps = z.infer<typeof ProductGridBlockPropsSchema>;
export type SectionNodeProps = z.infer<typeof SectionNodePropsSchema>;
export type ColumnNodeProps = z.infer<typeof ColumnNodePropsSchema>;
export type HeadingBlock = z.infer<typeof HeadingBlockSchema>;
export type TextBlock = z.infer<typeof TextBlockSchema>;
export type ButtonBlock = z.infer<typeof ButtonBlockSchema>;
export type SpacerBlock = z.infer<typeof SpacerBlockSchema>;
export type ImageBlock = z.infer<typeof ImageBlockSchema>;
export type ProductCardBlock = z.infer<typeof ProductCardBlockSchema>;
export type ProductGridBlock = z.infer<typeof ProductGridBlockSchema>;
export type LeafBlockNode = z.infer<typeof LeafBlockNodeSchema>;
export type LegacyBlockNode = z.infer<typeof LegacyBlockNodeSchema>;
export type BlockNode = LeafBlockNode;
export type ColumnNode = z.infer<typeof ColumnNodeSchema>;
export type SectionNode = z.infer<typeof SectionNodeSchema>;
export type PageDocumentV1 = z.infer<typeof PageDocumentV1Schema>;
export type PageDocumentV2 = z.infer<typeof PageDocumentV2Schema>;
export type PageDocument = PageDocumentV2;
export type PageNode = PageDocumentV2["root"];
export type EditorNode = PageNode | SectionNode | ColumnNode | LeafBlockNode;
export type ChildNode = SectionNode | ColumnNode | LeafBlockNode;

export type BlockPropsByType = {
  readonly heading: HeadingBlockProps;
  readonly text: TextBlockProps;
  readonly button: ButtonBlockProps;
  readonly spacer: SpacerBlockProps;
  readonly image: ImageBlockProps;
  readonly "product-card": ProductCardBlockProps;
  readonly "product-grid": ProductGridBlockProps;
};

export type NodePropsByType = BlockPropsByType & {
  readonly section: SectionNodeProps;
  readonly column: ColumnNodeProps;
};

export type PageDocumentValidationError = {
  readonly path: readonly (string | number)[];
  readonly message: string;
};

export type PageDocumentValidationResult =
  | {
      readonly ok: true;
      readonly document: PageDocumentV2;
    }
  | {
      readonly ok: false;
      readonly errors: readonly PageDocumentValidationError[];
    };

export type PageDocumentMigrationResult =
  | {
      readonly ok: true;
      readonly document: PageDocumentV2;
      readonly migrated: boolean;
    }
  | {
      readonly ok: false;
      readonly errors: readonly PageDocumentValidationError[];
    };

export function createEmptyPageDocument(): PageDocumentV2 {
  return {
    schemaVersion: PAGE_DOCUMENT_SCHEMA_VERSION,
    root: {
      id: "root",
      type: "page",
      children: []
    }
  };
}

export function createDefaultSection(): SectionNode {
  return {
    id: createNodeId("section"),
    type: "section",
    props: createDefaultSectionProps("single"),
    children: []
  };
}

export function createDefaultColumn(): ColumnNode {
  return {
    id: createNodeId("column"),
    type: "column",
    props: {
      align: "left"
    },
    children: []
  };
}

export function createDefaultBlock(type: "heading"): HeadingBlock;
export function createDefaultBlock(type: "text"): TextBlock;
export function createDefaultBlock(type: "button"): ButtonBlock;
export function createDefaultBlock(type: "spacer"): SpacerBlock;
export function createDefaultBlock(type: "image"): ImageBlock;
export function createDefaultBlock(type: "product-card"): ProductCardBlock;
export function createDefaultBlock(type: "product-grid"): ProductGridBlock;
export function createDefaultBlock(type: LeafBlockType): LeafBlockNode {
  const id = createNodeId(type);

  switch (type) {
    case "heading":
      return {
        id,
        type,
        props: {
          text: "Новый заголовок",
          level: 2,
          align: "left"
        }
      };
    case "text":
      return {
        id,
        type,
        props: {
          text: "Новый текст",
          align: "left"
        }
      };
    case "button":
      return {
        id,
        type,
        props: {
          label: "Кнопка",
          href: "#",
          align: "left",
          variant: "primary"
        }
      };
    case "spacer":
      return {
        id,
        type,
        props: {
          size: "medium"
        }
      };
    case "image":
      return {
        id,
        type,
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
      };
    case "product-card":
      return {
        id,
        type,
        props: {
          productId: null,
          showImage: true,
          showDescription: true,
          showPrice: true,
          buttonLabel: "Подробнее",
          layout: "vertical"
        }
      };
    case "product-grid":
      return {
        id,
        type,
        props: {
          selection: "all-active",
          productIds: [],
          columns: 3,
          showDescription: true,
          showPrice: true,
          buttonLabel: "Подробнее",
          limit: 8
        }
      };
  }
}

export function detectPageDocumentVersion(document: unknown): 1 | 2 {
  if (!isRecord(document)) {
    throw new PageDocumentMigrationError([
      {
        path: [],
        message: "Page document must be an object."
      }
    ]);
  }

  if (document.schemaVersion === PAGE_DOCUMENT_V1_SCHEMA_VERSION) {
    return 1;
  }

  if (document.schemaVersion === PAGE_DOCUMENT_SCHEMA_VERSION) {
    return 2;
  }

  throw new PageDocumentMigrationError([
    {
      path: ["schemaVersion"],
      message: "Unsupported page document schemaVersion."
    }
  ]);
}

export class PageDocumentMigrationError extends Error {
  readonly errors: readonly PageDocumentValidationError[];

  constructor(errors: readonly PageDocumentValidationError[]) {
    super("Page document cannot be migrated.");
    this.name = "PageDocumentMigrationError";
    this.errors = errors;
  }
}

export function migratePageDocumentV1ToV2(document: unknown): PageDocumentV2 {
  const result = PageDocumentV1Schema.safeParse(document);

  if (!result.success) {
    throw new PageDocumentMigrationError(toValidationErrors(result.error));
  }

  const migrated: PageDocumentV2 = {
    schemaVersion: PAGE_DOCUMENT_SCHEMA_VERSION,
    root: {
      id: result.data.root.id,
      type: "page",
      children: [
        {
          id: `${result.data.root.id}-section-v2`,
          type: "section",
          props: createDefaultSectionProps("single"),
          children: result.data.root.children.map((block) => ({ ...block }))
        }
      ]
    }
  };

  return PageDocumentV2Schema.parse(migrated);
}

export function migratePageDocumentToLatest(
  document: unknown
): PageDocumentMigrationResult {
  try {
    const version = detectPageDocumentVersion(document);

    if (version === 1) {
      return {
        ok: true,
        document: migratePageDocumentV1ToV2(document),
        migrated: true
      };
    }

    const result = PageDocumentV2Schema.safeParse(document);

    if (!result.success) {
      return {
        ok: false,
        errors: toValidationErrors(result.error)
      };
    }

    return {
      ok: true,
      document: result.data,
      migrated: false
    };
  } catch (error) {
    if (error instanceof PageDocumentMigrationError) {
      return {
        ok: false,
        errors: error.errors
      };
    }

    throw error;
  }
}

export function validatePageDocument(
  document: unknown
): PageDocumentValidationResult {
  const result = PageDocumentV2Schema.safeParse(document);

  if (result.success) {
    return {
      ok: true,
      document: result.data
    };
  }

  return {
    ok: false,
    errors: toValidationErrors(result.error)
  };
}

export function collectPageDocumentImageAssetIds(
  document: PageDocumentV2
): readonly string[] {
  return collectPageDocumentImageAssetReferences(document).map(
    (reference) => reference.assetId
  );
}

export type ImageAssetReference = {
  readonly blockId: string;
  readonly assetId: string;
  readonly src: string;
};

export function collectPageDocumentImageAssetReferences(
  document: PageDocumentV2
): readonly ImageAssetReference[] {
  return collectV2Nodes(document)
    .filter((node): node is ImageBlock => node.type === "image")
    .flatMap((node) =>
      node.props.assetId === undefined
        ? []
        : [
            {
              blockId: node.id,
              assetId: node.props.assetId,
              src: node.props.src
            }
          ]
    );
}

export function updateImageBlockExternalUrl(
  document: PageDocumentV2,
  blockId: string,
  src: string
): PageDocumentV2 {
  return updateNode(document, blockId, (node) =>
    node.type === "image" ? updateImageNodeExternalUrl(node, src) : node
  );
}

export function updateImageBlockAsset(
  document: PageDocumentV2,
  blockId: string,
  input: {
    readonly assetId: string;
    readonly src: string;
    readonly alt?: string | null;
  }
): PageDocumentV2 {
  return updateNode(document, blockId, (node) =>
    node.type === "image"
      ? {
          ...node,
          props: ImageBlockPropsSchema.parse({
            ...node.props,
            assetId: input.assetId,
            src: input.src,
            alt:
              node.props.alt.trim() === ""
                ? input.alt?.trim() || node.props.alt
                : node.props.alt
          })
        }
      : node
  );
}

function updateImageNodeExternalUrl(node: ImageBlock, src: string): ImageBlock {
  const props = {
    ...node.props
  };

  delete props.assetId;

  return {
    ...node,
    props: ImageBlockPropsSchema.parse({
      ...props,
      src
    })
  };
}

export function findNodeById(
  document: PageDocumentV2,
  nodeId: string
): EditorNode | null {
  return collectV2Nodes(document).find((node) => node.id === nodeId) ?? null;
}

export function findBlockById(
  document: PageDocumentV2,
  blockId: string
): LeafBlockNode | null {
  const node = findNodeById(document, blockId);

  return node !== null && isLeafBlockNode(node) ? node : null;
}

export function findParentNode(
  document: PageDocumentV2,
  nodeId: string
): PageNode | SectionNode | ColumnNode | null {
  if (document.root.id === nodeId) {
    return null;
  }

  for (const section of document.root.children) {
    if (section.id === nodeId) {
      return document.root;
    }

    for (const child of section.children) {
      if (child.id === nodeId) {
        return section;
      }

      if (child.type === "column") {
        for (const block of child.children) {
          if (block.id === nodeId) {
            return child;
          }
        }
      }
    }
  }

  return null;
}

export function insertSection(
  document: PageDocumentV2,
  section: SectionNode = createDefaultSection(),
  index?: number
): PageDocumentV2 {
  const children = [...document.root.children];
  const safeIndex = clampIndex(index, children.length);

  children.splice(safeIndex, 0, section);

  return withSections(document, children);
}

export function removeSection(
  document: PageDocumentV2,
  sectionId: string
): PageDocumentV2 {
  return withSections(
    document,
    document.root.children.filter((section) => section.id !== sectionId)
  );
}

export function moveSectionUp(
  document: PageDocumentV2,
  sectionId: string
): PageDocumentV2 {
  return moveSection(document, sectionId, -1);
}

export function moveSectionDown(
  document: PageDocumentV2,
  sectionId: string
): PageDocumentV2 {
  return moveSection(document, sectionId, 1);
}

export function updateSectionProps(
  document: PageDocumentV2,
  sectionId: string,
  props: Partial<SectionNodeProps>
): PageDocumentV2 {
  return updateNode(document, sectionId, (node) =>
    node.type === "section"
      ? {
          ...node,
          props: SectionNodePropsSchema.parse({
            ...node.props,
            ...props
          })
        }
      : node
  );
}

export function convertSectionLayout(
  document: PageDocumentV2,
  sectionId: string,
  layout: SectionLayout
): PageDocumentV2 {
  return updateNode(document, sectionId, (node) => {
    if (node.type !== "section" || node.props.layout === layout) {
      return node;
    }

    if (layout === "two-columns") {
      return {
        ...node,
        props: {
          ...node.props,
          layout
        },
        children: [
          {
            ...createDefaultColumn(),
            id: `${node.id}-column-1`,
            children: node.children.filter(isLeafBlockNode)
          },
          {
            ...createDefaultColumn(),
            id: `${node.id}-column-2`
          }
        ]
      };
    }

    return {
      ...node,
      props: {
        ...node.props,
        layout
      },
      children: node.children.flatMap((child) =>
        child.type === "column" ? child.children : [child]
      )
    };
  });
}

export function insertBlockIntoSection(
  document: PageDocumentV2,
  sectionId: string,
  block: LeafBlockNode,
  index?: number
): PageDocumentV2 {
  return updateNode(document, sectionId, (node) => {
    if (node.type !== "section" || node.props.layout !== "single") {
      return node;
    }

    const children = [...node.children.filter(isLeafBlockNode)];
    children.splice(clampIndex(index, children.length), 0, block);

    return {
      ...node,
      children
    };
  });
}

export function insertBlockIntoColumn(
  document: PageDocumentV2,
  columnId: string,
  block: LeafBlockNode,
  index?: number
): PageDocumentV2 {
  return updateNode(document, columnId, (node) => {
    if (node.type !== "column") {
      return node;
    }

    const children = [...node.children];
    children.splice(clampIndex(index, children.length), 0, block);

    return {
      ...node,
      children
    };
  });
}

export function moveBlockWithinParent(
  document: PageDocumentV2,
  blockId: string,
  direction: "up" | "down"
): PageDocumentV2 {
  const parent = findParentNode(document, blockId);

  if (parent === null || parent.type === "page") {
    return document;
  }

  const delta = direction === "up" ? -1 : 1;

  return updateNode(document, parent.id, (node) => {
    if (node.type !== "section" && node.type !== "column") {
      return node;
    }

    const children = node.type === "section" ? node.children.filter(isLeafBlockNode) : node.children;
    const index = children.findIndex((child) => child.id === blockId);
    const targetIndex = index + delta;

    if (index < 0 || targetIndex < 0 || targetIndex >= children.length) {
      return node;
    }

    return {
      ...node,
      children: moveArrayItem(children, index, targetIndex)
    };
  });
}

export function moveBlockToColumn(
  document: PageDocumentV2,
  blockId: string,
  columnId: string,
  index?: number
): PageDocumentV2 {
  const block = findBlockById(document, blockId);

  if (block === null || findNodeById(document, columnId)?.type !== "column") {
    return document;
  }

  return insertBlockIntoColumn(removeNode(document, blockId), columnId, block, index);
}

export function removeNode(
  document: PageDocumentV2,
  nodeId: string
): PageDocumentV2 {
  if (document.root.id === nodeId) {
    return document;
  }

  return {
    ...document,
    root: {
      ...document.root,
      children: document.root.children
        .filter((section) => section.id !== nodeId)
        .map((section) => removeFromSection(section, nodeId))
    }
  };
}

export function updateNodeProps<TType extends keyof NodePropsByType>(
  document: PageDocumentV2,
  nodeId: string,
  props: Partial<NodePropsByType[TType]>
): PageDocumentV2 {
  return updateNode(document, nodeId, (node) => {
    switch (node.type) {
      case "section":
        return {
          ...node,
          props: SectionNodePropsSchema.parse({
            ...node.props,
            ...props
          })
        };
      case "column":
        return {
          ...node,
          props: ColumnNodePropsSchema.parse({
            ...node.props,
            ...props
          })
        };
      case "heading":
        return {
          ...node,
          props: HeadingBlockPropsSchema.parse({ ...node.props, ...props })
        };
      case "text":
        return {
          ...node,
          props: TextBlockPropsSchema.parse({ ...node.props, ...props })
        };
      case "button":
        return {
          ...node,
          props: ButtonBlockPropsSchema.parse({ ...node.props, ...props })
        };
      case "spacer":
        return {
          ...node,
          props: SpacerBlockPropsSchema.parse({ ...node.props, ...props })
        };
      case "image":
        return {
          ...node,
          props: ImageBlockPropsSchema.parse({ ...node.props, ...props })
        };
      case "product-card":
        return {
          ...node,
          props: ProductCardBlockPropsSchema.parse({ ...node.props, ...props })
        };
      case "product-grid":
        return {
          ...node,
          props: ProductGridBlockPropsSchema.parse({ ...node.props, ...props })
        };
      case "page":
        return node;
    }
  });
}

export function updateBlockProps<TType extends LeafBlockType>(
  document: PageDocumentV2,
  blockId: string,
  props: Partial<BlockPropsByType[TType]>
): PageDocumentV2 {
  return updateNode(document, blockId, (node) => {
    switch (node.type) {
      case "heading":
        return {
          ...node,
          props: HeadingBlockPropsSchema.parse({ ...node.props, ...props })
        };
      case "text":
        return {
          ...node,
          props: TextBlockPropsSchema.parse({ ...node.props, ...props })
        };
      case "button":
        return {
          ...node,
          props: ButtonBlockPropsSchema.parse({ ...node.props, ...props })
        };
      case "spacer":
        return {
          ...node,
          props: SpacerBlockPropsSchema.parse({ ...node.props, ...props })
        };
      case "image":
        return {
          ...node,
          props: ImageBlockPropsSchema.parse({ ...node.props, ...props })
        };
      case "product-card":
        return {
          ...node,
          props: ProductCardBlockPropsSchema.parse({ ...node.props, ...props })
        };
      case "product-grid":
        return {
          ...node,
          props: ProductGridBlockPropsSchema.parse({ ...node.props, ...props })
        };
      case "page":
      case "section":
      case "column":
        return node;
    }
  });
}

export function insertBlock(
  document: PageDocumentV2,
  block: LeafBlockNode,
  index?: number
): PageDocumentV2 {
  const firstSection =
    document.root.children[0] ??
    ({
      ...createDefaultSection(),
      id: `${document.root.id}-section-v2`
    } satisfies SectionNode);
  const nextDocument =
    document.root.children.length === 0
      ? insertSection(document, firstSection)
      : document;

  return firstSection.props.layout === "single"
    ? insertBlockIntoSection(nextDocument, firstSection.id, block, index)
    : insertBlockIntoColumn(
        nextDocument,
        firstSection.children[0]?.id ?? "",
        block,
        index
      );
}

export function removeBlock(
  document: PageDocumentV2,
  blockId: string
): PageDocumentV2 {
  return removeNode(document, blockId);
}

export function moveBlockUp(
  document: PageDocumentV2,
  blockId: string
): PageDocumentV2 {
  return moveBlockWithinParent(document, blockId, "up");
}

export function moveBlockDown(
  document: PageDocumentV2,
  blockId: string
): PageDocumentV2 {
  return moveBlockWithinParent(document, blockId, "down");
}

function createDefaultSectionProps(layout: SectionLayout): SectionNodeProps {
  return {
    background: "white",
    paddingY: "medium",
    contentWidth: "standard",
    layout,
    columnRatio: "50-50",
    verticalAlign: "start"
  };
}

function isAllowedImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function collectV1Nodes(document: PageDocumentV1): readonly { readonly id: string }[] {
  return [document.root, ...document.root.children];
}

function collectV2Nodes(document: PageDocumentV2): EditorNode[] {
  const nodes: EditorNode[] = [document.root];

  for (const section of document.root.children) {
    nodes.push(section);

    for (const child of section.children) {
      nodes.push(child);

      if (child.type === "column") {
        nodes.push(...child.children);
      }
    }
  }

  return nodes;
}

function addDuplicateIdIssues(
  nodes: readonly { readonly id: string }[],
  context: z.RefinementCtx
): void {
  const ids = new Set<string>();

  for (const node of nodes) {
    if (ids.has(node.id)) {
      context.addIssue({
        code: "custom",
        message: `Duplicate node id: ${node.id}`,
        path: ["root", "children"]
      });
      return;
    }

    ids.add(node.id);
  }
}

function addDepthIssues(
  document: PageDocumentV2,
  context: z.RefinementCtx
): void {
  for (const section of document.root.children) {
    if (nodeDepth(section) > PAGE_DOCUMENT_MAX_DEPTH) {
      context.addIssue({
        code: "custom",
        message: "Page document tree is too deep.",
        path: ["root", "children"]
      });
      return;
    }
  }
}

function nodeDepth(node: SectionNode | ColumnNode | LeafBlockNode): number {
  if (isLeafBlockNode(node)) {
    return 2;
  }

  if (node.type === "column") {
    return 3;
  }

  const childDepths = node.children.map((child) =>
    child.type === "column" ? 1 + nodeDepth(child) : nodeDepth(child)
  );

  return childDepths.length === 0 ? 2 : Math.max(...childDepths);
}

function isLeafBlockNode(node: ChildNode | EditorNode): node is LeafBlockNode {
  return LEAF_BLOCK_TYPES.includes(node.type as LeafBlockType);
}

function updateNode(
  document: PageDocumentV2,
  nodeId: string,
  updater: (node: EditorNode) => EditorNode
): PageDocumentV2 {
  if (document.root.id === nodeId) {
    const updated = updater(document.root);

    return updated.type === "page" ? { ...document, root: updated } : document;
  }

  return withSections(
    document,
    document.root.children.map((section) => updateSection(section, nodeId, updater))
  );
}

function updateSection(
  section: SectionNode,
  nodeId: string,
  updater: (node: EditorNode) => EditorNode
): SectionNode {
  if (section.id === nodeId) {
    const updated = updater(section);

    return updated.type === "section" ? updated : section;
  }

  return {
    ...section,
    children: section.children.map((child) => {
      if (child.id === nodeId) {
        const updated = updater(child);

        return updated.type === child.type ? (updated as typeof child) : child;
      }

      if (child.type === "column") {
        return updateColumn(child, nodeId, updater);
      }

      return child;
    })
  };
}

function updateColumn(
  column: ColumnNode,
  nodeId: string,
  updater: (node: EditorNode) => EditorNode
): ColumnNode {
  if (column.id === nodeId) {
    const updated = updater(column);

    return updated.type === "column" ? updated : column;
  }

  return {
    ...column,
    children: column.children.map((block) => {
      if (block.id !== nodeId) {
        return block;
      }

      const updated = updater(block);

      return isLeafBlockNode(updated) ? updated : block;
    })
  };
}

function removeFromSection(section: SectionNode, nodeId: string): SectionNode {
  return {
    ...section,
    children: section.children
      .filter((child) => child.id !== nodeId)
      .map((child) =>
        child.type === "column"
          ? {
              ...child,
              children: child.children.filter((block) => block.id !== nodeId)
            }
          : child
      )
  };
}

function moveSection(
  document: PageDocumentV2,
  sectionId: string,
  delta: -1 | 1
): PageDocumentV2 {
  const index = document.root.children.findIndex((section) => section.id === sectionId);
  const targetIndex = index + delta;

  if (index < 0 || targetIndex < 0 || targetIndex >= document.root.children.length) {
    return document;
  }

  return withSections(
    document,
    moveArrayItem(document.root.children, index, targetIndex)
  );
}

function withSections(
  document: PageDocumentV2,
  sections: readonly SectionNode[]
): PageDocumentV2 {
  return {
    ...document,
    root: {
      ...document.root,
      children: [...sections]
    }
  };
}

function clampIndex(index: number | undefined, length: number): number {
  return index === undefined ? length : Math.max(0, Math.min(index, length));
}

function moveArrayItem<TItem>(
  items: readonly TItem[],
  fromIndex: number,
  toIndex: number
): TItem[] {
  const nextItems = [...items];
  const [item] = nextItems.splice(fromIndex, 1);

  if (item === undefined) {
    return [...items];
  }

  nextItems.splice(toIndex, 0, item);

  return nextItems;
}

function toValidationErrors(error: z.ZodError): readonly PageDocumentValidationError[] {
  return error.issues.map((issue) => ({
    path: issue.path.map((pathPart) =>
      typeof pathPart === "symbol" ? pathPart.toString() : pathPart
    ),
    message: issue.message
  }));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function createNodeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}
