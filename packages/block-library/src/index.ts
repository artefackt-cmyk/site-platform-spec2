import {
  ButtonBlockPropsSchema,
  ColumnNodePropsSchema,
  HeadingBlockPropsSchema,
  ImageBlockPropsSchema,
  SectionNodePropsSchema,
  SpacerBlockPropsSchema,
  TextBlockPropsSchema,
  createDefaultBlock,
  type BlockPropsByType,
  type BlockType,
  type ColumnNode,
  type ColumnNodeProps,
  type LeafBlockNode,
  type SectionNode,
  type SectionNodeProps
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

export type SectionDefinition = {
  readonly type: "section";
  readonly label: string;
  readonly defaultProps: SectionNodeProps;
  readonly propsSchema: z.ZodType<SectionNodeProps>;
  readonly inspectorFields: readonly InspectorFieldDefinition[];
};

export type ColumnDefinition = {
  readonly type: "column";
  readonly label: string;
  readonly defaultProps: ColumnNodeProps;
  readonly propsSchema: z.ZodType<ColumnNodeProps>;
  readonly inspectorFields: readonly InspectorFieldDefinition[];
};

export type SectionPreset = {
  readonly id: "hero" | "text-section";
  readonly label: string;
  readonly createSection: () => SectionNode;
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

export const IMAGE_BLOCK_DEFINITION: BlockDefinition<"image"> = {
  type: "image",
  label: "Изображение",
  defaultProps: createDefaultBlock("image").props,
  propsSchema: ImageBlockPropsSchema,
  inspectorFields: [
    {
      name: "src",
      label: "URL",
      fieldType: "url"
    },
    {
      name: "alt",
      label: "Alt",
      fieldType: "text"
    },
    {
      name: "caption",
      label: "Подпись",
      fieldType: "text"
    },
    {
      name: "aspectRatio",
      label: "Формат",
      fieldType: "select",
      options: [
        {
          label: "Авто",
          value: "auto"
        },
        {
          label: "Квадрат",
          value: "square"
        },
        {
          label: "Портрет",
          value: "portrait"
        },
        {
          label: "Пейзаж",
          value: "landscape"
        },
        {
          label: "Широкий",
          value: "wide"
        }
      ]
    },
    {
      name: "objectFit",
      label: "Заполнение",
      fieldType: "select",
      options: [
        {
          label: "Обрезать",
          value: "cover"
        },
        {
          label: "Вписать",
          value: "contain"
        }
      ]
    },
    {
      name: "borderRadius",
      label: "Скругление",
      fieldType: "select",
      options: [
        {
          label: "Нет",
          value: "none"
        },
        {
          label: "Малое",
          value: "small"
        },
        {
          label: "Среднее",
          value: "medium"
        },
        {
          label: "Большое",
          value: "large"
        }
      ]
    },
    {
      name: "width",
      label: "Ширина",
      fieldType: "select",
      options: [
        {
          label: "Малая",
          value: "small"
        },
        {
          label: "Средняя",
          value: "medium"
        },
        {
          label: "Полная",
          value: "full"
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

export const SECTION_DEFINITION: SectionDefinition = {
  type: "section",
  label: "Секция",
  defaultProps: createSectionProps(),
  propsSchema: SectionNodePropsSchema,
  inspectorFields: [
    {
      name: "layout",
      label: "Композиция",
      fieldType: "select",
      options: [
        {
          label: "Одна колонка",
          value: "single"
        },
        {
          label: "Две колонки",
          value: "two-columns"
        }
      ]
    },
    {
      name: "columnRatio",
      label: "Колонки",
      fieldType: "select",
      options: [
        {
          label: "50 / 50",
          value: "50-50"
        },
        {
          label: "40 / 60",
          value: "40-60"
        },
        {
          label: "60 / 40",
          value: "60-40"
        }
      ]
    },
    {
      name: "background",
      label: "Фон",
      fieldType: "select",
      options: [
        {
          label: "Белый",
          value: "white"
        },
        {
          label: "Спокойный",
          value: "muted"
        },
        {
          label: "Темный",
          value: "dark"
        },
        {
          label: "Акцент",
          value: "accent"
        }
      ]
    },
    {
      name: "paddingY",
      label: "Отступ",
      fieldType: "select",
      options: [
        {
          label: "Малый",
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
    },
    {
      name: "contentWidth",
      label: "Ширина",
      fieldType: "select",
      options: [
        {
          label: "Узкая",
          value: "narrow"
        },
        {
          label: "Стандарт",
          value: "standard"
        },
        {
          label: "Широкая",
          value: "wide"
        }
      ]
    },
    {
      name: "verticalAlign",
      label: "Вертикаль",
      fieldType: "select",
      options: [
        {
          label: "Сверху",
          value: "start"
        },
        {
          label: "По центру",
          value: "center"
        },
        {
          label: "Снизу",
          value: "end"
        }
      ]
    }
  ]
};

export const COLUMN_DEFINITION: ColumnDefinition = {
  type: "column",
  label: "Колонка",
  defaultProps: {
    align: "left"
  },
  propsSchema: ColumnNodePropsSchema,
  inspectorFields: [
    {
      name: "align",
      label: "Выравнивание",
      fieldType: "select",
      options: alignmentOptions()
    }
  ]
};

export const BLOCK_DEFINITIONS = [
  HEADING_BLOCK_DEFINITION,
  TEXT_BLOCK_DEFINITION,
  BUTTON_BLOCK_DEFINITION,
  IMAGE_BLOCK_DEFINITION,
  SPACER_BLOCK_DEFINITION
] as const;

export const SECTION_PRESETS: readonly SectionPreset[] = [
  {
    id: "hero",
    label: "Hero",
    createSection: createHeroSectionPreset
  },
  {
    id: "text-section",
    label: "Текстовая секция",
    createSection: createTextSectionPreset
  }
];

export function getBlockDefinition(type: BlockType) {
  return BLOCK_DEFINITIONS.find((definition) => definition.type === type) ?? null;
}

export function createHeroSectionPreset(): SectionNode {
  const sectionId = createPresetNodeId("section-hero");
  const heading = withNodeId(createDefaultBlock("heading"), `${sectionId}-heading`);
  const text = withNodeId(createDefaultBlock("text"), `${sectionId}-text`);
  const button = withNodeId(createDefaultBlock("button"), `${sectionId}-button`);
  const image = withNodeId(createDefaultBlock("image"), `${sectionId}-image`);

  return {
    id: sectionId,
    type: "section",
    props: {
      ...createSectionProps(),
      layout: "two-columns",
      columnRatio: "60-40",
      paddingY: "large",
      contentWidth: "wide",
      verticalAlign: "center"
    },
    children: [
      createColumn(`${sectionId}-column-1`, [
        {
          ...heading,
          props: {
            ...heading.props,
            text: "Новый раздел",
            level: 1
          }
        },
        {
          ...text,
          props: {
            ...text.props,
            text: "Короткое описание предложения или страницы."
          }
        },
        button
      ]),
      createColumn(`${sectionId}-column-2`, [image])
    ]
  };
}

export function createTextSectionPreset(): SectionNode {
  const sectionId = createPresetNodeId("section-text");
  const heading = withNodeId(createDefaultBlock("heading"), `${sectionId}-heading`);
  const text = withNodeId(createDefaultBlock("text"), `${sectionId}-text`);

  return {
    id: sectionId,
    type: "section",
    props: createSectionProps(),
    children: [
      {
        ...heading,
        props: {
          ...heading.props,
          text: "Заголовок секции"
        }
      },
      {
        ...text,
        props: {
          ...text.props,
          text: "Основной текст секции."
        }
      }
    ]
  };
}

function createSectionProps(): SectionNodeProps {
  return {
    background: "white",
    paddingY: "medium",
    contentWidth: "standard",
    layout: "single",
    columnRatio: "50-50",
    verticalAlign: "start"
  };
}

function createColumn(id: string, children: readonly LeafBlockNode[]): ColumnNode {
  return {
    id,
    type: "column",
    props: {
      align: "left"
    },
    children: [...children]
  };
}

function withNodeId<TNode extends LeafBlockNode>(node: TNode, id: string): TNode {
  return {
    ...node,
    id
  };
}

function createPresetNodeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
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
