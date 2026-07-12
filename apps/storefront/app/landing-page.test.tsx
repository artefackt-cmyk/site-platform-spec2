import * as React from "react";
import { existsSync, readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { mercurioLogoAssets } from "@site-platform/ui";
import {
  businessChangeScenarios,
  capabilityGroups,
  growthStages,
  infrastructureSteps,
  integrations
} from "./landing-content";
import { LandingPageView } from "./landing-page-view";
import { generateMetadata } from "./page";

describe("Mercurio marketing landing", () => {
  it("renders the landing route through SSR without console errors", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {
      return undefined;
    });
    const html = renderLanding();

    expect(html).toContain("landing-hero-title");
    expect(html).toContain("Запустите сайт, магазин");
    expect(html).toContain("или маркетплейс");
    expect(html).toContain("без дизайнера и программиста");
    expect(html).toContain("role=\"img\"");
    expect(html).toContain(mercurioLogoAssets.horizontal);
    expect(html).toContain(mercurioLogoAssets.monogram);
    expect(html).toContain("Декоративный макет интерфейса Mercurio");
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("renders semantic headings, skip link and header navigation", () => {
    const html = renderLanding();

    expect(html).toContain("Перейти к содержанию");
    expect(html).toContain("<h1");
    expect(html).toContain("id=\"hero-title\"");
    expect(html).toContain("Возможности");
    expect(html).toContain("Для бизнеса");
    expect(html).toContain("Интеграции");
    expect(html).toContain("О платформе");
    expect(html).toContain("aria-label=\"Навигация Mercurio\"");
  });

  it("renders a controlled hero heading without standalone conjunction wrappers", () => {
    const html = renderLanding();

    expect(html).toContain('<h1 id="hero-title" class="landing-hero-title">');
    expect(html).toContain("<span>Запустите сайт, магазин</span>");
    expect(html).toContain("<span>или маркетплейс</span>");
    expect(html).toContain(
      '<span class="landing-hero-title-accent">без дизайнера и программиста</span>'
    );
    expect(html).not.toContain("<span>и</span>");
    expect(html).not.toContain("<span>или</span>");
    expect(html).not.toContain("<span>без</span>");
  });

  it("renders accessible mobile navigation", () => {
    const html = renderLanding();

    expect(html).toContain("landing-menu-button");
    expect(html).toContain("aria-controls=\"landing-mobile-menu\"");
    expect(html).toContain("aria-expanded=\"false\"");
    expect(html).toContain("aria-label=\"Мобильная навигация\"");
  });

  it("renders hero and final CTA links to the configured dashboard URL", () => {
    const html = renderLanding("http://localhost:3000");
    const routeSource = readFileSync(
      new URL("./page.tsx", import.meta.url),
      "utf8"
    );

    expect(html).toContain("href=\"http://localhost:3000\"");
    expect(html).toContain("Создать проект");
    expect(html).toContain("Посмотреть возможности");
    expect(html).toContain("Посмотреть платформу");
    expect(html).toContain("landing-hero-actions");
    expect(routeSource).toContain("loadPublicConfig");
    expect(routeSource).toContain("config.dashboardUrl");
  });

  it("keeps responsive hero and overflow guard classes in CSS", () => {
    const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");

    expect(css).toContain("width: min(1240px, calc(100% - 40px));");
    expect(css).toContain("grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);");
    expect(css).toContain("min-height: min(680px, calc(100svh - 74px));");
    expect(css).toContain("font-size: clamp(40px, 3.05vw, 44px);");
    expect(css).toContain("white-space: nowrap;");
    expect(css).toContain("overflow-x: clip");
    expect(css).toContain("@media (max-width: 1040px)");
    expect(css).toContain("@media (max-width: 720px)");
    expect(css).toContain("white-space: normal;");
    expect(css).toContain(".landing-final-cta .landing-hero-actions");
  });

  it("uses a larger approved desktop logo asset without reconstructing the mark", () => {
    const html = renderLanding();
    const source = readFileSync(
      new URL("./landing-page-view.tsx", import.meta.url),
      "utf8"
    );
    const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");

    expect(source).toContain('className="landing-brand-wide" variant="wordmark"');
    expect(html).toContain(mercurioLogoAssets.horizontal);
    expect(css).toContain("flex: 0 0 260px");
    expect(source).not.toContain("<svg");
  });

  it("keeps integrations honest and does not mark unavailable work as available", () => {
    expect(integrations.length).toBeGreaterThan(0);
    expect(
      integrations.every(
        (integration) =>
          integration.status === "В разработке" || integration.status === "Скоро"
      )
    ).toBe(true);
    expect(integrations.map((integration) => integration.status)).not.toContain(
      "Доступно"
    );

    const html = renderLanding();

    expect(html).toContain("МойСклад");
    expect(html).toContain("ЮKassa и СБП");
    expect(html).toContain("В разработке");
    expect(html).toContain("Скоро");
    expect(html).not.toContain("Доступно");
  });

  it("marks analytics and marketplace as future work", () => {
    const html = renderLanding();

    expect(html).toContain("Модуль в разработке");
    expect(html).toContain("Направление развития");
    expect(html).toContain("Стратегическое направление");
    expect(
      growthStages.some(
        (stage) =>
          stage.title === "Экосистема" &&
          stage.badge === "Стратегическое направление"
      )
    ).toBe(true);
  });

  it("renders a visually clear current capabilities block", () => {
    const html = renderLanding();

    expect(capabilityGroups.map((group) => group.title)).toEqual([
      "Уже работает",
      "Следующие этапы",
      "Стратегическое направление"
    ]);
    expect(html).toContain("публичный storefront");
    expect(html).toContain("checkout");
    expect(html).toContain("экосистема интеграций");
  });

  it("renders a Mercurio mockup from real modules only", () => {
    const html = renderLanding();

    expect(html).toContain("Страницы");
    expect(html).toContain("Товары");
    expect(html).toContain("Медиа");
    expect(html).toContain("Публикация");
    expect(html).toContain("Structure");
    expect(html).toContain("Sections");
    expect(html).toContain("Columns");
    expect(html).toContain("Button settings");
    expect(html).toContain("Composition controls");
    expect(html).toContain("Editor preview");
    expect(html).toContain("Product catalog");
    expect(html).toContain("Product grid");
    expect(html).not.toContain("live analytics");
    expect(html).not.toContain("MRR");
    expect(html).not.toContain("conversion rate");
  });

  it("renders internal section layout variants for product storytelling", () => {
    const html = renderLanding();
    const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");

    expect(html).toContain("landing-audience-layout");
    expect(html).toContain("landing-dark-section landing-editor-story");
    expect(html).toContain("landing-project-variants");
    expect(html).toContain("landing-commerce-story");
    expect(html).toContain("landing-flow-timeline");
    expect(html).toContain("landing-analytics-dashboard");
    expect(html).toContain("landing-capability-layer");
    expect(css).toContain("grid-template-columns: minmax(0, 0.92fr) minmax(360px, 1.08fr);");
    expect(css).toContain("grid-template-columns: minmax(360px, 1fr) minmax(0, 0.9fr);");
    expect(css).toContain("grid-template-columns: repeat(8, minmax(0, 1fr));");
  });

  it("keeps internal heading scale controlled below hero scale", () => {
    const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");

    expect(css).toContain("font-size: clamp(44px, 4.4vw, 64px);");
    expect(css).toContain("max-width: 880px;");
    expect(css).toContain("line-height: 1.07;");
    expect(css).toContain("font-size: clamp(34px, 9vw, 44px);");
  });

  it("renders project variation cards instead of only scenario chips", () => {
    const html = renderLanding();

    expect(businessChangeScenarios.map((scenario) => scenario.title)).toEqual([
      "Новый продукт",
      "Сезонная коллекция",
      "Рекламная кампания",
      "Отдельная аудитория"
    ]);
    expect(html).toContain("Страницы проекта");
    expect(html).toContain("product-launch");
    expect(html).toContain("summer-drop");
    expect(html).toContain("ads-campaign");
    expect(html).toContain("b2b-offer");
  });

  it("renders commerce as catalog plus product landing surfaces", () => {
    const html = renderLanding();

    expect(html).toContain("Каталог: демо худи");
    expect(html).toContain("Демо худи");
    expect(html).toContain("4 варианта · цена · остатки");
    expect(html).toContain("Отдельный лендинг");
    expect(html).toContain("Hero, benefits, gallery и CTA");
    expect(html).toContain("Benefits");
    expect(html).toContain("Gallery");
  });

  it("uses honest infrastructure statuses and a mobile timeline contract", () => {
    const html = renderLanding();
    const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");

    expect(infrastructureSteps.map((step) => step.label)).toEqual([
      "Сайт",
      "Товары",
      "Склад",
      "Касса",
      "Доставка",
      "Бонусы",
      "Рассылки",
      "Аналитика"
    ]);
    expect(
      infrastructureSteps.every((step) =>
        ["Уже работает", "Следующий этап", "Roadmap"].includes(step.status)
      )
    ).toBe(true);
    expect(html).toContain("data-status=\"Roadmap\"");
    expect(css).toContain(".landing-flow-timeline li + li");
    expect(css).toContain("border-left: 0;");
    expect(css).toContain(".landing-flow-timeline li > span:last-child");
  });

  it("does not show fake analytics values", () => {
    const html = renderLanding();

    expect(html).toContain("landing-analytics-dashboard");
    expect(html).toContain("Схематичный модуль аналитики в разработке");
    expect(html).toContain("Популярные страницы");
    expect(html).not.toMatch(/\d+%/);
    expect(html).not.toContain("₽");
    expect(html).not.toContain("live");
  });

  it("keeps header compact and overflow guards for the second polish", () => {
    const html = renderLanding();
    const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");

    expect(html).toContain("landing-header landing-header-compact");
    expect(css).toContain(".landing-header-compact");
    expect(css).toContain("min-height: 62px;");
    expect(css).toContain("backdrop-filter: blur(18px);");
    expect(css).toContain("overflow-x: clip");
    expect(css).toContain("overflow: hidden;");
  });

  it("does not reconstruct the Mercurio mark in source or rendered markup", () => {
    const html = renderLanding();
    const source = readFileSync(
      new URL("./landing-page-view.tsx", import.meta.url),
      "utf8"
    );

    expect(source).toContain('import { MercurioLogo } from "@site-platform/ui"');
    expect(source).not.toContain("<svg");
    expect(source).not.toContain("mercurio-logo-mark");
    expect(html).not.toContain("preserveAspectRatio");
  });

  it("sets SEO metadata with canonical and Open Graph data", () => {
    const metadata = generateMetadata();

    expect(metadata.title).toBe(
      "Mercurio — сайты, магазины и торговая инфраструктура без кода"
    );
    expect(metadata.description).toBe(
      "Создавайте сайты, интернет-магазины и торговые платформы без дизайнера и программиста. Управляйте страницами, товарами и публикациями в одной гибкой системе."
    );
    expect(metadata.alternates).toEqual({
      canonical: "http://localhost:3001"
    });
    expect(metadata.openGraph).toMatchObject({
      title: metadata.title,
      description: metadata.description,
      url: "http://localhost:3001"
    });
  });

  it("keeps the marketing homepage separate from existing /s routes", () => {
    expect(existsSync(new URL("./page.tsx", import.meta.url))).toBe(true);
    expect(
      existsSync(
        new URL("./s/[publicHandle]/[[...pageSlug]]/page.tsx", import.meta.url)
      )
    ).toBe(true);
    expect(
      existsSync(
        new URL("./s/[publicHandle]/products/page.tsx", import.meta.url)
      )
    ).toBe(true);
    expect(
      existsSync(
        new URL(
          "./s/[publicHandle]/products/[productSlug]/page.tsx",
          import.meta.url
        )
      )
    ).toBe(true);
  });
});

function renderLanding(dashboardUrl = "http://localhost:3000"): string {
  return renderToStaticMarkup(
    React.createElement(LandingPageView, {
      dashboardUrl
    })
  );
}
