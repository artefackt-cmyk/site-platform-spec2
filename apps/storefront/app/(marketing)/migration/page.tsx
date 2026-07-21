import * as React from "react";
import type { Metadata } from "next";
import { loadPublicConfig } from "@site-platform/config";
import { CTA } from "../../../components/public/cta";
import { PageHero } from "../../../components/public/heroes";
import { createPublicMetadata } from "../../../components/public/metadata";
import { buildDashboardUrl } from "../../../components/public/public-theme";
import { FeatureGrid, ProcessSteps } from "../../../components/public/sections";
import { PublicShell } from "../../../components/public/shell";
import { migrationPage } from "../../../content/public/system-pages";

export function generateMetadata(): Metadata {
  return createPublicMetadata({
    title: migrationPage.title,
    description: migrationPage.description,
    canonical: "/migration"
  });
}

export default function MigrationPage() {
  const config = loadPublicConfig();
  const registerUrl = buildDashboardUrl(config.dashboardUrl, "/register");

  return (
    <PublicShell dashboardUrl={config.dashboardUrl}>
      <PageHero
        eyebrow="Миграция"
        title={migrationPage.title}
        description={migrationPage.description}
        primaryLabel="Запланировать переход"
        primaryHref={registerUrl}
        secondaryLabel="Посмотреть тарифы"
        secondaryHref="/pricing"
      />
      <FeatureGrid
        eyebrow="Откуда переносим"
        title="Начинаем с аудита текущей системы"
        description="Перед переносом фиксируем структуру страниц, каталог, данные клиентов и ограничения исходной платформы."
        items={migrationPage.platforms}
      />
      <FeatureGrid
        eyebrow="Данные"
        title="Что можно подготовить к переносу"
        description="Состав переноса подтверждается отдельно, чтобы не сломать текущие продажи и обработку заявок."
        items={migrationPage.transferred}
      />
      <ProcessSteps steps={migrationPage.steps} />
      <FeatureGrid
        eyebrow="Проверка"
        title="Что нельзя переносить автоматически"
        description="Критичные данные и публичный контент проходят ручную проверку перед запуском."
        items={migrationPage.manualChecks}
      />
      <CTA
        title="Подготовьте переход без остановки текущего сайта"
        description="Сначала собираем preview-контур, проверяем страницы и данные, затем планируем переключение."
        primaryLabel="Начать аудит"
        primaryHref={registerUrl}
        secondaryLabel="Все продукты"
        secondaryHref="/products"
      />
    </PublicShell>
  );
}
