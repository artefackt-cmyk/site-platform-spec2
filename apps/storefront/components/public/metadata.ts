import type { Metadata } from "next";
import { loadPublicConfig } from "@site-platform/config";

export type PublicMetadataInput = {
  readonly title: string;
  readonly description: string;
  readonly canonical: `/${string}`;
  readonly noindex?: boolean;
};

export function createPublicMetadata(input: PublicMetadataInput): Metadata {
  const config = loadPublicConfig();
  const storefrontUrl = config.storefrontUrl.replace(/\/$/, "");

  return {
    metadataBase: new URL(storefrontUrl),
    title: input.title,
    description: input.description,
    alternates: {
      canonical: input.canonical
    },
    openGraph: {
      type: "website",
      locale: "ru_RU",
      siteName: "Mercurio",
      title: input.title,
      description: input.description,
      url: input.canonical
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description
    },
    robots: input.noindex
      ? {
          index: false,
          follow: true
        }
      : {
          index: true,
          follow: true
        }
  };
}

export function getStorefrontBaseUrl(): string {
  return loadPublicConfig().storefrontUrl.replace(/\/$/, "");
}
