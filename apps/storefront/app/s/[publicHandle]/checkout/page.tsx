import type { Metadata } from "next";
import { loadPublicConfig } from "@site-platform/config";
import { CheckoutClient } from "../../../checkout-client";

type CheckoutPageProps = {
  readonly params: Promise<{
    readonly publicHandle: string;
  }>;
};

export async function generateMetadata({
  params
}: CheckoutPageProps): Promise<Metadata> {
  const { publicHandle } = await params;

  return {
    title: "Оформить заказ",
    alternates: {
      canonical: `/s/${encodeURIComponent(publicHandle)}/checkout`
    },
    robots: {
      index: false,
      follow: false
    }
  };
}

export default async function Page({ params }: CheckoutPageProps) {
  const { publicHandle } = await params;
  const config = loadPublicConfig();

  return <CheckoutClient apiUrl={config.apiUrl} publicHandle={publicHandle} />;
}
