import { describe, expect, it } from "vitest";
import {
  getMerkurioThemeInitializationScript,
  normalizeMerkurioThemeMode,
  resolveMerkurioThemeMode
} from "./theme";

describe("Merkurio UI theme provider helpers", () => {
  it("normalizes persisted mode values", () => {
    expect(normalizeMerkurioThemeMode("dark")).toBe("dark");
    expect(normalizeMerkurioThemeMode("unexpected")).toBe("system");
    expect(normalizeMerkurioThemeMode(null)).toBe("system");
  });

  it("resolves system theme without mutating Site Theme", () => {
    expect(resolveMerkurioThemeMode("system", true)).toBe("dark");
    expect(resolveMerkurioThemeMode("system", false)).toBe("light");
    expect(resolveMerkurioThemeMode("light", true)).toBe("light");
  });

  it("produces SSR-safe initialization script", () => {
    const script = getMerkurioThemeInitializationScript();

    expect(script).toContain("merkurio-ui-theme");
    expect(script).toContain("dataset.merkurioTheme");
    expect(script).toContain("prefers-color-scheme");
  });
});
