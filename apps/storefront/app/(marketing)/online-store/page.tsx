import * as React from "react";
import type { Metadata } from "next";
import {
  generateReadyProductMetadata,
  OnlineStoreProductPage
} from "../../../components/public/product-pages";

export function generateMetadata(): Metadata {
  return generateReadyProductMetadata("online-store");
}

export default function OnlineStorePage() {
  return <OnlineStoreProductPage />;
}
