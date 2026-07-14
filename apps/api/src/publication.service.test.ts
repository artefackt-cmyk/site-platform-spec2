import { describe, expect, it } from "vitest";
import type { AppConfig } from "@site-platform/config";
import { createEmptyPageDocument } from "@site-platform/editor-core";
import { PublicSiteService } from "./publication.service";

describe("PublicSiteService", () => {
  it("resolves public shell settings from the Site behind the public handle", async () => {
    const now = new Date("2026-07-14T12:00:00.000Z");
    const defaultSnapshot = createSnapshot({
      id: "snapshot-default",
      siteId: "site-default",
      pageId: "page-default",
      pageTitle: "Default Home",
      publishedAt: now
    });
    const secondSnapshot = createSnapshot({
      id: "snapshot-second",
      siteId: "site-second",
      pageId: "page-second",
      pageTitle: "Second Home",
      publishedAt: now
    });
    const stateByHandle = {
      "default-public": createState({
        siteId: "site-default",
        siteName: "Default Site",
        pageId: "page-default",
        snapshot: defaultSnapshot
      }),
      "second-public": createState({
        siteId: "site-second",
        siteName: "Second Site",
        pageId: "page-second",
        snapshot: secondSnapshot
      })
    } as const;
    const settingsBySiteId = new Map([
      [
        "site-default",
        createSiteSettingsRecord({
          siteId: "site-default",
          brandText: "Default Site Shell",
          footerText: "Default Site Footer",
          pageId: "page-default"
        })
      ],
      [
        "site-second",
        createSiteSettingsRecord({
          siteId: "site-second",
          brandText: "Second Site Shell",
          footerText: "Second Site Footer",
          pageId: "page-second"
        })
      ]
    ]);
    const client = {
      publishedPageState: {
        findFirst: async ({ where }: { readonly where: PublicStateWhere }) =>
          stateByHandle[where.site.publicationSettings.publicHandle] ?? null,
        findMany: async ({ where }: { readonly where: PublicStateWhere }) => {
          const state =
            stateByHandle[where.site.publicationSettings.publicHandle] ?? null;

          return state === null ? [] : [state];
        }
      },
      projectPublicationSettings: {
        findUnique: async ({
          where
        }: {
          readonly where: { readonly publicHandle: string };
        }) =>
          where.publicHandle in stateByHandle
            ? {
                projectId: "project"
              }
            : null
      },
      projectSiteSettings: {
        findFirst: async ({ where }: { readonly where: { readonly siteId?: string } }) =>
          where.siteId === undefined
            ? settingsBySiteId.get("site-default") ?? null
            : settingsBySiteId.get(where.siteId) ?? null
      },
      product: {
        findMany: async () => []
      }
    };
    const service = new PublicSiteService(client as never, createTestConfig());

    const defaultPage = await service.getPublishedPage("default-public", "home");
    const secondPage = await service.getPublishedPage("second-public", "home");

    expect(defaultPage.siteSettings.header.brandText).toBe("Default Site Shell");
    expect(defaultPage.siteSettings.footer.brandText).toBe("Default Site Footer");
    expect(defaultPage.navigation).toEqual([
      expect.objectContaining({
        pageId: "page-default",
        publicUrl: "http://localhost:3001/s/default-public/home"
      })
    ]);
    expect(secondPage.siteSettings.header.brandText).toBe("Second Site Shell");
    expect(secondPage.siteSettings.footer.brandText).toBe("Second Site Footer");
    expect(secondPage.navigation).toEqual([
      expect.objectContaining({
        pageId: "page-second",
        publicUrl: "http://localhost:3001/s/second-public/home"
      })
    ]);

    settingsBySiteId.set(
      "site-second",
      createSiteSettingsRecord({
        siteId: "site-second",
        brandText: "Second Site Changed",
        footerText: "Second Site Changed Footer",
        pageId: "page-second"
      })
    );

    await expect(service.getPublishedPage("default-public", "home")).resolves.toMatchObject({
      siteSettings: {
        header: {
          brandText: "Default Site Shell"
        },
        footer: {
          brandText: "Default Site Footer"
        }
      }
    });
    await expect(service.getPublishedPage("second-public", "home")).resolves.toMatchObject({
      siteSettings: {
        header: {
          brandText: "Second Site Changed"
        },
        footer: {
          brandText: "Second Site Changed Footer"
        }
      }
    });
  });
});

type PublicStateWhere = {
  readonly site: {
    readonly publicationSettings: {
      readonly publicHandle: "default-public" | "second-public";
    };
  };
};

function createSnapshot(input: {
  readonly id: string;
  readonly siteId: string;
  readonly pageId: string;
  readonly pageTitle: string;
  readonly publishedAt: Date;
}) {
  return {
    id: input.id,
    organizationId: "org",
    projectId: "project",
    siteId: input.siteId,
    pageId: input.pageId,
    version: 1,
    pageTitle: input.pageTitle,
    pageSlug: "home",
    documentJson: createEmptyPageDocument(),
    siteSettingsJson: null,
    sourceRevision: 1,
    rollbackSourceSnapshotId: null,
    publishedByUserId: "user",
    publishedAt: input.publishedAt,
    createdAt: input.publishedAt
  };
}

function createState(input: {
  readonly siteId: string;
  readonly siteName: string;
  readonly pageId: string;
  readonly snapshot: ReturnType<typeof createSnapshot>;
}) {
  return {
    id: `state-${input.siteId}`,
    organizationId: "org",
    projectId: "project",
    siteId: input.siteId,
    pageId: input.pageId,
    activeSnapshotId: input.snapshot.id,
    activeSnapshot: input.snapshot,
    publishedAt: input.snapshot.publishedAt,
    unpublishedAt: null,
    createdAt: input.snapshot.publishedAt,
    updatedAt: input.snapshot.publishedAt,
    project: {
      id: "project",
      organizationId: "org",
      name: "Shared Project",
      slug: "shared-project",
      status: "ACTIVE",
      createdAt: input.snapshot.publishedAt,
      updatedAt: input.snapshot.publishedAt,
      deletedAt: null
    },
    site: {
      id: input.siteId,
      organizationId: "org",
      projectId: "project",
      name: input.siteName,
      slug: input.siteId,
      status: "ACTIVE",
      isDefault: input.siteId === "site-default",
      createdAt: input.snapshot.publishedAt,
      updatedAt: input.snapshot.publishedAt
    }
  };
}

function createSiteSettingsRecord(input: {
  readonly siteId: string;
  readonly brandText: string;
  readonly footerText: string;
  readonly pageId: string;
}) {
  return {
    id: `settings-${input.siteId}`,
    organizationId: "org",
    projectId: "project",
    siteId: input.siteId,
    headerEnabled: true,
    footerEnabled: true,
    headerDraft: {
      brandText: input.brandText,
      logoUrl: "",
      navigation: [
        {
          label: input.brandText,
          type: "page",
          pageId: input.pageId
        }
      ],
      cartLinkEnabled: true,
      ctaLabel: "",
      ctaUrl: ""
    },
    footerDraft: {
      brandText: input.footerText,
      description: "",
      email: "",
      phone: "",
      legalText: "",
      copyrightText: input.footerText
    },
    revision: 1,
    createdAt: new Date("2026-07-14T12:00:00.000Z"),
    updatedAt: new Date("2026-07-14T12:00:00.000Z")
  };
}

function createTestConfig(): AppConfig {
  return {
    web: {
      publicStorefrontUrl: "http://localhost:3001",
      publicApiUrl: "http://localhost:3002"
    },
    media: {
      storageDir: "/tmp/mercurio-test-media",
      publicBaseUrl: "http://localhost:3002/media"
    }
  } as AppConfig;
}
