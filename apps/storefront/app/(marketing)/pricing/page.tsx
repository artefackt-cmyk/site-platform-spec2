import * as React from "react";
import type { Metadata } from "next";
import { loadPublicConfig } from "@site-platform/config";
import { CTA } from "../../../components/public/cta";
import { PageHero } from "../../../components/public/heroes";
import { createPublicMetadata } from "../../../components/public/metadata";
import { buildDashboardUrl } from "../../../components/public/public-theme";
import { FeatureGrid } from "../../../components/public/sections";
import { PublicShell } from "../../../components/public/shell";
import { pricingPage } from "../../../content/public/system-pages";

export function generateMetadata(): Metadata {
  return createPublicMetadata({
    title: pricingPage.title,
    description: pricingPage.description,
    canonical: "/pricing"
  });
}

export default function PricingPage() {
  const config = loadPublicConfig();
  const registerUrl = buildDashboardUrl(config.dashboardUrl, "/register");

  return (
    <PublicShell dashboardUrl={config.dashboardUrl}>
      <PageHero
        eyebrow="Тарифы"
        title={pricingPage.title}
        description={pricingPage.description}
        primaryLabel="Обсудить запуск"
        primaryHref={registerUrl}
        secondaryLabel="Как проходит переход"
        secondaryHref="/migration"
      />
      <section className="section pricing-section" aria-labelledby="pricing-plans-title">
        <div className="section-header">
          <p className="eyebrow">Пакеты</p>
          <h2 id="pricing-plans-title">Стартовые сценарии без публичной цены</h2>
          <p>{pricingPage.note}</p>
        </div>
        <div className="pricing-grid">
          {pricingPage.plans.map((plan) => (
            <article className="pricing-card" key={plan.name}>
              <div className="pricing-card-header">
                <span>{plan.badge}</span>
                <h3>{plan.name}</h3>
                <strong>{plan.draftPrice}</strong>
              </div>
              <p>{plan.description}</p>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
      <FeatureGrid
        eyebrow="Состав"
        title="Что влияет на итоговую оценку"
        description="Финальный объём зависит от текущей платформы, данных, интеграций и готовности контента."
        items={pricingPage.comparison}
      />
      <FeatureGrid
        eyebrow="Вопросы"
        title="Что важно уточнить перед запуском"
        description="Этот раздел фиксирует ограничения предварительной версии тарифов."
        items={pricingPage.faq}
      />
      <CTA
        title="Подберите первый рабочий сценарий Mercurio"
        description="Начните с публичного сайта, интернет-магазина или плана миграции без изменения текущей системы."
        primaryLabel="Начать работу"
        primaryHref={registerUrl}
        secondaryLabel="Посмотреть продукты"
        secondaryHref="/products"
      />
    </PublicShell>
  );
}
