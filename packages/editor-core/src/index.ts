import { z } from "zod";

export const packageName = "@site-platform/editor-core" as const;

export const PAGE_DOCUMENT_SCHEMA_VERSION = 1 as const;

export const BLOCK_TYPES = ["heading", "text", "button", "spacer"] as const;
export const TEXT_ALIGNMENTS = ["left", "center", "right"] as const;
export const HEADING_LEVELS = [1, 2, 3] as const;
export const BUTTON_VARIANTS = ["primary", "secondary"] as const;
export const SPACER_SIZES = ["small", "medium", "large"] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];
export type TextAlignment = (typeof TEXT_ALIGNMENTS)[number];
export type HeadingLevel = (typeof HEADING_LEVELS)[number];
export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];
export type SpacerSize = (typeof SPACER_SIZES)[number];

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

export const BlockNodeSchema = z.discriminatedUnion("type", [
  HeadingBlockSchema,
  TextBlockSchema,
  ButtonBlockSchema,
  SpacerBlockSchema
]);

export const PageDocumentV1Schema = z
  .object({
    schemaVersion: z.literal(PAGE_DOCUMENT_SCHEMA_VERSION),
    root: z
      .object({
        id: NodeIdSchema,
        type: z.literal("page"),
        children: z.array(BlockNodeSchema)
      })
      .strict()
  })
  .strict()
  .superRefine((document, context) => {
    const ids = new Set<string>();
    const allIds = [document.root.id, ...document.root.children.map((node) => node.id)];

    for (const id of allIds) {
      if (ids.has(id)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate node id: ${id}`,
          path: ["root", "children"]
        });
        return;
      }

      ids.add(id);
    }
  });

export type HeadingBlockProps = z.infer<typeof HeadingBlockPropsSchema>;
export type TextBlockProps = z.infer<typeof TextBlockPropsSchema>;
export type ButtonBlockProps = z.infer<typeof ButtonBlockPropsSchema>;
export type SpacerBlockProps = z.infer<typeof SpacerBlockPropsSchema>;
export type HeadingBlock = z.infer<typeof HeadingBlockSchema>;
export type TextBlock = z.infer<typeof TextBlockSchema>;
export type ButtonBlock = z.infer<typeof ButtonBlockSchema>;
export type SpacerBlock = z.infer<typeof SpacerBlockSchema>;
export type BlockNode = z.infer<typeof BlockNodeSchema>;
export type PageDocumentV1 = z.infer<typeof PageDocumentV1Schema>;

export type BlockPropsByType = {
  readonly heading: HeadingBlockProps;
  readonly text: TextBlockProps;
  readonly button: ButtonBlockProps;
  readonly spacer: SpacerBlockProps;
};

export type PageDocumentValidationError = {
  readonly path: readonly (string | number)[];
  readonly message: string;
};

export type PageDocumentValidationResult =
  | {
      readonly ok: true;
      readonly document: PageDocumentV1;
    }
  | {
      readonly ok: false;
      readonly errors: readonly PageDocumentValidationError[];
    };

export function createEmptyPageDocument(): PageDocumentV1 {
  return {
    schemaVersion: PAGE_DOCUMENT_SCHEMA_VERSION,
    root: {
      id: "root",
      type: "page",
      children: []
    }
  };
}

export function createDefaultBlock(type: "heading"): HeadingBlock;
export function createDefaultBlock(type: "text"): TextBlock;
export function createDefaultBlock(type: "button"): ButtonBlock;
export function createDefaultBlock(type: "spacer"): SpacerBlock;
export function createDefaultBlock(type: BlockType): BlockNode {
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
  }
}

export function validatePageDocument(
  document: unknown
): PageDocumentValidationResult {
  const result = PageDocumentV1Schema.safeParse(document);

  if (result.success) {
    return {
      ok: true,
      document: result.data
    };
  }

  return {
    ok: false,
    errors: result.error.issues.map((issue) => ({
      path: issue.path.map((pathPart) =>
        typeof pathPart === "symbol" ? pathPart.toString() : pathPart
      ),
      message: issue.message
    }))
  };
}

export function findBlockById(
  document: PageDocumentV1,
  blockId: string
): BlockNode | null {
  return document.root.children.find((block) => block.id === blockId) ?? null;
}

export function updateBlockProps<TType extends BlockType>(
  document: PageDocumentV1,
  blockId: string,
  props: Partial<BlockPropsByType[TType]>
): PageDocumentV1 {
  return updateBlock(document, blockId, (block) => {
    switch (block.type) {
      case "heading":
        return {
          ...block,
          props: HeadingBlockPropsSchema.parse({
            ...block.props,
            ...props
          })
        };
      case "text":
        return {
          ...block,
          props: TextBlockPropsSchema.parse({
            ...block.props,
            ...props
          })
        };
      case "button":
        return {
          ...block,
          props: ButtonBlockPropsSchema.parse({
            ...block.props,
            ...props
          })
        };
      case "spacer":
        return {
          ...block,
          props: SpacerBlockPropsSchema.parse({
            ...block.props,
            ...props
          })
        };
    }
  });
}

export function insertBlock(
  document: PageDocumentV1,
  block: BlockNode,
  index?: number
): PageDocumentV1 {
  const children = [...document.root.children];
  const safeIndex =
    index === undefined ? children.length : Math.max(0, Math.min(index, children.length));

  children.splice(safeIndex, 0, block);

  return withChildren(document, children);
}

export function removeBlock(
  document: PageDocumentV1,
  blockId: string
): PageDocumentV1 {
  return withChildren(
    document,
    document.root.children.filter((block) => block.id !== blockId)
  );
}

export function moveBlockUp(
  document: PageDocumentV1,
  blockId: string
): PageDocumentV1 {
  const index = document.root.children.findIndex((block) => block.id === blockId);

  if (index <= 0) {
    return document;
  }

  return moveBlock(document, index, index - 1);
}

export function moveBlockDown(
  document: PageDocumentV1,
  blockId: string
): PageDocumentV1 {
  const index = document.root.children.findIndex((block) => block.id === blockId);

  if (index < 0 || index >= document.root.children.length - 1) {
    return document;
  }

  return moveBlock(document, index, index + 1);
}

function updateBlock(
  document: PageDocumentV1,
  blockId: string,
  updater: (block: BlockNode) => BlockNode
): PageDocumentV1 {
  return withChildren(
    document,
    document.root.children.map((block) =>
      block.id === blockId ? updater(block) : block
    )
  );
}

function moveBlock(
  document: PageDocumentV1,
  fromIndex: number,
  toIndex: number
): PageDocumentV1 {
  const children = [...document.root.children];
  const [block] = children.splice(fromIndex, 1);

  if (block === undefined) {
    return document;
  }

  children.splice(toIndex, 0, block);

  return withChildren(document, children);
}

function withChildren(
  document: PageDocumentV1,
  children: readonly BlockNode[]
): PageDocumentV1 {
  return {
    ...document,
    root: {
      ...document.root,
      children: [...children]
    }
  };
}

function createNodeId(prefix: BlockType): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}
