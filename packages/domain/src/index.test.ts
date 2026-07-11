import { describe, expect, it } from "vitest";
import {
  ALL_PERMISSIONS,
  DOMAIN_ERROR_CODES,
  MUTATION_PERMISSIONS,
  PERMISSIONS,
  hasPermission,
  normalizeEmail,
  packageName,
  validateOrganizationName,
  validateProjectSlug
} from "./index";

describe("@site-platform/domain", () => {
  it("exposes the package entrypoint", () => {
    expect(packageName).toBe("@site-platform/domain");
  });

  it("normalizes email addresses", () => {
    expect(normalizeEmail("  Owner@Example.COM  ")).toBe("owner@example.com");
  });

  it("validates organization names", () => {
    expect(validateOrganizationName("  Artefackt   Studio  ")).toEqual({
      ok: true,
      value: "Artefackt Studio"
    });
    expect(validateOrganizationName(" ")).toEqual({
      ok: false,
      code: DOMAIN_ERROR_CODES.organizationNameRequired
    });
    expect(validateOrganizationName("A")).toEqual({
      ok: false,
      code: DOMAIN_ERROR_CODES.organizationNameTooShort
    });
  });

  it("validates project slugs", () => {
    expect(validateProjectSlug("main-store")).toEqual({
      ok: true,
      value: "main-store"
    });
    expect(validateProjectSlug("Main Store")).toEqual({
      ok: false,
      code: DOMAIN_ERROR_CODES.projectSlugInvalidFormat
    });
    expect(validateProjectSlug("a")).toEqual({
      ok: false,
      code: DOMAIN_ERROR_CODES.projectSlugTooShort
    });
  });

  it("grants OWNER every current permission", () => {
    for (const permission of ALL_PERMISSIONS) {
      expect(hasPermission("OWNER", permission)).toBe(true);
    }
  });

  it("does not grant VIEWER mutation permissions", () => {
    for (const permission of MUTATION_PERMISSIONS) {
      expect(hasPermission("VIEWER", permission)).toBe(false);
    }

    expect(hasPermission("VIEWER", PERMISSIONS.organizationRead)).toBe(true);
    expect(hasPermission("VIEWER", PERMISSIONS.projectRead)).toBe(true);
    expect(hasPermission("VIEWER", PERMISSIONS.contentRead)).toBe(true);
  });
});
