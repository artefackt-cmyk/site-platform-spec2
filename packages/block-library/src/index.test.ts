import { describe, expect, it } from "vitest";
import {
  BLOCK_DEFINITIONS,
  SECTION_DEFINITION,
  SECTION_PRESETS,
  getBlockDefinition
} from "./index";

describe("@site-platform/block-library", () => {
  it("exposes the first block definitions", () => {
    expect(BLOCK_DEFINITIONS.map((definition) => definition.type)).toEqual([
      "heading",
      "text",
      "button",
      "image",
      "spacer",
      "product-card",
      "product-grid"
    ]);
  });

  it("validates default props with the shared schemas", () => {
    for (const definition of BLOCK_DEFINITIONS) {
      expect(definition.propsSchema.safeParse(definition.defaultProps).success).toBe(
        true
      );
    }
  });

  it("finds a definition by type", () => {
    expect(getBlockDefinition("heading")).toMatchObject({
      label: "Заголовок"
    });
  });

  it("exposes section metadata and presets", () => {
    expect(SECTION_DEFINITION.propsSchema.safeParse(SECTION_DEFINITION.defaultProps).success).toBe(
      true
    );
    expect(SECTION_PRESETS.map((preset) => preset.id)).toEqual([
      "hero",
      "text-section"
    ]);
    expect(SECTION_PRESETS[0]?.createSection()).toMatchObject({
      type: "section",
      props: {
        layout: "two-columns"
      }
    });
  });
});
