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
  return (
    <main className="landing-page">
      <a className="skip-link" href="#main-content">
        Перейти к содержанию
      </a>
      <header className="landing-header">
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
          <a className="landing-link-button" href={dashboardUrl}>
            Войти
          </a>
          <a className="landing-primary-button" href={dashboardUrl}>
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
            <a className="landing-primary-button" href={dashboardUrl}>
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
        <div className="landing-card-grid landing-card-grid-four">
          {audienceCards.map((card) => (
            <article key={card.title} className="landing-card">
              {card.badge === undefined ? null : (
                <span className="landing-badge">{card.badge}</span>
              )}
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="features" className="landing-section landing-band" aria-labelledby="features-title">
        <SectionIntro
          eyebrow="Главное отличие"
          titleId="features-title"
          title="Не подстраивайте бизнес под шаблон"
          text="Большинство конструкторов предлагают выбрать готовый шаблон и менять контент внутри заданной структуры. Mercurio устроен иначе. Вы можете свободно менять композицию страниц, перестраивать модули и блоки, создавать собственные формы кнопок и собирать новые сценарии взаимодействия."
        />
        <p className="landing-large-phrase">
          Mercurio не ограничивает творчество и возможности бизнеса.
        </p>
        <div className="landing-card-grid">
          {templateDifferenceCards.map((card) => (
            <article key={card.title} className="landing-card">
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </article>
          ))}
        </div>
        <p className="landing-note">
          Больше свободы, чем в традиционных шаблонных конструкторах.
        </p>
      </section>

      <section className="landing-section" aria-labelledby="change-title">
        <SectionIntro
          eyebrow="Гибкость"
          titleId="change-title"
          title="Меняйте сайт так же быстро, как меняется ваш бизнес"
          text="Запускайте новые страницы, перестраивайте композицию, меняйте акценты и добавляйте блоки без пересборки всего проекта."
        />
        <ul className="landing-chip-list" aria-label="Сценарии изменений">
          {businessChangeScenarios.map((scenario) => (
            <li key={scenario}>{scenario}</li>
          ))}
        </ul>
        <p className="landing-large-phrase">
          Не выбирайте шаблон навсегда. Создавайте новую форму под каждую задачу.
        </p>
      </section>

      <section className="landing-section landing-commerce" aria-labelledby="commerce-title">
        <SectionIntro
          eyebrow="Магазин и лендинги"
          titleId="commerce-title"
          title="Продавайте через каталог и рассказывайте о каждом продукте отдельно"
          text="Не ограничивайтесь стандартной карточкой товара. Создавайте отдельные страницы, которые раскрывают ценность продукта и помогают продавать убедительнее."
        />
        <div className="landing-two-column">
          <FeatureList title="Полноценный магазин" items={storeBullets} />
          <FeatureList
            title="Лендинг конкретного продукта"
            items={productLandingBullets}
          />
        </div>
        <article className="landing-callout">
          <h3>Коллекция или подборка</h3>
          <p>
            Соберите отдельный лендинг для коллекции, сезонного запуска или
            рекламной кампании.
          </p>
        </article>
      </section>

      <section className="landing-section landing-band" aria-labelledby="infrastructure-title">
        <SectionIntro
          eyebrow="Торговая инфраструктура"
          titleId="infrastructure-title"
          title="Mercurio скрывает техническую сложность и оставляет только понятные действия"
          text="Не нужно разбираться в серверах, API и программировании. Mercurio связывает инструменты в единую систему и переводит технические процессы на язык простых действий."
        />
        <ol className="landing-step-list">
          {infrastructureSteps.map((step) => (
            <li key={step}>{step}</li>
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
              <h3>{integration.title}</h3>
              <span>{integration.status}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-analytics" aria-labelledby="analytics-title">
        <div>
          <span className="landing-badge">Модуль аналитики в разработке</span>
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
        <ul className="landing-chip-list" aria-label="Направления аналитики">
          {analyticsDirections.map((direction) => (
            <li key={direction}>{direction}</li>
          ))}
        </ul>
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

      <section className="landing-section landing-capabilities" aria-labelledby="capabilities-title">
        <SectionIntro
          eyebrow="Текущий статус"
          titleId="capabilities-title"
          title="Что уже доступно и что развивается дальше"
          text="Mercurio честно разделяет рабочие функции, ближайшие этапы и стратегические направления, чтобы не обещать готовое раньше времени."
        />
        <div className="landing-capability-grid">
          {capabilityGroups.map((group) => (
            <article key={group.title} className="landing-capability-card">
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
          <a className="landing-primary-button" href={dashboardUrl}>
            Создать проект
          </a>
          <a className="landing-secondary-button" href={dashboardUrl}>
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
