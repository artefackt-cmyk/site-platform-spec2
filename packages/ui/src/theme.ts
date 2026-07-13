"use client";

import * as React from "react";
import { mergeClassNames } from "./components";

export type MerkurioThemeMode = "light" | "dark" | "system";
export type ResolvedMerkurioTheme = "light" | "dark";

export const merkurioThemeStorageKey = "merkurio-ui-theme";

export function normalizeMerkurioThemeMode(value: string | null | undefined): MerkurioThemeMode {
  return value === "light" || value === "dark" || value === "system" ? value : "system";
}

export function resolveMerkurioThemeMode(
  mode: MerkurioThemeMode,
  systemPrefersDark: boolean
): ResolvedMerkurioTheme {
  if (mode === "system") {
    return systemPrefersDark ? "dark" : "light";
  }

  return mode;
}

export function getMerkurioThemeInitializationScript(): string {
  return `(function(){try{var key="${merkurioThemeStorageKey}";var stored=localStorage.getItem(key);var mode=stored==="light"||stored==="dark"||stored==="system"?stored:"system";var dark=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches;var resolved=mode==="system"?(dark?"dark":"light"):mode;document.documentElement.dataset.merkurioTheme=resolved;document.documentElement.dataset.merkurioThemeMode=mode;document.documentElement.style.colorScheme=resolved;}catch(error){document.documentElement.dataset.merkurioTheme="light";document.documentElement.dataset.merkurioThemeMode="system";}})();`;
}

export function MerkurioThemeScript(): React.ReactElement {
  return React.createElement("script", {
    dangerouslySetInnerHTML: {
      __html: getMerkurioThemeInitializationScript()
    }
  });
}

export type MerkurioThemeContextValue = {
  readonly mode: MerkurioThemeMode;
  readonly resolvedTheme: ResolvedMerkurioTheme;
  readonly setMode: (mode: MerkurioThemeMode) => void;
};

const MerkurioThemeContext = React.createContext<MerkurioThemeContextValue | undefined>(
  undefined
);

export function MerkurioThemeProvider({
  children,
  defaultMode = "system"
}: {
  readonly children: React.ReactNode;
  readonly defaultMode?: MerkurioThemeMode;
}): React.ReactElement {
  const [mode, setModeState] = React.useState<MerkurioThemeMode>(defaultMode);
  const [resolvedTheme, setResolvedTheme] = React.useState<ResolvedMerkurioTheme>("light");

  React.useEffect(() => {
    const storedMode = normalizeMerkurioThemeMode(
      window.localStorage.getItem(merkurioThemeStorageKey)
    );
    setModeState(storedMode);
  }, []);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = (nextMode: MerkurioThemeMode) => {
      const nextResolvedTheme = resolveMerkurioThemeMode(nextMode, mediaQuery.matches);
      document.documentElement.dataset.merkurioTheme = nextResolvedTheme;
      document.documentElement.dataset.merkurioThemeMode = nextMode;
      document.documentElement.style.colorScheme = nextResolvedTheme;
      setResolvedTheme(nextResolvedTheme);
    };

    applyTheme(mode);

    const listener = () => {
      if (mode === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", listener);

    return () => {
      mediaQuery.removeEventListener("change", listener);
    };
  }, [mode]);

  const setMode = React.useCallback((nextMode: MerkurioThemeMode) => {
    window.localStorage.setItem(merkurioThemeStorageKey, nextMode);
    setModeState(nextMode);
  }, []);

  const contextValue = React.useMemo<MerkurioThemeContextValue>(
    () => ({
      mode,
      resolvedTheme,
      setMode
    }),
    [mode, resolvedTheme, setMode]
  );

  return React.createElement(
    MerkurioThemeContext.Provider,
    { value: contextValue },
    children
  );
}

export function useMerkurioTheme(): MerkurioThemeContextValue {
  const contextValue = React.useContext(MerkurioThemeContext);

  if (contextValue === undefined) {
    throw new Error("useMerkurioTheme must be used inside MerkurioThemeProvider.");
  }

  return contextValue;
}

export function MerkurioThemeSwitcher({
  className
}: {
  readonly className?: string;
}): React.ReactElement {
  const { mode, setMode } = useMerkurioTheme();
  const options: readonly { readonly value: MerkurioThemeMode; readonly label: string }[] = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" }
  ];

  return React.createElement(
    "div",
    {
      className: mergeClassNames("ui-segmented", className),
      role: "radiogroup",
      "aria-label": "Merkurio UI theme"
    },
    options.map((option) =>
      React.createElement(
        "button",
        {
          key: option.value,
          type: "button",
          className: option.value === mode ? "ui-segment ui-segment-selected" : "ui-segment",
          role: "radio",
          "aria-checked": option.value === mode ? "true" : "false",
          onClick: () => {
            setMode(option.value);
          }
        },
        option.label
      )
    )
  );
}
