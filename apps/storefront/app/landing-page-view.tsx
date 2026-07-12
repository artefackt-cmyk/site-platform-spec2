import * as React from "react";
import { MercurioLogo } from "@site-platform/ui";
import {
  analyticsDirections,
  audienceCards,
  businessChangeScenarios,
  capabilityGroups,
  growthStages,
  infrastructureSteps,
  integrations,
  marketingNavItems,
  mercurioReasons,
  productLandingBullets,
  storeBullets,
  templateDifferenceCards
} from "./landing-content";
import { LandingMobileNav } from "./landing-mobile-nav";

export function LandingPageView({
  dashboardUrl
}: {
  readonly dashboardUrl: string;
}) {
  const loginUrl = buildDashboardUrl(dashboardUrl, "/login");
  const registerUrl = buildDashboardUrl(dashboardUrl, "/register");

  return (
    <main className="landing-page">
      <a className="skip-link" href="#main-content">
        Перейти к содержанию
      </a>
      <header className="landing-header landing-header-compact">
        <a className="landing-brand" href="/" aria-label="Mercurio">
          <MercurioLogo className="landing-brand-wide" variant="wordmark" />
          <MercurioLogo
            className="landing-brand-compact"
            variant="icon"
            size={42}
          />
        </a>
        <nav className="landing-desktop-nav" aria-label="Навигация Mercurio">
          {marketingNavItems.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="landing-header-actions">
          <a className="landing-link-button" href={loginUrl}>
            Войти
          </a>
          <a className="landing-primary-button" href={registerUrl}>
            Создать проект
          </a>
        </div>
        <LandingMobileNav
          navItems={marketingNavItems}
          dashboardUrl={dashboardUrl}
        />
      </header>

      <section id="main-content" className="landing-hero" aria-labelledby="hero-title">
        <div className="landing-hero-copy">
          <p className="landing-eyebrow">Mercurio для цифровой торговли</p>
          <h1 id="hero-title" className="landing-hero-title">
            <span>Запустите сайт, магазин</span>
            <span>или маркетплейс</span>
            <span className="landing-hero-title-accent">без дизайнера и программиста</span>
          </h1>
          <p className="landing-hero-lead">
            Mercurio помогает собрать не просто красивый сайт, а работающую
            инфраструктуру вокруг торговли: страницы, товары, склад, кассу,
            бонусные программы, рассылки и аналитику — в одной гибкой системе.
          </p>
          <p className="landing-hero-line">
            Запусти сайт. Подключи склад и кассу. Развивай продажи без
            технической команды.
          </p>
          <div className="landing-hero-actions">
            <a className="landing-primary-button" href={registerUrl}>
              Создать проект
            </a>
            <a className="landing-secondary-button" href="#features">
              Посмотреть возможности
            </a>
          </div>
          <ul className="landing-proof-list" aria-label="Короткие преимущества">
            <li>Без кода</li>
            <li>Без жёстких шаблонов</li>
            <li>Без зависимости от разработчиков</li>
          </ul>
        </div>
        <MercurioProductMockup />
      </section>

      <section id="audiences" className="landing-section" aria-labelledby="audiences-title">
        <SectionIntro
          eyebrow="Для кого"
          titleId="audiences-title"
          title="Платформа для тех, кто продаёт и быстро меняет формат"
          text="Mercurio закрывает путь от первой страницы до торговой системы, сохраняя управление в руках команды бизнеса."
        />
        <div className="landing-audience-layout">
          <AudienceCardView
            card={audienceCards[0]}
            className="landing-audience-card landing-audience-card-large"
          />
          <div className="landing-audience-side">
            {audienceCards.slice(1, 3).map((card) => (
              <AudienceCardView
                key={card.title}
                card={card}
                className="landing-audience-card"
              />
            ))}
          </div>
          <AudienceCardView
            card={audienceCards[3]}
            className="landing-audience-card landing-audience-marketplace"
          />
        </div>
      </section>

      <section id="features" className="landing-section landing-dark-section landing-editor-story" aria-labelledby="features-title">
        <div className="landing-story-copy">
          <SectionIntro
            eyebrow="Главное отличие"
            titleId="features-title"
            title="Не подстраивайте бизнес под шаблон"
            text="Большинство конструкторов предлагают выбрать готовый шаблон и менять контент внутри заданной структуры. Mercurio устроен иначе: вы меняете секции, колонки, блоки и визуальные настройки без обещаний абсолютного свободного позиционирования."
          />
          <div className="landing-feature-stack">
            {templateDifferenceCards.map((card) => (
              <article key={card.title}>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
          <p className="landing-note">
            Больше свободы, чем в традиционных шаблонных конструкторах.
          </p>
        </div>
        <EditorFreedomMockup />
      </section>

      <section className="landing-section landing-project-variants" aria-labelledby="change-title">
        <ProjectScenarioMockup />
        <div className="landing-story-copy">
          <SectionIntro
            eyebrow="Гибкость"
            titleId="change-title"
            title="Меняйте сайт так же быстро, как меняется ваш бизнес"
            text="Один проект может содержать главную, каталог, продуктовые страницы и отдельные лендинги под запуск, сезон, рекламу или аудиторию."
          />
          <p className="landing-large-phrase">
            Не выбирайте шаблон навсегда. Создавайте новую форму под каждую задачу.
          </p>
        </div>
      </section>

      <section className="landing-section landing-commerce landing-commerce-story" aria-labelledby="commerce-title">
        <SectionIntro
          eyebrow="Магазин и лендинги"
          titleId="commerce-title"
          title="Продавайте через каталог и рассказывайте о каждом продукте отдельно"
          text="Не ограничивайтесь стандартной карточкой товара. Создавайте отдельные страницы, которые раскрывают ценность продукта и помогают продавать убедительнее."
        />
        <CommerceStoryMockup />
      </section>

      <section className="landing-section landing-band landing-infrastructure-story" aria-labelledby="infrastructure-title">
        <SectionIntro
          eyebrow="Торговая инфраструктура"
          titleId="infrastructure-title"
          title="Mercurio скрывает техническую сложность и оставляет только понятные действия"
          text="Не нужно разбираться в серверах, API и программировании. Mercurio связывает инструменты в единую систему и переводит технические процессы на язык простых действий."
        />
        <ol className="landing-flow-timeline" aria-label="Этапы торговой инфраструктуры">
          {infrastructureSteps.map((step) => (
            <li key={step.label} data-status={step.status}>
              <span className="landing-flow-icon" aria-hidden="true">
                {step.icon}
              </span>
              <strong>{step.label}</strong>
              <span>{step.status}</span>
            </li>
          ))}
        </ol>
        <p className="landing-large-phrase">
          Подключайте новые возможности тогда, когда они становятся нужны бизнесу.
        </p>
      </section>

      <section id="integrations" className="landing-section" aria-labelledby="integrations-title">
        <SectionIntro
          eyebrow="Интеграции"
          titleId="integrations-title"
          title="Соберите собственную систему вокруг торговли"
          text="Подключайте только те инструменты, которые нужны сейчас. Меняйте и расширяйте инфраструктуру по мере роста."
        />
        <div className="landing-integration-grid">
          {integrations.map((integration) => (
            <article key={integration.title} className="landing-integration-card">
              <span className="landing-integration-icon" aria-hidden="true">
                {integration.title.slice(0, 2)}
              </span>
              <h3>{integration.title}</h3>
              <p>{integration.role}</p>
              <span className="landing-status-badge">{integration.status}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-analytics" aria-labelledby="analytics-title">
        <div className="landing-story-copy">
          <span className="landing-badge">Модуль в разработке</span>
          <h2 id="analytics-title">Видите, что происходит с сайтом и продажами</h2>
          <p>
            Mercurio будет собирать ключевые показатели в одном месте, чтобы вы
            понимали, что работает, где теряются клиенты и что стоит развивать
            дальше.
          </p>
          <p className="landing-large-phrase">
            Не просто запускайте сайт. Управляйте бизнесом на основе данных.
          </p>
        </div>
        <AnalyticsRoadmapMockup />
      </section>

      <section id="platform" className="landing-section landing-band" aria-labelledby="platform-title">
        <SectionIntro
          eyebrow="Путь развития"
          titleId="platform-title"
          title="Начните с сайта. Дорастите до собственной торговой платформы."
          text="Mercurio не заставляет выбирать сложность заранее. Вы начинаете с необходимого минимума и добавляете новые возможности по мере роста."
        />
        <div className="landing-card-grid landing-card-grid-four">
          {growthStages.map((stage) => (
            <article key={stage.title} className="landing-card">
              {stage.badge === undefined ? null : (
                <span className="landing-badge">{stage.badge}</span>
              )}
              <h3>{stage.title}</h3>
              <p>{stage.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section" aria-labelledby="why-title">
        <SectionIntro
          eyebrow="Почему Mercurio"
          titleId="why-title"
          title="Одна платформа вместо разрозненных инструментов"
          text="Свобода интерфейса соединяется с понятной системой управления страницами, товарами и публикациями."
        />
        <div className="landing-card-grid">
          {mercurioReasons.map((reason) => (
            <article key={reason.title} className="landing-card">
              <h3>{reason.title}</h3>
              <p>{reason.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-capabilities landing-mercury-panel" aria-labelledby="capabilities-title">
        <SectionIntro
          eyebrow="Текущий статус"
          titleId="capabilities-title"
          title="Что уже доступно и что развивается дальше"
          text="Mercurio честно разделяет рабочие функции, ближайшие этапы и стратегические направления, чтобы не обещать готовое раньше времени."
        />
        <div className="landing-capability-grid">
          {capabilityGroups.map((group, index) => (
            <article key={group.title} className="landing-capability-card landing-capability-layer">
              <span className="landing-layer-index">0{index + 1}</span>
              <h3>{group.title}</h3>
              <ul>
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-final-cta" aria-labelledby="final-cta-title">
        <h2 id="final-cta-title">
          Создайте инфраструктуру, которая развивается вместе с бизнесом
        </h2>
        <p>
          Запустите сайт или магазин. Добавляйте товары. Подключайте склад,
          оплату, доставку и новые сервисы тогда, когда они понадобятся.
        </p>
        <div className="landing-hero-actions">
          <a className="landing-primary-button" href={registerUrl}>
            Создать проект
          </a>
          <a className="landing-secondary-button" href={loginUrl}>
            Посмотреть платформу
          </a>
        </div>
        <p className="landing-supporting-line">
          Начните без программиста. Развивайте без пересборки с нуля.
        </p>
      </section>
    </main>
  );
}

function buildDashboardUrl(dashboardUrl: string, path: string): string {
  const url = new URL(dashboardUrl);
  url.pathname = path;
  url.search = "";
  url.hash = "";

  return url.toString();
}

function SectionIntro({
  eyebrow,
  titleId,
  title: sectionTitle,
  text
}: {
  readonly eyebrow: string;
  readonly titleId: string;
  readonly title: string;
  readonly text: string;
}) {
  return (
    <div className="landing-section-intro">
      <p className="landing-eyebrow">{eyebrow}</p>
      <h2 id={titleId}>{sectionTitle}</h2>
      <p>{text}</p>
    </div>
  );
}

function AudienceCardView({
  card,
  className
}: {
  readonly card: (typeof audienceCards)[number] | undefined;
  readonly className: string;
}) {
  if (card === undefined) {
    return null;
  }

  return (
    <article className={className}>
      {card.badge === undefined ? null : (
        <span className="landing-badge">{card.badge}</span>
      )}
      <h3>{card.title}</h3>
      <p>{card.text}</p>
    </article>
  );
}

function FeatureList({
  title: featureTitle,
  items
}: {
  readonly title: string;
  readonly items: readonly string[];
}) {
  return (
    <article className="landing-feature-list">
      <h3>{featureTitle}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}

function EditorFreedomMockup() {
  return (
    <aside className="landing-editor-mockup" aria-label="Декоративный макет редактора Mercurio">
      <div className="landing-editor-glow" aria-hidden="true" />
      <div className="landing-editor-shell">
        <div className="landing-editor-toolbar">
          <strong>Editor</strong>
          <span>Страница: Главная</span>
          <span>Публикация</span>
        </div>
        <div className="landing-editor-grid">
          <nav aria-label="Панель структуры">
            <strong>Structure</strong>
            <span className="is-selected">Hero section</span>
            <span>Product grid</span>
            <span>Media gallery</span>
            <span>CTA block</span>
          </nav>
          <section className="landing-editor-canvas" aria-label="Область композиции">
            <div className="landing-editor-section is-selected">
              <span>Sections</span>
              <div className="landing-editor-columns">
                <div>
                  <strong>Новая коллекция</strong>
                  <p>Block selection</p>
                </div>
                <div className="landing-editor-media">Media</div>
              </div>
            </div>
            <div className="landing-editor-section is-rebuilt">
              <span>Columns</span>
              <div className="landing-editor-reflow">
                <i />
                <i />
                <i />
              </div>
            </div>
          </section>
          <aside aria-label="Настройки выбранного блока">
            <strong>Composition controls</strong>
            <span>Columns: 2</span>
            <span>Button settings</span>
            <div className="landing-button-shapes" aria-label="Форма кнопки">
              <i />
              <i className="is-active" />
              <i />
            </div>
          </aside>
        </div>
      </div>
    </aside>
  );
}

function ProjectScenarioMockup() {
  return (
    <aside className="landing-project-board" aria-label="Декоративные варианты страниц проекта">
      <div className="landing-project-header">
        <strong>Demo Store</strong>
        <span>Страницы проекта</span>
      </div>
      <div className="landing-project-pages">
        <article className="is-primary">
          <span>Главная</span>
          <strong>Базовый storefront</strong>
          <p>каталог, товары, публикация</p>
        </article>
        {businessChangeScenarios.map((scenario) => (
          <article key={scenario.title}>
            <span>{scenario.page}</span>
            <strong>{scenario.title}</strong>
            <p>{scenario.detail}</p>
          </article>
        ))}
      </div>
    </aside>
  );
}

function CommerceStoryMockup() {
  return (
    <div className="landing-commerce-mockup">
      <article className="landing-catalog-panel">
        <div className="landing-mockup-window-label">Product catalog</div>
        <h3>Каталог: демо худи</h3>
        <div className="landing-product-grid" aria-label="Каталог товаров">
          <div className="landing-product-card is-active">
            <span className="landing-product-image" />
            <strong>Демо худи</strong>
            <p>4 варианта · цена · остатки</p>
          </div>
          <div className="landing-product-card">
            <span className="landing-product-image" />
            <strong>Демо футболка</strong>
            <p>3 варианта · изображения</p>
          </div>
          <div className="landing-product-card">
            <span className="landing-product-image" />
            <strong>Демо шоппер</strong>
            <p>2 цвета · доступность</p>
          </div>
        </div>
        <FeatureList title="Полноценный магазин" items={storeBullets} />
      </article>
      <article className="landing-product-landing-panel">
        <div className="landing-mockup-window-label">Product landing</div>
        <div className="landing-product-landing-hero">
          <span>Отдельный лендинг</span>
          <strong>Демо худи для сезонного запуска</strong>
          <p>Hero, benefits, gallery и CTA для рекламного трафика.</p>
          <div>Купить коллекцию</div>
        </div>
        <div className="landing-product-landing-blocks" aria-label="Блоки продуктового лендинга">
          <span>Benefits</span>
          <span>Gallery</span>
          <span>CTA</span>
        </div>
        <FeatureList
          title="Лендинг конкретного продукта"
          items={productLandingBullets}
        />
      </article>
    </div>
  );
}

function AnalyticsRoadmapMockup() {
  return (
    <aside className="landing-analytics-dashboard" aria-label="Схематичный модуль аналитики в разработке">
      <div className="landing-analytics-topbar">
        <strong>Analytics</strong>
        <span>Модуль в разработке</span>
      </div>
      <div className="landing-analytics-placeholders">
        <div>
          <span>Посещаемость</span>
          <i />
        </div>
        <div>
          <span>Популярные страницы</span>
          <i />
        </div>
        <div>
          <span>Продажи</span>
          <i />
        </div>
        <div>
          <span>Остатки</span>
          <i />
        </div>
      </div>
      <ul className="landing-analytics-labels" aria-label="Направления аналитики">
        {analyticsDirections.map((direction) => (
          <li key={direction}>{direction}</li>
        ))}
      </ul>
    </aside>
  );
}

function MercurioProductMockup() {
  return (
    <aside
      className="landing-product-mockup"
      aria-label="Декоративный макет интерфейса Mercurio"
    >
      <div className="landing-mockup-glow" aria-hidden="true" />
      <div className="landing-mockup-window landing-mockup-dashboard">
        <div className="landing-mockup-topbar">
          <MercurioLogo variant="icon" size={32} title="Mercurio dashboard" />
          <strong>Demo Store</strong>
          <span>Публикация сохранена</span>
        </div>
        <div className="landing-mockup-shell">
          <nav aria-label="Декоративная навигация dashboard">
            <span className="is-active">Страницы</span>
            <span>Товары</span>
            <span>Медиа</span>
            <span>Публикация</span>
          </nav>
          <section aria-label="Декоративный список страниц">
            <div className="landing-mockup-row is-strong">
              <span>Главная</span>
              <strong>Опубликовано</strong>
            </div>
            <div className="landing-mockup-row">
              <span>Каталог</span>
              <strong>Черновик</strong>
            </div>
            <div className="landing-mockup-row">
              <span>О бренде</span>
              <strong>Готово</strong>
            </div>
          </section>
        </div>
      </div>

      <div className="landing-mockup-window landing-mockup-editor-window">
        <div className="landing-mockup-window-label">Editor preview</div>
        <div className="landing-mockup-canvas">
          <span className="landing-mockup-label">Hero section</span>
          <strong>Новая коллекция</strong>
          <p>Страницы, блоки, изображения и кнопки в одном редакторе.</p>
          <div className="landing-mockup-button">Кнопка бренда</div>
        </div>
        <div className="landing-mockup-editor-rail" aria-label="Декоративные блоки редактора">
          <span>Heading</span>
          <span>Image</span>
          <span>Product grid</span>
        </div>
      </div>

      <div className="landing-mockup-window landing-mockup-catalog">
        <div>
          <span className="landing-mockup-label">Product catalog</span>
          <strong>Товары и варианты</strong>
          <p>Цена, остатки, изображения</p>
        </div>
        <div className="landing-mockup-product-list" aria-label="Декоративный каталог товаров">
          <span>Демо футболка</span>
          <span>Демо худи</span>
        </div>
      </div>
    </aside>
  );
}
