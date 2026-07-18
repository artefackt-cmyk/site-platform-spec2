"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import {
  parsePublicThemeMode,
  publicThemeCookieName,
  publicThemeStorageKey,
  resolvePublicTheme,
  type PublicThemeMode
} from "./public-theme";

const modes: { readonly value: PublicThemeMode; readonly label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" }
];

export function ThemeSwitcher() {
  const [mode, setMode] = useState<PublicThemeMode>("system");

  useEffect(() => {
    setMode(parsePublicThemeMode(localStorage.getItem(publicThemeStorageKey)));
  }, []);

  useEffect(() => {
    function apply(nextMode: PublicThemeMode) {
      const resolved = resolvePublicTheme(
        nextMode,
        window.matchMedia("(prefers-color-scheme: dark)").matches
      );
      document.documentElement.dataset.publicTheme = resolved;
      document.documentElement.dataset.publicThemeMode = nextMode;
    }

    apply(mode);
    localStorage.setItem(publicThemeStorageKey, mode);
    document.cookie = `${publicThemeCookieName}=${mode}; Path=/; Max-Age=31536000; SameSite=Lax`;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (mode === "system") {
        apply("system");
      }
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [mode]);

  return (
    <div className="theme-switcher" role="group" aria-label="Выбор темы">
      {modes.map((item) => (
        <button
          key={item.value}
          type="button"
          aria-pressed={mode === item.value}
          onClick={() => setMode(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
