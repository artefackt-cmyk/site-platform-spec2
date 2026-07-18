import * as React from "react";
import type { Metadata } from "next";
import { loadPublicConfig } from "@site-platform/config";
import { PageHero } from "../../../components/public/heroes";
import { createPublicMetadata } from "../../../components/public/metadata";
import { buildDashboardUrl } from "../../../components/public/public-theme";
import { PublicShell } from "../../../components/public/shell";
import { privacyPage } from "../../../content/public/system-pages";

export function generateMetadata(): Metadata {
  return createPublicMetadata({
    title: privacyPage.title,
    description: privacyPage.description,
    canonical: privacyPage.canonical,
    noindex: true
  });
}

export default function PrivacyPage() {
  const config = loadPublicConfig();
  const registerUrl = buildDashboardUrl(config.dashboardUrl, "/register");

  return (
    <PublicShell dashboardUrl={config.dashboardUrl}>
      <PageHero
        eyebrow="Документы"
        title={privacyPage.title}
        description={privacyPage.description}
        primaryLabel="Начать работу"
        primaryHref={registerUrl}
        secondaryLabel="Условия использования"
        secondaryHref="/terms"
      />
      <section className="section legal-section" aria-labelledby="privacy-sections-title">
        <div className="section-header">
          <p className="eyebrow">Черновик</p>
          <h2 id="privacy-sections-title">Структура будущего документа</h2>
          <p>Финальная редакция должна быть подготовлена и проверена юристом перед публичной публикацией.</p>
        </div>
        <div className="legal-document">
          {privacyPage.sections.map((section) => (
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
