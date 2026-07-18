import * as React from "react";
import type { PublicCard } from "../../content/public/products";

export function DesktopMobileSection() {
  return (
    <section className="desktop-mobile-section" aria-labelledby="desktop-mobile-title">
      <div className="wide-section-header">
        <p className="eyebrow">ОДНО РАБОЧЕЕ ОКНО</p>
        <h2 id="desktop-mobile-title">Desktop и Mobile одновременно</h2>
        <p>
          Редактируйте одну страницу и сразу проверяйте, как она выглядит на большом и маленьком
          экране. Общие изменения применяются сразу, а точечные настройки остаются под контролем.
        </p>
      </div>
      <div className="editor-both-mockup" aria-label="Редактор Mercurio с Desktop и Mobile preview">
        <div className="editor-topbar">
          <strong>M&nbsp; MERCURIO</strong>
          <span>Главная страница</span>
          <div className="editor-spacer" />
          <button type="button">Предпросмотр</button>
          <button type="button" className="active">Опубликовать</button>
          <span aria-hidden="true">◐</span>
          <span aria-hidden="true" className="editor-user" />
        </div>
        <aside className="editor-rail" aria-label="Панель редактора">
          {["Структура", "Добавить", "Страницы", "Медиа", "Тема"].map((item, index) => (
            <span className={index === 0 ? "active" : undefined} key={item}>
              <i aria-hidden="true" />
              {item}
            </span>
          ))}
        </aside>
        <div className="editor-context">
          <div>
            <strong>Обложка · Hero Editorial</strong>
            <span>Выбранный блок</span>
          </div>
          {["Контент", "Компоновка", "Стиль"].map((item, index) => (
            <button type="button" className={index === 0 ? "active" : undefined} key={item}>
              {item}
            </button>
          ))}
          <div className="editor-spacer" />
          {["Дублировать", "Скрыть", "Все настройки"].map((item) => (
            <button type="button" key={item}>
              {item}
            </button>
          ))}
        </div>
        <div className="editor-canvas">
          <div className="editor-view-controls">
            <div>
              <button type="button" className="active">Оба</button>
              <button type="button">Desktop</button>
              <button type="button">Mobile</button>
            </div>
            <div>
              <button type="button">Общее</button>
              <button type="button">Desktop</button>
              <button type="button" className="active">Mobile</button>
            </div>
            <span>Скролл связан</span>
          </div>
          <div className="desktop-preview">
            <div className="preview-site-header">
              <strong>ATELIER</strong>
              <span>Каталог&nbsp;&nbsp;&nbsp;О бренде&nbsp;&nbsp;&nbsp;Доставка</span>
            </div>
            <div className="preview-hero">
              <span>НОВАЯ КОЛЛЕКЦИЯ</span>
              <strong>Форма, материал и спокойный ритм.</strong>
              <p>Локальный бренд предметов для дома и повседневной жизни.</p>
              <button type="button">Смотреть каталог</button>
            </div>
          </div>
          <div className="mobile-preview">
            <div className="preview-site-header">
              <strong>ATELIER</strong>
            </div>
            <div className="preview-hero">
              <span>НОВАЯ КОЛЛЕКЦИЯ</span>
              <strong>Форма, материал и спокойный ритм.</strong>
              <p>Локальный бренд предметов для дома и повседневной жизни.</p>
              <button type="button">Смотреть каталог</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FeatureGrid({
  eyebrow,
  title,
  description,
  items
}: {
  eyebrow: string;
  title: string;
  description: string;
  items: PublicCard[];
}) {
  return (
    <section className="section" id="features">
      <div className="section-header">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className="card-grid">
        {items.map((item) => (
          <article className="feature-card" key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ScenarioGrid({
  eyebrow,
  title,
  items
}: {
  eyebrow: string;
  title: string;
  items: PublicCard[];
}) {
  return (
    <section className="section section-inverted">
      <div className="section-header">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      <div className="card-grid">
        {items.map((item) => (
          <article className="scenario-card" key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function MetricsStrip({
  items
}: {
  items: {
    value: string;
    label: string;
  }[];
}) {
  return (
    <section className="metrics-strip" aria-label="Ключевые показатели Mercurio">
      {items.map((item) => (
        <article className="metric-card" key={item.label}>
          <strong>{item.value}</strong>
          <span>{item.label}</span>
        </article>
      ))}
    </section>
  );
}

export function ProcessSteps({ steps }: { steps: string[] }) {
  return (
    <section className="section">
      <div className="section-header">
        <p className="eyebrow">Процесс</p>
        <h2>Как это запускается</h2>
      </div>
      <ol className="process-list">
        {steps.map((step, index) => (
          <li key={step}>
            <span>{index + 1}</span>
            {step}
          </li>
        ))}
      </ol>
    </section>
  );
}
