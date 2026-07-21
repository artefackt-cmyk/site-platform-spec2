import * as React from "react";
import type { Metadata } from "next";
import { loadPublicConfig } from "@site-platform/config";
import { CTA } from "../../../../components/public/cta";
import { ProductHero } from "../../../../components/public/heroes";
import {
  DesktopMobileSection,
  FeatureGrid,
  ProcessSteps,
  ScenarioGrid
} from "../../../../components/public/sections";
import { buildDashboardUrl } from "../../../../components/public/public-theme";
import { PublicShell } from "../../../../components/public/shell";
import { getProductBySlug } from "../../../../content/public/products";

export function generateMetadata(): Metadata {
  const config = loadPublicConfig();
  const product = getWebsiteBuilderProduct();

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

export default function WebsiteBuilderPage() {
  const config = loadPublicConfig();
  const registerUrl = buildDashboardUrl(config.dashboardUrl, "/register");
  const product = getWebsiteBuilderProduct();

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

function getWebsiteBuilderProduct() {
  const product = getProductBySlug("website-builder");

  if (product === undefined) {
    throw new Error("Website builder product content is missing.");
  }

  return product;
}
