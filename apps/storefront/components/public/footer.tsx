import * as React from "react";
import Link from "next/link";
import { footerGroups } from "../../content/public/navigation";
import { buildDashboardUrl } from "./public-theme";

export function Footer({ dashboardUrl }: { readonly dashboardUrl: string }) {
  const loginUrl = buildDashboardUrl(dashboardUrl, "/login");
  const registerUrl = buildDashboardUrl(dashboardUrl, "/register");

  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <Link className="brand" href="/" aria-label="Mercurio на главную">
          <span className="brand-mark" aria-hidden="true">M</span>
          <span className="brand-word">Mercurio</span>
        </Link>
        <p>Публичная система для сайтов, магазинов, продаж и коммуникаций.</p>
      </div>
      <nav className="footer-nav" aria-label="Навигация в подвале">
        {footerGroups.map((group) => (
          <div key={group.title}>
            <h2>{group.title}</h2>
            {group.links.map((link) => (
              <Link
                href={toFirstStageHref(link.href, { loginUrl, registerUrl })}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <p className="footer-note">© 2026 Mercurio.</p>
    </footer>
  );
}

function toFirstStageHref(
  href: string,
  urls: { readonly loginUrl: string; readonly registerUrl: string }
): string {
  if (href === "/login") {
    return urls.loginUrl;
  }

  if (href === "/start" || href === "/register") {
    return urls.registerUrl;
  }

  const publicRoutes = new Set(["/", "/products", "/pricing", "/migration", "/privacy", "/terms"]);

  if (publicRoutes.has(href) || href.startsWith("/products/")) {
    return href;
  }

  return urls.registerUrl;
}
