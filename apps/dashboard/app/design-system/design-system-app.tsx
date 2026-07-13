"use client";

import React from "react";
import { useEffect, useState } from "react";
import {
  Badge,
  BlockLibraryCard,
  Breadcrumbs,
  Button,
  CanvasSectionFrame,
  Card,
  Checkbox,
  Divider,
  DualViewportPreview,
  EditorRail,
  EditorRailItem,
  EditorSidePanel,
  EditorTopBar,
  EmptyState,
  ErrorState,
  FloatingSectionToolbar,
  Icon,
  IconButton,
  Input,
  InsertSectionControl,
  Inspector,
  InspectorTabs,
  LoadingState,
  MerkurioThemeSwitcher,
  MercurioLogo,
  Modal,
  Panel,
  PropertyGroup,
  PropertyRow,
  PublicationStatus,
  SectionNavigatorItem,
  SegmentedControl,
  Select,
  StatusBadge,
  Tabs,
  Textarea,
  Toast,
  Toggle,
  merkurioIconNames,
  merkurioUiColorTokens,
  merkurioUiGeometryTokens,
  merkurioUiSemanticColorTokenNames,
  merkurioUiTypographyTokens,
  type DualViewportPreviewMode,
  type SitePreviewTheme
} from "@site-platform/ui";

export function DesignSystemApp() {
  const [sitePreviewTheme, setSitePreviewThemeState] = useState<SitePreviewTheme>("light");
  const [dualMode, setDualMode] = useState<DualViewportPreviewMode>("side-by-side");
  const [toggleOn, setToggleOn] = useState(true);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("merkurio-site-preview-theme");
    if (storedTheme === "light" || storedTheme === "dark") {
      setSitePreviewThemeState(storedTheme);
    }
  }, []);

  const setSitePreviewTheme = (nextTheme: SitePreviewTheme) => {
    window.localStorage.setItem("merkurio-site-preview-theme", nextTheme);
    setSitePreviewThemeState(nextTheme);
  };

  return (
    <main className="design-system-page">
      <header className="design-system-hero">
        <div>
          <MercurioLogo variant="compact" />
          <p className="ds-eyebrow">Design System Foundation v1</p>
          <h1>Merkurio UI Foundation</h1>
          <p>
            Живая среда для токенов, базовых компонентов, editor primitives и будущего
            переноса в Figma UI kit.
          </p>
        </div>
        <section className="ds-theme-card" aria-label="Editor theme">
          <span>Editor UI theme</span>
          <MerkurioThemeSwitcher />
        </section>
      </header>

      <section className="ds-grid ds-grid-two">
        <Panel title="Palette">
          <div className="ds-token-grid">
            {merkurioUiSemanticColorTokenNames.map((tokenName) => (
              <article key={tokenName} className="ds-color-token">
                <span style={{ background: merkurioUiColorTokens[tokenName].light }} />
                <span style={{ background: merkurioUiColorTokens[tokenName].dark }} />
                <strong>{tokenName}</strong>
                <small>
                  {merkurioUiColorTokens[tokenName].light} / {merkurioUiColorTokens[tokenName].dark}
                </small>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Typography">
          <div className="ds-type-list">
            {Object.entries(merkurioUiTypographyTokens).map(([name, token]) => (
              <article key={name}>
                <span>{name}</span>
                <p
                  style={{
                    fontFamily: token.family,
                    fontWeight: token.weight,
                    fontSize: token.size,
                    lineHeight: token.lineHeight
                  }}
                >
                  Ясность. Скорость. Преимущество.
                </p>
              </article>
            ))}
          </div>
        </Panel>
      </section>

      <section className="ds-grid ds-grid-three">
        <Panel title="Spacing">
          <div className="ds-rhythm">
            {Object.entries(merkurioUiGeometryTokens.spacing).map(([name, value]) => (
              <span key={name} style={{ width: value }}>
                {value}
              </span>
            ))}
          </div>
        </Panel>
        <Panel title="Radius">
          <div className="ds-radius-grid">
            {Object.entries(merkurioUiGeometryTokens.radius).map(([name, value]) => (
              <span key={name} style={{ borderRadius: value }}>
                {name}
              </span>
            ))}
          </div>
        </Panel>
        <Panel title="Icons">
          <div className="ds-icon-grid">
            {merkurioIconNames.map((iconName) => (
              <span key={iconName} title={iconName}>
                <Icon name={iconName} size={20} />
              </span>
            ))}
          </div>
        </Panel>
      </section>

      <Panel title="Core Components">
        <div className="ds-components-grid">
          <Card>
            <h3>Buttons</h3>
            <div className="ds-inline">
              <Button variant="primary">Primary</Button>
              <Button variant="brand">Brand</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="primary" loading>
                Save
              </Button>
            </div>
            <div className="ds-state-matrix" aria-label="Button states">
              <Button>Default</Button>
              <Button className="is-hover-demo">Hover</Button>
              <Button className="is-pressed-demo">Pressed</Button>
              <Button className="is-focus-demo">Focus</Button>
              <Button disabled>Disabled</Button>
              <Button loading>Loading</Button>
            </div>
            <div className="ds-inline">
              <IconButton label="Preview" icon="preview" />
              <IconButton label="Publish" icon="publish" selected />
              <IconButton label="Focus demo" icon="settings" className="is-focus-demo" />
              <IconButton label="Disabled demo" icon="hide" disabled />
              <IconButton label="Delete" icon="delete" variant="danger" />
            </div>
          </Card>

          <Card>
            <h3>Forms</h3>
            <Input label="Название" defaultValue="Главная страница" />
            <Input label="Focus" defaultValue="Фокус" className="is-focus-demo" />
            <Input label="Disabled" defaultValue="Недоступно" disabled />
            <Textarea label="Описание" defaultValue="Короткий текст секции" />
            <Select
              label="Режим"
              defaultValue="editor"
              options={[
                { value: "editor", label: "Editor" },
                { value: "preview", label: "Preview" }
              ]}
            />
            <Select
              label="Disabled select"
              disabled
              options={[{ value: "disabled", label: "Disabled" }]}
            />
            <Checkbox label="Показывать в навигации" defaultChecked />
            <Checkbox label="Disabled checkbox" disabled />
            <Toggle
              label="Включить"
              pressed={toggleOn}
              onClick={() => setToggleOn((value) => !value)}
            />
            <Toggle label="Disabled toggle" pressed={false} disabled />
          </Card>

          <Card>
            <h3>Navigation & Feedback</h3>
            <Breadcrumbs
              items={[
                { label: "Проекты", href: "/" },
                { label: "Demo Store" },
                { label: "Design System" }
              ]}
            />
            <Tabs
              label="Компоненты"
              selectedId="core"
              items={[
                { id: "foundation", label: "Foundation" },
                { id: "core", label: "Core" },
                { id: "editor", label: "Editor" },
                { id: "disabled", label: "Disabled", disabled: true }
              ]}
            />
            <Tabs
              label="Tab states"
              selectedId="focus"
              className="is-focus-demo"
              items={[
                { id: "default", label: "Default" },
                { id: "focus", label: "Focus" },
                { id: "disabled", label: "Disabled", disabled: true }
              ]}
            />
            <div className="ds-inline">
              <Badge tone="accent">Accent</Badge>
              <StatusBadge status="published">Published</StatusBadge>
              <StatusBadge status="changed">Changed</StatusBadge>
            </div>
            <Toast tone="info">Стиль сохранён локально.</Toast>
          </Card>

          <Card>
            <h3>States</h3>
            <EmptyState title="Нет блоков" description="Добавьте первый блок в секцию." />
            <LoadingState label="Синхронизация" />
            <ErrorState title="Ошибка" description="Проверьте обязательные поля." />
          </Card>
        </div>
      </Panel>

      <Panel title="Editor Components">
        <div className="ds-editor-demo">
          <EditorRail>
            <EditorRailItem icon="structure" label="Структура" selected />
            <EditorRailItem icon="add-block" label="Добавить блок" />
            <EditorRailItem icon="theme" label="Тема" />
          </EditorRail>
          <EditorSidePanel title="Структура страницы">
            <SectionNavigatorItem index={1} title="Первый экран" type="Hero" state="selected" />
            <SectionNavigatorItem index={2} title="Преимущества" type="Icons" />
            <SectionNavigatorItem index={3} title="Каталог" type="Commerce" state="hidden" />
            <SectionNavigatorItem index={4} title="Отзывы" type="Slider" state="error" />
            <InsertSectionControl />
          </EditorSidePanel>
          <section className="ds-editor-canvas">
            <EditorTopBar
              title="Главная страница"
              status={<PublicationStatus status="changed" />}
              actions={
                <>
                  <Button variant="secondary" icon="preview">
                    Предпросмотр
                  </Button>
                  <Button variant="primary" icon="publish">
                    Опубликовать
                  </Button>
                </>
              }
            />
            <CanvasSectionFrame label="Секция: Первый экран" selected>
              <FloatingSectionToolbar />
              <div className="ds-demo-hero">
                <p className="ds-eyebrow">Digital solutions</p>
                <h2>Разрабатываем IT-решения и продукты для роста бизнеса</h2>
                <p>Стратегия, дизайн и разработка сложных цифровых продуктов под ключ.</p>
              </div>
            </CanvasSectionFrame>
            <div className="ds-block-grid">
              <BlockLibraryCard name="Hero editorial" category="Первый экран" state="selected" />
              <BlockLibraryCard name="Product grid" category="Commerce" commerce />
              <BlockLibraryCard name="Dark CTA" category="Conversion" state="favorite" />
              <BlockLibraryCard name="Video hero" category="Media" state="unavailable" />
            </div>
          </section>
          <Inspector title="Инспектор">
            <InspectorTabs
              selectedId="content"
              items={[
                { id: "content", label: "Контент" },
                { id: "layout", label: "Компоновка" },
                { id: "style", label: "Стиль" },
                { id: "spacing", label: "Отступы" },
                { id: "adaptive", label: "Адаптивность" }
              ]}
            />
            <PropertyGroup title="Заголовок">
              <PropertyRow label="Role" value="H1" />
              <PropertyRow label="Font" value="Prata / 56" />
              <PropertyRow label="Color" value="text.primary" />
            </PropertyGroup>
            <PropertyGroup title="Кнопки" defaultOpen={false}>
              <PropertyRow label="Primary" value="Graphite" />
              <PropertyRow label="Brand" value="Gradient only on demand" />
            </PropertyGroup>
          </Inspector>
        </div>
      </Panel>

      <Panel
        title="Dual Viewport Preview"
        actions={
          <div className="ds-inline">
            <SegmentedControl
              label="Preview mode"
              value={dualMode}
              onValueChange={(value) => {
                if (
                  value === "side-by-side" ||
                  value === "desktop" ||
                  value === "mobile"
                ) {
                  setDualMode(value);
                }
              }}
              options={[
                { value: "side-by-side", label: "Side by side" },
                { value: "desktop", label: "Desktop" },
                { value: "mobile", label: "Mobile" }
              ]}
            />
            <Button
              variant={sitePreviewTheme === "light" ? "primary" : "secondary"}
              onClick={() => setSitePreviewTheme("light")}
            >
              Site Light
            </Button>
            <Button
              variant={sitePreviewTheme === "dark" ? "primary" : "secondary"}
              onClick={() => setSitePreviewTheme("dark")}
            >
              Site Dark
            </Button>
          </div>
        }
      >
        <DualViewportPreview
          mode={dualMode}
          siteTheme={sitePreviewTheme}
          editingState="inheritedMobile"
        >
          <div className="ds-preview-page">
            <p className="ds-eyebrow">Platform for growth</p>
            <h2>Ясность. Скорость. Преимущество.</h2>
            <p>Один content source одновременно проверяется в desktop и mobile frame.</p>
            <Button variant="primary">Начать бесплатно</Button>
          </div>
        </DualViewportPreview>
      </Panel>

      <Divider />

      <section className="ds-footer-note">
        <Modal title="Modal foundation">Каркас модального окна для будущей реализации focus trap.</Modal>
      </section>
    </main>
  );
}
