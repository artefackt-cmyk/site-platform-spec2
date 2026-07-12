"use client";

import * as React from "react";
import { useState } from "react";
import type { MarketingNavItem } from "./landing-content";

export function LandingMobileNav({
  navItems,
  dashboardUrl
}: {
  readonly navItems: readonly MarketingNavItem[];
  readonly dashboardUrl: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="landing-mobile-nav">
      <button
        type="button"
        className="landing-menu-button"
        aria-controls="landing-mobile-menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="landing-menu-icon" aria-hidden="true" />
        <span className="visually-hidden">Открыть меню</span>
      </button>
      <nav
        id="landing-mobile-menu"
        className={open ? "landing-mobile-panel is-open" : "landing-mobile-panel"}
        aria-label="Мобильная навигация"
      >
        {navItems.map((item) => (
          <a key={item.href} href={item.href} onClick={() => setOpen(false)}>
            {item.label}
          </a>
        ))}
        <a href={dashboardUrl} onClick={() => setOpen(false)}>
          Войти
        </a>
        <a
          className="landing-mobile-primary"
          href={dashboardUrl}
          onClick={() => setOpen(false)}
        >
          Создать проект
        </a>
      </nav>
    </div>
  );
}
