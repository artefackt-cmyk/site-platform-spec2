import * as React from "react";

export type MerkurioIconName =
  | "structure"
  | "add-block"
  | "pages"
  | "header-footer"
  | "media"
  | "theme"
  | "learning"
  | "desktop"
  | "tablet"
  | "mobile"
  | "undo"
  | "redo"
  | "preview"
  | "publish"
  | "duplicate"
  | "hide"
  | "show"
  | "delete"
  | "drag"
  | "settings"
  | "cart"
  | "more";

export type MerkurioIconSize = 16 | 20 | 24;

const iconPathByName: Record<MerkurioIconName, readonly string[]> = {
  structure: [
    "M5 5h6v6H5V5Zm8 0h6v6h-6V5ZM5 13h6v6H5v-6Zm8 0h6v6h-6v-6Z"
  ],
  "add-block": ["M12 5v14M5 12h14", "M5 5h14v14H5V5Z"],
  pages: ["M7 4h7l4 4v12H7V4Zm7 0v5h5"],
  "header-footer": ["M5 5h14v4H5V5Zm0 10h14v4H5v-4Zm0-4h14"],
  media: ["M5 6h14v12H5V6Zm3 9 3-4 2 2 2-3 3 5"],
  theme: [
    "M12 4a8 8 0 1 0 0 16h1.2a2 2 0 0 0 .8-3.84 1.5 1.5 0 0 1 .62-2.86H16a4 4 0 0 0 0-8h-4Z",
    "M8.2 10h.01M10.2 7.6h.01M13.2 7.4h.01M15.6 10.3h.01"
  ],
  learning: ["M4 9 12 5l8 4-8 4-8-4Zm3 2v4c2.9 2 7.1 2 10 0v-4"],
  desktop: ["M4 5h16v11H4V5Zm6 15h4m-6 0h8"],
  tablet: ["M7 4h10v16H7V4Zm5 13.5h.01"],
  mobile: ["M8 3h8v18H8V3Zm4 15.5h.01"],
  undo: ["M9 7 5 11l4 4", "M5 11h8a5 5 0 0 1 5 5v1"],
  redo: ["M15 7l4 4-4 4", "M19 11h-8a5 5 0 0 0-5 5v1"],
  preview: ["M3 12s3-6 9-6 9 6 9 6-3 6-9 6-9-6-9-6Z", "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"],
  publish: ["M12 16V4", "M7 9l5-5 5 5", "M5 20h14"],
  duplicate: ["M8 8h11v11H8V8Z", "M5 16V5h11"],
  hide: [
    "M3 12s3-6 9-6c1.8 0 3.3.5 4.6 1.2M21 12s-3 6-9 6c-1.8 0-3.3-.5-4.6-1.2",
    "M4 4l16 16"
  ],
  show: ["M3 12s3-6 9-6 9 6 9 6-3 6-9 6-9-6-9-6Z", "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"],
  delete: ["M5 7h14", "M10 11v6m4-6v6", "M8 7l1-3h6l1 3", "M7 7l1 13h8l1-13"],
  drag: ["M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01"],
  settings: [
    "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z",
    "M19 12a7 7 0 0 0-.1-1.1l2-1.5-2-3.4-2.4 1a7.5 7.5 0 0 0-1.9-1.1L14.3 3h-4.6L9.3 5.9A7.5 7.5 0 0 0 7.4 7L5 6 3 9.4l2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.1l-2 1.5L5 18l2.4-1a7.5 7.5 0 0 0 1.9 1.1l.4 2.9h4.6l.4-2.9a7.5 7.5 0 0 0 1.9-1.1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1.1Z"
  ],
  cart: ["M6 6h15l-2 8H8L6 3H3", "M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"],
  more: ["M6 12h.01M12 12h.01M18 12h.01"]
};

export function Icon({
  name,
  size = 20,
  className,
  title
}: {
  readonly name: MerkurioIconName;
  readonly size?: MerkurioIconSize;
  readonly className?: string;
  readonly title?: string;
}): React.ReactElement {
  const titleId = title === undefined ? undefined : `m-icon-${name}-${size}`;

  return React.createElement(
    "svg",
    {
      className,
      viewBox: "0 0 24 24",
      width: size,
      height: size,
      fill: "none",
      role: title === undefined ? undefined : "img",
      "aria-hidden": title === undefined ? "true" : undefined,
      "aria-labelledby": titleId,
      focusable: "false"
    },
    title === undefined
      ? null
      : React.createElement("title", { id: titleId }, title),
    iconPathByName[name].map((path, index) =>
      React.createElement("path", {
        key: `${name}-${index}`,
        d: path,
        stroke: "currentColor",
        strokeWidth: 1.8,
        strokeLinecap: "round",
        strokeLinejoin: "round"
      })
    )
  );
}

export const merkurioIconNames = Object.keys(iconPathByName) as readonly MerkurioIconName[];
