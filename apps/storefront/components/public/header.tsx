"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { type KeyboardEvent as ReactKeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { primaryNavigation } from "../../content/public/navigation";
import { buildDashboardUrl } from "./public-theme";

const megaGroups = [
  {
    title: "Создание",
    icon: "structure",
    links: [
      { label: "Конструктор сайтов", href: "/website-builder" },
      { label: "Шаблоны", href: "/templates" },
      { label: "Контент и SEO", href: "/resources" }
    ]
  },
  {
    title: "Продажи",
    icon: "cart",
    links: [
      { label: "Интернет-магазин", href: "/online-store" },
      { label: "Заказы и оплата", href: "/products/orders-payments" },
      { label: "Клиенты и лояльность", href: "/products/customers-loyalty" },
      { label: "Продажи и коммуникации", href: "/products/sales-communications" },
      { label: "Боты", href: "/products/bots" }
    ]
  },
  {
    title: "Рост",
    icon: "learning",
    links: [
      { label: "Маркетинг", href: "/products/marketing" },
      { label: "Реклама", href: "/products/advertising" },
      { label: "Социальные сети", href: "/products/social-media" },
      { label: "Автоматические воронки", href: "/products/automatic-funnels" },
      { label: "Аналитика", href: "/products/analytics" }
    ]
  },
  {
    title: "Управление",
    icon: "settings",
    links: [
      { label: "Команда и роли", href: "/products/team-roles" },
      { label: "Интеграции", href: "/products/integrations" }
    ]
  }
];

const desktopNavigation = [
  { label: "Продукты", href: "/products", isProducts: true },
  { label: "Решения", href: "/solutions" },
  { label: "Тарифы", href: "/pricing" },
  { label: "Переход на Mercurio", href: "/migration" },
  { label: "Ресурсы", href: "/resources" }
];

export function Header({ dashboardUrl }: { readonly dashboardUrl: string }) {
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const megaId = useId();
  const mobileId = useId();
  const headerRef = useRef<HTMLElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileButtonRef = useRef<HTMLButtonElement>(null);
  const mobileWasOpenRef = useRef(false);
  const loginUrl = buildDashboardUrl(dashboardUrl, "/login");
  const registerUrl = buildDashboardUrl(dashboardUrl, "/register");

  function handleProductsKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setMegaOpen((value) => !value);
    }
  }

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      document.documentElement.dataset.publicInputMode = "pointer";
      if (!headerRef.current?.contains(event.target as Node)) {
        setMegaOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      document.documentElement.dataset.publicInputMode = "keyboard";
      if (event.key === "Escape") {
        const productsButton = headerRef.current?.querySelector<HTMLButtonElement>(".nav-button");
        const megaWasOpen = productsButton?.getAttribute("aria-expanded") === "true";
        setMegaOpen(false);
        setMobileOpen(false);
        if (megaWasOpen) {
          productsButton?.focus();
        } else {
          mobileButtonRef.current?.focus();
        }
      }

      if (event.key === "Tab" && mobileOpen) {
        const focusableElements = mobileMenuRef.current?.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled])"
        );
        const focusable = Array.from(focusableElements ?? []).filter((element) => {
          const rect = element.getBoundingClientRect();
          const styles = window.getComputedStyle(element);
          return !element.hidden && rect.width > 0 && rect.height > 0 && styles.display !== "none";
        });

        if (focusable.length === 0) {
          event.preventDefault();
          mobileButtonRef.current?.focus();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (first === undefined || last === undefined) {
          event.preventDefault();
          mobileButtonRef.current?.focus();
          return;
        }

        const activeElement = document.activeElement;

        if (event.shiftKey && activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen]);

  useEffect(() => {
    const root = headerRef.current?.closest(".public-site");
    const previousBodyOverflow = document.body.style.overflow;

    root?.classList.toggle("public-menu-open", mobileOpen);
    if (mobileOpen) {
      const firstLink = document.querySelector<HTMLAnchorElement>("[data-mobile-first]");
      document.body.style.overflow = "hidden";
      window.requestAnimationFrame(() => firstLink?.focus());
    } else if (mobileWasOpenRef.current) {
      document.body.style.overflow = previousBodyOverflow;
      window.requestAnimationFrame(() => mobileButtonRef.current?.focus());
    }

    mobileWasOpenRef.current = mobileOpen;

    return () => {
      root?.classList.remove("public-menu-open");
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [mobileOpen]);

  return (
    <header className="site-header" ref={headerRef}>
      <Link className="brand" href="/" aria-label="Mercurio на главную">
        <Image className="brand-logo brand-logo-light" src="/brand-light.svg" alt="" width={150} height={51} priority />
        <Image className="brand-logo brand-logo-dark" src="/brand-dark.svg" alt="" width={150} height={51} priority />
      </Link>

      <nav className="desktop-nav" aria-label="Основная навигация">
        {desktopNavigation.map((item) =>
          item.isProducts ? (
            <button
              className="nav-link nav-button"
              type="button"
              aria-expanded={megaOpen}
              aria-controls={megaId}
              onClick={() => setMegaOpen((value) => !value)}
              onKeyDown={handleProductsKeyDown}
              key={item.href}
            >
              {item.label}
            </button>
          ) : (
            <Link
              className="nav-link"
              href={toFirstStageHref(item.href, { registerUrl })}
              key={item.href}
            >
              {item.label}
            </Link>
          )
        )}
      </nav>

      <div className="header-actions">
        <Link className="login-link" href={loginUrl}>
          Войти
        </Link>
        <Link className="button button-primary button-small" href={registerUrl}>
          Начать работу
        </Link>
        <button
          ref={mobileButtonRef}
          className="icon-button mobile-trigger"
          type="button"
          aria-label={mobileOpen ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={mobileOpen}
          aria-controls={mobileId}
          onClick={() => setMobileOpen((value) => !value)}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
      </div>

      <div className="mega-menu" id={megaId} hidden={!megaOpen}>
        <div className="mega-groups">
          {megaGroups.map((group) => (
            <section className="mega-group" key={group.title} aria-label={group.title}>
              <h2>
                <span className={`mega-icon mega-icon-${group.icon}`} aria-hidden="true" />
                {group.title}
              </h2>
              <div className="mega-links">
                {group.links.map((link) => (
                  <Link
                    href={toFirstStageHref(link.href, { registerUrl })}
                    key={link.href}
                    onClick={() => setMegaOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
        <div className="mega-footer">
          <Link className="mega-footer-card mega-all-products" href="/website-builder" onClick={() => setMegaOpen(false)}>
            <strong>Конструктор сайтов Mercurio →</strong>
            <span>Контрольная страница первого этапа интеграции.</span>
          </Link>
          <Link className="mega-footer-card mega-migration" href="/migration" onClick={() => setMegaOpen(false)}>
            <strong>Уже используете другую систему?</strong>
            <span>Перенесём сайт, товары, клиентов и заказы без остановки бизнеса. Как проходит переход →</span>
          </Link>
        </div>
      </div>

      <button
        className="mobile-backdrop"
        type="button"
        aria-label="Закрыть меню"
        hidden={!mobileOpen}
        onClick={() => setMobileOpen(false)}
      />

      <div className="mobile-menu" id={mobileId} hidden={!mobileOpen} ref={mobileMenuRef}>
        <nav aria-label="Мобильная навигация">
          <Link href="/products" data-mobile-first onClick={() => setMobileOpen(false)}>
            Все продукты
          </Link>
          <button
            type="button"
            aria-expanded={mobileProductsOpen}
            aria-controls={`${mobileId}-products`}
            onClick={() => setMobileProductsOpen((value) => !value)}
          >
            Продукты
            <span aria-hidden="true">{mobileProductsOpen ? "−" : "+"}</span>
          </button>
          <div id={`${mobileId}-products`} hidden={!mobileProductsOpen} className="mobile-subnav">
            {megaGroups.flatMap((group) => group.links).map((product) => (
              <Link
                href={toFirstStageHref(product.href, { registerUrl })}
                key={product.href}
                onClick={() => setMobileOpen(false)}
              >
                {product.label}
              </Link>
            ))}
          </div>
          {primaryNavigation.slice(1).map((item) => (
            <Link
              href={toFirstStageHref(item.href, { registerUrl })}
              key={item.href}
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link href={loginUrl} onClick={() => setMobileOpen(false)}>
            Войти
          </Link>
          <Link className="button button-primary" href={registerUrl} onClick={() => setMobileOpen(false)}>
            Начать работу
          </Link>
        </nav>
      </div>
    </header>
  );
}

function toFirstStageHref(
  href: string,
  urls: { readonly registerUrl: string }
): string {
  const publicRoutes = new Set([
    "/",
    "/products",
    "/website-builder",
    "/online-store",
    "/pricing",
    "/migration",
    "/privacy",
    "/terms"
  ]);

  if (publicRoutes.has(href) || href.startsWith("/products/")) {
    return href;
  }

  return urls.registerUrl;
}
