import * as React from "react";

export function ProductMockup({ variant }: { variant: "dashboard" | "builder" | "store" }) {
  const isStore = variant === "store";
  const isBuilder = variant === "builder";

  if (isBuilder) {
    return (
      <div className="builder-hero-mockup" aria-label="Редактор сайта Mercurio">
        <div className="mockup-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="builder-mockup-body">
          <nav className="builder-mockup-nav" aria-label="Разделы редактора">
            <span className="active">Страницы</span>
            <span>Блоки</span>
            <span>Дизайн</span>
            <span>Публикация</span>
          </nav>
          <div className="builder-mockup-content">
            <div className="builder-metrics">
              <article>
                <span>Страницы</span>
                <strong>12</strong>
              </article>
              <article>
                <span>Блоки</span>
                <strong>48</strong>
              </article>
              <article>
                <span>Версии</span>
                <strong>7</strong>
              </article>
            </div>
            <div className="builder-graph" aria-label="График роста">
              <span className="g1" />
              <span className="g2" />
              <span className="g3" />
              <span className="g4" />
              <span className="g5" />
              <span className="g6" />
              <span className="g7" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mockup-frame" aria-label="Интерфейс Mercurio">
      <div className="mockup-topbar">
        <span />
        <span />
        <span />
        <strong>{isStore ? "Store" : isBuilder ? "Builder" : "Dashboard"}</strong>
      </div>
      <div className="mockup-body">
        <aside className="mockup-sidebar">
          <span className="active" />
          <span />
          <span />
          <span />
        </aside>
        <div className="mockup-main">
          <div className="mockup-panel large">
            <div className="mockup-line wide" />
            <div className="mockup-line" />
            <div className="mockup-actions">
              <span />
              <span />
            </div>
          </div>
          <div className="mockup-grid">
            <div className="mockup-panel">
              <strong>{isStore ? "128" : "12"}</strong>
              <span>{isStore ? "orders" : "pages"}</span>
            </div>
            <div className="mockup-panel">
              <strong>{isStore ? "4.8" : "31%"}</strong>
              <span>{isStore ? "rating" : "conversion"}</span>
            </div>
          </div>
          <div className="mockup-flow" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    </div>
  );
}
