import * as React from "react";
import type { Metadata } from "next";
import { loadPublicConfig } from "@site-platform/config";
import { CTA } from "../../components/public/cta";
import { HomeHero } from "../../components/public/heroes";
import { FeatureGrid, MetricsStrip, ScenarioGrid } from "../../components/public/sections";
import { PublicShell } from "../../components/public/shell";
import { buildDashboardUrl } from "../../components/public/public-theme";
import { homePage } from "../../content/public/pages";

const title = "Mercurio - публичная платформа для продаж и сайтов";
const description =
  "Mercurio помогает собирать сайты, магазины, продажи и коммуникации в единую публичную систему для растущего бизнеса.";

export function generateMetadata(): Metadata {
  const config = loadPublicConfig();
  const storefrontUrl = config.storefrontUrl.replace(/\/$/, "");

  return {
    metadataBase: new URL(storefrontUrl),
    title,
    description,
    alternates: {
      canonical: "/"
    },
    openGraph: {
      type: "website",
      locale: "ru_RU",
      url: "/",
      siteName: "Mercurio",
      title,
      description
    },
    twitter: {
      card: "summary_large_image",
      title,
      description
    },
    icons: {
      icon: "/favicon.svg"
    }
  };
}

export default function HomePage() {
  const config = loadPublicConfig();
  const registerUrl = buildDashboardUrl(config.dashboardUrl, "/register");
  const heroContent = {
    ...homePage.hero,
    primaryHref: registerUrl,
    secondaryHref: "/products/website-builder"
  };

  return (
    <PublicShell dashboardUrl={config.dashboardUrl}>
      <HomeHero content={heroContent} />
      <MetricsStrip items={homePage.metrics} />
      <FeatureGrid
        eyebrow="Возможности"
        title="Публичная система, которая растёт вместе с продажами"
        description="Mercurio связывает витрину, каталог, заявки, коммуникации и аналитику в один понятный поток."
        items={homePage.features}
      />
      <ScenarioGrid
        eyebrow="Сценарии"
        title="От первого сайта до полноценного магазина"
        items={homePage.scenarios}
      />
      <CTA
        title="Соберите публичный контур без лишней сборки вокруг"
        description="Начните с сайта или магазина, а затем подключайте коммуникации, аналитику и автоматизацию продаж."
        primaryLabel="Начать работу"
        primaryHref={registerUrl}
        secondaryLabel="Посмотреть конструктор"
        secondaryHref="/products/website-builder"
      />
    </PublicShell>
  );
}
