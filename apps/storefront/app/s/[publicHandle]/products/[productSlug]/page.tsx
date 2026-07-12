import type { Metadata } from "next";
import { loadPublicConfig } from "@site-platform/config";
import { fetchPublicProduct } from "../../../../public-site-client";
import { ProductGallery } from "./product-gallery";

type ProductPageProps = {
  readonly params: Promise<{
    readonly publicHandle: string;
    readonly productSlug: string;
  }>;
};

export async function generateMetadata({
  params
}: ProductPageProps): Promise<Metadata> {
  const { publicHandle, productSlug } = await params;
  const config = loadPublicConfig();
  const response = await fetchPublicProduct({
    apiUrl: config.apiUrl,
    publicHandle,
    productSlug
  });

  if (!response.ok) {
    return {
      title: "Товар не найден",
      robots: {
        index: false,
        follow: false
      }
    };
  }

  return {
    title: response.product.title,
    description: response.product.shortDescription ?? response.product.title,
    alternates: {
      canonical: response.product.canonicalUrl
    },
    openGraph: {
      title: response.product.title,
      description: response.product.shortDescription ?? response.product.title
    }
  };
}

export default async function Page({ params }: ProductPageProps) {
  const { publicHandle, productSlug } = await params;
  const config = loadPublicConfig();
  const response = await fetchPublicProduct({
    apiUrl: config.apiUrl,
    publicHandle,
    productSlug
  });
  const siteBasePath = `/s/${encodeURIComponent(publicHandle)}`;

  if (!response.ok) {
    return (
      <main style={stateStyle}>
        <h1>Товар не найден</h1>
        <p>{response.message}</p>
      </main>
    );
  }

  const product = response.product;

  return (
    <main style={shellStyle}>
      <nav style={breadcrumbStyle} aria-label="Навигация">
        <a href={siteBasePath} style={linkStyle}>
          На сайт
        </a>
        <span>/</span>
        <a href={`${siteBasePath}/products`} style={linkStyle}>
          Каталог
        </a>
      </nav>
      <section style={layoutStyle}>
        <ProductGallery title={product.title} images={product.images ?? []} />
        <div style={contentStyle}>
          <h1 style={titleStyle}>{product.title}</h1>
          {product.shortDescription === null ? null : (
            <p style={leadStyle}>{product.shortDescription}</p>
          )}
          <p style={priceStyle}>
            {product.price === null ? "Цена не указана" : product.price.formatted}
          </p>
          <p style={mutedStyle}>Статус: {toAvailabilityLabel(product.availability)}</p>
          {product.description === null ? null : (
            <p style={descriptionStyle}>{product.description}</p>
          )}
          <section style={variantsStyle}>
            <h2 style={sectionTitleStyle}>Варианты</h2>
            {product.variants.map((variant) => (
              <article key={variant.id} style={variantRowStyle}>
                <span>{variant.title}</span>
                <span>{variant.sku}</span>
                <strong>{variant.price.formatted}</strong>
              </article>
            ))}
          </section>
        </div>
      </section>
    </main>
  );
}

function toAvailabilityLabel(
  availability: "in-stock" | "out-of-stock" | "preorder"
): string {
  if (availability === "in-stock") {
    return "в наличии";
  }

  if (availability === "preorder") {
    return "предзаказ";
  }

  return "нет в наличии";
}

const shellStyle = {
  minHeight: "100vh",
  padding: "32px",
  color: "#152033",
  background: "#ffffff"
} as const;

const breadcrumbStyle = {
  display: "flex",
  gap: 8,
  marginBottom: 24,
  color: "#667085"
} as const;

const linkStyle = {
  color: "#1d4ed8",
  fontWeight: 700,
  textDecoration: "none"
} as const;

const layoutStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(280px, 520px) minmax(0, 1fr)",
  gap: 32,
  alignItems: "start"
} as const;

const contentStyle = {
  display: "grid",
  gap: 16
} as const;

const titleStyle = {
  margin: 0,
  fontSize: 44,
  lineHeight: 1.08
} as const;

const leadStyle = {
  margin: 0,
  color: "#475467",
  fontSize: 20,
  lineHeight: 1.55
} as const;

const priceStyle = {
  margin: 0,
  fontSize: 28,
  fontWeight: 800
} as const;

const mutedStyle = {
  margin: 0,
  color: "#667085"
} as const;

const descriptionStyle = {
  margin: 0,
  whiteSpace: "pre-wrap",
  lineHeight: 1.65
} as const;

const variantsStyle = {
  display: "grid",
  gap: 10,
  marginTop: 12
} as const;

const sectionTitleStyle = {
  margin: 0,
  fontSize: 22
} as const;

const variantRowStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr auto",
  gap: 12,
  border: "1px solid #d6dee9",
  borderRadius: 8,
  padding: 12
} as const;

const stateStyle = {
  display: "grid",
  minHeight: "100vh",
  placeItems: "center",
  padding: 32,
  color: "#152033",
  textAlign: "center"
} as const;
