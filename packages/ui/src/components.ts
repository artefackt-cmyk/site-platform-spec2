import * as React from "react";
import { Icon, type MerkurioIconName } from "./icons";

export function mergeClassNames(
  ...classNames: readonly (string | undefined | false)[]
): string {
  return classNames.filter(Boolean).join(" ");
}

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "brand";
export type ComponentSize = "sm" | "md" | "lg";

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  icon,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  readonly variant?: ButtonVariant;
  readonly size?: ComponentSize;
  readonly loading?: boolean;
  readonly icon?: MerkurioIconName;
}): React.ReactElement {
  return React.createElement(
    "button",
    {
      ...props,
      className: mergeClassNames(
        "ui-button",
        `ui-button-${variant}`,
        `ui-button-${size}`,
        className
      ),
      disabled: props.disabled === true || loading,
      "aria-busy": loading ? "true" : undefined
    },
    icon === undefined
      ? null
      : React.createElement(Icon, { name: icon, size: size === "lg" ? 20 : 16 }),
    React.createElement("span", null, loading ? "Загрузка..." : children)
  );
}

export function IconButton({
  label,
  icon,
  size = "md",
  variant = "ghost",
  selected = false,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  readonly label: string;
  readonly icon: MerkurioIconName;
  readonly size?: ComponentSize;
  readonly variant?: "ghost" | "secondary" | "danger";
  readonly selected?: boolean;
}): React.ReactElement {
  return React.createElement(
    "button",
    {
      ...props,
      className: mergeClassNames(
        "ui-icon-button",
        `ui-icon-button-${variant}`,
        `ui-icon-button-${size}`,
        selected && "ui-icon-button-selected",
        className
      ),
      "aria-label": label,
      "aria-pressed": selected ? "true" : undefined
    },
    React.createElement(Icon, {
      name: icon,
      size: size === "lg" ? 24 : size === "sm" ? 16 : 20
    })
  );
}

export function Input({
  label,
  hint,
  error,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  readonly label: string;
  readonly hint?: string;
  readonly error?: string;
}): React.ReactElement {
  const inputId = props.id ?? props.name ?? label;

  return React.createElement(
    "label",
    { className: mergeClassNames("ui-field", className), htmlFor: inputId },
    React.createElement("span", { className: "ui-field-label" }, label),
    React.createElement("input", {
      ...props,
      id: inputId,
      className: "ui-input",
      "aria-invalid": error === undefined ? undefined : "true"
    }),
    hint === undefined ? null : React.createElement("span", { className: "ui-field-hint" }, hint),
    error === undefined ? null : React.createElement("span", { className: "ui-field-error" }, error)
  );
}

export function Textarea({
  label,
  hint,
  error,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  readonly label: string;
  readonly hint?: string;
  readonly error?: string;
}): React.ReactElement {
  const inputId = props.id ?? props.name ?? label;

  return React.createElement(
    "label",
    { className: mergeClassNames("ui-field", className), htmlFor: inputId },
    React.createElement("span", { className: "ui-field-label" }, label),
    React.createElement("textarea", {
      ...props,
      id: inputId,
      className: "ui-input ui-textarea",
      "aria-invalid": error === undefined ? undefined : "true"
    }),
    hint === undefined ? null : React.createElement("span", { className: "ui-field-hint" }, hint),
    error === undefined ? null : React.createElement("span", { className: "ui-field-error" }, error)
  );
}

export function Select({
  label,
  options,
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  readonly label: string;
  readonly options: readonly { readonly value: string; readonly label: string }[];
}): React.ReactElement {
  const selectId = props.id ?? props.name ?? label;

  return React.createElement(
    "label",
    { className: mergeClassNames("ui-field", className), htmlFor: selectId },
    React.createElement("span", { className: "ui-field-label" }, label),
    React.createElement(
      "select",
      { ...props, id: selectId, className: "ui-input ui-select" },
      options.map((option) =>
        React.createElement("option", { key: option.value, value: option.value }, option.label)
      )
    )
  );
}

export function Checkbox({
  label,
  description,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  readonly label: string;
  readonly description?: string;
}): React.ReactElement {
  return React.createElement(
    "label",
    { className: mergeClassNames("ui-check-row", className) },
    React.createElement("input", { ...props, type: "checkbox" }),
    React.createElement(
      "span",
      null,
      React.createElement("strong", null, label),
      description === undefined ? null : React.createElement("small", null, description)
    )
  );
}

export function Toggle({
  label,
  pressed,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  readonly label: string;
  readonly pressed: boolean;
}): React.ReactElement {
  return React.createElement(
    "button",
    {
      ...props,
      type: props.type ?? "button",
      className: mergeClassNames("ui-toggle", pressed && "ui-toggle-on", className),
      "aria-label": label,
      "aria-pressed": pressed ? "true" : "false"
    },
    React.createElement("span", { className: "ui-toggle-knob" })
  );
}

export type TabItem = {
  readonly id: string;
  readonly label: string;
  readonly disabled?: boolean;
};

export function getNextTabIndex(
  currentIndex: number,
  key: "ArrowLeft" | "ArrowRight" | "Home" | "End",
  items: readonly TabItem[]
): number {
  if (items.length === 0) {
    return -1;
  }

  if (key === "Home") {
    return 0;
  }

  if (key === "End") {
    return items.length - 1;
  }

  const direction = key === "ArrowRight" ? 1 : -1;
  let nextIndex = currentIndex;

  for (let attempts = 0; attempts < items.length; attempts += 1) {
    nextIndex = (nextIndex + direction + items.length) % items.length;
    if (items[nextIndex]?.disabled !== true) {
      return nextIndex;
    }
  }

  return currentIndex;
}

export function Tabs({
  items,
  selectedId,
  label,
  className
}: {
  readonly items: readonly TabItem[];
  readonly selectedId: string;
  readonly label: string;
  readonly className?: string;
}): React.ReactElement {
  return React.createElement(
    "div",
    { className: mergeClassNames("ui-tabs", className), role: "tablist", "aria-label": label },
    items.map((item) =>
      React.createElement(
        "button",
        {
          key: item.id,
          type: "button",
          className: item.id === selectedId ? "ui-tab ui-tab-selected" : "ui-tab",
          role: "tab",
          "aria-selected": item.id === selectedId ? "true" : "false",
          tabIndex: item.id === selectedId ? 0 : -1,
          disabled: item.disabled
        },
        item.label
      )
    )
  );
}

export function SegmentedControl({
  label,
  options,
  value,
  onValueChange,
  className
}: {
  readonly label: string;
  readonly options: readonly { readonly value: string; readonly label: string; readonly icon?: MerkurioIconName }[];
  readonly value: string;
  readonly onValueChange?: ((value: string) => void) | undefined;
  readonly className?: string;
}): React.ReactElement {
  return React.createElement(
    "div",
    { className: mergeClassNames("ui-segmented", className), role: "radiogroup", "aria-label": label },
    options.map((option) =>
      React.createElement(
        "button",
        {
          key: option.value,
          type: "button",
          className: option.value === value ? "ui-segment ui-segment-selected" : "ui-segment",
          role: "radio",
          "aria-checked": option.value === value ? "true" : "false",
          onClick:
            onValueChange === undefined
              ? undefined
              : () => {
                  onValueChange(option.value);
                }
        },
        option.icon === undefined ? null : React.createElement(Icon, { name: option.icon, size: 16 }),
        option.label
      )
    )
  );
}

export function Badge({
  tone = "neutral",
  children,
  className
}: {
  readonly tone?: "neutral" | "success" | "warning" | "danger" | "accent" | "info";
  readonly children?: React.ReactNode;
  readonly className?: string;
}): React.ReactElement {
  return React.createElement(
    "span",
    { className: mergeClassNames("ui-badge", `ui-badge-${tone}`, className) },
    children
  );
}

export function StatusBadge({
  status,
  children
}: {
  readonly status: "draft" | "published" | "publishing" | "changed" | "error";
  readonly children?: React.ReactNode;
}): React.ReactElement {
  const toneByStatus = {
    draft: "neutral",
    published: "success",
    publishing: "info",
    changed: "warning",
    error: "danger"
  } as const;

  return React.createElement(Badge, { tone: toneByStatus[status] }, children);
}

export function Tooltip({
  label,
  children
}: {
  readonly label: string;
  readonly children: React.ReactElement;
}): React.ReactElement {
  return React.createElement(
    "span",
    { className: "ui-tooltip", "data-tooltip": label },
    children
  );
}

export function DropdownMenu({
  label,
  items
}: {
  readonly label: string;
  readonly items: readonly { readonly label: string; readonly danger?: boolean }[];
}): React.ReactElement {
  return React.createElement(
    "details",
    { className: "ui-menu" },
    React.createElement("summary", { "aria-label": label }, React.createElement(Icon, { name: "more", size: 20 })),
    React.createElement(
      "div",
      { className: "ui-menu-panel", role: "menu" },
      items.map((item) =>
        React.createElement(
          "button",
          {
            key: item.label,
            type: "button",
            role: "menuitem",
            className: item.danger === true ? "ui-menu-item ui-menu-item-danger" : "ui-menu-item"
          },
          item.label
        )
      )
    )
  );
}

export function Card({
  children,
  className
}: {
  readonly children: React.ReactNode;
  readonly className?: string;
}): React.ReactElement {
  return React.createElement("section", { className: mergeClassNames("ui-card", className) }, children);
}

export function Panel({
  title,
  children,
  actions,
  className
}: {
  readonly title?: string;
  readonly children: React.ReactNode;
  readonly actions?: React.ReactNode;
  readonly className?: string;
}): React.ReactElement {
  return React.createElement(
    "section",
    { className: mergeClassNames("ui-panel", className) },
    title === undefined && actions === undefined
      ? null
      : React.createElement(
          "header",
          { className: "ui-panel-header" },
          title === undefined ? null : React.createElement("h2", null, title),
          actions
        ),
    children
  );
}

export function Modal({
  title,
  children,
  onCloseLabel = "Закрыть"
}: {
  readonly title: string;
  readonly children: React.ReactNode;
  readonly onCloseLabel?: string;
}): React.ReactElement {
  return React.createElement(
    "section",
    {
      className: "ui-modal",
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "ui-modal-title"
    },
    React.createElement("h2", { id: "ui-modal-title" }, title),
    children,
    React.createElement(IconButton, {
      type: "button",
      label: onCloseLabel,
      icon: "hide",
      size: "sm"
    })
  );
}

export function Drawer({
  title,
  children
}: {
  readonly title: string;
  readonly children: React.ReactNode;
}): React.ReactElement {
  return React.createElement(
    "aside",
    { className: "ui-drawer", "aria-labelledby": "ui-drawer-title" },
    React.createElement("h2", { id: "ui-drawer-title" }, title),
    children
  );
}

export function Toast({
  tone = "info",
  children
}: {
  readonly tone?: "success" | "warning" | "danger" | "info";
  readonly children: React.ReactNode;
}): React.ReactElement {
  return React.createElement("div", { className: `ui-toast ui-toast-${tone}`, role: "status" }, children);
}

export function EmptyState({
  title,
  description,
  action
}: {
  readonly title: string;
  readonly description: string;
  readonly action?: React.ReactNode;
}): React.ReactElement {
  return React.createElement(
    "section",
    { className: "ui-state ui-empty-state" },
    React.createElement("h3", null, title),
    React.createElement("p", null, description),
    action
  );
}

export function LoadingState({ label = "Загрузка" }: { readonly label?: string }): React.ReactElement {
  return React.createElement(
    "section",
    { className: "ui-state ui-loading-state", role: "status", "aria-live": "polite" },
    React.createElement("span", { className: "ui-spinner", "aria-hidden": "true" }),
    label
  );
}

export function ErrorState({
  title,
  description
}: {
  readonly title: string;
  readonly description: string;
}): React.ReactElement {
  return React.createElement(
    "section",
    { className: "ui-state ui-error-state", role: "alert" },
    React.createElement("h3", null, title),
    React.createElement("p", null, description)
  );
}

export function Breadcrumbs({
  items
}: {
  readonly items: readonly { readonly label: string; readonly href?: string }[];
}): React.ReactElement {
  return React.createElement(
    "nav",
    { className: "ui-breadcrumbs", "aria-label": "Хлебные крошки" },
    items.map((item, index) =>
      React.createElement(
        "span",
        { key: `${item.label}-${index}` },
        item.href === undefined
          ? React.createElement("strong", null, item.label)
          : React.createElement("a", { href: item.href }, item.label)
      )
    )
  );
}

export function Divider(): React.ReactElement {
  return React.createElement("hr", { className: "ui-divider" });
}
