import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
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

    expect(html).toContain("Архивный сайт");
    expect(html).toContain("Архив");
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
});

function renderSiteManagement(
  section: "project-sites" | "overview" | "pages" | "settings" | "publication",
  input: {
    readonly user?: CurrentUserResponse;
    readonly sites?: readonly SiteSummary[];
    readonly pages?: readonly SitePageSummary[];
    readonly createSiteForm?: Parameters<typeof SiteManagementView>[0]["createSiteForm"];
    readonly canManageSites?: boolean;
    readonly canEditPages?: boolean;
  } = {}
): string {
  const state: SiteManagementLoadState = {
    status: "ready",
    project,
    user: input.user ?? user,
    sites: input.sites ?? sites,
    currentSite: section === "project-sites" ? null : mainSite,
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
      confirmAction={null}
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

