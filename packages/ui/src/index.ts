import * as React from "react";

export const packageName = "@site-platform/ui" as const;

export const mercurioTokens = {
  color: {
    graphite: "#0B0F13",
    steelBlue: "#3B4C63",
    mistGray: "#C9CED4",
    chromeSilver: "#E6E9EC",
    white: "#FFFFFF",
    softBackground: "#F6F8FA",
    textPrimary: "#111820",
    textSecondary: "#3B4C63",
    textMuted: "#6F7D8E",
    borderSubtle: "#DDE3EA",
    surfacePrimary: "#FFFFFF",
    surfaceSecondary: "#F7F9FB",
    surfaceHover: "#EEF2F6",
    accentPrimary: "#3B5F91",
    accentSoft: "#E8EEF7",
    success: "#3E9B70",
    warning: "#D89534",
    danger: "#B84A4A",
    focusRing: "#6C8FD6"
  },
  radius: {
    sm: "6px",
    md: "8px",
    lg: "14px",
    xl: "22px"
  },
  shadow: {
    panel: "0 18px 60px rgba(24, 35, 50, 0.08)",
    control: "0 8px 24px rgba(24, 35, 50, 0.08)"
  },
  size: {
    sidebarWidth: "260px",
    topbarHeight: "84px",
    buttonHeight: "44px",
    inputHeight: "44px"
  },
  gradient: {
    mercury:
      "linear-gradient(135deg, #0B0F13 0%, #1A2532 45%, #8EA0B8 72%, #F5F7FA 100%)",
    silver:
      "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.95), transparent 28%), linear-gradient(135deg, #F8FAFC 0%, #DDE5EE 42%, #8295AF 58%, #F8FAFC 100%)"
  },
  font: {
    brand: "Prata, Georgia, serif",
    ui: "Inter, system-ui, sans-serif"
  }
} as const;

export type MercurioLogoVariant = "icon" | "wordmark" | "lockup" | "compact";
export type MercurioLogoSize = number | `${number}px` | `${number}rem`;
export type MercurioLogoSurface = "light" | "dark";

export const mercurioLogoAssets = {
  monogram: "/assets/mercurio/mercurio-monogram.png",
  horizontal: "/assets/mercurio/mercurio-logo-horizontal.png"
} as const;

const mercurioLogoDefaults = {
  icon: {
    width: 40,
    height: 40
  },
  compact: {
    width: 190,
    height: 42
  },
  wordmark: {
    width: 260,
    height: 58
  },
  lockup: {
    width: 236,
    height: 54
  }
} as const;

export function MercurioLogo({
  variant = "lockup",
  className,
  size,
  title = "Mercurio",
  surface = "light"
}: {
  readonly variant?: MercurioLogoVariant;
  readonly className?: string;
  readonly size?: MercurioLogoSize;
  readonly title?: string;
  readonly surface?: MercurioLogoSurface;
}): React.ReactElement {
  const defaults = mercurioLogoDefaults[variant];
  const logoWidth = toCssSize(size ?? defaults.width);
  const logoHeight = toCssSize(
    variant === "icon" && size !== undefined ? size : defaults.height
  );
  const assetSrc =
    variant === "icon"
      ? mercurioLogoAssets.monogram
      : mercurioLogoAssets.horizontal;
  const logoClassName = mergeClassNames(
    `mercurio-logo mercurio-logo-${variant} mercurio-logo-${surface}`,
    className
  );

  return React.createElement(
    "span",
    {
      className: logoClassName,
      role: "img",
      "aria-label": title,
      title,
      style: {
        width: logoWidth,
        maxWidth: logoWidth,
        minWidth: variant === "icon" ? logoWidth : undefined,
        height: logoHeight,
        maxHeight: logoHeight,
        flex: "0 0 auto"
      }
    },
    React.createElement(
      "object",
      {
        className: "mercurio-logo-asset",
        data: assetSrc,
        type: "image/png",
        "aria-hidden": "true",
        style: {
          width: logoWidth,
          height: logoHeight,
          maxWidth: logoWidth,
          maxHeight: logoHeight,
          flex: "0 0 auto",
          objectFit: "contain",
          objectPosition: "center"
        }
      },
      React.createElement(
        "span",
        {
          className: "mercurio-logo-fallback"
        },
        "MERCURIO"
      )
    )
  );
}

function toCssSize(size: MercurioLogoSize): string {
  return typeof size === "number" ? `${size}px` : size;
}

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export function Button({
  variant = "secondary",
  loading = false,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  readonly variant?: ButtonVariant;
  readonly loading?: boolean;
}): React.ReactElement {
  return React.createElement(
    "button",
    {
      ...props,
      className: mergeClassNames(`ui-button ui-button-${variant}`, className),
      disabled: props.disabled === true || loading,
      "aria-busy": loading ? "true" : undefined
    },
    loading ? "Загрузка..." : children
  );
}

export function Badge({
  tone = "neutral",
  children,
  className
}: {
  readonly tone?: "neutral" | "success" | "warning" | "danger" | "accent";
  readonly children: React.ReactNode;
  readonly className?: string;
}): React.ReactElement {
  return React.createElement(
    "span",
    {
      className: mergeClassNames(`ui-badge ui-badge-${tone}`, className)
    },
    children
  );
}

export function Card({
  children,
  className
}: {
  readonly children: React.ReactNode;
  readonly className?: string;
}): React.ReactElement {
  return React.createElement(
    "section",
    {
      className: mergeClassNames("ui-card", className)
    },
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
    React.createElement(
      "button",
      {
        type: "button",
        className: "ui-button ui-button-ghost",
        "aria-label": onCloseLabel
      },
      onCloseLabel
    )
  );
}

export function mergeClassNames(
  ...classNames: readonly (string | undefined | false)[]
): string {
  return classNames.filter(Boolean).join(" ");
}
