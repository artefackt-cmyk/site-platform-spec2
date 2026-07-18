import * as React from "react";
import { existsSync, readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import HomePage, { generateMetadata as generateHomeMetadata } from "./(marketing)/page";
import WebsiteBuilderPage, {
  generateMetadata as generateWebsiteBuilderMetadata
} from "./(marketing)/products/website-builder/page";
import { Header } from "../components/public/header";
import {
  parsePublicThemeMode,
  resolvePublicTheme
} from "../components/public/public-theme";

const dashboardUrl = "http://localhost:3000";

describe("isolated Mercurio marketing public site", () => {
  it("renders the marketing root through SSR", () => {
    const html = renderToStaticMarkup(React.createElement(HomePage));

    expect(html).toContain("public-site");
    expect(html).toContain("Сайт, магазин и продажи в одной системе");
    expect(html).toContain("Публичная система, которая растёт вместе с продажами");
    expect(html).toContain("href=\"http://localhost:3000/register\"");
    expect(html).toContain("href=\"/products/website-builder\"");
  });

  it("renders the website-builder control page baseline sections", () => {
    const html = renderToStaticMarkup(React.createElement(WebsiteBuilderPage));

    expect(html).toContain("product-hero-website-builder");
    expect(html).toContain("Создавайте сайт и сразу видьте его на Desktop и Mobile");
    expect(html).toContain("Desktop и Mobile одновременно");
    expect(html).toContain("editor-both-mockup");
    expect(html).toContain("Desktop");
    expect(html).toContain("Mobile");
  });

  it("renders expected header and mega menu content", () => {
    const html = renderToStaticMarkup(
      React.createElement(Header, { dashboardUrl })
    );

    expect(html).toContain("brand-logo-light");
    expect(html).toContain("brand-logo-dark");
    expect(html).toContain("Продукты");
    expect(html).toContain("mega-menu");
    expect(html).toContain("Создание");
    expect(html).toContain("Продажи");
    expect(html).toContain("Рост");
    expect(html).toContain("Управление");
    expect(html).toContain("Конструктор сайтов");
    expect(html).toContain("href=\"/products/website-builder\"");
    expect(html).toContain("href=\"http://localhost:3000/login\"");
    expect(html).toContain("href=\"http://localhost:3000/register\"");
  });

  it("keeps public theme parsing isolated from tenant data-theme", () => {
    expect(parsePublicThemeMode("light")).toBe("light");
    expect(parsePublicThemeMode("dark")).toBe("dark");
    expect(parsePublicThemeMode("system")).toBe("system");
    expect(parsePublicThemeMode("unexpected")).toBe("system");
    expect(resolvePublicTheme("system", true)).toBe("dark");
    expect(resolvePublicTheme("system", false)).toBe("light");
    expect(resolvePublicTheme("light", true)).toBe("light");

    const switcherSource = readFileSync(
      new URL("../components/public/theme-switcher.tsx", import.meta.url),
      "utf8"
    );
    const layoutSource = readFileSync(
      new URL("./(marketing)/layout.tsx", import.meta.url),
      "utf8"
    );

    expect(switcherSource).toContain("dataset.publicTheme");
    expect(layoutSource).toContain("dataset.publicTheme");
    expect(switcherSource).not.toContain("dataset.theme");
    expect(layoutSource).not.toContain("dataset.theme");
    expect(switcherSource).not.toContain("colorScheme");
    expect(layoutSource).not.toContain("colorScheme");
    expect(switcherSource).not.toContain("mercurio-theme");
  });

  it("keeps marketing CSS scoped away from tenant storefront routes", () => {
    const publicCss = readFileSync(
      new URL("../styles/public-site.css", import.meta.url),
      "utf8"
    );
    const tenantPageSource = readFileSync(
      new URL("./s/[publicHandle]/[[...pageSlug]]/page.tsx", import.meta.url),
      "utf8"
    );
    const tenantClientSource = readFileSync(
      new URL("./public-site-client.ts", import.meta.url),
      "utf8"
    );

    expect(publicCss).toContain(".public-site");
    expect(publicCss).toContain("html[data-public-theme=\"dark\"] .public-site");
    expect(publicCss).not.toContain("[data-theme");
    expect(publicCss).not.toContain("--mc-");
    expect(publicCss).not.toMatch(/(^|})\s*body(?:[.#:[\s{]|$)/);
    expect(tenantPageSource).not.toContain("public-site.css");
    expect(tenantPageSource).not.toContain("public-theme");
    expect(tenantClientSource).toContain("/api/public/sites/");
    expect(tenantClientSource).toContain("/orders");
  });

  it("ships first-stage assets and env-aware metadata", () => {
    const homeMetadata = generateHomeMetadata();
    const productMetadata = generateWebsiteBuilderMetadata();

    expect(homeMetadata.metadataBase?.toString()).toBe("http://localhost:3001/");
    expect(productMetadata.metadataBase?.toString()).toBe("http://localhost:3001/");
    expect(productMetadata.alternates?.canonical).toBe("/products/website-builder");
    expect(existsSync(new URL("../public/brand-light.svg", import.meta.url))).toBe(true);
    expect(existsSync(new URL("../public/brand-dark.svg", import.meta.url))).toBe(true);
    expect(existsSync(new URL("../public/favicon.svg", import.meta.url))).toBe(true);
    expect(existsSync(new URL("../public/icons/mega-cart.svg", import.meta.url))).toBe(true);
  });
});
