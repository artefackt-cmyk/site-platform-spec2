import * as React from "react";
import { BLOCK_DEFINITIONS, getBlockDefinition } from "@site-platform/block-library";
import type {
  BlockNode,
  BlockPropsByType,
  BlockType,
  ButtonBlock,
  HeadingBlock,
  SpacerBlock,
  TextBlock
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
  readonly onAddBlock: (type: BlockType) => void;
  readonly onSelectBlock: (blockId: string | null) => void;
  readonly onMoveBlock: (blockId: string, direction: "up" | "down") => void;
  readonly onRemoveBlock: (blockId: string) => void;
  readonly onUpdateHeading: (props: Partial<BlockPropsByType["heading"]>) => void;
  readonly onUpdateText: (props: Partial<BlockPropsByType["text"]>) => void;
  readonly onUpdateButton: (props: Partial<BlockPropsByType["button"]>) => void;
  readonly onUpdateSpacer: (props: Partial<BlockPropsByType["spacer"]>) => void;
  readonly onSave: () => void;
};

export function PageEditorView({
  state,
  onAddBlock,
  onSelectBlock,
  onMoveBlock,
  onRemoveBlock,
  onUpdateHeading,
  onUpdateText,
  onUpdateButton,
  onUpdateSpacer,
  onSave
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

  const selectedBlock =
    state.editor.selectedBlockId === null
      ? null
      : state.editor.document.root.children.find(
          (block) => block.id === state.editor.selectedBlockId
        ) ?? null;

  return (
    <main className="editor-shell">
      <EditorTopbar
        project={state.project}
        page={state.page}
        saveStatus={state.editor.saveStatus}
        errorMessage={state.editor.errorMessage}
        onSave={onSave}
      />

      <section className="editor-workbench">
        <aside className="editor-panel editor-left-panel">
          <BlockList
            blocks={state.editor.document.root.children}
            selectedBlockId={state.editor.selectedBlockId}
            onSelectBlock={onSelectBlock}
            onMoveBlock={onMoveBlock}
            onRemoveBlock={onRemoveBlock}
          />
          <AddBlockPanel onAddBlock={onAddBlock} />
        </aside>

        <section className="editor-center-panel" onClick={() => onSelectBlock(null)}>
          <div className="editor-canvas">
            {state.editor.document.root.children.length === 0 ? (
              <div className="editor-empty-canvas">
                Страница пока пуста. Добавьте первый блок
              </div>
            ) : (
              <PageRenderer
                document={state.editor.document}
                mode="editor"
                selectedBlockId={state.editor.selectedBlockId}
                onBlockSelect={onSelectBlock}
              />
            )}
          </div>
        </section>

        <aside className="editor-panel editor-right-panel">
          <Inspector
            block={selectedBlock}
            onUpdateHeading={onUpdateHeading}
            onUpdateText={onUpdateText}
            onUpdateButton={onUpdateButton}
            onUpdateSpacer={onUpdateSpacer}
          />
        </aside>
      </section>
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
  onSave
}: {
  readonly project: ProjectSummary;
  readonly page: SitePageSummary;
  readonly saveStatus: EditorState["saveStatus"];
  readonly errorMessage: string | null;
  readonly onSave: () => void;
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
        <button className="ghost-button" type="button" disabled>
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

function BlockList({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onMoveBlock,
  onRemoveBlock
}: {
  readonly blocks: readonly BlockNode[];
  readonly selectedBlockId: string | null;
  readonly onSelectBlock: (blockId: string | null) => void;
  readonly onMoveBlock: (blockId: string, direction: "up" | "down") => void;
  readonly onRemoveBlock: (blockId: string) => void;
}) {
  return (
    <section className="editor-panel-section">
      <p className="eyebrow">Блоки страницы</p>
      {blocks.length === 0 ? (
        <p className="editor-muted">Блоков пока нет.</p>
      ) : (
        <div className="editor-block-list">
          {blocks.map((block, index) => {
            const definition = getBlockDefinition(block.type);
            const summary = getBlockSummary(block);

            return (
              <article
                className={
                  selectedBlockId === block.id
                    ? "editor-block-list-item editor-block-list-item-selected"
                    : "editor-block-list-item"
                }
                key={block.id}
              >
                <button
                  type="button"
                  className="editor-block-select"
                  onClick={() => onSelectBlock(block.id)}
                >
                  <strong>{definition?.label ?? block.type}</strong>
                  <span>{summary}</span>
                </button>
                <div className="editor-block-actions">
                  <button
                    type="button"
                    className="mini-button"
                    onClick={() => onMoveBlock(block.id, "up")}
                    disabled={index === 0}
                  >
                    Вверх
                  </button>
                  <button
                    type="button"
                    className="mini-button"
                    onClick={() => onMoveBlock(block.id, "down")}
                    disabled={index === blocks.length - 1}
                  >
                    Вниз
                  </button>
                  <button
                    type="button"
                    className="mini-button danger-mini-button"
                    onClick={() => onRemoveBlock(block.id)}
                  >
                    Удалить
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
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
  block,
  onUpdateHeading,
  onUpdateText,
  onUpdateButton,
  onUpdateSpacer
}: {
  readonly block: BlockNode | null;
  readonly onUpdateHeading: (props: Partial<BlockPropsByType["heading"]>) => void;
  readonly onUpdateText: (props: Partial<BlockPropsByType["text"]>) => void;
  readonly onUpdateButton: (props: Partial<BlockPropsByType["button"]>) => void;
  readonly onUpdateSpacer: (props: Partial<BlockPropsByType["spacer"]>) => void;
}) {
  if (block === null) {
    return (
      <section className="editor-panel-section">
        <p className="eyebrow">Инспектор</p>
        <h2>Выберите блок</h2>
        <p className="editor-muted">Настройки появятся после выбора блока.</p>
      </section>
    );
  }

  switch (block.type) {
    case "heading":
      return (
        <HeadingInspector block={block} onUpdateHeading={onUpdateHeading} />
      );
    case "text":
      return <TextInspector block={block} onUpdateText={onUpdateText} />;
    case "button":
      return <ButtonInspector block={block} onUpdateButton={onUpdateButton} />;
    case "spacer":
      return <SpacerInspector block={block} onUpdateSpacer={onUpdateSpacer} />;
  }
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
