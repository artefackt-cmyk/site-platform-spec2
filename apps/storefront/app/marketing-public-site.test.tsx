import * as React from "react";
import { existsSync, readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import HomePage, { generateMetadata as generateHomeMetadata } from "./(marketing)/page";
import ProductsPage, {
  generateMetadata as generateProductsMetadata
} from "./(marketing)/products/page";
import ProductAnnouncementPage, {
  generateMetadata as generateAnnouncementMetadata
} from "./(marketing)/products/[slug]/page";
import MarketingNotFound from "./(marketing)/not-found";
import MarketingCatchAllPage from "./(marketing)/[...notFound]/page";
import OnlineStorePage, {
  generateMetadata as generateOnlineStoreMetadata
} from "./(marketing)/products/online-store/page";
import WebsiteBuilderPage, {
  generateMetadata as generateWebsiteBuilderMetadata
} from "./(marketing)/products/website-builder/page";
import MigrationPage, {
  generateMetadata as generateMigrationMetadata
} from "./(marketing)/migration/page";
import PricingPage, {
  generateMetadata as generatePricingMetadata
} from "./(marketing)/pricing/page";
import PrivacyPage, {
  generateMetadata as generatePrivacyMetadata
} from "./(marketing)/privacy/page";
import TermsPage, {
  generateMetadata as generateTermsMetadata
} from "./(marketing)/terms/page";
import robots from "./robots";
import sitemap from "./sitemap";
import { buildAuthRedirectUrl } from "../components/public/auth-redirect";
import { Header } from "../components/public/header";
import {
  parsePublicThemeMode,
  resolvePublicTheme
} from "../components/public/public-theme";
import { Footer } from "../components/public/footer";
import { products } from "../content/public/products";

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

  it("renders the product catalog page through SSR", () => {
    const html = renderToStaticMarkup(React.createElement(ProductsPage));
    const metadata = generateProductsMetadata();

    expect(html).toContain("Все продукты Mercurio");
    expect(html).toContain("Выберите продукт под текущий этап роста");
    expect(html).toContain("product-card-v2");
    expect(html).toContain("href=\"/products/online-store\"");
    expect(html).toContain("href=\"/products/orders-payments\"");
    expect(html).toContain("Посмотреть тарифы");
    expect(metadata.alternates?.canonical).toBe("/products");
  });

  it("renders the online-store page with approved store content", () => {
    const html = renderToStaticMarkup(React.createElement(OnlineStorePage));
    const metadata = generateOnlineStoreMetadata();

    expect(html).toContain("Интернет-магазин");
    expect(html).toContain("Посмотреть возможности");
    expect(html).toContain("Управление витриной");
    expect(html).toContain("Каталог и остатки");
    expect(html).toContain("Заказы и оплаты");
    expect(html).toContain("Командная работа");
    expect(html).toContain("Связи продуктов");
    expect(html).toContain("Запустите продажи");
    expect(html).toContain("Рассчитать стоимость");
    expect(html).not.toContain("Начните с конструктора");
    expect(html).not.toContain("Посмотреть шаблоны");
    expect(html).not.toContain("Не просто страницы");
    expect(metadata.alternates?.canonical).toBe("/products/online-store");
  });

  it("renders pricing, migration, legal and marketing not-found pages through SSR", () => {
    const pricingHtml = renderToStaticMarkup(React.createElement(PricingPage));
    const migrationHtml = renderToStaticMarkup(React.createElement(MigrationPage));
    const privacyHtml = renderToStaticMarkup(React.createElement(PrivacyPage));
    const termsHtml = renderToStaticMarkup(React.createElement(TermsPage));
    const notFoundHtml = renderToStaticMarkup(React.createElement(MarketingNotFound));

    expect(pricingHtml).toContain("Тарифы Mercurio");
    expect(pricingHtml).toContain("Стартовые сценарии без публичной цены");
    expect(pricingHtml).toContain("href=\"/migration\"");
    expect(migrationHtml).toContain("Переход на Mercurio");
    expect(migrationHtml).toContain("Аудит исходной системы");
    expect(migrationHtml).toContain("href=\"/pricing\"");
    expect(privacyHtml).toContain("Политика конфиденциальности");
    expect(privacyHtml).toContain("Требует юридической проверки");
    expect(termsHtml).toContain("Условия использования");
    expect(termsHtml).toContain("Требует юридической проверки");
    expect(notFoundHtml).toContain("Страница Mercurio не найдена");
    expect(notFoundHtml).toContain("href=\"/products\"");
  });

  it("ships metadata for new marketing system pages", () => {
    expect(generatePricingMetadata().alternates?.canonical).toBe("/pricing");
    expect(generateMigrationMetadata().alternates?.canonical).toBe("/migration");
    expect(generatePrivacyMetadata().alternates?.canonical).toBe("/privacy");
    expect(generateTermsMetadata().alternates?.canonical).toBe("/terms");
    expect(generatePrivacyMetadata().robots).toMatchObject({ index: false, follow: true });
    expect(generateTermsMetadata().robots).toMatchObject({ index: false, follow: true });
  });

  it("builds dashboard auth redirect URLs without exposing arbitrary query params", () => {
    expect(buildAuthRedirectUrl("login", { returnTo: "/products", token: "secret" })).toBe(
      "http://localhost:3000/login?returnTo=%2Fproducts"
    );
    expect(buildAuthRedirectUrl("register", { source: ["public", "ignored"] })).toBe(
      "http://localhost:3000/register?source=public"
    );
  });

  it("publishes sitemap and robots only for the public marketing surface", () => {
    const sitemapUrls = sitemap().map((entry) => entry.url);
    const sitemapPaths = sitemapUrls.map((url) => new URL(url).pathname);
    const robotsConfig = robots();

    expect(sitemapUrls).toContain("http://localhost:3001/");
    expect(sitemapUrls).toContain("http://localhost:3001/products");
    expect(sitemapUrls).toContain("http://localhost:3001/products/website-builder");
    expect(sitemapUrls).toContain("http://localhost:3001/products/online-store");
    expect(sitemapUrls).toContain("http://localhost:3001/pricing");
    expect(sitemapUrls).toContain("http://localhost:3001/migration");
    expect(sitemapUrls).toContain("http://localhost:3001/privacy");
    expect(sitemapUrls).toContain("http://localhost:3001/terms");
    expect(sitemapPaths.some((path) => path === "/s" || path.startsWith("/s/"))).toBe(false);
    expect(sitemapPaths.some((path) => path === "/checkout" || path.startsWith("/checkout/"))).toBe(false);
    expect(sitemapPaths.some((path) => path === "/order" || path.startsWith("/order/"))).toBe(false);
    expect(sitemapPaths).not.toContain("/login");
    expect(sitemapPaths).not.toContain("/register");
    expect(new Set(sitemapUrls).size).toBe(sitemapUrls.length);
    expect(robotsConfig.rules).toMatchObject({
      userAgent: "*",
      allow: "/",
      disallow: ["/s/", "/checkout", "/order", "/login", "/register", "/api/"]
    });
    expect(robotsConfig.sitemap).toBe("http://localhost:3001/sitemap.xml");
  });

  it("renders an announcement product page from shared product content", async () => {
    const element = await ProductAnnouncementPage({
      params: Promise.resolve({ slug: "orders-payments" })
    });
    const html = renderToStaticMarkup(element);
    const metadata = await generateAnnouncementMetadata({
      params: Promise.resolve({ slug: "orders-payments" })
    });

    expect(html).toContain("Заказы и оплаты");
    expect(html).toContain("В разработке");
    expect(html).toContain("Будущий модуль закроет путь заказа");
    expect(html).toContain("Вернуться в каталог");
    expect(html).toContain("href=\"/products\"");
    expect(html).toContain("href=\"http://localhost:3000/register\"");
    expect(metadata.alternates?.canonical).toBe("/products/orders-payments");
  });

  it("handles an unknown announcement product slug with not-found metadata and route", async () => {
    const metadata = await generateAnnouncementMetadata({
      params: Promise.resolve({ slug: "unknown-product" })
    });

    expect(metadata).toEqual({});
    await expect(
      ProductAnnouncementPage({
        params: Promise.resolve({ slug: "unknown-product" })
      })
    ).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });

  it("routes unknown marketing URLs into the public not-found boundary", () => {
    expect(() => MarketingCatchAllPage()).toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
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
    expect(html).toContain("href=\"/products/online-store\"");
    expect(html).toContain("href=\"/products/orders-payments\"");
    expect(html).toContain("href=\"/products/marketing\"");
    expect(html).toContain("href=\"/pricing\"");
    expect(html).toContain("href=\"/migration\"");
    expect(html).toContain("href=\"/migration\"");
    expect(html).toContain("href=\"http://localhost:3000/login\"");
    expect(html).toContain("href=\"http://localhost:3000/register\"");
    expect(html).not.toContain("href=\"/solutions\"");
    expect(html).not.toContain("href=\"/resources\"");
    expect(html).not.toContain("href=\"/templates\"");
    expect(html).not.toContain("href=\"/products/website-builder\" href=\"/products/online-store\"");
  });

  it("keeps footer product links on real product routes", () => {
    const html = renderToStaticMarkup(
      React.createElement(Footer, { dashboardUrl })
    );

    expect(html).toContain("href=\"/products\"");
    expect(html).toContain("href=\"/products/website-builder\"");
    expect(html).toContain("href=\"/products/online-store\"");
    expect(html).toContain("href=\"/products/integrations\"");
    expect(html).toContain("href=\"/pricing\"");
    expect(html).toContain("href=\"/migration\"");
    expect(html).toContain("href=\"/privacy\"");
    expect(html).toContain("href=\"/terms\"");
    expect(html).toContain("href=\"http://localhost:3000/login\"");
    expect(html).toContain("href=\"http://localhost:3000/register\"");
    expect(html).not.toContain("href=\"/resources\"");
  });

  it("keeps product content slugs unique", () => {
    const slugs = products.map((product) => product.slug);
    const uniqueSlugs = new Set(slugs);

    expect(uniqueSlugs.size).toBe(slugs.length);
    expect(slugs).toContain("website-builder");
    expect(slugs).toContain("online-store");
    expect(slugs).toContain("orders-payments");
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
    const themeBootSource = readFileSync(
      new URL("../components/public/theme-boot.tsx", import.meta.url),
      "utf8"
    );
    const layoutSource = readFileSync(
      new URL("./(marketing)/layout.tsx", import.meta.url),
      "utf8"
    );

    expect(switcherSource).toContain("dataset.publicTheme");
    expect(themeBootSource).toContain("dataset.publicTheme");
    expect(layoutSource).toContain("PublicThemeBoot");
    expect(switcherSource).not.toContain("dataset.theme");
    expect(themeBootSource).not.toContain("dataset.theme");
    expect(switcherSource).not.toContain("colorScheme");
    expect(themeBootSource).not.toContain("colorScheme");
    expect(switcherSource).not.toContain("mercurio-theme");
    expect(themeBootSource).not.toContain("mercurio-theme");
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
    expect(tenantClientSource).toContain("fetchPublicSitePage");
    expect(tenantClientSource).toContain("fetchPublicCatalog");
    expect(tenantClientSource).toContain("createPublicOrder");
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
