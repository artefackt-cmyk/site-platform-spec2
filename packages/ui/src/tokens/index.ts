export type MercurioThemeName = "light" | "dark";

export type TokenModeValues = {
  readonly light: string;
  readonly dark: string;
};

export const merkurioUiSemanticColorTokenNames = [
  "color.bg.canvas",
  "color.bg.surface",
  "color.bg.elevated",
  "color.bg.inverted",
  "color.bg.selected",
  "color.bg.hover",
  "color.bg.disabled",
  "color.text.primary",
  "color.text.secondary",
  "color.text.muted",
  "color.text.inverted",
  "color.text.disabled",
  "color.text.accent",
  "color.text.danger",
  "color.border.default",
  "color.border.strong",
  "color.border.focus",
  "color.border.selected",
  "color.border.danger",
  "color.accent.primary",
  "color.accent.hover",
  "color.accent.pressed",
  "color.accent.soft",
  "color.accent.brand",
  "color.accent.focus",
  "color.accent.selected",
  "color.success",
  "color.warning",
  "color.error",
  "color.info"
] as const;

export type MercurioUiSemanticColorTokenName =
  (typeof merkurioUiSemanticColorTokenNames)[number];

export const merkurioUiColorTokens: Record<
  MercurioUiSemanticColorTokenName,
  TokenModeValues
> = {
  "color.bg.canvas": { light: "#F6F8FA", dark: "#071019" },
  "color.bg.surface": { light: "#FFFFFF", dark: "#0B1722" },
  "color.bg.elevated": { light: "#FFFFFF", dark: "#122231" },
  "color.bg.inverted": { light: "#0B0F13", dark: "#F7FAFC" },
  "color.bg.selected": { light: "#EDF3FA", dark: "#14283D" },
  "color.bg.hover": { light: "#EEF3F8", dark: "#142435" },
  "color.bg.disabled": { light: "#EDF1F5", dark: "#101A24" },
  "color.text.primary": { light: "#101820", dark: "#F2F6FA" },
  "color.text.secondary": { light: "#34465B", dark: "#B9C6D5" },
  "color.text.muted": { light: "#6B7787", dark: "#8393A5" },
  "color.text.inverted": { light: "#FFFFFF", dark: "#071019" },
  "color.text.disabled": { light: "#9AA5B3", dark: "#5E6E7D" },
  "color.text.accent": { light: "#2F66B3", dark: "#8DB7FF" },
  "color.text.danger": { light: "#A33B3B", dark: "#FF9B9B" },
  "color.border.default": { light: "#D9E1EB", dark: "#243647" },
  "color.border.strong": { light: "#B8C4D2", dark: "#3B526A" },
  "color.border.focus": { light: "#4D83D8", dark: "#8CB6FF" },
  "color.border.selected": { light: "#4A6F96", dark: "#7FA7D6" },
  "color.border.danger": { light: "#D86A6A", dark: "#FF8A8A" },
  "color.accent.primary": { light: "#3B5F7D", dark: "#87A9C9" },
  "color.accent.hover": { light: "#304F6B", dark: "#A0BCD8" },
  "color.accent.pressed": { light: "#243D55", dark: "#6F93B8" },
  "color.accent.soft": { light: "#E8EEF4", dark: "#13283A" },
  "color.accent.brand": { light: "#3B5F7D", dark: "#87A9C9" },
  "color.accent.focus": { light: "#4D83D8", dark: "#8CB6FF" },
  "color.accent.selected": { light: "#4A6F96", dark: "#7FA7D6" },
  "color.success": { light: "#2F8A62", dark: "#66C996" },
  "color.warning": { light: "#B7791F", dark: "#F0BD5E" },
  "color.error": { light: "#B84A4A", dark: "#FF8F8F" },
  "color.info": { light: "#2F6FE4", dark: "#8DB7FF" }
} as const;

export const merkurioUiGeometryTokens = {
  spacing: {
    "1": "4px",
    "2": "8px",
    "3": "12px",
    "4": "16px",
    "6": "24px",
    "8": "32px",
    "12": "48px",
    "16": "64px",
    "24": "96px"
  },
  size: {
    controlSm: "32px",
    controlMd: "40px",
    controlLg: "48px",
    editorRailWidth: "84px",
    editorLeftPanelWidth: "280px",
    inspectorWidth: "340px",
    panelPadding: "16px",
    editorTopbarHeight: "70px",
    iconSm: "16px",
    iconMd: "20px",
    iconLg: "24px"
  },
  border: {
    hairline: "1px",
    selected: "1.5px",
    focusRing: "3px"
  },
  radius: {
    none: "0",
    xs: "2px",
    sm: "4px",
    md: "8px",
    pill: "999px"
  },
  shadow: {
    panel: {
      light: "0 18px 54px rgba(20, 32, 48, 0.08)",
      dark: "0 22px 64px rgba(0, 0, 0, 0.34)"
    },
    control: {
      light: "0 8px 24px rgba(20, 32, 48, 0.08)",
      dark: "0 10px 28px rgba(0, 0, 0, 0.28)"
    },
    selected: {
      light: "0 0 0 1px rgba(74, 111, 150, 0.62), 0 8px 20px rgba(74, 111, 150, 0.1)",
      dark: "0 0 0 1px rgba(127, 167, 214, 0.68), 0 10px 24px rgba(127, 167, 214, 0.14)"
    }
  },
  blur: {
    panel: "18px",
    overlay: "28px"
  }
} as const;

export const merkurioUiTypographyTokens = {
  display: {
    family: "Prata, Georgia, serif",
    weight: "400",
    size: "56px",
    lineHeight: "1.06",
    letterSpacing: "0",
    textTransform: "none"
  },
  "heading-1": {
    family: "Prata, Georgia, serif",
    weight: "400",
    size: "42px",
    lineHeight: "1.12",
    letterSpacing: "0",
    textTransform: "none"
  },
  "heading-2": {
    family: "Inter, system-ui, sans-serif",
    weight: "600",
    size: "28px",
    lineHeight: "1.22",
    letterSpacing: "0",
    textTransform: "none"
  },
  "heading-3": {
    family: "Inter, system-ui, sans-serif",
    weight: "600",
    size: "22px",
    lineHeight: "1.28",
    letterSpacing: "0",
    textTransform: "none"
  },
  "heading-4": {
    family: "Inter, system-ui, sans-serif",
    weight: "600",
    size: "18px",
    lineHeight: "1.34",
    letterSpacing: "0",
    textTransform: "none"
  },
  "body-large": {
    family: "Inter, system-ui, sans-serif",
    weight: "400",
    size: "17px",
    lineHeight: "1.62",
    letterSpacing: "0",
    textTransform: "none"
  },
  body: {
    family: "Inter, system-ui, sans-serif",
    weight: "400",
    size: "15px",
    lineHeight: "1.55",
    letterSpacing: "0",
    textTransform: "none"
  },
  "body-small": {
    family: "Inter, system-ui, sans-serif",
    weight: "400",
    size: "13px",
    lineHeight: "1.48",
    letterSpacing: "0",
    textTransform: "none"
  },
  label: {
    family: "Inter, system-ui, sans-serif",
    weight: "500",
    size: "12px",
    lineHeight: "1.25",
    letterSpacing: "0",
    textTransform: "none"
  },
  caption: {
    family: "Inter, system-ui, sans-serif",
    weight: "400",
    size: "11px",
    lineHeight: "1.36",
    letterSpacing: "0.02em",
    textTransform: "uppercase"
  },
  button: {
    family: "Inter, system-ui, sans-serif",
    weight: "600",
    size: "14px",
    lineHeight: "1",
    letterSpacing: "0",
    textTransform: "none"
  },
  numeric: {
    family: "Inter, system-ui, sans-serif",
    weight: "600",
    size: "14px",
    lineHeight: "1.25",
    letterSpacing: "0",
    textTransform: "none"
  },
  code: {
    family: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    weight: "400",
    size: "13px",
    lineHeight: "1.5",
    letterSpacing: "0",
    textTransform: "none"
  }
} as const;

export const siteThemeTokenNames = [
  "site.color.background",
  "site.color.surface",
  "site.color.text",
  "site.color.muted",
  "site.color.accent",
  "site.color.onAccent",
  "site.color.border",
  "site.color.icon",
  "site.typography.heading",
  "site.typography.body",
  "site.typography.label",
  "site.radius.button",
  "site.radius.card",
  "site.spacing.section",
  "site.spacing.content"
] as const;

export type SiteThemeTokenName = (typeof siteThemeTokenNames)[number];

export const siteThemePlaceholderTokens: Record<
  SiteThemeTokenName,
  TokenModeValues
> = {
  "site.color.background": { light: "#FFFFFF", dark: "#080E16" },
  "site.color.surface": { light: "#F7F9FB", dark: "#101A25" },
  "site.color.text": { light: "#111820", dark: "#F3F6FA" },
  "site.color.muted": { light: "#667484", dark: "#9BA8B6" },
  "site.color.accent": { light: "#365F93", dark: "#8DB7FF" },
  "site.color.onAccent": { light: "#FFFFFF", dark: "#071019" },
  "site.color.border": { light: "#DDE5EE", dark: "#243647" },
  "site.color.icon": { light: "#3B4C63", dark: "#B8C7D7" },
  "site.typography.heading": {
    light: "Prata, Georgia, serif",
    dark: "Prata, Georgia, serif"
  },
  "site.typography.body": {
    light: "Inter, system-ui, sans-serif",
    dark: "Inter, system-ui, sans-serif"
  },
  "site.typography.label": {
    light: "Inter, system-ui, sans-serif",
    dark: "Inter, system-ui, sans-serif"
  },
  "site.radius.button": { light: "4px", dark: "4px" },
  "site.radius.card": { light: "8px", dark: "8px" },
  "site.spacing.section": { light: "96px", dark: "96px" },
  "site.spacing.content": { light: "24px", dark: "24px" }
} as const;

export const merkurioUiTokens = {
  color: merkurioUiColorTokens,
  geometry: merkurioUiGeometryTokens,
  typography: merkurioUiTypographyTokens,
  siteThemePlaceholder: siteThemePlaceholderTokens
} as const;

export function tokenNameToCssVariableName(
  tokenName: string,
  namespace = "m-ui"
): string {
  return `--${namespace}-${tokenName.replaceAll(".", "-")}`;
}

export function getMerkurioUiCssVariables(theme: MercurioThemeName): Record<string, string> {
  const colorVariables = Object.fromEntries(
    merkurioUiSemanticColorTokenNames.map((tokenName) => [
      tokenNameToCssVariableName(tokenName),
      merkurioUiColorTokens[tokenName][theme]
    ])
  );

  return {
    ...colorVariables,
    "--m-ui-font-brand": merkurioUiTypographyTokens.display.family,
    "--m-ui-font-ui": merkurioUiTypographyTokens.body.family,
    "--m-ui-spacing-1": merkurioUiGeometryTokens.spacing["1"],
    "--m-ui-spacing-2": merkurioUiGeometryTokens.spacing["2"],
    "--m-ui-spacing-3": merkurioUiGeometryTokens.spacing["3"],
    "--m-ui-spacing-4": merkurioUiGeometryTokens.spacing["4"],
    "--m-ui-spacing-6": merkurioUiGeometryTokens.spacing["6"],
    "--m-ui-spacing-8": merkurioUiGeometryTokens.spacing["8"],
    "--m-ui-spacing-12": merkurioUiGeometryTokens.spacing["12"],
    "--m-ui-spacing-16": merkurioUiGeometryTokens.spacing["16"],
    "--m-ui-spacing-24": merkurioUiGeometryTokens.spacing["24"],
    "--m-ui-radius-none": merkurioUiGeometryTokens.radius.none,
    "--m-ui-radius-xs": merkurioUiGeometryTokens.radius.xs,
    "--m-ui-radius-sm": merkurioUiGeometryTokens.radius.sm,
    "--m-ui-radius-md": merkurioUiGeometryTokens.radius.md,
    "--m-ui-radius-pill": merkurioUiGeometryTokens.radius.pill,
    "--m-ui-shadow-panel": merkurioUiGeometryTokens.shadow.panel[theme],
    "--m-ui-shadow-control": merkurioUiGeometryTokens.shadow.control[theme],
    "--m-ui-shadow-selected": merkurioUiGeometryTokens.shadow.selected[theme],
    "--m-ui-size-control-sm": merkurioUiGeometryTokens.size.controlSm,
    "--m-ui-size-control-md": merkurioUiGeometryTokens.size.controlMd,
    "--m-ui-size-control-lg": merkurioUiGeometryTokens.size.controlLg,
    "--m-ui-size-icon-sm": merkurioUiGeometryTokens.size.iconSm,
    "--m-ui-size-icon-md": merkurioUiGeometryTokens.size.iconMd,
    "--m-ui-size-icon-lg": merkurioUiGeometryTokens.size.iconLg,
    "--m-ui-editor-rail-width": merkurioUiGeometryTokens.size.editorRailWidth,
    "--m-ui-editor-left-panel-width": merkurioUiGeometryTokens.size.editorLeftPanelWidth,
    "--m-ui-inspector-width": merkurioUiGeometryTokens.size.inspectorWidth,
    "--m-ui-editor-topbar-height": merkurioUiGeometryTokens.size.editorTopbarHeight,
    "--m-ui-panel-padding": merkurioUiGeometryTokens.size.panelPadding,
    "--m-ui-focus-ring-width": merkurioUiGeometryTokens.border.focusRing,
    "--m-ui-blur-panel": merkurioUiGeometryTokens.blur.panel
  };
}

export const merkurioUiFigmaTokens = {
  meta: {
    name: "Merkurio UI Design Tokens v1",
    source: "packages/ui/src/tokens",
    note: "Merkurio UI tokens are independent from Site Theme tokens."
  },
  modes: {
    light: getMerkurioUiCssVariables("light"),
    dark: getMerkurioUiCssVariables("dark")
  },
  semanticColors: merkurioUiColorTokens,
  typography: merkurioUiTypographyTokens,
  geometry: merkurioUiGeometryTokens,
  siteThemePlaceholder: siteThemePlaceholderTokens
} as const;
