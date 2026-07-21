import * as React from "react";
import type { Metadata } from "next";
import { loadPublicConfig } from "@site-platform/config";
import { PageHero } from "../../../components/public/heroes";
import { createPublicMetadata } from "../../../components/public/metadata";
import { buildDashboardUrl } from "../../../components/public/public-theme";
import { PublicShell } from "../../../components/public/shell";
import { termsPage } from "../../../content/public/system-pages";

export function generateMetadata(): Metadata {
  return createPublicMetadata({
    title: termsPage.title,
    description: termsPage.description,
    canonical: termsPage.canonical,
    noindex: true
  });
}

export default function TermsPage() {
  const config = loadPublicConfig();
  const registerUrl = buildDashboardUrl(config.dashboardUrl, "/register");

  return (
    <PublicShell dashboardUrl={config.dashboardUrl}>
      <PageHero
        eyebrow="Документы"
        title={termsPage.title}
        description={termsPage.description}
        primaryLabel="Начать работу"
        primaryHref={registerUrl}
        secondaryLabel="Политика конфиденциальности"
        secondaryHref="/privacy"
      />
      <section className="section legal-section" aria-labelledby="terms-sections-title">
        <div className="section-header">
          <p className="eyebrow">Черновик</p>
          <h2 id="terms-sections-title">Структура будущего документа</h2>
          <p>Финальная редакция должна быть подготовлена и проверена юристом перед публичной публикацией.</p>
        </div>
        <div className="legal-document">
          {termsPage.sections.map((section) => (
            <article className="legal-card" key={section.title}>
              <h3>{section.title}</h3>
              <p>{section.description}</p>
            </article>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}
