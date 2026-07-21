import type { MetadataRoute } from "next";
import { getStorefrontBaseUrl } from "../components/public/metadata";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getStorefrontBaseUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/s/", "/checkout", "/order", "/login", "/register", "/api/"]
    },
    sitemap: `${baseUrl}/sitemap.xml`
  };
}
