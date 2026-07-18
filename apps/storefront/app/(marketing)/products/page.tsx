import * as React from "react";
import type { Metadata } from "next";
import { loadPublicConfig } from "@site-platform/config";
import { PageHero } from "../../../components/public/heroes";
import { ProductCatalog } from "../../../components/public/product-catalog";
import { buildDashboardUrl } from "../../../components/public/public-theme";
import { PublicShell } from "../../../components/public/shell";
import { productsPage } from "../../../content/public/pages";
import { products } from "../../../content/public/products";

const title = "Все продукты Mercurio";
const description =
  "Каталог продуктов Mercurio: конструктор сайтов, интернет-магазин, коммуникации, аналитика, роли и интеграции.";

export function generateMetadata(): Metadata {
  const config = loadPublicConfig();
  const storefrontUrl = config.storefrontUrl.replace(/\/$/, "");

  return {
    metadataBase: new URL(storefrontUrl),
    title,
    description,
    alternates: {
      canonical: "/products"
    },
    openGraph: {
      title,
      description,
      url: "/products"
    },
    twitter: {
      title,
      description
    }
  };
}

export default function ProductsPage() {
  const config = loadPublicConfig();
  const registerUrl = buildDashboardUrl(config.dashboardUrl, "/register");

  return (
    <PublicShell dashboardUrl={config.dashboardUrl}>
      <PageHero
        eyebrow="Продукты"
        title={productsPage.hero.title}
        description={productsPage.hero.description}
        primaryLabel="Начать работу"
        primaryHref={registerUrl}
        secondaryLabel="Посмотреть тарифы"
        secondaryHref="/pricing"
      />
      <ProductCatalog products={products} />
    </PublicShell>
  );
}
