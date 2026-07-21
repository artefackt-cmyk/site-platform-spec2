import * as React from "react";
import type { Metadata } from "next";
import { loadPublicConfig } from "@site-platform/config";
import { CTA } from "../../../../components/public/cta";
import { ProductHero } from "../../../../components/public/heroes";
import {
  FeatureGrid,
  ProcessSteps,
  ScenarioGrid
} from "../../../../components/public/sections";
import { buildDashboardUrl } from "../../../../components/public/public-theme";
import { PublicShell } from "../../../../components/public/shell";
import { getProductBySlug } from "../../../../content/public/products";

const storeManagement = [
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

const storeCapabilities = [
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

export function generateMetadata(): Metadata {
  const config = loadPublicConfig();
  const product = getOnlineStoreProduct();
  const storefrontUrl = config.storefrontUrl.replace(/\/$/, "");

  return {
    metadataBase: new URL(storefrontUrl),
    title: product.name,
    description: product.description,
    alternates: {
      canonical: `/products/${product.slug}`
    },
    openGraph: {
      title: `${product.name} Mercurio`,
      description: product.description,
      url: `/products/${product.slug}`
    },
    twitter: {
      title: `${product.name} Mercurio`,
      description: product.description
    }
  };
}

export default function OnlineStorePage() {
  const config = loadPublicConfig();
  const registerUrl = buildDashboardUrl(config.dashboardUrl, "/register");
  const product = getOnlineStoreProduct();

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

function getOnlineStoreProduct() {
  const product = getProductBySlug("online-store");

  if (product === undefined) {
    throw new Error("Online store product content is missing.");
  }

  return product;
}
