import * as React from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Panel,
  StatusBadge
} from "@site-platform/ui";
import type {
  CreatePageFormValues,
  CreateSiteFormValues,
  CurrentUserResponse,
  ProjectSiteSettingsResponse,
  ProjectSummary,
  PublicationSettingsResponse,
  PublicationStatusResponse,
  SitePageSummary,
  SiteSummary,
  UpdateSiteFormValues
} from "./dashboard-types";
import { MercurioAppShell } from "./mercurio-shell";
import {
  createProjectSitesRoute,
  createSitePageEditorRoute,
  createSiteRoute,
  type SiteSection
} from "./site-routes";

export type SiteManagementLoadState =
  | {
      readonly status: "loading";
    }
  | {
      readonly status: "error";
      readonly message: string;
    }
  | {
      readonly status: "ready";
      readonly project: ProjectSummary;
      readonly user: CurrentUserResponse;
      readonly sites: readonly SiteSummary[];
      readonly currentSite: SiteSummary | null;
      readonly pages: readonly SitePageSummary[];
      readonly siteSettings: ProjectSiteSettingsResponse | null;
      readonly publicationSettings: PublicationSettingsResponse | null;
      readonly publicationStatus: PublicationStatusResponse | null;
    };

export type SiteFormState = {
  readonly open: boolean;
  readonly values: CreateSiteFormValues;
  readonly slugEdited: boolean;
  readonly submitting: boolean;
  readonly errorMessage: string | undefined;
};

export type SiteDetailsFormState = {
  readonly values: UpdateSiteFormValues;
  readonly submitting: boolean;
  readonly errorMessage: string | undefined;
  readonly successMessage: string | undefined;
};

export type PageFormState = {
  readonly open: boolean;
  readonly values: CreatePageFormValues;
  readonly submitting: boolean;
  readonly errorMessage: string | undefined;
};

export type PublicationFormState = {
  readonly publicHandle: string;
  readonly submitting: boolean;
  readonly errorMessage: string | undefined;
  readonly successMessage: string | undefined;
};

export type ConfirmSiteAction =
  | {
      readonly type: "archive" | "set-default";
      readonly site: SiteSummary;
    }
  | null;

export type SiteManagementViewProps = {
  readonly state: SiteManagementLoadState;
  readonly section: SiteSection | "project-sites";
  readonly createSiteForm: SiteFormState;
  readonly siteDetailsForm: SiteDetailsFormState;
  readonly pageForm: PageFormState;
  readonly publicationForm: PublicationFormState;
  readonly confirmAction: ConfirmSiteAction;
  readonly confirmActionSubmitting: boolean;
  readonly confirmActionError: string | undefined;
  readonly canManageSites: boolean;
  readonly canEditPages: boolean;
  readonly onOpenCreateSite: () => void;
  readonly onCloseCreateSite: () => void;
  readonly onCreateSiteChange: (values: CreateSiteFormValues, slugEdited: boolean) => void;
  readonly onSubmitCreateSite: (event: FormEvent<HTMLFormElement>) => void;
  readonly onSiteDetailsChange: (values: UpdateSiteFormValues) => void;
  readonly onSubmitSiteDetails: (event: FormEvent<HTMLFormElement>) => void;
  readonly onOpenCreatePage: () => void;
  readonly onCloseCreatePage: () => void;
  readonly onPageFormChange: (values: CreatePageFormValues) => void;
  readonly onSubmitCreatePage: (event: FormEvent<HTMLFormElement>) => void;
  readonly onPublicationHandleChange: (value: string) => void;
  readonly onSubmitPublicationSettings: (event: FormEvent<HTMLFormElement>) => void;
  readonly onRequestArchiveSite: (site: SiteSummary) => void;
  readonly onRequestSetDefaultSite: (site: SiteSummary) => void;
  readonly onCancelConfirmAction: () => void;
  readonly onConfirmSiteAction: () => void;
};

const siteTabs: readonly { readonly id: SiteSection; readonly label: string }[] = [
  { id: "overview", label: "Обзор" },
  { id: "pages", label: "Страницы" },
  { id: "publication", label: "Публикация" },
  { id: "settings", label: "Настройки" }
];

export function SiteManagementView({
  state,
  section,
  createSiteForm,
  siteDetailsForm,
  pageForm,
  publicationForm,
  confirmAction,
  confirmActionSubmitting,
  confirmActionError,
  canManageSites,
  canEditPages,
  onOpenCreateSite,
  onCloseCreateSite,
  onCreateSiteChange,
  onSubmitCreateSite,
  onSiteDetailsChange,
  onSubmitSiteDetails,
  onOpenCreatePage,
  onCloseCreatePage,
  onPageFormChange,
  onSubmitCreatePage,
  onPublicationHandleChange,
  onSubmitPublicationSettings,
  onRequestArchiveSite,
  onRequestSetDefaultSite,
  onCancelConfirmAction,
  onConfirmSiteAction
}: SiteManagementViewProps): React.ReactElement {
  return (
    <MercurioAppShell
      activeArea={section === "pages" ? "pages" : "project"}
      project={state.status === "ready" ? state.project : undefined}
      user={state.status === "ready" ? state.user : undefined}
    >
      {state.status === "loading" ? (
        <main className="site-dashboard-page">
          <LoadingState label="Загрузка сайтов проекта" />
        </main>
      ) : state.status === "error" ? (
        <main className="site-dashboard-page">
          <ErrorState title="Проект не открыт" description={state.message} />
        </main>
      ) : (
        <main className="site-dashboard-page">
          <AccountPageHeader
            title={section === "project-sites" ? "Сайты проекта" : currentTitle(section)}
            description={
              section === "project-sites"
                ? `Все сайты проекта ${state.project.name} и их публикации.`
                : "Site context сохранён в URL и применяется к страницам, настройкам и публикации."
            }
          />
          <ProjectContextBar
            project={state.project}
            sites={state.sites}
            currentSite={state.currentSite}
            section={section === "project-sites" ? "overview" : section}
          />

          {section === "project-sites" ? (
            <ProjectSitesSection
              project={state.project}
              sites={state.sites}
              pages={state.pages}
              canManageSites={canManageSites}
              onOpenCreateSite={onOpenCreateSite}
              onRequestArchiveSite={onRequestArchiveSite}
              onRequestSetDefaultSite={onRequestSetDefaultSite}
            />
          ) : (
            <SiteScopedShell
              project={state.project}
              currentSite={state.currentSite}
              section={section}
              canManageSites={canManageSites}
            >
              {state.currentSite === null ? null : section === "overview" ? (
                <SiteOverview
                  project={state.project}
                  site={state.currentSite}
                  pages={state.pages}
                  publicationStatus={state.publicationStatus}
                  publicationSettings={state.publicationSettings}
                  canManageSites={canManageSites}
                  onRequestArchiveSite={onRequestArchiveSite}
                  onRequestSetDefaultSite={onRequestSetDefaultSite}
                />
              ) : section === "pages" ? (
                <SitePagesSection
                  project={state.project}
                  site={state.currentSite}
                  pages={state.pages}
                  form={pageForm}
                  canEditPages={canEditPages}
                  onOpenCreatePage={onOpenCreatePage}
                  onCloseCreatePage={onCloseCreatePage}
                  onPageFormChange={onPageFormChange}
                  onSubmitCreatePage={onSubmitCreatePage}
                />
              ) : section === "settings" ? (
                <SiteSettingsSection
                  site={state.currentSite}
                  form={siteDetailsForm}
                  canManageSites={canManageSites}
                  onChange={onSiteDetailsChange}
                  onSubmit={onSubmitSiteDetails}
                  onRequestArchiveSite={onRequestArchiveSite}
                  onRequestSetDefaultSite={onRequestSetDefaultSite}
                />
              ) : (
                <SitePublicationSection
                  settings={state.publicationSettings}
                  status={state.publicationStatus}
                  form={publicationForm}
                  canManageSites={canManageSites}
                  onHandleChange={onPublicationHandleChange}
                  onSubmit={onSubmitPublicationSettings}
                />
              )}
            </SiteScopedShell>
          )}
          {createSiteForm.open ? (
            <CreateSiteDialog
              form={createSiteForm}
              onClose={onCloseCreateSite}
              onChange={onCreateSiteChange}
              onSubmit={onSubmitCreateSite}
            />
          ) : null}
          {confirmAction === null ? null : (
            <ArchiveSiteDialog
              action={confirmAction}
              submitting={confirmActionSubmitting}
              errorMessage={confirmActionError}
              onCancel={onCancelConfirmAction}
              onConfirm={onConfirmSiteAction}
            />
          )}
        </main>
      )}
    </MercurioAppShell>
  );
}

function AccountPageHeader({
  title,
  description
}: {
  readonly title: string;
  readonly description: string;
}) {
  return (
    <header className="account-page-header">
      <p className="account-eyebrow">ЛИЧНЫЙ КАБИНЕТ · DIGITAL SPIRIT</p>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  );
}

function SiteScopedShell({
  project,
  currentSite,
  section,
  canManageSites,
  children
}: {
  readonly project: ProjectSummary;
  readonly currentSite: SiteSummary | null;
  readonly section: SiteSection;
  readonly canManageSites: boolean;
  readonly children: React.ReactNode;
}) {
  if (currentSite === null) {
    return (
      <ErrorState
        title="Сайт не найден"
        description="Сайт не найден в текущем проекте или недоступен."
      />
    );
  }

  const isArchived = currentSite.status === "ARCHIVED";

  return (
    <section className="site-shell" aria-label="Site dashboard shell">
      <SiteTabs
        projectId={project.id}
        siteId={currentSite.id}
        activeSection={section}
        disabled={isArchived}
      />
      {isArchived ? (
        <ArchivedSiteState project={project} site={currentSite} />
      ) : (
        <>
          {canManageSites ? null : <Badge tone="neutral">Режим только чтение</Badge>}
          {children}
        </>
      )}
    </section>
  );
}

function ProjectContextBar({
  project,
  sites,
  currentSite,
  section
}: {
  readonly project: ProjectSummary;
  readonly sites: readonly SiteSummary[];
  readonly currentSite: SiteSummary | null;
  readonly section: SiteSection;
}) {
  const activeSites = sites.filter((site) => site.status === "ACTIVE");
  const defaultSite = sites.find((site) => site.isDefault);

  return (
    <section className="site-context-bar">
      <div>
        <nav className="account-breadcrumbs" aria-label="Хлебные крошки">
          <Link href="/">Проекты</Link>
          <span>/</span>
          <Link href={createProjectSitesRoute(project.id)}>{project.name}</Link>
          {currentSite === null ? null : (
            <>
              <span>/</span>
              <strong>{currentSite.name}</strong>
            </>
          )}
        </nav>
        <h2 title={currentSite?.name ?? project.name}>{currentSite?.name ?? project.name}</h2>
        <p>
          {project.slug} · {sites.length} {pluralizeSites(sites.length)}
          {defaultSite === undefined ? "" : ` · основной: ${defaultSite.name}`}
        </p>
      </div>
      <div className="site-context-actions">
        {currentSite === null ? null : (
          <SiteSwitcher
            project={project}
            sites={activeSites}
            currentSite={currentSite}
            section={section}
          />
        )}
      </div>
    </section>
  );
}

function SiteSwitcher({
  project,
  sites,
  currentSite,
  section
}: {
  readonly project: ProjectSummary;
  readonly sites: readonly SiteSummary[];
  readonly currentSite: SiteSummary;
  readonly section: SiteSection;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const listboxId = React.useId();
  const searchId = React.useId();
  const filteredSites = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return normalizedQuery.length === 0
      ? sites
      : sites.filter((site) =>
          `${site.name} ${site.slug}`.toLowerCase().includes(normalizedQuery)
        );
  }, [query, sites]);
  const showSearch = sites.length >= 8;

  React.useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (
        rootRef.current !== null &&
        event.target instanceof Node &&
        !rootRef.current.contains(event.target)
      ) {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  React.useEffect(() => {
    if (open) {
      setQuery("");
    }
  }, [open]);

  const focusOption = React.useCallback((direction: 1 | -1) => {
    const options = Array.from(
      rootRef.current?.querySelectorAll<HTMLAnchorElement>("[data-site-switch-option]") ?? []
    );
    const currentIndex = options.findIndex((option) => option === document.activeElement);
    const nextIndex =
      currentIndex === -1
        ? direction === 1
          ? 0
          : options.length - 1
        : (currentIndex + direction + options.length) % options.length;

    options[nextIndex]?.focus();
  }, []);

  const onRootKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }

    if (!open && (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      setOpen(true);
      window.setTimeout(() => focusOption(1), 0);
      return;
    }

    if (open && event.key === "ArrowDown") {
      event.preventDefault();
      focusOption(1);
      return;
    }

    if (open && event.key === "ArrowUp") {
      event.preventDefault();
      focusOption(-1);
    }
  };

  return (
    <div className="site-switcher" ref={rootRef} onKeyDown={onRootKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        className="site-switcher-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((current) => !current)}
      >
        <span>
          <small>Текущий сайт</small>
          <strong title={currentSite.name}>{currentSite.name}</strong>
          <small title={`/${currentSite.slug}`}>/{currentSite.slug}</small>
        </span>
        <span className="site-switcher-badges">
          {currentSite.isDefault ? <DefaultSiteBadge /> : null}
          <SiteStatusBadge site={currentSite} />
        </span>
      </button>
      <div className="site-switcher-panel" hidden={!open}>
        {showSearch ? (
          <Input
            label="Поиск сайта"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
        ) : null}
        <div
          id={listboxId}
          className="site-switcher-list"
          role="listbox"
          aria-label="Выбор сайта"
          aria-describedby={showSearch ? searchId : undefined}
        >
          {showSearch ? (
            <p id={searchId} className="site-switcher-hint">
              Архивные сайты скрыты из списка переключения.
            </p>
          ) : null}
          {filteredSites.length === 0 ? (
            <p className="site-switcher-empty">Активные сайты не найдены.</p>
          ) : (
            filteredSites.map((site) => (
              <Link
                key={site.id}
                className={
                  site.id === currentSite.id
                    ? "site-switcher-item active"
                    : "site-switcher-item"
                }
                href={createSiteRoute(project.id, site.id, section)}
                title={site.name}
                role="option"
                aria-selected={site.id === currentSite.id}
                data-site-switch-option=""
                onClick={() => setOpen(false)}
              >
                <span>
                  <strong>{site.name}</strong>
                  <small>/{site.slug}</small>
                </span>
                <span className="site-switcher-badges">
                  {site.isDefault ? <DefaultSiteBadge /> : null}
                </span>
              </Link>
            ))
          )}
        </div>
        <Link className="site-switcher-manage" href={createProjectSitesRoute(project.id)}>
          Управление сайтами
        </Link>
      </div>
    </div>
  );
}

function ArchivedSiteState({
  project,
  site
}: {
  readonly project: ProjectSummary;
  readonly site: SiteSummary;
}) {
  return (
    <Panel title="Сайт в архиве" className="site-archived-state">
      <div className="site-overview-badges">
        <SiteStatusBadge site={site} />
        {site.isDefault ? <DefaultSiteBadge /> : null}
      </div>
      <p className="site-muted">
        Этот сайт перемещён в архив. Его страницы и настройки сохранены, но он не
        используется как активный Site context.
      </p>
      <Link className="ui-button ui-button-secondary ui-button-md" href={createProjectSitesRoute(project.id)}>
        Вернуться к списку сайтов
      </Link>
    </Panel>
  );
}

function ProjectSitesSection({
  project,
  sites,
  pages,
  canManageSites,
  onOpenCreateSite,
  onRequestArchiveSite,
  onRequestSetDefaultSite
}: {
  readonly project: ProjectSummary;
  readonly sites: readonly SiteSummary[];
  readonly pages: readonly SitePageSummary[];
  readonly canManageSites: boolean;
  readonly onOpenCreateSite: () => void;
  readonly onRequestArchiveSite: (site: SiteSummary) => void;
  readonly onRequestSetDefaultSite: (site: SiteSummary) => void;
}) {
  const activeSites = sites.filter((site) => site.status === "ACTIVE");
  const archivedSites = sites.filter((site) => site.status === "ARCHIVED");
  const defaultSite = activeSites.find((site) => site.isDefault);

  return (
    <section className="site-section-stack">
      <div className="site-list-toolbar">
        <div>
          <h2>Сайты</h2>
          <p>
            {activeSites.length} активных · {archivedSites.length} архивных
            {defaultSite === undefined ? "" : ` · основной: ${defaultSite.name}`}
          </p>
        </div>
        {canManageSites ? (
          <Button type="button" variant="primary" onClick={onOpenCreateSite}>
            Создать сайт
          </Button>
        ) : (
          <Badge tone="neutral">Только чтение</Badge>
        )}
      </div>
      {sites.length === 0 ? (
        <EmptyState
          title="Сайтов пока нет"
          description="Создайте первый сайт проекта или проверьте доступы."
          action={
            canManageSites ? (
              <Button type="button" variant="primary" onClick={onOpenCreateSite}>
                Создать сайт
              </Button>
            ) : null
          }
        />
      ) : (
        <>
          <SiteRowsGroup
            title="Активные сайты"
            description="Сайты, доступные для открытия, настройки и публикации."
            emptyTitle="Активных сайтов нет"
            projectId={project.id}
            sites={activeSites}
            pages={pages}
            activeSitesCount={activeSites.length}
            canManageSites={canManageSites}
            onRequestArchiveSite={onRequestArchiveSite}
            onRequestSetDefaultSite={onRequestSetDefaultSite}
          />
          {archivedSites.length === 0 ? null : (
            <SiteRowsGroup
              title="Архив"
              description="Архивированные сайты отделены от активного списка."
              projectId={project.id}
              sites={archivedSites}
              pages={pages}
              activeSitesCount={activeSites.length}
              canManageSites={canManageSites}
              onRequestArchiveSite={onRequestArchiveSite}
              onRequestSetDefaultSite={onRequestSetDefaultSite}
            />
          )}
        </>
      )}
    </section>
  );
}

function SiteRowsGroup({
  title,
  description,
  emptyTitle,
  projectId,
  sites,
  pages,
  activeSitesCount,
  canManageSites,
  onRequestArchiveSite,
  onRequestSetDefaultSite
}: {
  readonly title: string;
  readonly description: string;
  readonly emptyTitle?: string;
  readonly projectId: string;
  readonly sites: readonly SiteSummary[];
  readonly pages: readonly SitePageSummary[];
  readonly activeSitesCount: number;
  readonly canManageSites: boolean;
  readonly onRequestArchiveSite: (site: SiteSummary) => void;
  readonly onRequestSetDefaultSite: (site: SiteSummary) => void;
}) {
  if (sites.length === 0) {
    return emptyTitle === undefined ? null : (
      <section className="site-row-group">
        <div className="site-row-group-heading">
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <EmptyState title={emptyTitle} description="Проверьте фильтры или доступы." />
      </section>
    );
  }

  return (
    <section className="site-row-group">
      <div className="site-row-group-heading">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className="site-row-list">
        {sites.map((site) => (
          <SiteRow
            key={site.id}
            projectId={projectId}
            site={site}
            pagesCount={pages.filter((page) => page.siteId === site.id).length}
            activeSitesCount={activeSitesCount}
            canManageSites={canManageSites}
            onRequestArchiveSite={onRequestArchiveSite}
            onRequestSetDefaultSite={onRequestSetDefaultSite}
          />
        ))}
      </div>
    </section>
  );
}

function SiteRow({
  projectId,
  site,
  pagesCount,
  activeSitesCount,
  canManageSites,
  onRequestArchiveSite,
  onRequestSetDefaultSite
}: {
  readonly projectId: string;
  readonly site: SiteSummary;
  readonly pagesCount: number;
  readonly activeSitesCount: number;
  readonly canManageSites: boolean;
  readonly onRequestArchiveSite: (site: SiteSummary) => void;
  readonly onRequestSetDefaultSite: (site: SiteSummary) => void;
}) {
  const isActive = site.status === "ACTIVE";
  const archiveDisabledReason = !isActive
    ? "Сайт уже в архиве"
    : site.isDefault
      ? "Нельзя архивировать основной"
      : activeSitesCount <= 1
        ? "Единственный активный"
        : null;
  const setDefaultDisabledReason = !isActive
    ? "Архивный сайт"
    : site.isDefault
      ? "Уже основной"
      : null;

  return (
    <article className={site.status === "ARCHIVED" ? "account-site-row archived" : "account-site-row"}>
      <div className="site-preview-tile" aria-hidden="true" />
      <div className="site-row-name">
        <a href={createSiteRoute(projectId, site.id)} title={site.name}>
          {site.name}
        </a>
        <span title={`/${site.slug}`} aria-label={`Slug: /${site.slug}`}>
          /{site.slug}
        </span>
      </div>
      <div className="site-row-badges">
        <SiteStatusBadge site={site} />
        {site.isDefault ? <DefaultSiteBadge /> : null}
      </div>
      <span>{pagesCount} стр.</span>
      <span>{formatDateTime(site.updatedAt)}</span>
      <details className="site-row-menu">
        <summary aria-label={`Действия сайта ${site.name}`}>•••</summary>
        <div className="site-row-menu-panel">
          <a className="site-row-menu-item" href={createSiteRoute(projectId, site.id)}>
            Открыть
          </a>
          <a
            className="site-row-menu-item"
            href={createSiteRoute(projectId, site.id, "settings")}
          >
            Настроить
          </a>
          {canManageSites ? (
            <>
              <button
                className="site-row-menu-item"
                type="button"
                disabled={setDefaultDisabledReason !== null}
                title={setDefaultDisabledReason ?? undefined}
                onClick={() => onRequestSetDefaultSite(site)}
              >
                {setDefaultDisabledReason ?? "Сделать основным"}
              </button>
              <button
                className="site-row-menu-item site-row-menu-item-danger"
                type="button"
                disabled={archiveDisabledReason !== null}
                title={archiveDisabledReason ?? undefined}
                onClick={() => onRequestArchiveSite(site)}
              >
                {archiveDisabledReason ?? "Архивировать"}
              </button>
            </>
          ) : (
            <span className="site-row-menu-note">Управление недоступно</span>
          )}
        </div>
      </details>
    </article>
  );
}

function SiteTabs({
  projectId,
  siteId,
  activeSection,
  disabled = false
}: {
  readonly projectId: string;
  readonly siteId: string;
  readonly activeSection: SiteSection;
  readonly disabled?: boolean;
}) {
  return (
    <nav className="site-local-tabs" aria-label="Разделы сайта">
      {siteTabs.map((tab) =>
        disabled ? (
          <span
            key={tab.id}
            className={activeSection === tab.id ? "site-local-tab active disabled" : "site-local-tab disabled"}
            aria-current={activeSection === tab.id ? "page" : undefined}
            aria-disabled="true"
          >
            {tab.label}
          </span>
        ) : (
          <Link
            key={tab.id}
            className={activeSection === tab.id ? "site-local-tab active" : "site-local-tab"}
            href={createSiteRoute(projectId, siteId, tab.id)}
            aria-current={activeSection === tab.id ? "page" : undefined}
          >
            {tab.label}
          </Link>
        )
      )}
    </nav>
  );
}

function SiteOverview({
  project,
  site,
  pages,
  publicationStatus,
  publicationSettings,
  canManageSites,
  onRequestArchiveSite,
  onRequestSetDefaultSite
}: {
  readonly project: ProjectSummary;
  readonly site: SiteSummary;
  readonly pages: readonly SitePageSummary[];
  readonly publicationStatus: PublicationStatusResponse | null;
  readonly publicationSettings: PublicationSettingsResponse | null;
  readonly canManageSites: boolean;
  readonly onRequestArchiveSite: (site: SiteSummary) => void;
  readonly onRequestSetDefaultSite: (site: SiteSummary) => void;
}) {
  return (
    <section className="site-overview-grid">
      <Panel title="Сводка сайта" className="site-overview-main">
        <div className="site-stat-grid">
          <Metric label="Статус" value={site.status === "ACTIVE" ? "Активен" : "Архив"} />
          <Metric label="Страницы" value={String(pages.length)} />
          <Metric label="Slug" value={`/${site.slug}`} />
          <Metric label="Создан" value={formatDateTime(site.createdAt)} />
          <Metric label="Обновлён" value={formatDateTime(site.updatedAt)} />
        </div>
        <div className="site-overview-badges">
          <SiteStatusBadge site={site} />
          {site.isDefault ? <DefaultSiteBadge /> : null}
          <PublicationBadge status={publicationStatus} />
        </div>
      </Panel>
      <Panel title="Быстрые действия">
        <p className="site-muted">
          Public handle: {publicationSettings?.publicHandle ?? "не настроен"}
        </p>
        <div className="site-action-stack">
          <Link className="ui-button ui-button-secondary ui-button-md" href={createSiteRoute(project.id, site.id, "pages")}>
            Страницы
          </Link>
          <Link className="ui-button ui-button-secondary ui-button-md" href={createSiteRoute(project.id, site.id, "publication")}>
            Публикация
          </Link>
          <Link className="ui-button ui-button-secondary ui-button-md" href={createSiteRoute(project.id, site.id, "settings")}>
            Настройки
          </Link>
          {canManageSites && !site.isDefault ? (
            <Button type="button" variant="secondary" onClick={() => onRequestSetDefaultSite(site)}>
              Сделать основным
            </Button>
          ) : null}
          {canManageSites && !site.isDefault && site.status === "ACTIVE" ? (
            <Button type="button" variant="danger" onClick={() => onRequestArchiveSite(site)}>
              Архивировать сайт
            </Button>
          ) : null}
        </div>
      </Panel>
    </section>
  );
}

function SitePagesSection({
  project,
  site,
  pages,
  form,
  canEditPages,
  onOpenCreatePage,
  onCloseCreatePage,
  onPageFormChange,
  onSubmitCreatePage
}: {
  readonly project: ProjectSummary;
  readonly site: SiteSummary;
  readonly pages: readonly SitePageSummary[];
  readonly form: PageFormState;
  readonly canEditPages: boolean;
  readonly onOpenCreatePage: () => void;
  readonly onCloseCreatePage: () => void;
  readonly onPageFormChange: (values: CreatePageFormValues) => void;
  readonly onSubmitCreatePage: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className="site-section-stack">
      <div className="site-list-toolbar">
        <div>
          <h2>Страницы сайта</h2>
          <p>Показываются только страницы сайта «{site.name}».</p>
        </div>
        {canEditPages ? (
          <Button type="button" variant="primary" onClick={onOpenCreatePage}>
            Добавить страницу
          </Button>
        ) : (
          <Badge tone="neutral">Только чтение</Badge>
        )}
      </div>
      {form.open ? (
        <CreatePageInlineForm
          form={form}
          onChange={onPageFormChange}
          onClose={onCloseCreatePage}
          onSubmit={onSubmitCreatePage}
        />
      ) : null}
      {pages.length === 0 ? (
        <EmptyState
          title="Страниц пока нет"
          description="Создайте первую страницу внутри текущего Site."
          action={
            canEditPages ? (
              <Button type="button" variant="primary" onClick={onOpenCreatePage}>
                Добавить страницу
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="site-page-list">
          {pages.map((page) => (
            <a
              key={page.id}
              className="site-page-row"
              href={createSitePageEditorRoute(project.id, site.id, page.id)}
            >
              <span>
                <strong>{page.title}</strong>
                <small>/{page.slug}</small>
              </span>
              {page.isHome ? <Badge tone="accent">Главная</Badge> : null}
              <StatusBadge status={page.status === "PUBLISHED" ? "published" : "draft"}>
                {page.status === "PUBLISHED" ? "Опубликована" : "Черновик"}
              </StatusBadge>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

function SiteSettingsSection({
  site,
  form,
  canManageSites,
  onChange,
  onSubmit,
  onRequestArchiveSite,
  onRequestSetDefaultSite
}: {
  readonly site: SiteSummary;
  readonly form: SiteDetailsFormState;
  readonly canManageSites: boolean;
  readonly onChange: (values: UpdateSiteFormValues) => void;
  readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  readonly onRequestArchiveSite: (site: SiteSummary) => void;
  readonly onRequestSetDefaultSite: (site: SiteSummary) => void;
}) {
  return (
    <section className="site-settings-grid">
      <Panel title="Основная информация">
        <form className="site-form-grid" onSubmit={onSubmit}>
          <Input
            label="Название сайта"
            value={form.values.name}
            disabled={!canManageSites || form.submitting}
            onChange={(event) =>
              onChange({
                ...form.values,
                name: event.currentTarget.value
              })
            }
          />
          <Input
            label="Slug"
            value={form.values.slug}
            disabled={!canManageSites || form.submitting}
            {...(form.errorMessage === undefined ? {} : { error: form.errorMessage })}
            onChange={(event) =>
              onChange({
                ...form.values,
                slug: event.currentTarget.value
              })
            }
          />
          {form.successMessage === undefined ? null : (
            <p className="site-success-message">{form.successMessage}</p>
          )}
          <Button
            type="submit"
            variant="primary"
            disabled={!canManageSites || form.submitting}
            loading={form.submitting}
          >
            Сохранить
          </Button>
        </form>
      </Panel>
      <Panel title="Состояние сайта">
        <div className="site-action-stack">
          <SiteStatusBadge site={site} />
          {site.isDefault ? <DefaultSiteBadge /> : null}
          <Metric label="Создан" value={formatDateTime(site.createdAt)} />
          <Metric label="Обновлён" value={formatDateTime(site.updatedAt)} />
          {canManageSites && !site.isDefault ? (
            <Button type="button" variant="secondary" onClick={() => onRequestSetDefaultSite(site)}>
              Сделать основным
            </Button>
          ) : null}
          {canManageSites && !site.isDefault && site.status === "ACTIVE" ? (
            <Button type="button" variant="danger" onClick={() => onRequestArchiveSite(site)}>
              Архивировать сайт
            </Button>
          ) : null}
        </div>
      </Panel>
    </section>
  );
}

function SitePublicationSection({
  settings,
  status,
  form,
  canManageSites,
  onHandleChange,
  onSubmit
}: {
  readonly settings: PublicationSettingsResponse | null;
  readonly status: PublicationStatusResponse | null;
  readonly form: PublicationFormState;
  readonly canManageSites: boolean;
  readonly onHandleChange: (value: string) => void;
  readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className="site-settings-grid">
      <Panel title="Публикация">
        <form className="site-form-grid" onSubmit={onSubmit}>
          <Input
            label="Public handle"
            value={form.publicHandle}
            disabled={!canManageSites || form.submitting}
            {...(form.errorMessage === undefined ? {} : { error: form.errorMessage })}
            {...(settings === null ? {} : { hint: `URL: ${settings.projectPublicUrl}` })}
            onChange={(event) => onHandleChange(event.currentTarget.value)}
          />
          {form.successMessage === undefined ? null : (
            <p className="site-success-message">{form.successMessage}</p>
          )}
          <Button
            type="submit"
            variant="primary"
            disabled={!canManageSites || form.submitting}
            loading={form.submitting}
          >
            Сохранить публикацию
          </Button>
        </form>
      </Panel>
      <Panel title="Статус">
        <PublicationBadge status={status} />
        <p className="site-muted">
          {status?.publicUrl ?? "У сайта пока нет опубликованной страницы."}
        </p>
      </Panel>
    </section>
  );
}

function CreateSiteDialog({
  form,
  onClose,
  onChange,
  onSubmit
}: {
  readonly form: SiteFormState;
  readonly onClose: () => void;
  readonly onChange: (values: CreateSiteFormValues, slugEdited: boolean) => void;
  readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="account-modal-backdrop">
      <form className="account-confirm-modal" onSubmit={onSubmit}>
        <h2>Создать сайт</h2>
        <p>Создайте пустой сайт. Шаблон можно будет выбрать позже.</p>
        <Input
          label="Название сайта"
          value={form.values.name}
          disabled={form.submitting}
          onChange={(event) =>
            onChange(
              {
                ...form.values,
                name: event.currentTarget.value
              },
              false
            )
          }
        />
        <Input
          label="Slug"
          value={form.values.slug}
          disabled={form.submitting}
          {...(form.errorMessage === undefined ? {} : { error: form.errorMessage })}
          onChange={(event) =>
            onChange(
              {
                ...form.values,
                slug: event.currentTarget.value
              },
              true
            )
          }
        />
        <div className="account-modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" variant="primary" loading={form.submitting}>
            Создать
          </Button>
        </div>
      </form>
    </div>
  );
}

function CreatePageInlineForm({
  form,
  onChange,
  onClose,
  onSubmit
}: {
  readonly form: PageFormState;
  readonly onChange: (values: CreatePageFormValues) => void;
  readonly onClose: () => void;
  readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="site-inline-form" onSubmit={onSubmit}>
      <Input
        label="Название страницы"
        value={form.values.title}
        disabled={form.submitting}
        onChange={(event) =>
          onChange({
            ...form.values,
            title: event.currentTarget.value
          })
        }
      />
      <Input
        label="Slug"
        value={form.values.slug}
        disabled={form.submitting}
        {...(form.errorMessage === undefined ? {} : { error: form.errorMessage })}
        onChange={(event) =>
          onChange({
            ...form.values,
            slug: event.currentTarget.value
          })
        }
      />
      <label className="ui-check-row">
        <input
          type="checkbox"
          checked={form.values.isHome}
          disabled={form.submitting}
          onChange={(event) =>
            onChange({
              ...form.values,
              isHome: event.currentTarget.checked
            })
          }
        />
        <span>
          <strong>Сделать главной</strong>
          <small>Главная страница уникальна внутри текущего Site.</small>
        </span>
      </label>
      <div className="account-modal-actions">
        <Button type="button" variant="secondary" onClick={onClose}>
          Отмена
        </Button>
        <Button type="submit" variant="primary" loading={form.submitting}>
          Добавить
        </Button>
      </div>
    </form>
  );
}

function ArchiveSiteDialog({
  action,
  submitting,
  errorMessage,
  onCancel,
  onConfirm
}: {
  readonly action: Exclude<ConfirmSiteAction, null>;
  readonly submitting: boolean;
  readonly errorMessage: string | undefined;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}) {
  const isArchive = action.type === "archive";

  return (
    <div className="account-modal-backdrop">
      <section className="account-confirm-modal" role="dialog" aria-modal="true">
        <h2>{isArchive ? "Архивировать сайт?" : "Сделать сайт основным?"}</h2>
        <p>
          {isArchive
            ? `Сайт «${action.site.name}» будет перемещён в архив.`
            : `Сайт «${action.site.name}» будет открываться по умолчанию для проекта.`}
        </p>
        <div className="account-confirm-warning">
          {isArchive
            ? "Его страницы и настройки сохранятся."
            : "Этот сайт будет открываться по умолчанию для проекта."}
        </div>
        {errorMessage === undefined ? null : (
          <p className="site-error-message" role="alert">
            {errorMessage}
          </p>
        )}
        <div className="account-modal-actions">
          <Button
            type="button"
            variant="secondary"
            disabled={submitting}
            onClick={onCancel}
          >
            Отмена
          </Button>
          <Button
            type="button"
            variant={isArchive ? "danger" : "primary"}
            loading={submitting}
            onClick={onConfirm}
          >
            {isArchive ? "Архивировать" : "Сделать основным"}
          </Button>
        </div>
      </section>
    </div>
  );
}

function SiteStatusBadge({ site }: { readonly site: SiteSummary }) {
  return site.status === "ACTIVE" ? (
    <Badge tone="success">Активен</Badge>
  ) : (
    <Badge tone="neutral">Архив</Badge>
  );
}

function DefaultSiteBadge() {
  return <Badge tone="accent">Основной</Badge>;
}

function PublicationBadge({
  status
}: {
  readonly status: PublicationStatusResponse | null;
}) {
  if (status === null) {
    return <StatusBadge status="draft">Не проверено</StatusBadge>;
  }

  const labelByStatus = {
    "never-published": "Не публиковался",
    "published-current": "Опубликован",
    "published-with-changes": "Есть изменения",
    unpublished: "Снят с публикации"
  } as const;
  const badgeStatusByStatus = {
    "never-published": "draft",
    "published-current": "published",
    "published-with-changes": "changed",
    unpublished: "error"
  } as const;

  return (
    <StatusBadge status={badgeStatusByStatus[status.status]}>
      {labelByStatus[status.status]}
    </StatusBadge>
  );
}

function Metric({
  label,
  value
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="site-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function currentTitle(section: SiteSection): string {
  switch (section) {
    case "overview":
      return "Обзор сайта";
    case "pages":
      return "Страницы сайта";
    case "settings":
      return "Настройки сайта";
    case "publication":
      return "Публикация сайта";
  }
}

function pluralizeSites(count: number): string {
  if (count % 10 === 1 && count % 100 !== 11) {
    return "сайт";
  }

  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
    return "сайта";
  }

  return "сайтов";
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
