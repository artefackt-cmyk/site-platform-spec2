import { describe, expect, it } from "vitest";
import { BLOCK_DEFINITIONS, getBlockDefinition } from "./index";

describe("@site-platform/block-library", () => {
  it("exposes the first block definitions", () => {
    expect(BLOCK_DEFINITIONS.map((definition) => definition.type)).toEqual([
      "heading",
      "text",
      "button",
      "spacer"
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
});
