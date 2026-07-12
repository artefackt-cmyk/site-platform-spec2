import * as React from "react";
import type { Metadata } from "next";
import { loadPublicConfig } from "@site-platform/config";
import { LandingPageView } from "./landing-page-view";

const title = "Mercurio — сайты, магазины и торговая инфраструктура без кода";
const description =
  "Создавайте сайты, интернет-магазины и торговые платформы без дизайнера и программиста. Управляйте страницами, товарами и публикациями в одной гибкой системе.";

export function generateMetadata(): Metadata {
  const config = loadPublicConfig();
  const storefrontUrl = config.storefrontUrl.replace(/\/$/, "");

  return {
    title,
    description,
    alternates: {
      canonical: storefrontUrl
    },
    openGraph: {
      title,
      description,
      url: storefrontUrl,
      images: [
        {
          url: `${storefrontUrl}/assets/mercurio/mercurio-logo-horizontal.png`,
          alt: "Mercurio"
        }
      ]
    }
  };
}

export default function Page() {
  const config = loadPublicConfig();

  return <LandingPageView dashboardUrl={config.dashboardUrl} />;
}
