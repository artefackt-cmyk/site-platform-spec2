import * as React from "react";
import { BLOCK_DEFINITIONS, getBlockDefinition } from "@site-platform/block-library";
import {
  findNodeById,
  type BlockNode,
  type BlockPropsByType,
  type BlockType,
  type ButtonBlock,
  type ColumnNode,
  type HeadingBlock,
  type ImageBlock,
  type NodePropsByType,
  type SectionLayout,
  type SectionNode,
  type SpacerBlock,
  type TextBlock
} from "@site-platform/editor-core";
import { PageRenderer } from "@site-platform/renderer";
import type { ProjectSummary, SitePageSummary } from "./dashboard-types";
import type { EditorState } from "./page-editor-state";

export type PageEditorLoadState =
  | {
      readonly status: "loading";
    }
  | {
      readonly status: "error";
      readonly message: string;
    }
  | {
      readonly status: "ready";
      readonly project: ProjectSummary;
      readonly page: SitePageSummary;
      readonly editor: EditorState;
    };

export type PageEditorViewProps = {
  readonly state: PageEditorLoadState;
  readonly onAddSection: () => void;
  readonly onAddHeroSection: () => void;
  readonly onAddTextSection: () => void;
  readonly onAddBlock: (type: BlockType) => void;
  readonly onSelectNode: (nodeId: string | null) => void;
  readonly onMoveNode: (nodeId: string, direction: "up" | "down") => void;
  readonly onRemoveNode: (nodeId: string) => void;
  readonly onConvertSection: (layout: SectionLayout) => void;
  readonly onUpdateSection: (props: Partial<NodePropsByType["section"]>) => void;
  readonly onUpdateColumn: (props: Partial<NodePropsByType["column"]>) => void;
  readonly onUpdateHeading: (props: Partial<BlockPropsByType["heading"]>) => void;
  readonly onUpdateText: (props: Partial<BlockPropsByType["text"]>) => void;
  readonly onUpdateButton: (props: Partial<BlockPropsByType["button"]>) => void;
  readonly onUpdateImage: (props: Partial<BlockPropsByType["image"]>) => void;
  readonly onUpdateSpacer: (props: Partial<BlockPropsByType["spacer"]>) => void;
  readonly onSave: () => void | Promise<boolean>;
  readonly onPreview: () => void;
  readonly previewWarningOpen: boolean;
  readonly onSaveAndPreview: () => void;
  readonly onOpenSavedPreview: () => void;
  readonly onCancelPreview: () => void;
};

export function PageEditorView({
  state,
  onAddSection,
  onAddHeroSection,
  onAddTextSection,
  onAddBlock,
  onSelectNode,
  onMoveNode,
  onRemoveNode,
  onConvertSection,
  onUpdateSection,
  onUpdateColumn,
  onUpdateHeading,
  onUpdateText,
  onUpdateButton,
  onUpdateImage,
  onUpdateSpacer,
  onSave,
  onPreview,
  previewWarningOpen,
  onSaveAndPreview,
  onOpenSavedPreview,
  onCancelPreview
}: PageEditorViewProps) {
  if (state.status === "loading") {
    return (
      <EditorShell>
        <EditorCenterState
          title="Загрузка страницы"
          text="Получаем документ страницы."
        />
      </EditorShell>
    );
  }

  if (state.status === "error") {
    return (
      <EditorShell>
        <EditorCenterState
          title="Страница не открыта"
          text={state.message}
          tone="error"
        />
      </EditorShell>
    );
  }

  const selectedNode =
    state.editor.selectedNodeId === null
      ? null
      : findNodeById(state.editor.document, state.editor.selectedNodeId);

  return (
    <main className="editor-shell">
      <EditorTopbar
        project={state.project}
        page={state.page}
        saveStatus={state.editor.saveStatus}
        errorMessage={state.editor.errorMessage}
        onSave={onSave}
        onPreview={onPreview}
      />

      <section className="editor-workbench">
        <aside className="editor-panel editor-left-panel">
          <StructureTree
            sections={state.editor.document.root.children}
            selectedNodeId={state.editor.selectedNodeId}
            onSelectNode={onSelectNode}
            onMoveNode={onMoveNode}
            onRemoveNode={onRemoveNode}
          />
          <AddSectionPanel
            onAddSection={onAddSection}
            onAddHeroSection={onAddHeroSection}
            onAddTextSection={onAddTextSection}
          />
          <AddBlockPanel onAddBlock={onAddBlock} />
        </aside>

        <section className="editor-center-panel" onClick={() => onSelectNode(null)}>
          <div className="editor-canvas">
            {state.editor.document.root.children.length === 0 ? (
              <div className="editor-empty-canvas">
                Страница пока пуста. Добавьте первую секцию
              </div>
            ) : (
              <PageRenderer
                document={state.editor.document}
                mode="editor"
                selectedNodeId={state.editor.selectedNodeId}
                onNodeSelect={onSelectNode}
              />
            )}
          </div>
        </section>

        <aside className="editor-panel editor-right-panel">
          <Inspector
            node={selectedNode}
            onConvertSection={onConvertSection}
            onUpdateSection={onUpdateSection}
            onUpdateColumn={onUpdateColumn}
            onUpdateHeading={onUpdateHeading}
            onUpdateText={onUpdateText}
            onUpdateButton={onUpdateButton}
            onUpdateImage={onUpdateImage}
            onUpdateSpacer={onUpdateSpacer}
          />
        </aside>
      </section>
      {previewWarningOpen ? (
        <PreviewWarningDialog
          onSaveAndPreview={onSaveAndPreview}
          onOpenSavedPreview={onOpenSavedPreview}
          onCancelPreview={onCancelPreview}
        />
      ) : null}
    </main>
  );
}

function EditorShell({ children }: { readonly children: React.ReactNode }) {
  return (
    <main className="dashboard-shell">
      <section className="dashboard-panel">{children}</section>
    </main>
  );
}

function EditorTopbar({
  project,
  page,
  saveStatus,
  errorMessage,
  onSave,
  onPreview
}: {
  readonly project: ProjectSummary;
  readonly page: SitePageSummary;
  readonly saveStatus: EditorState["saveStatus"];
  readonly errorMessage: string | null;
  readonly onSave: () => void | Promise<boolean>;
  readonly onPreview: () => void;
}) {
  return (
    <header className="editor-topbar">
      <div>
        <nav className="breadcrumb" aria-label="Навигация">
          <a href={`/projects/${project.id}`}>Страницы</a>
          <span>/</span>
          <span>{page.title}</span>
        </nav>
        <h1>{page.title}</h1>
        <p className="project-slug">/{page.slug}</p>
      </div>
      <div className="editor-topbar-actions">
        <span className="project-status">{page.status}</span>
        <span className={`save-indicator save-indicator-${saveStatus}`}>
          {toSaveStatusLabel(saveStatus)}
        </span>
        <button
          className="primary-button"
          type="button"
          onClick={onSave}
          disabled={saveStatus === "saving" || saveStatus === "saved"}
        >
          Сохранить
        </button>
        <button
          className="ghost-button"
          type="button"
          onClick={onPreview}
          disabled={saveStatus === "saving"}
        >
          Предпросмотр
        </button>
        <a className="ghost-button" href={`/projects/${project.id}`}>
          Назад к страницам
        </a>
      </div>
      {errorMessage === null ? null : (
        <p className="editor-save-error" role="alert">
          {errorMessage}
        </p>
      )}
    </header>
  );
}

function PreviewWarningDialog({
  onSaveAndPreview,
  onOpenSavedPreview,
  onCancelPreview
}: {
  readonly onSaveAndPreview: () => void;
  readonly onOpenSavedPreview: () => void;
  readonly onCancelPreview: () => void;
}) {
  return (
    <div className="preview-warning-backdrop" role="presentation">
      <section
        className="preview-warning-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-warning-title"
      >
        <p className="eyebrow">Предпросмотр</p>
        <h2 id="preview-warning-title">
          Предпросмотр показывает последнюю сохранённую версию
        </h2>
        <p>
          У вас есть несохранённые изменения. Сохраните их перед открытием
          предпросмотра или откройте последнюю сохранённую версию.
        </p>
        <div className="preview-warning-actions">
          <button className="primary-button" type="button" onClick={onSaveAndPreview}>
            Сохранить и открыть
          </button>
          <button className="secondary-button" type="button" onClick={onOpenSavedPreview}>
            Открыть сохранённую версию
          </button>
          <button className="ghost-button" type="button" onClick={onCancelPreview}>
            Отмена
          </button>
        </div>
      </section>
    </div>
  );
}

function StructureTree({
  sections,
  selectedNodeId,
  onSelectNode,
  onMoveNode,
  onRemoveNode
}: {
  readonly sections: readonly SectionNode[];
  readonly selectedNodeId: string | null;
  readonly onSelectNode: (nodeId: string | null) => void;
  readonly onMoveNode: (nodeId: string, direction: "up" | "down") => void;
  readonly onRemoveNode: (nodeId: string) => void;
}) {
  return (
    <section className="editor-panel-section">
      <p className="eyebrow">Структура</p>
      {sections.length === 0 ? (
        <p className="editor-muted">Секций пока нет.</p>
      ) : (
        <div className="editor-block-list">
          {sections.map((section, index) => (
            <TreeSection
              key={section.id}
              section={section}
              index={index}
              total={sections.length}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
              onMoveNode={onMoveNode}
              onRemoveNode={onRemoveNode}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function TreeSection({
  section,
  index,
  total,
  selectedNodeId,
  onSelectNode,
  onMoveNode,
  onRemoveNode
}: {
  readonly section: SectionNode;
  readonly index: number;
  readonly total: number;
  readonly selectedNodeId: string | null;
  readonly onSelectNode: (nodeId: string | null) => void;
  readonly onMoveNode: (nodeId: string, direction: "up" | "down") => void;
  readonly onRemoveNode: (nodeId: string) => void;
}) {
  return (
    <article
      className={
        selectedNodeId === section.id
          ? "editor-block-list-item editor-block-list-item-selected"
          : "editor-block-list-item"
      }
    >
      <button
        type="button"
        className="editor-block-select"
        onClick={() => onSelectNode(section.id)}
      >
        <strong>Секция</strong>
        <span>{section.props.layout === "two-columns" ? "Две колонки" : "Одна колонка"}</span>
      </button>
      <div className="editor-block-actions">
        <button
          type="button"
          className="mini-button"
          onClick={() => onMoveNode(section.id, "up")}
          disabled={index === 0}
        >
          Вверх
        </button>
        <button
          type="button"
          className="mini-button"
          onClick={() => onMoveNode(section.id, "down")}
          disabled={index === total - 1}
        >
          Вниз
        </button>
        <button
          type="button"
          className="mini-button danger-mini-button"
          onClick={() => onRemoveNode(section.id)}
        >
          Удалить
        </button>
      </div>
      <div className="editor-block-list">
        {section.children.map((child, childIndex) =>
          child.type === "column" ? (
            <TreeColumn
              key={child.id}
              column={child}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
              onMoveNode={onMoveNode}
              onRemoveNode={onRemoveNode}
            />
          ) : (
            <TreeBlock
              key={child.id}
              block={child}
              index={childIndex}
              total={section.children.length}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
              onMoveNode={onMoveNode}
              onRemoveNode={onRemoveNode}
            />
          )
        )}
      </div>
    </article>
  );
}

function TreeColumn({
  column,
  selectedNodeId,
  onSelectNode,
  onMoveNode,
  onRemoveNode
}: {
  readonly column: ColumnNode;
  readonly selectedNodeId: string | null;
  readonly onSelectNode: (nodeId: string | null) => void;
  readonly onMoveNode: (nodeId: string, direction: "up" | "down") => void;
  readonly onRemoveNode: (nodeId: string) => void;
}) {
  return (
    <article
      className={
        selectedNodeId === column.id
          ? "editor-block-list-item editor-block-list-item-selected"
          : "editor-block-list-item"
      }
    >
      <button
        type="button"
        className="editor-block-select"
        onClick={() => onSelectNode(column.id)}
      >
        <strong>Колонка</strong>
        <span>{column.children.length} блоков</span>
      </button>
      <div className="editor-block-list">
        {column.children.map((block, index) => (
          <TreeBlock
            key={block.id}
            block={block}
            index={index}
            total={column.children.length}
            selectedNodeId={selectedNodeId}
            onSelectNode={onSelectNode}
            onMoveNode={onMoveNode}
            onRemoveNode={onRemoveNode}
          />
        ))}
      </div>
    </article>
  );
}

function TreeBlock({
  block,
  index,
  total,
  selectedNodeId,
  onSelectNode,
  onMoveNode,
  onRemoveNode
}: {
  readonly block: BlockNode;
  readonly index: number;
  readonly total: number;
  readonly selectedNodeId: string | null;
  readonly onSelectNode: (nodeId: string | null) => void;
  readonly onMoveNode: (nodeId: string, direction: "up" | "down") => void;
  readonly onRemoveNode: (nodeId: string) => void;
}) {
  const definition = getBlockDefinition(block.type);

  return (
    <article
      className={
        selectedNodeId === block.id
          ? "editor-block-list-item editor-block-list-item-selected"
          : "editor-block-list-item"
      }
    >
      <button
        type="button"
        className="editor-block-select"
        onClick={() => onSelectNode(block.id)}
      >
        <strong>{definition?.label ?? block.type}</strong>
        <span>{getBlockSummary(block)}</span>
      </button>
      <div className="editor-block-actions">
        <button
          type="button"
          className="mini-button"
          onClick={() => onMoveNode(block.id, "up")}
          disabled={index === 0}
        >
          Вверх
        </button>
        <button
          type="button"
          className="mini-button"
          onClick={() => onMoveNode(block.id, "down")}
          disabled={index === total - 1}
        >
          Вниз
        </button>
        <button
          type="button"
          className="mini-button danger-mini-button"
          onClick={() => onRemoveNode(block.id)}
        >
          Удалить
        </button>
      </div>
    </article>
  );
}

function AddSectionPanel({
  onAddSection,
  onAddHeroSection,
  onAddTextSection
}: {
  readonly onAddSection: () => void;
  readonly onAddHeroSection: () => void;
  readonly onAddTextSection: () => void;
}) {
  return (
    <section className="editor-panel-section">
      <p className="eyebrow">Добавить секцию</p>
      <div className="add-block-grid">
        <button type="button" className="secondary-button" onClick={onAddSection}>
          Пустая
        </button>
        <button type="button" className="secondary-button" onClick={onAddHeroSection}>
          Hero
        </button>
        <button type="button" className="secondary-button" onClick={onAddTextSection}>
          Текст
        </button>
      </div>
    </section>
  );
}

function AddBlockPanel({
  onAddBlock
}: {
  readonly onAddBlock: (type: BlockType) => void;
}) {
  return (
    <section className="editor-panel-section">
      <p className="eyebrow">Добавить блок</p>
      <div className="add-block-grid">
        {BLOCK_DEFINITIONS.map((definition) => (
          <button
            key={definition.type}
            type="button"
            className="secondary-button"
            onClick={() => onAddBlock(definition.type)}
          >
            {definition.label}
          </button>
        ))}
      </div>
    </section>
  );
}

function Inspector({
  node,
  onConvertSection,
  onUpdateSection,
  onUpdateColumn,
  onUpdateHeading,
  onUpdateText,
  onUpdateButton,
  onUpdateImage,
  onUpdateSpacer
}: {
  readonly node: ReturnType<typeof findNodeById>;
  readonly onConvertSection: (layout: SectionLayout) => void;
  readonly onUpdateSection: (props: Partial<NodePropsByType["section"]>) => void;
  readonly onUpdateColumn: (props: Partial<NodePropsByType["column"]>) => void;
  readonly onUpdateHeading: (props: Partial<BlockPropsByType["heading"]>) => void;
  readonly onUpdateText: (props: Partial<BlockPropsByType["text"]>) => void;
  readonly onUpdateButton: (props: Partial<BlockPropsByType["button"]>) => void;
  readonly onUpdateImage: (props: Partial<BlockPropsByType["image"]>) => void;
  readonly onUpdateSpacer: (props: Partial<BlockPropsByType["spacer"]>) => void;
}) {
  if (node === null || node.type === "page") {
    return (
      <section className="editor-panel-section">
        <p className="eyebrow">Инспектор</p>
        <h2>Выберите элемент</h2>
        <p className="editor-muted">Настройки появятся после выбора элемента.</p>
      </section>
    );
  }

  switch (node.type) {
    case "section":
      return (
        <SectionInspector
          section={node}
          onConvertSection={onConvertSection}
          onUpdateSection={onUpdateSection}
        />
      );
    case "column":
      return <ColumnInspector column={node} onUpdateColumn={onUpdateColumn} />;
    case "heading":
      return (
        <HeadingInspector block={node} onUpdateHeading={onUpdateHeading} />
      );
    case "text":
      return <TextInspector block={node} onUpdateText={onUpdateText} />;
    case "button":
      return <ButtonInspector block={node} onUpdateButton={onUpdateButton} />;
    case "image":
      return <ImageInspector block={node} onUpdateImage={onUpdateImage} />;
    case "spacer":
      return <SpacerInspector block={node} onUpdateSpacer={onUpdateSpacer} />;
  }
}

function SectionInspector({
  section,
  onConvertSection,
  onUpdateSection
}: {
  readonly section: SectionNode;
  readonly onConvertSection: (layout: SectionLayout) => void;
  readonly onUpdateSection: (props: Partial<NodePropsByType["section"]>) => void;
}) {
  return (
    <section className="editor-panel-section">
      <p className="eyebrow">Инспектор</p>
      <h2>Секция</h2>
      <InspectorSelect
        label="Композиция"
        value={section.props.layout}
        options={[
          ["single", "Одна колонка"],
          ["two-columns", "Две колонки"]
        ]}
        onChange={(layout) =>
          onConvertSection(layout === "two-columns" ? "two-columns" : "single")
        }
      />
      <InspectorSelect
        label="Ширина колонок"
        value={section.props.columnRatio}
        options={[
          ["50-50", "50 / 50"],
          ["40-60", "40 / 60"],
          ["60-40", "60 / 40"]
        ]}
        onChange={(columnRatio) =>
          onUpdateSection({
            columnRatio:
              columnRatio === "40-60"
                ? "40-60"
                : columnRatio === "60-40"
                  ? "60-40"
                  : "50-50"
          })
        }
      />
      <InspectorSelect
        label="Фон"
        value={section.props.background}
        options={[
          ["white", "Белый"],
          ["muted", "Спокойный"],
          ["dark", "Темный"],
          ["accent", "Акцент"]
        ]}
        onChange={(background) =>
          onUpdateSection({
            background:
              background === "muted"
                ? "muted"
                : background === "dark"
                  ? "dark"
                  : background === "accent"
                    ? "accent"
                    : "white"
          })
        }
      />
      <InspectorSelect
        label="Отступ"
        value={section.props.paddingY}
        options={[
          ["small", "Малый"],
          ["medium", "Средний"],
          ["large", "Большой"]
        ]}
        onChange={(paddingY) =>
          onUpdateSection({
            paddingY:
              paddingY === "small" ? "small" : paddingY === "large" ? "large" : "medium"
          })
        }
      />
      <InspectorSelect
        label="Контент"
        value={section.props.contentWidth}
        options={[
          ["narrow", "Узкий"],
          ["standard", "Стандарт"],
          ["wide", "Широкий"]
        ]}
        onChange={(contentWidth) =>
          onUpdateSection({
            contentWidth:
              contentWidth === "narrow"
                ? "narrow"
                : contentWidth === "wide"
                  ? "wide"
                  : "standard"
          })
        }
      />
      <InspectorSelect
        label="Вертикаль"
        value={section.props.verticalAlign}
        options={[
          ["start", "Сверху"],
          ["center", "По центру"],
          ["end", "Снизу"]
        ]}
        onChange={(verticalAlign) =>
          onUpdateSection({
            verticalAlign:
              verticalAlign === "center"
                ? "center"
                : verticalAlign === "end"
                  ? "end"
                  : "start"
          })
        }
      />
    </section>
  );
}

function ColumnInspector({
  column,
  onUpdateColumn
}: {
  readonly column: ColumnNode;
  readonly onUpdateColumn: (props: Partial<NodePropsByType["column"]>) => void;
}) {
  return (
    <section className="editor-panel-section">
      <p className="eyebrow">Инспектор</p>
      <h2>Колонка</h2>
      <AlignmentSelect
        value={column.props.align}
        onChange={(align) => onUpdateColumn({ align })}
      />
    </section>
  );
}

function HeadingInspector({
  block,
  onUpdateHeading
}: {
  readonly block: HeadingBlock;
  readonly onUpdateHeading: (props: Partial<BlockPropsByType["heading"]>) => void;
}) {
  return (
    <section className="editor-panel-section">
      <p className="eyebrow">Инспектор</p>
      <h2>Заголовок</h2>
      <InspectorTextInput
        label="Текст"
        value={block.props.text}
        onChange={(text) => onUpdateHeading({ text })}
      />
      <InspectorSelect
        label="Уровень"
        value={String(block.props.level)}
        options={[
          ["1", "H1"],
          ["2", "H2"],
          ["3", "H3"]
        ]}
        onChange={(value) =>
          onUpdateHeading({
            level: Number(value) === 1 ? 1 : Number(value) === 2 ? 2 : 3
          })
        }
      />
      <AlignmentSelect
        value={block.props.align}
        onChange={(align) => onUpdateHeading({ align })}
      />
    </section>
  );
}

function TextInspector({
  block,
  onUpdateText
}: {
  readonly block: TextBlock;
  readonly onUpdateText: (props: Partial<BlockPropsByType["text"]>) => void;
}) {
  return (
    <section className="editor-panel-section">
      <p className="eyebrow">Инспектор</p>
      <h2>Текст</h2>
      <InspectorTextarea
        label="Текст"
        value={block.props.text}
        onChange={(text) => onUpdateText({ text })}
      />
      <AlignmentSelect
        value={block.props.align}
        onChange={(align) => onUpdateText({ align })}
      />
    </section>
  );
}

function ButtonInspector({
  block,
  onUpdateButton
}: {
  readonly block: ButtonBlock;
  readonly onUpdateButton: (props: Partial<BlockPropsByType["button"]>) => void;
}) {
  return (
    <section className="editor-panel-section">
      <p className="eyebrow">Инспектор</p>
      <h2>Кнопка</h2>
      <InspectorTextInput
        label="Надпись"
        value={block.props.label}
        onChange={(label) => onUpdateButton({ label })}
      />
      <InspectorTextInput
        label="Ссылка"
        value={block.props.href}
        onChange={(href) => onUpdateButton({ href })}
      />
      <InspectorSelect
        label="Стиль"
        value={block.props.variant}
        options={[
          ["primary", "Основной"],
          ["secondary", "Вторичный"]
        ]}
        onChange={(variant) =>
          onUpdateButton({
            variant: variant === "secondary" ? "secondary" : "primary"
          })
        }
      />
      <AlignmentSelect
        value={block.props.align}
        onChange={(align) => onUpdateButton({ align })}
      />
    </section>
  );
}

function ImageInspector({
  block,
  onUpdateImage
}: {
  readonly block: ImageBlock;
  readonly onUpdateImage: (props: Partial<BlockPropsByType["image"]>) => void;
}) {
  return (
    <section className="editor-panel-section">
      <p className="eyebrow">Инспектор</p>
      <h2>Изображение</h2>
      <InspectorTextInput
        label="URL"
        value={block.props.src}
        onChange={(src) => onUpdateImage({ src })}
      />
      <InspectorTextInput
        label="Alt"
        value={block.props.alt}
        onChange={(alt) => onUpdateImage({ alt })}
      />
      <InspectorTextInput
        label="Подпись"
        value={block.props.caption ?? ""}
        onChange={(caption) => onUpdateImage({ caption })}
      />
      <InspectorSelect
        label="Формат"
        value={block.props.aspectRatio}
        options={[
          ["auto", "Авто"],
          ["square", "Квадрат"],
          ["portrait", "Портрет"],
          ["landscape", "Пейзаж"],
          ["wide", "Широкий"]
        ]}
        onChange={(aspectRatio) =>
          onUpdateImage({
            aspectRatio:
              aspectRatio === "square"
                ? "square"
                : aspectRatio === "portrait"
                  ? "portrait"
                  : aspectRatio === "landscape"
                    ? "landscape"
                    : aspectRatio === "wide"
                      ? "wide"
                      : "auto"
          })
        }
      />
      <InspectorSelect
        label="Заполнение"
        value={block.props.objectFit}
        options={[
          ["cover", "Обрезать"],
          ["contain", "Вписать"]
        ]}
        onChange={(objectFit) =>
          onUpdateImage({
            objectFit: objectFit === "contain" ? "contain" : "cover"
          })
        }
      />
      <InspectorSelect
        label="Скругление"
        value={block.props.borderRadius}
        options={[
          ["none", "Нет"],
          ["small", "Малое"],
          ["medium", "Среднее"],
          ["large", "Большое"]
        ]}
        onChange={(borderRadius) =>
          onUpdateImage({
            borderRadius:
              borderRadius === "none"
                ? "none"
                : borderRadius === "small"
                  ? "small"
                  : borderRadius === "large"
                    ? "large"
                    : "medium"
          })
        }
      />
      <InspectorSelect
        label="Ширина"
        value={block.props.width}
        options={[
          ["small", "Малая"],
          ["medium", "Средняя"],
          ["full", "Полная"]
        ]}
        onChange={(width) =>
          onUpdateImage({
            width: width === "small" ? "small" : width === "medium" ? "medium" : "full"
          })
        }
      />
      <AlignmentSelect
        value={block.props.align}
        onChange={(align) => onUpdateImage({ align })}
      />
    </section>
  );
}

function SpacerInspector({
  block,
  onUpdateSpacer
}: {
  readonly block: SpacerBlock;
  readonly onUpdateSpacer: (props: Partial<BlockPropsByType["spacer"]>) => void;
}) {
  return (
    <section className="editor-panel-section">
      <p className="eyebrow">Инспектор</p>
      <h2>Отступ</h2>
      <InspectorSelect
        label="Размер"
        value={block.props.size}
        options={[
          ["small", "Маленький"],
          ["medium", "Средний"],
          ["large", "Большой"]
        ]}
        onChange={(size) =>
          onUpdateSpacer({
            size:
              size === "small" ? "small" : size === "large" ? "large" : "medium"
          })
        }
      />
    </section>
  );
}

function InspectorTextInput({
  label,
  value,
  onChange
}: {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  return (
    <label className="inspector-field">
      {label}
      <input value={value} onChange={(event) => onChange(event.currentTarget.value)} />
    </label>
  );
}

function InspectorTextarea({
  label,
  value,
  onChange
}: {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  return (
    <label className="inspector-field">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </label>
  );
}

function AlignmentSelect({
  value,
  onChange
}: {
  readonly value: "left" | "center" | "right";
  readonly onChange: (value: "left" | "center" | "right") => void;
}) {
  return (
    <InspectorSelect
      label="Выравнивание"
      value={value}
      options={[
        ["left", "Слева"],
        ["center", "По центру"],
        ["right", "Справа"]
      ]}
      onChange={(nextValue) =>
        onChange(
          nextValue === "center" ? "center" : nextValue === "right" ? "right" : "left"
        )
      }
    />
  );
}

function InspectorSelect({
  label,
  value,
  options,
  onChange
}: {
  readonly label: string;
  readonly value: string;
  readonly options: readonly (readonly [string, string])[];
  readonly onChange: (value: string) => void;
}) {
  return (
    <label className="inspector-field">
      {label}
      <select value={value} onChange={(event) => onChange(event.currentTarget.value)}>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function EditorCenterState({
  title,
  text,
  tone
}: {
  readonly title: string;
  readonly text: string;
  readonly tone?: "error";
}) {
  return (
    <div
      className={tone === "error" ? "center-state error-state" : "center-state"}
      role={tone === "error" ? "alert" : undefined}
    >
      <p className="eyebrow">Page editor</p>
      <h1>{title}</h1>
      <p>{text}</p>
    </div>
  );
}

function getBlockSummary(block: BlockNode): string {
  switch (block.type) {
    case "heading":
      return block.props.text || "Пустой заголовок";
    case "text":
      return block.props.text || "Пустой текст";
    case "button":
      return block.props.label || "Кнопка";
    case "image":
      return block.props.src || "Изображение без URL";
    case "spacer":
      return `Размер: ${block.props.size}`;
  }
}

function toSaveStatusLabel(status: EditorState["saveStatus"]): string {
  switch (status) {
    case "saved":
      return "Сохранено";
    case "dirty":
      return "Есть изменения";
    case "saving":
      return "Сохранение...";
    case "error":
      return "Ошибка сохранения";
  }
}
