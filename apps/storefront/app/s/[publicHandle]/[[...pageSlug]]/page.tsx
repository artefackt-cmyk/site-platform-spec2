import type { Metadata } from "next";
import { loadPublicConfig } from "@site-platform/config";
import { validatePageDocument } from "@site-platform/editor-core";
import { PageRenderer } from "@site-platform/renderer";
import { MercurioLogo } from "@site-platform/ui";
import { fetchPublicSitePage } from "../../../public-site-client";

type StorefrontPageProps = {
  readonly params: Promise<{
    readonly publicHandle: string;
    readonly pageSlug?: readonly string[];
  }>;
};

export async function generateMetadata({
  params
}: StorefrontPageProps): Promise<Metadata> {
  const { publicHandle, pageSlug } = await params;
  const config = loadPublicConfig();
  const response = await fetchPublicSitePage({
    apiUrl: config.apiUrl,
    publicHandle,
    ...(pageSlug?.[0] === undefined ? {} : { pageSlug: pageSlug[0] })
  });

  if (!response.ok) {
    return {
      title: "Страница не найдена",
      robots: {
        index: false,
        follow: false
      }
    };
  }

  const description = extractDescription(response.page.document, response.page.pageTitle);

  return {
    title: response.page.pageTitle,
    description,
    alternates: {
      canonical: `${config.storefrontUrl.replace(/\/$/, "")}${
        response.page.canonicalPath
      }`
    },
    openGraph: {
      title: response.page.pageTitle,
      description
    }
  };
}

export default async function Page({ params }: StorefrontPageProps) {
  const { publicHandle, pageSlug } = await params;
  const config = loadPublicConfig();
  const response = await fetchPublicSitePage({
    apiUrl: config.apiUrl,
    publicHandle,
    ...(pageSlug?.[0] === undefined ? {} : { pageSlug: pageSlug[0] })
  });

  if (!response.ok) {
    return (
      <main style={stateStyle}>
        <h1>{response.status === 404 ? "Страница не найдена" : "Сайт недоступен"}</h1>
        <p>{response.message}</p>
      </main>
    );
  }

  const validation = validatePageDocument(response.page.document);

  if (!validation.ok) {
    return (
      <main style={stateStyle}>
        <h1>Опубликованная версия повреждена</h1>
        <p>Откройте dashboard и опубликуйте страницу заново.</p>
      </main>
    );
  }

  const siteBasePath = `/s/${encodeURIComponent(publicHandle)}`;

  return (
    <div style={shellStyle}>
      <header style={headerStyle}>
        <a
          href={siteBasePath}
          style={brandStyle}
          aria-label={`${response.page.projectName} на Mercurio`}
        >
          <MercurioLogo variant="compact" title={response.page.projectName} />
        </a>
        <nav style={navStyle} aria-label="Навигация сайта">
          {response.page.navigation.map((item) => (
            <a
              key={item.slug}
              href={`${siteBasePath}/${item.slug}`}
              style={
                item.slug === response.page.pageSlug ? activeNavLinkStyle : navLinkStyle
              }
            >
              {item.title}
            </a>
          ))}
        </nav>
      </header>
      <main>
        <PageRenderer
          document={validation.document}
          mode="storefront"
          context={{
            siteBasePath,
            products: response.page.products,
            productList: response.page.productList
          }}
        />
      </main>
      <footer style={footerStyle}>{response.page.projectName}</footer>
    </div>
  );
}

function extractDescription(document: unknown, fallback: string): string {
  const validation = validatePageDocument(document);

  if (!validation.ok) {
    return fallback;
  }

  for (const section of validation.document.root.children) {
    for (const child of section.children) {
      if (child.type === "text" && child.props.text.trim() !== "") {
        return child.props.text.trim().slice(0, 160);
      }

      if (child.type === "column") {
        const text = child.children.find(
          (block) => block.type === "text" && block.props.text.trim() !== ""
        );

        if (text?.type === "text") {
          return text.props.text.trim().slice(0, 160);
        }
      }
    }
  }

  return fallback;
}

const shellStyle = {
  minHeight: "100vh",
  background: "#ffffff"
} as const;

const headerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: 24,
  borderBottom: "1px solid #e5e7eb",
  padding: "18px 32px"
} as const;

const brandStyle = {
  display: "inline-flex",
  maxWidth: 190,
  textDecoration: "none"
} as const;

const navStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: 12
} as const;

const navLinkStyle = {
  color: "#475467",
  fontWeight: 700,
  textDecoration: "none"
} as const;

const activeNavLinkStyle = {
  ...navLinkStyle,
  color: "#1d4ed8"
} as const;

const footerStyle = {
  borderTop: "1px solid #e5e7eb",
  padding: "24px 32px",
  color: "#667085"
} as const;

const stateStyle = {
  display: "grid",
  minHeight: "100vh",
  placeItems: "center",
  padding: 32,
  color: "#152033",
  textAlign: "center"
} as const;
