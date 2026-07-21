import * as React from "react";
import Link from "next/link";

export function CTA({
  title,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref
}: {
  title: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
}) {
  return (
    <section className="cta-banner">
      <div>
        <p className="eyebrow">Mercurio</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
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
