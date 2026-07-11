import {
  ButtonBlockPropsSchema,
  HeadingBlockPropsSchema,
  SpacerBlockPropsSchema,
  TextBlockPropsSchema,
  createDefaultBlock,
  type BlockPropsByType,
  type BlockType
} from "@site-platform/editor-core";
import type { z } from "zod";

export const packageName = "@site-platform/block-library" as const;

export type InspectorFieldType = "text" | "textarea" | "select" | "url";

export type InspectorFieldDefinition = {
  readonly name: string;
  readonly label: string;
  readonly fieldType: InspectorFieldType;
  readonly options?: readonly {
    readonly label: string;
    readonly value: string | number;
  }[];
};

export type BlockDefinition<TType extends BlockType> = {
  readonly type: TType;
  readonly label: string;
  readonly defaultProps: BlockPropsByType[TType];
  readonly propsSchema: z.ZodType<BlockPropsByType[TType]>;
  readonly inspectorFields: readonly InspectorFieldDefinition[];
};

export const HEADING_BLOCK_DEFINITION: BlockDefinition<"heading"> = {
  type: "heading",
  label: "Заголовок",
  defaultProps: createDefaultBlock("heading").props,
  propsSchema: HeadingBlockPropsSchema,
  inspectorFields: [
    {
      name: "text",
      label: "Текст",
      fieldType: "text"
    },
    {
      name: "level",
      label: "Уровень",
      fieldType: "select",
      options: [
        {
          label: "H1",
          value: 1
        },
        {
          label: "H2",
          value: 2
        },
        {
          label: "H3",
          value: 3
        }
      ]
    },
    {
      name: "align",
      label: "Выравнивание",
      fieldType: "select",
      options: alignmentOptions()
    }
  ]
};

export const TEXT_BLOCK_DEFINITION: BlockDefinition<"text"> = {
  type: "text",
  label: "Текст",
  defaultProps: createDefaultBlock("text").props,
  propsSchema: TextBlockPropsSchema,
  inspectorFields: [
    {
      name: "text",
      label: "Текст",
      fieldType: "textarea"
    },
    {
      name: "align",
      label: "Выравнивание",
      fieldType: "select",
      options: alignmentOptions()
    }
  ]
};

export const BUTTON_BLOCK_DEFINITION: BlockDefinition<"button"> = {
  type: "button",
  label: "Кнопка",
  defaultProps: createDefaultBlock("button").props,
  propsSchema: ButtonBlockPropsSchema,
  inspectorFields: [
    {
      name: "label",
      label: "Надпись",
      fieldType: "text"
    },
    {
      name: "href",
      label: "Ссылка",
      fieldType: "url"
    },
    {
      name: "variant",
      label: "Стиль",
      fieldType: "select",
      options: [
        {
          label: "Основной",
          value: "primary"
        },
        {
          label: "Вторичный",
          value: "secondary"
        }
      ]
    },
    {
      name: "align",
      label: "Выравнивание",
      fieldType: "select",
      options: alignmentOptions()
    }
  ]
};

export const SPACER_BLOCK_DEFINITION: BlockDefinition<"spacer"> = {
  type: "spacer",
  label: "Отступ",
  defaultProps: createDefaultBlock("spacer").props,
  propsSchema: SpacerBlockPropsSchema,
  inspectorFields: [
    {
      name: "size",
      label: "Размер",
      fieldType: "select",
      options: [
        {
          label: "Маленький",
          value: "small"
        },
        {
          label: "Средний",
          value: "medium"
        },
        {
          label: "Большой",
          value: "large"
        }
      ]
    }
  ]
};

export const BLOCK_DEFINITIONS = [
  HEADING_BLOCK_DEFINITION,
  TEXT_BLOCK_DEFINITION,
  BUTTON_BLOCK_DEFINITION,
  SPACER_BLOCK_DEFINITION
] as const;

export function getBlockDefinition(type: BlockType) {
  return BLOCK_DEFINITIONS.find((definition) => definition.type === type) ?? null;
}

function alignmentOptions() {
  return [
    {
      label: "Слева",
      value: "left"
    },
    {
      label: "По центру",
      value: "center"
    },
    {
      label: "Справа",
      value: "right"
    }
  ] as const;
}
