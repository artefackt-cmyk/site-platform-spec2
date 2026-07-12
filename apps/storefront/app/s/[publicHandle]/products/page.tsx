import type { Metadata } from "next";
import { loadPublicConfig } from "@site-platform/config";
import { MercurioLogo } from "@site-platform/ui";
import { fetchPublicCatalog } from "../../../public-site-client";

type ProductsPageProps = {
  readonly params: Promise<{
    readonly publicHandle: string;
  }>;
};

export async function generateMetadata({
  params
}: ProductsPageProps): Promise<Metadata> {
  const { publicHandle } = await params;

  return {
    title: "Каталог",
    alternates: {
      canonical: `/s/${encodeURIComponent(publicHandle)}/products`
    }
  };
}

export default async function Page({ params }: ProductsPageProps) {
  const { publicHandle } = await params;
  const config = loadPublicConfig();
  const response = await fetchPublicCatalog({
    apiUrl: config.apiUrl,
    publicHandle
  });
  const siteBasePath = `/s/${encodeURIComponent(publicHandle)}`;

  if (!response.ok) {
    return (
      <main style={stateStyle}>
        <h1>Каталог недоступен</h1>
        <p>{response.message}</p>
      </main>
    );
  }

  return (
    <main style={shellStyle}>
      <header style={headerStyle}>
        <a href={siteBasePath} style={brandStyle} aria-label="На сайт Mercurio">
          <MercurioLogo variant="compact" title="Mercurio" />
        </a>
        <h1 style={titleStyle}>Каталог</h1>
      </header>
      {response.catalog.products.length === 0 ? (
        <p style={mutedStyle}>Активных товаров пока нет.</p>
      ) : (
        <section style={gridStyle}>
          {response.catalog.products.map((product) => (
            <article key={product.id} style={cardStyle}>
              {product.primaryImage === null ? (
                <div style={imagePlaceholderStyle}>Изображение товара</div>
              ) : (
                <img
                  src={product.primaryImage.url}
                  alt={product.primaryImage.altText ?? product.title}
                  style={imageStyle}
                />
              )}
              <h2 style={cardTitleStyle}>{product.title}</h2>
              {product.shortDescription === null ? null : (
                <p style={mutedStyle}>{product.shortDescription}</p>
              )}
              <p style={priceStyle}>
                {product.price === null ? "Цена не указана" : product.price.formatted}
              </p>
              <a
                href={`${siteBasePath}/products/${encodeURIComponent(product.slug)}`}
                style={buttonStyle}
              >
                Подробнее
              </a>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

const shellStyle = {
  minHeight: "100vh",
  padding: "32px",
  color: "#152033",
  background: "#ffffff"
} as const;

const headerStyle = {
  display: "grid",
  gap: 12,
  marginBottom: 28
} as const;

const brandStyle = {
  display: "inline-flex",
  maxWidth: 190,
  textDecoration: "none"
} as const;

const titleStyle = {
  margin: 0,
  fontSize: 42,
  lineHeight: 1.1
} as const;

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 20
} as const;

const cardStyle = {
  display: "grid",
  gap: 12,
  border: "1px solid #d6dee9",
  borderRadius: 8,
  padding: 16
} as const;

const imageStyle = {
  width: "100%",
  aspectRatio: "4 / 3",
  objectFit: "cover",
  borderRadius: 6
} as const;

const imagePlaceholderStyle = {
  display: "grid",
  width: "100%",
  aspectRatio: "4 / 3",
  placeItems: "center",
  borderRadius: 6,
  background: "#f3f6fa",
  color: "#667085"
} as const;

const cardTitleStyle = {
  margin: 0,
  fontSize: 22
} as const;

const mutedStyle = {
  margin: 0,
  color: "#667085",
  lineHeight: 1.55
} as const;

const priceStyle = {
  margin: 0,
  fontWeight: 800
} as const;

const buttonStyle = {
  justifySelf: "start",
  borderRadius: 6,
  background: "#2563eb",
  padding: "10px 14px",
  color: "#ffffff",
  fontWeight: 700,
  textDecoration: "none"
} as const;

const stateStyle = {
  display: "grid",
  minHeight: "100vh",
  placeItems: "center",
  padding: 32,
  color: "#152033",
  textAlign: "center"
} as const;
