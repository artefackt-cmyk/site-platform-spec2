import type { Metadata } from "next";
import { loadPublicConfig } from "@site-platform/config";
import { validatePageDocument } from "@site-platform/editor-core";
import { PageRenderer } from "@site-platform/renderer";
import { MercurioLogo } from "@site-platform/ui";
import { CartBadge } from "../../../cart-client";
import {
  fetchPublicSitePage,
  type PublicSitePageResponse
} from "../../../public-site-client";

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
      <GlobalHeader
        page={response.page}
        publicHandle={publicHandle}
        siteBasePath={siteBasePath}
      />
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
      <GlobalFooter page={response.page} />
    </div>
  );
}

function GlobalHeader({
  page,
  publicHandle,
  siteBasePath
}: {
  readonly page: PublicSitePageResponse;
  readonly publicHandle: string;
  readonly siteBasePath: string;
}) {
  if (!page.siteSettings.headerEnabled) {
    return null;
  }

  const configuredNavigation = page.siteSettings.header.navigation.flatMap((item) => {
    if (item.type === "external" && item.url !== undefined) {
      return [
        {
          label: item.label,
          href: item.url,
          active: false
        }
      ];
    }

    const matchingPage = page.navigation.find((navigationItem) =>
      item.pageId === undefined ? false : navigationItem.pageId === item.pageId
    );

    return matchingPage === undefined
      ? []
      : [
          {
            label: item.label,
            href: `${siteBasePath}/${matchingPage.slug}`,
            active: matchingPage.slug === page.pageSlug
          }
        ];
  });
  const fallbackNavigation = page.navigation.map((item) => ({
    label: item.title,
    href: `${siteBasePath}/${item.slug}`,
    active: item.slug === page.pageSlug
  }));
  const navigation =
    configuredNavigation.length > 0 ? configuredNavigation : fallbackNavigation;

  return (
    <header style={headerStyle}>
      <a
        href={siteBasePath}
        style={brandStyle}
        aria-label={page.siteSettings.header.brandText || page.projectName}
      >
        {page.siteSettings.header.logoUrl === "" &&
        page.siteSettings.header.brandText === "" ? (
          <MercurioLogo variant="compact" title={page.projectName} />
        ) : page.siteSettings.header.logoUrl === "" ? (
          <span style={brandTextStyle}>
            {page.siteSettings.header.brandText || page.projectName}
          </span>
        ) : (
          <img
            src={page.siteSettings.header.logoUrl}
            alt={page.siteSettings.header.brandText || page.projectName}
            style={brandImageStyle}
          />
        )}
      </a>
      <nav style={navStyle} aria-label="Навигация сайта">
        {navigation.map((item) => (
          <a
            key={`${item.href}-${item.label}`}
            href={item.href}
            style={item.active ? activeNavLinkStyle : navLinkStyle}
          >
            {item.label}
          </a>
        ))}
        <a href={`${siteBasePath}/products`} style={navLinkStyle}>
          Каталог
        </a>
      </nav>
      <div style={headerActionsStyle}>
        {page.siteSettings.header.ctaLabel !== "" &&
        page.siteSettings.header.ctaUrl !== "" ? (
          <a href={page.siteSettings.header.ctaUrl} style={ctaLinkStyle}>
            {page.siteSettings.header.ctaLabel}
          </a>
        ) : null}
        {page.siteSettings.header.cartLinkEnabled ? (
          <CartBadge publicHandle={publicHandle} />
        ) : null}
      </div>
    </header>
  );
}

function GlobalFooter({ page }: { readonly page: PublicSitePageResponse }) {
  if (!page.siteSettings.footerEnabled) {
    return null;
  }

  return (
    <footer style={footerStyle}>
      <div>
        <strong>{page.siteSettings.footer.brandText || page.projectName}</strong>
        {page.siteSettings.footer.description === "" ? null : (
          <p>{page.siteSettings.footer.description}</p>
        )}
      </div>
      <address style={footerAddressStyle}>
        {page.siteSettings.footer.email === "" ? null : (
          <a href={`mailto:${page.siteSettings.footer.email}`}>
            {page.siteSettings.footer.email}
          </a>
        )}
        {page.siteSettings.footer.phone === "" ? null : (
          <a href={`tel:${page.siteSettings.footer.phone}`}>
            {page.siteSettings.footer.phone}
          </a>
        )}
      </address>
      {page.siteSettings.footer.legalText === "" ? null : (
        <p>{page.siteSettings.footer.legalText}</p>
      )}
      {page.siteSettings.footer.copyrightText === "" ? null : (
        <small>{page.siteSettings.footer.copyrightText}</small>
      )}
    </footer>
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

const brandTextStyle = {
  color: "#152033",
  fontSize: 20,
  fontWeight: 850
} as const;

const brandImageStyle = {
  maxWidth: 190,
  maxHeight: 48,
  objectFit: "contain"
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

const headerActionsStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  alignItems: "center"
} as const;

const ctaLinkStyle = {
  borderRadius: 6,
  background: "#203146",
  padding: "10px 14px",
  color: "#ffffff",
  fontWeight: 800,
  textDecoration: "none"
} as const;

const footerStyle = {
  display: "grid",
  gap: 12,
  borderTop: "1px solid #e5e7eb",
  padding: "24px 32px",
  color: "#667085"
} as const;

const footerAddressStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  fontStyle: "normal"
} as const;

const stateStyle = {
  display: "grid",
  minHeight: "100vh",
  placeItems: "center",
  padding: 32,
  color: "#152033",
  textAlign: "center"
} as const;
