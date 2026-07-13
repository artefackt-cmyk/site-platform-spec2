import { describe, expect, it } from "vitest";
import {
  getMerkurioUiCssVariables,
  merkurioUiColorTokens,
  merkurioUiSemanticColorTokenNames,
  merkurioUiTypographyTokens,
  siteThemePlaceholderTokens,
  siteThemeTokenNames,
  tokenNameToCssVariableName
} from "./index";

describe("Merkurio UI token foundation", () => {
  it("exports every required semantic color for light and dark modes", () => {
    expect(merkurioUiSemanticColorTokenNames).toHaveLength(30);

    for (const tokenName of merkurioUiSemanticColorTokenNames) {
      expect(merkurioUiColorTokens[tokenName].light).toMatch(/^#[0-9A-F]{6}$/i);
      expect(merkurioUiColorTokens[tokenName].dark).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });

  it("maps semantic tokens to stable CSS variable names", () => {
    expect(tokenNameToCssVariableName("color.bg.surface")).toBe(
      "--m-ui-color-bg-surface"
    );
    expect(getMerkurioUiCssVariables("dark")["--m-ui-color-bg-surface"]).toBe(
      "#0B1722"
    );
    expect(getMerkurioUiCssVariables("light")["--m-ui-color-accent-brand"]).toBe(
      "#3B5F7D"
    );
  });

  it("keeps typography roles explicit", () => {
    expect(merkurioUiTypographyTokens.display.family).toContain("Prata");
    expect(merkurioUiTypographyTokens.body.family).toContain("Inter");
    expect(merkurioUiTypographyTokens["heading-2"].family).toContain("Inter");
  });

  it("keeps Site Theme placeholder tokens separate from Merkurio UI tokens", () => {
    expect(siteThemeTokenNames).toContain("site.color.background");
    expect(siteThemePlaceholderTokens["site.color.background"].light).toBe("#FFFFFF");
    expect(
      merkurioUiSemanticColorTokenNames.some((tokenName) =>
        tokenName.startsWith("site.")
      )
    ).toBe(false);
  });
});
