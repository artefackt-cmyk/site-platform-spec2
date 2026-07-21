import * as React from "react";
import { loadPublicConfig } from "@site-platform/config";
import { CTA } from "../../components/public/cta";
import { PageHero } from "../../components/public/heroes";
import { PublicShell } from "../../components/public/shell";
import { PublicThemeBoot } from "../../components/public/theme-boot";

export default function MarketingNotFound() {
  const config = loadPublicConfig();

  return (
    <>
      <PublicThemeBoot />
      <PublicShell dashboardUrl={config.dashboardUrl}>
        <PageHero
          eyebrow="404"
          title="Страница Mercurio не найдена"
          description="Такой публичной страницы нет или ссылка уже изменилась. Можно вернуться к продуктам и выбрать актуальный сценарий."
          primaryLabel="На главную"
          primaryHref="/"
          secondaryLabel="Все продукты"
          secondaryHref="/products"
        />
        <CTA
          title="Продолжите с понятной точки входа"
          description="Каталог продуктов Mercurio поможет быстро перейти к сайту, магазину, коммуникациям и миграции."
          primaryLabel="Посмотреть продукты"
          primaryHref="/products"
          secondaryLabel="Тарифы"
          secondaryHref="/pricing"
        />
      </PublicShell>
    </>
  );
}
