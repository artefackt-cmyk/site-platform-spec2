import { describe, expect, it } from "vitest";
import { packageName } from "./index";

describe("@site-platform/domain", () => {
  it("exposes the package entrypoint", () => {
    expect(packageName).toBe("@site-platform/domain");
  });
});

