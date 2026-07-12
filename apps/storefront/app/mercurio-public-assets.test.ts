import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Mercurio public brand assets", () => {
  it("serves the shared Mercurio assets from the storefront public directory", () => {
    expect(
      existsSync(
        new URL(
          "../public/assets/mercurio/mercurio-monogram.png",
          import.meta.url
        )
      )
    ).toBe(true);
    expect(
      existsSync(
        new URL(
          "../public/assets/mercurio/mercurio-logo-horizontal.png",
          import.meta.url
        )
      )
    ).toBe(true);
  });

  it("uses the shared MercurioLogo component in public headers", () => {
    const landingSource = readFileSync(
      new URL("./s/[publicHandle]/[[...pageSlug]]/page.tsx", import.meta.url),
      "utf8"
    );
    const productsSource = readFileSync(
      new URL("./s/[publicHandle]/products/page.tsx", import.meta.url),
      "utf8"
    );

    expect(landingSource).toContain('import { MercurioLogo } from "@site-platform/ui"');
    expect(landingSource).toContain('<MercurioLogo variant="compact"');
    expect(productsSource).toContain('import { MercurioLogo } from "@site-platform/ui"');
    expect(productsSource).toContain('<MercurioLogo variant="compact"');
  });
});
