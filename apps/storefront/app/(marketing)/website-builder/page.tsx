import * as React from "react";
import type { Metadata } from "next";
import {
  generateReadyProductMetadata,
  WebsiteBuilderProductPage
} from "../../../components/public/product-pages";

export function generateMetadata(): Metadata {
  return generateReadyProductMetadata("website-builder");
}

export default function WebsiteBuilderPage() {
  return <WebsiteBuilderProductPage />;
}
