import type { MetadataRoute } from "next";
import { getStorefrontBaseUrl } from "../components/public/metadata";
import { getProductPublicPath, products } from "../content/public/products";

const staticMarketingRoutes = [
  "/",
  "/products",
  "/website-builder",
  "/online-store",
  "/pricing",
  "/migration",
  "/privacy",
  "/terms"
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getStorefrontBaseUrl();
  const productRoutes = products.map((product) => getProductPublicPath(product.slug));
  const routes = Array.from(new Set([...staticMarketingRoutes, ...productRoutes]));

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : 0.7
  }));
}
