import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MerkurioThemeProvider } from "@site-platform/ui";
import type {
  CurrentUserResponse,
  ProjectSummary,
  SitePageSummary,
  SiteSummary
} from "./dashboard-types";
import {
  SiteManagementView,
  type SiteManagementLoadState
} from "./site-management-view";
import { createSitePageEditorRoute, createSiteRoute } from "./site-routes";

describe("SiteManagementView", () => {
  it("renders all project sites and the default badge", () => {
    const html = renderSiteManagement("project-sites");

    expect(html).toContain("Основной сайт");
    expect(html).toContain("B2B для бизнеса");
    expect(html).toContain("Основной");
  });

  it("renders archived sites with status", () => {
    const html = renderSiteManagement("project-sites", {
      sites: [...sites, archivedSite]
    });

    expect(html).toContain("Активные сайты");
    expect(html).toContain("Архив");
    expect(html).toContain("Архивный сайт");
    expect(html).toContain("Архив");
  });

  it("renders 20+ sites without dropping rows", () => {
    const manySites = Array.from({ length: 22 }, (_, index) => ({
      ...secondSite,
      id: `site-${index + 1}`,
      name: `Site ${index + 1}`,
      slug: `site-${index + 1}`,
      isDefault: index === 0
    }));
    const html = renderSiteManagement("project-sites", {
      sites: manySites
    });

    expect(html).toContain("22 активных");
    expect(html).toContain("Site 22");
  });

  it("keeps long site name and slug inside the row", () => {
    const html = renderSiteManagement("project-sites", {
      sites: [
        {
          ...mainSite,
          name: "Очень длинное название сайта для проверки переполнения строки",
          slug: "very-long-site-slug-for-checking-row-overflow-and-actions-menu"
        }
      ]
    });

    expect(html).toContain("Очень длинное название сайта");
    expect(html).toContain("very-long-site-slug-for-checking-row-overflow");
    expect(html).toContain("Действия сайта");
  });

  it("renders create site dialog and duplicate slug error", () => {
    const html = renderSiteManagement("project-sites", {
      createSiteForm: {
        open: true,
        values: {
          name: "Основной сайт",
          slug: "main"
        },
        slugEdited: true,
        submitting: false,
        errorMessage: "Сайт с таким slug уже существует в проекте."
      }
    });

    expect(html).toContain("Создать сайт");
    expect(html).toContain("Сайт с таким slug уже существует");
  });

  it("preserves the current section when switching sites", () => {
    const html = renderSiteManagement("settings");

    expect(html).toContain(createSiteRoute(project.id, secondSite.id, "settings"));
  });

  it("preserves overview, pages, settings and publication sections in switcher links", () => {
    expect(renderSiteManagement("overview")).toContain(
      createSiteRoute(project.id, secondSite.id, "overview")
    );
    expect(renderSiteManagement("pages")).toContain(
      createSiteRoute(project.id, secondSite.id, "pages")
    );
    expect(renderSiteManagement("settings")).toContain(
      createSiteRoute(project.id, secondSite.id, "settings")
    );
    expect(renderSiteManagement("publication")).toContain(
      createSiteRoute(project.id, secondSite.id, "publication")
    );
  });

  it("does not transfer pageId when switching sites", () => {
    const html = renderSiteManagement("pages");

    expect(html).toContain(createSiteRoute(project.id, secondSite.id, "pages"));
    expect(html).not.toContain(`${secondSite.id}/pages/page-a`);
  });

  it("links page rows with the current siteId", () => {
    const html = renderSiteManagement("pages");

    expect(html).toContain(createSitePageEditorRoute(project.id, mainSite.id, "page-a"));
  });

  it("does not render another site's pages in the current site page list", () => {
    const html = renderSiteManagement("pages", {
      pages: [mainPage]
    });

    expect(html).toContain("Главная");
    expect(html).not.toContain("B2B Главная");
  });

  it("renders settings for the current site", () => {
    const html = renderSiteManagement("settings");

    expect(html).toContain("Настройки сайта");
    expect(html).toContain("main");
  });

  it("renders publication settings for the current site", () => {
    const html = renderSiteManagement("publication");

    expect(html).toContain("Public handle");
    expect(html).toContain("demo-main");
  });

  it("renders site overview with required facts and quick links", () => {
    const html = renderSiteManagement("overview");

    expect(html).toContain("Сводка сайта");
    expect(html).toContain("Создан");
    expect(html).toContain(createSiteRoute(project.id, mainSite.id, "pages"));
    expect(html).toContain(createSiteRoute(project.id, mainSite.id, "publication"));
    expect(html).toContain(createSiteRoute(project.id, mainSite.id, "settings"));
  });

  it("shows search affordance for 20+ active sites in the switcher", () => {
    const manySites = Array.from({ length: 22 }, (_, index) => ({
      ...secondSite,
      id: `site-${index + 1}`,
      name: `Site ${index + 1}`,
      slug: `site-${index + 1}`,
      isDefault: index === 0
    }));
    const html = renderSiteManagement("overview", {
      sites: manySites,
      currentSite: manySites[0] ?? null
    });

    expect(html).toContain("Поиск сайта");
    expect(html).toContain("Site 22");
  });

  it("excludes archived sites from normal switcher options", () => {
    const html = renderSiteManagement("overview", {
      sites: [...sites, archivedSite]
    });

    expect(html).not.toContain(createSiteRoute(project.id, archivedSite.id, "overview"));
  });

  it("renders archived current site state without normal site content", () => {
    const html = renderSiteManagement("settings", {
      sites: [...sites, archivedSite],
      currentSite: archivedSite
    });

    expect(html).toContain("Сайт в архиве");
    expect(html).toContain("Вернуться к списку сайтов");
    expect(html).not.toContain("Основная информация");
  });

  it("renders not-found state when route siteId is outside the resolved project sites", () => {
    const html = renderSiteManagement("overview", {
      currentSite: null
    });

    expect(html).toContain("Сайт не найден");
  });

  it("hides manage actions for viewer", () => {
    const html = renderSiteManagement("project-sites", {
      user: {
        ...user,
        role: "VIEWER"
      },
      canManageSites: false,
      canEditPages: false
    });

    expect(html).toContain("Только чтение");
    expect(html).not.toContain("Сделать основным");
    expect(html).not.toContain("Архивировать");
  });

  it("hides archive and set-default for editor", () => {
    const html = renderSiteManagement("settings", {
      user: {
        ...user,
        role: "EDITOR"
      },
      canManageSites: false,
      canEditPages: true
    });

    expect(html).not.toContain("Сделать основным");
    expect(html).not.toContain("Архивировать сайт");
  });

  it("does not enable default-site archive or repeated set-default", () => {
    const html = renderSiteManagement("project-sites", {
      sites: [mainSite, secondSite]
    });

    expect(html).toContain("Уже основной");
    expect(html).toContain("Нельзя архивировать основной");
  });

  it("does not enable archive for the only active site", () => {
    const html = renderSiteManagement("project-sites", {
      sites: [{ ...secondSite, isDefault: false }]
    });

    expect(html).toContain("Единственный активный");
  });

  it("renders confirm action backend errors", () => {
    const html = renderSiteManagement("project-sites", {
      confirmAction: {
        type: "archive",
        site: secondSite
      },
      confirmActionError: "У пользователя нет прав на это действие."
    });

    expect(html).toContain("Архивировать сайт?");
    expect(html).toContain("У пользователя нет прав на это действие.");
  });
});

function renderSiteManagement(
  section: "project-sites" | "overview" | "pages" | "settings" | "publication",
  input: {
    readonly user?: CurrentUserResponse;
    readonly sites?: readonly SiteSummary[];
    readonly pages?: readonly SitePageSummary[];
    readonly currentSite?: SiteSummary | null;
    readonly createSiteForm?: Parameters<typeof SiteManagementView>[0]["createSiteForm"];
    readonly confirmAction?: Parameters<typeof SiteManagementView>[0]["confirmAction"];
    readonly confirmActionError?: string;
    readonly canManageSites?: boolean;
    readonly canEditPages?: boolean;
  } = {}
): string {
  const state: SiteManagementLoadState = {
    status: "ready",
    project,
    user: input.user ?? user,
    sites: input.sites ?? sites,
    currentSite:
      input.currentSite !== undefined
        ? input.currentSite
        : section === "project-sites"
          ? null
          : mainSite,
    pages: input.pages ?? (section === "project-sites" ? [mainPage, secondPage] : [mainPage]),
    siteSettings: {
      projectId: project.id,
      siteId: mainSite.id,
      revision: 1,
      headerEnabled: true,
      footerEnabled: true,
      header: {
        brandText: "KRAPIVA",
        logoUrl: "",
        navigation: [],
        cartLinkEnabled: true,
        ctaLabel: "",
        ctaUrl: ""
      },
      footer: {
        brandText: "KRAPIVA",
        description: "",
        email: "",
        phone: "",
        legalText: "",
        copyrightText: "© KRAPIVA"
      }
    },
    publicationSettings: {
      publicHandle: "demo-main",
      basePublicUrl: "https://example.test/s",
      projectPublicUrl: "https://example.test/s/demo-main",
      constraints: {
        minLength: 3,
        maxLength: 64,
        pattern: "^[a-z0-9-]+$",
        reserved: []
      }
    },
    publicationStatus: {
      status: "published-current",
      publicUrl: "https://example.test/s/demo-main",
      activeSnapshotId: "snapshot-1",
      activeVersion: 1,
      publishedAt: "2026-01-01T00:00:00.000Z"
    }
  };

  return renderToStaticMarkup(
    <MerkurioThemeProvider>
      <SiteManagementView
      state={state}
      section={section}
      createSiteForm={
        input.createSiteForm ?? {
          open: false,
          values: {
            name: "",
            slug: ""
          },
          slugEdited: false,
          submitting: false,
          errorMessage: undefined
        }
      }
      siteDetailsForm={{
        values: {
          name: mainSite.name,
          slug: mainSite.slug
        },
        submitting: false,
        errorMessage: undefined,
        successMessage: undefined
      }}
      pageForm={{
        open: false,
        values: {
          title: "",
          slug: "",
          isHome: false
        },
        submitting: false,
        errorMessage: undefined
      }}
      publicationForm={{
        publicHandle: "demo-main",
        submitting: false,
        errorMessage: undefined,
        successMessage: undefined
      }}
      confirmAction={input.confirmAction ?? null}
      confirmActionSubmitting={false}
      confirmActionError={input.confirmActionError}
      canManageSites={input.canManageSites ?? true}
      canEditPages={input.canEditPages ?? true}
      onOpenCreateSite={() => undefined}
      onCloseCreateSite={() => undefined}
      onCreateSiteChange={() => undefined}
      onSubmitCreateSite={() => undefined}
      onSiteDetailsChange={() => undefined}
      onSubmitSiteDetails={() => undefined}
      onOpenCreatePage={() => undefined}
      onCloseCreatePage={() => undefined}
      onPageFormChange={() => undefined}
      onSubmitCreatePage={() => undefined}
      onPublicationHandleChange={() => undefined}
      onSubmitPublicationSettings={() => undefined}
      onRequestArchiveSite={() => undefined}
      onRequestSetDefaultSite={() => undefined}
      onCancelConfirmAction={() => undefined}
      onConfirmSiteAction={() => undefined}
      />
    </MerkurioThemeProvider>
  );
}

const project: ProjectSummary = {
  id: "project-1",
  name: "KRAPIVA",
  slug: "krapiva",
  status: "ACTIVE",
  createdAt: "2026-01-01T00:00:00.000Z"
};

const user: CurrentUserResponse = {
  user: {
    id: "user-1",
    email: "owner@example.test",
    displayName: "Owner"
  },
  activeOrganization: {
    id: "org-1",
    name: "Digital Spirit",
    slug: "digital-spirit"
  },
  role: "OWNER",
  onboarding: {
    completed: true,
    completedAt: "2026-01-01T00:00:00.000Z"
  }
};

const mainSite: SiteSummary = {
  id: "site-main",
  projectId: project.id,
  name: "Основной сайт",
  slug: "main",
  status: "ACTIVE",
  isDefault: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z"
};

const secondSite: SiteSummary = {
  id: "site-b2b",
  projectId: project.id,
  name: "B2B для бизнеса",
  slug: "b2b",
  status: "ACTIVE",
  isDefault: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-03T00:00:00.000Z"
};

const archivedSite: SiteSummary = {
  id: "site-archived",
  projectId: project.id,
  name: "Архивный сайт",
  slug: "archive",
  status: "ARCHIVED",
  isDefault: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-04T00:00:00.000Z"
};

const sites = [mainSite, secondSite] as const;

const mainPage: SitePageSummary = {
  id: "page-a",
  projectId: project.id,
  siteId: mainSite.id,
  title: "Главная",
  slug: "home",
  status: "DRAFT",
  isHome: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z"
};

const secondPage: SitePageSummary = {
  id: "page-b",
  projectId: project.id,
  siteId: secondSite.id,
  title: "B2B Главная",
  slug: "b2b-home",
  status: "DRAFT",
  isHome: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z"
};
