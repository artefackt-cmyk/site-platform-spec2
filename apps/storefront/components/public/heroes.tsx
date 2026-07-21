import * as React from "react";
import Link from "next/link";
import type { Product } from "../../content/public/products";
import { ProductMockup } from "./ui-mockups";

type HeroContent = {
  eyebrow: string;
  title: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
};

export function HomeHero({ content }: { content: HeroContent }) {
  return (
    <section className="hero-section">
      <div className="hero-copy">
        <p className="eyebrow">{content.eyebrow}</p>
        <h1>{content.title}</h1>
        <p>{content.description}</p>
        <div className="hero-actions">
          <Link className="button button-primary" href={content.primaryHref}>
            {content.primaryLabel}
          </Link>
          <Link className="button button-secondary" href={content.secondaryHref}>
            {content.secondaryLabel}
          </Link>
        </div>
      </div>
      <ProductMockup variant="dashboard" />
    </section>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref
}: {
  eyebrow: string;
  title: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
}) {
  return (
    <section className="page-hero">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{description}</p>
      <div className="hero-actions">
        <Link className="button button-primary" href={primaryHref}>
          {primaryLabel}
        </Link>
        <Link className="button button-secondary" href={secondaryHref}>
          {secondaryLabel}
        </Link>
      </div>
    </section>
  );
}

export function ProductHero({
  product,
  primaryHref,
  secondaryLabel,
  secondaryHref
}: {
  product: Product;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
}) {
  const isWebsiteBuilder = product.slug === "website-builder";
  const eyebrow = isWebsiteBuilder ? "КОНСТРУКТОР САЙТОВ" : product.eyebrow;
  const title = isWebsiteBuilder
    ? "Создавайте сайт и сразу видьте его на Desktop и Mobile"
    : product.name;
  const description = isWebsiteBuilder
    ? "Визуальный редактор Mercurio объединяет блоки, дизайн-систему, контент и публикацию в одном рабочем окне — без постоянного переключения между режимами."
    : product.description;

  return (
    <section className={isWebsiteBuilder ? "product-hero product-hero-website-builder" : "product-hero"}>
      <div className="hero-copy">
        <p className="eyebrow">{eyebrow}</p>
        {!isWebsiteBuilder && <div className="status-pill">{product.badge}</div>}
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="hero-actions">
          <Link className="button button-primary" href={primaryHref}>
            {product.primaryCtaLabel}
          </Link>
          <Link className="button button-secondary" href={secondaryHref}>
            {secondaryLabel}
          </Link>
        </div>
      </div>
      <ProductMockup variant={product.slug === "online-store" ? "store" : "builder"} />
    </section>
  );
}
