import * as React from "react";
import type { Metadata } from "next";
import { loadPublicConfig } from "@site-platform/config";
import { CTA } from "./cta";
import { ProductHero } from "./heroes";
import {
  DesktopMobileSection,
  FeatureGrid,
  ProcessSteps,
  ScenarioGrid
} from "./sections";
import { buildDashboardUrl } from "./public-theme";
import { PublicShell } from "./shell";
import {
  getProductBySlug,
  getProductPublicPath,
  type Product,
  type PublicCard
} from "../../content/public/products";

type ReadyProductSlug = "website-builder" | "online-store";

const storeManagement: PublicCard[] = [
  {
    title: "Управление витриной",
    description: "Публикуйте коллекции, статусы, карточки и CTA без отдельной CMS для магазина."
  },
  {
    title: "Каталог и остатки",
    description: "Держите товары, услуги, наборы и доступность рядом с публичной страницей."
  },
  {
    title: "Заказы и оплаты",
    description: "Собирайте заявки и готовьте путь к оплате без потери контекста клиента."
  }
];

const storeCapabilities: PublicCard[] = [
  {
    title: "Карточки товаров",
    description: "Название, описание, варианты, статус и следующий шаг для клиента."
  },
  {
    title: "Командная работа",
    description: "Редактор, менеджер и владелец видят один публичный контур и свои задачи."
  },
  {
    title: "Связи продуктов",
    description: "Магазин соединяется с конструктором, заказами, коммуникациями и аналитикой."
  }
];

const launchSteps = ["Соберите витрину", "Добавьте каталог и остатки", "Настройте заявки", "Запустите продажи"];

export function generateReadyProductMetadata(slug: ReadyProductSlug): Metadata {
  const config = loadPublicConfig();
  const product = getReadyProduct(slug);
  const storefrontUrl = config.storefrontUrl.replace(/\/$/, "");
  const publicPath = getProductPublicPath(product.slug);

  return {
    metadataBase: new URL(storefrontUrl),
    title: product.name,
    description: product.description,
    alternates: {
      canonical: publicPath
    },
    openGraph: {
      title: `${product.name} Mercurio`,
      description: product.description,
      url: publicPath
    },
    twitter: {
      title: `${product.name} Mercurio`,
      description: product.description
    }
  };
}

export function WebsiteBuilderProductPage() {
  const config = loadPublicConfig();
  const registerUrl = buildDashboardUrl(config.dashboardUrl, "/register");
  const product = getReadyProduct("website-builder");

  return (
    <PublicShell dashboardUrl={config.dashboardUrl}>
      <ProductHero
        product={product}
        primaryHref={registerUrl}
        secondaryLabel={product.secondaryCtaLabel}
        secondaryHref="/"
      />
      <DesktopMobileSection />
      <FeatureGrid
        eyebrow="Ключевые возможности"
        title={product.featureTitle}
        description={product.futureSummary}
        items={product.features}
      />
      <ScenarioGrid eyebrow="Сценарии" title={product.scenarioTitle} items={product.scenarios} />
      <ProcessSteps steps={product.process} />
      <CTA
        title={product.finalCtaTitle}
        description={product.finalCtaDescription}
        primaryLabel={product.finalPrimaryLabel}
        primaryHref={registerUrl}
        secondaryLabel="На главную"
        secondaryHref="/"
      />
    </PublicShell>
  );
}

export function OnlineStoreProductPage() {
  const config = loadPublicConfig();
  const registerUrl = buildDashboardUrl(config.dashboardUrl, "/register");
  const product = getReadyProduct("online-store");

  return (
    <PublicShell dashboardUrl={config.dashboardUrl}>
      <ProductHero
        product={product}
        primaryHref={registerUrl}
        secondaryLabel="Посмотреть возможности"
        secondaryHref="#features"
      />
      <FeatureGrid
        eyebrow="Витрина и каталог"
        title="Управляйте магазином как частью публичной системы"
        description="Каталог, заказы, оплаты и остатки живут рядом с сайтом, а команда не теряет контекст клиента."
        items={storeManagement}
      />
      <ScenarioGrid
        eyebrow="Возможности магазина"
        title="От первого каталога до управляемых продаж"
        items={storeCapabilities}
      />
      <FeatureGrid
        eyebrow="Связи продуктов"
        title={product.featureTitle}
        description={product.futureSummary}
        items={product.features}
      />
      <ScenarioGrid eyebrow="Сценарии" title={product.scenarioTitle} items={product.scenarios} />
      <ProcessSteps steps={launchSteps} />
      <CTA
        title="Запустите продажи"
        description="Начните с витрины и заявок, затем подключайте оплату, лояльность, коммуникации и аналитику."
        primaryLabel="Начать работу"
        primaryHref={registerUrl}
        secondaryLabel="Рассчитать стоимость"
        secondaryHref="/pricing"
      />
    </PublicShell>
  );
}

function getReadyProduct(slug: ReadyProductSlug): Product {
  const product = getProductBySlug(slug);

  if (product === undefined) {
    throw new Error(`${slug} product content is missing.`);
  }

  return product;
}
