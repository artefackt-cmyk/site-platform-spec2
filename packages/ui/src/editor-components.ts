import * as React from "react";
import {
  Badge,
  Button,
  DropdownMenu,
  IconButton,
  SegmentedControl,
  StatusBadge,
  Tabs,
  mergeClassNames,
  type TabItem
} from "./components";
import { Icon, type MerkurioIconName } from "./icons";

export type SectionNavigatorItemState =
  | "default"
  | "hover"
  | "selected"
  | "hidden"
  | "dragging"
  | "error";

export function EditorTopBar({
  title,
  status,
  actions
}: {
  readonly title: string;
  readonly status?: React.ReactNode;
  readonly actions?: React.ReactNode;
}): React.ReactElement {
  return React.createElement(
    "header",
    { className: "m-editor-topbar" },
    React.createElement("div", null, React.createElement("strong", null, title), status),
    React.createElement("div", { className: "m-editor-topbar-actions" }, actions)
  );
}

export function EditorRail({
  children
}: {
  readonly children: React.ReactNode;
}): React.ReactElement {
  return React.createElement("nav", { className: "m-editor-rail", "aria-label": "Editor" }, children);
}

export function EditorRailItem({
  icon,
  label,
  selected = false
}: {
  readonly icon: MerkurioIconName;
  readonly label: string;
  readonly selected?: boolean;
}): React.ReactElement {
  return React.createElement(IconButton, {
    icon,
    label,
    selected,
    className: "m-editor-rail-item"
  });
}

export function EditorSidePanel({
  title,
  children
}: {
  readonly title: string;
  readonly children: React.ReactNode;
}): React.ReactElement {
  return React.createElement(
    "aside",
    { className: "m-editor-side-panel" },
    React.createElement("h2", null, title),
    children
  );
}

export function SectionNavigatorItem({
  index,
  title,
  type,
  state = "default"
}: {
  readonly index: number;
  readonly title: string;
  readonly type: string;
  readonly state?: SectionNavigatorItemState;
}): React.ReactElement {
  const isHidden = state === "hidden";

  return React.createElement(
    "article",
    {
      className: mergeClassNames(
        "m-section-item",
        `m-section-item-${state}`,
        state === "selected" && "m-section-item-selected"
      ),
      "data-state": state,
      "aria-selected": state === "selected" ? "true" : undefined,
      "aria-disabled": isHidden ? "true" : undefined
    },
    React.createElement(Icon, { name: "drag", size: 16, className: "m-section-item-drag" }),
    React.createElement("span", { className: "m-section-item-index" }, String(index)),
    React.createElement(
      "div",
      { className: "m-section-item-body" },
      React.createElement("strong", null, title),
      React.createElement(
        "span",
        null,
        type,
        state === "error"
          ? React.createElement("em", { className: "m-section-item-issue" }, "Issue")
          : null
      )
    ),
    React.createElement(IconButton, {
      icon: isHidden ? "hide" : "show",
      label: isHidden ? "Секция скрыта" : "Секция видима",
      size: "sm"
    }),
    React.createElement(DropdownMenu, {
      label: "Действия секции",
      items: [
        { label: "Переименовать" },
        { label: "Дублировать" },
        { label: "Удалить", danger: true }
      ]
    })
  );
}

export type BlockLibraryCardState =
  | "default"
  | "hover"
  | "selected"
  | "recent"
  | "favorite"
  | "unavailable";

export function BlockLibraryCard({
  name,
  category,
  state = "default",
  thumbnail,
  supportsDesktop = true,
  supportsMobile = true,
  supportsLightDark = true,
  commerce = false
}: {
  readonly name: string;
  readonly category: string;
  readonly state?: BlockLibraryCardState;
  readonly thumbnail?: React.ReactNode;
  readonly supportsDesktop?: boolean;
  readonly supportsMobile?: boolean;
  readonly supportsLightDark?: boolean;
  readonly commerce?: boolean;
}): React.ReactElement {
  return React.createElement(
    "article",
    {
      className: mergeClassNames("m-block-card", `m-block-card-${state}`),
      "data-state": state,
      "aria-disabled": state === "unavailable" ? "true" : undefined
    },
    React.createElement("div", { className: "m-block-card-thumb" }, thumbnail),
    React.createElement(
      "div",
      { className: "m-block-card-copy" },
      React.createElement("strong", null, name),
      React.createElement("span", null, category)
    ),
    React.createElement(
      "div",
      { className: "m-block-card-indicators", "aria-label": "Поддержка блока" },
      supportsDesktop ? React.createElement(Icon, { name: "desktop", size: 16 }) : null,
      supportsMobile ? React.createElement(Icon, { name: "mobile", size: 16 }) : null,
      supportsLightDark ? React.createElement(Badge, { tone: "accent" }, "L/D") : null,
      commerce ? React.createElement(Icon, { name: "cart", size: 16 }) : null
    )
  );
}

export function InsertSectionControl({
  label = "Добавить секцию"
}: {
  readonly label?: string;
}): React.ReactElement {
  return React.createElement(Button, { variant: "secondary", icon: "add-block" }, label);
}

export function CanvasSectionFrame({
  selected = false,
  label,
  children
}: {
  readonly selected?: boolean;
  readonly label: string;
  readonly children: React.ReactNode;
}): React.ReactElement {
  return React.createElement(
    "section",
    {
      className: mergeClassNames("m-canvas-section", selected && "m-canvas-section-selected"),
      "aria-label": label
    },
    selected ? React.createElement("span", { className: "m-canvas-section-label" }, label) : null,
    children
  );
}

export function SelectionOutline(): React.ReactElement {
  return React.createElement("span", { className: "m-selection-outline", "aria-hidden": "true" });
}

export function FloatingSectionToolbar(): React.ReactElement {
  return React.createElement(
    "div",
    { className: "m-floating-toolbar", role: "toolbar", "aria-label": "Секция" },
    React.createElement(IconButton, { label: "Переместить", icon: "drag", size: "sm" }),
    React.createElement(IconButton, { label: "Настройки", icon: "settings", size: "sm" }),
    React.createElement(IconButton, { label: "Дублировать", icon: "duplicate", size: "sm" }),
    React.createElement(IconButton, { label: "Удалить", icon: "delete", size: "sm", variant: "danger" })
  );
}

export function Inspector({
  title,
  children
}: {
  readonly title: string;
  readonly children: React.ReactNode;
}): React.ReactElement {
  return React.createElement(
    "aside",
    { className: "m-inspector" },
    React.createElement("h2", null, title),
    children
  );
}

export function InspectorTabs({
  selectedId,
  items
}: {
  readonly selectedId: string;
  readonly items: readonly TabItem[];
}): React.ReactElement {
  return React.createElement(Tabs, {
    label: "Inspector",
    selectedId,
    items,
    className: "m-inspector-tabs"
  });
}

export function PropertyGroup({
  title,
  children,
  defaultOpen = true
}: {
  readonly title: string;
  readonly children: React.ReactNode;
  readonly defaultOpen?: boolean;
}): React.ReactElement {
  return React.createElement(
    "details",
    { className: "m-property-group", open: defaultOpen },
    React.createElement("summary", null, title),
    children
  );
}

export function PropertyRow({
  label,
  value
}: {
  readonly label: string;
  readonly value: React.ReactNode;
}): React.ReactElement {
  return React.createElement(
    "div",
    { className: "m-property-row" },
    React.createElement("span", null, label),
    value
  );
}

export type ResponsiveViewportMode = "desktop" | "tablet" | "mobile";

export function ResponsiveModeSwitch({
  value
}: {
  readonly value: ResponsiveViewportMode;
}): React.ReactElement {
  return React.createElement(SegmentedControl, {
    label: "Viewport",
    value,
    options: [
      { value: "desktop", label: "Desktop", icon: "desktop" },
      { value: "tablet", label: "Tablet", icon: "tablet" },
      { value: "mobile", label: "Mobile", icon: "mobile" }
    ]
  });
}

export function PublicationStatus({
  status
}: {
  readonly status: "draft" | "published" | "publishing" | "changed" | "error";
}): React.ReactElement {
  const labelByStatus = {
    draft: "Черновик",
    published: "Опубликовано",
    publishing: "Публикуется",
    changed: "Есть изменения",
    error: "Ошибка"
  } as const;

  return React.createElement(StatusBadge, { status }, labelByStatus[status]);
}

export function ThemeModeSwitch({
  value
}: {
  readonly value: "light" | "dark" | "system";
}): React.ReactElement {
  return React.createElement(SegmentedControl, {
    label: "Editor theme",
    value,
    options: [
      { value: "light", label: "Light" },
      { value: "dark", label: "Dark" },
      { value: "system", label: "System" }
    ]
  });
}

export type DualViewportPreviewMode = "desktop" | "mobile" | "side-by-side";
export type SitePreviewTheme = "light" | "dark";
export type DualViewportEditingState =
  | "editingDesktop"
  | "editingMobileOverride"
  | "inheritedMobile";

export function DualViewportPreview({
  mode = "side-by-side",
  activeViewport = "desktop",
  siteTheme = "light",
  editingState = "editingDesktop",
  children
}: {
  readonly mode?: DualViewportPreviewMode;
  readonly activeViewport?: "desktop" | "mobile";
  readonly siteTheme?: SitePreviewTheme;
  readonly editingState?: DualViewportEditingState;
  readonly children: React.ReactNode;
}): React.ReactElement {
  const showDesktop = mode === "desktop" || mode === "side-by-side";
  const showMobile = mode === "mobile" || mode === "side-by-side";
  const mobileEditingLabel =
    editingState === "editingMobileOverride"
      ? "Редактируется: Mobile"
      : "Mobile наследует Desktop";

  return React.createElement(
    "section",
    {
      className: "m-dual-preview",
      "data-mode": mode,
      "data-site-theme": siteTheme,
      "data-editing-state": editingState
    },
    showDesktop
      ? React.createElement(
          "article",
          {
            className: mergeClassNames(
              "m-viewport-frame m-viewport-desktop",
              activeViewport === "desktop" && "m-viewport-active"
            )
          },
          React.createElement(
            "header",
            null,
            "Desktop",
            React.createElement("span", null, "Редактируется: Desktop")
          ),
          React.createElement("div", { className: "m-viewport-content" }, children)
        )
      : null,
    showMobile
      ? React.createElement(
          "article",
          {
            className: mergeClassNames(
              "m-viewport-frame m-viewport-mobile",
              activeViewport === "mobile" && "m-viewport-active"
            )
          },
          React.createElement(
            "header",
            null,
            "Mobile",
            React.createElement("span", null, mobileEditingLabel)
          ),
          React.createElement("div", { className: "m-viewport-content" }, children)
        )
      : null
  );
}
