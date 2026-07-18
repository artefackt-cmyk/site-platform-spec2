import * as React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadPublicConfig } from "@site-platform/config";
import { CTA } from "../../../../components/public/cta";
import { ProductHero } from "../../../../components/public/heroes";
import { FeatureGrid } from "../../../../components/public/sections";
import { buildDashboardUrl } from "../../../../components/public/public-theme";
import { PublicShell } from "../../../../components/public/shell";
import {
  getProductBySlug,
  products
} from "../../../../content/public/products";

type ProductAnnouncementPageProps = {
  readonly params: Promise<{
    readonly slug: string;
  }>;
};

const announcementProducts = products.filter((product) => product.status === "announced");

export function generateStaticParams() {
  return announcementProducts.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: ProductAnnouncementPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (product === undefined || product.status !== "announced") {
    return {};
  }

  const config = loadPublicConfig();
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

export default async function ProductAnnouncementPage({ params }: ProductAnnouncementPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (product === undefined || product.status !== "announced") {
    notFound();
  }

  const config = loadPublicConfig();
  const registerUrl = buildDashboardUrl(config.dashboardUrl, "/register");

  return (
    <PublicShell dashboardUrl={config.dashboardUrl}>
      <ProductHero
        product={product}
        primaryHref={registerUrl}
        secondaryLabel="Вернуться в каталог"
        secondaryHref="/products"
      />
      <FeatureGrid
        eyebrow="В разработке"
        title={`Что появится в продукте «${product.name}»`}
        description={product.futureSummary}
        items={product.features}
      />
      <CTA
        title="Продукт в разработке"
        description="Оставьте заявку, чтобы обсудить сценарий и получить уведомление о запуске."
        primaryLabel="Начать работу"
        primaryHref={registerUrl}
        secondaryLabel="Вернуться в каталог"
        secondaryHref="/products"
      />
    </PublicShell>
  );
}
