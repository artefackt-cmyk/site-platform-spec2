import type { TenantContext } from "@site-platform/domain";
import type {
  Prisma,
  Project,
  PublishedPageSnapshot,
  PublishedPageState,
  Site
} from "@prisma/client";
import { validatePageDocument, type PageDocumentV2 } from "@site-platform/editor-core";
import { toPrismaJson } from "./page-document-repository";
import type { PrismaJsonInput, RepositoryPrismaClient } from "../types";
import type { SiteSettingsSnapshotJson } from "./project-site-settings-repository";

export type CreatePublishedPageSnapshotInput = {
  readonly tenantContext: TenantContext;
  readonly projectId: string;
  readonly pageId: string;
  readonly pageTitle: string;
  readonly pageSlug: string;
  readonly document: PageDocumentV2;
  readonly siteSettingsSnapshot?: SiteSettingsSnapshotJson | null;
  readonly sourceRevision: number;
  readonly publishedByUserId: string;
  readonly rollbackSourceSnapshotId?: string | null;
  readonly publishedAt?: Date;
};

export type ActivePublishedPageLookup = {
  readonly project: Project;
  readonly site: Site;
  readonly state: PublishedPageState;
  readonly snapshot: PublishedPageSnapshot;
};

export class PublishedPageSnapshotRepository {
  constructor(private readonly client: RepositoryPrismaClient) {}

  async create(
    input: CreatePublishedPageSnapshotInput
  ): Promise<PublishedPageSnapshot | null> {
    const page = await findActivePageInProject(
      this.client,
      input.tenantContext,
      input.projectId,
      input.pageId
    );

    if (page === null) {
      return null;
    }

    const validation = validatePageDocument(input.document);

    if (!validation.ok) {
      throw new Error("Published snapshot document must be valid PageDocument V2.");
    }

    const version = await this.getNextVersion(input.pageId);

    return this.client.publishedPageSnapshot.create({
      data: {
        organizationId: input.tenantContext.organizationId,
        projectId: input.projectId,
        siteId: page.siteId,
        pageId: input.pageId,
        version,
        pageTitle: input.pageTitle,
        pageSlug: input.pageSlug,
        documentJson: toPrismaJson(validation.document),
        ...(input.siteSettingsSnapshot === undefined ||
        input.siteSettingsSnapshot === null
          ? {}
          : {
              siteSettingsJson: toSnapshotJson(input.siteSettingsSnapshot)
            }),
        sourceRevision: input.sourceRevision,
        publishedByUserId: input.publishedByUserId,
        rollbackSourceSnapshotId: input.rollbackSourceSnapshotId ?? null,
        ...(input.publishedAt === undefined
          ? {}
          : {
              publishedAt: input.publishedAt,
              createdAt: input.publishedAt
            })
      }
    });
  }

  async listByPage(
    context: TenantContext,
    projectId: string,
    pageId: string
  ): Promise<readonly PublishedPageSnapshot[]> {
    return this.client.publishedPageSnapshot.findMany({
      where: snapshotScope(context, projectId, pageId),
      orderBy: {
        version: "desc"
      }
    });
  }

  async findByIdForPage(
    context: TenantContext,
    projectId: string,
    pageId: string,
    snapshotId: string
  ): Promise<PublishedPageSnapshot | null> {
    return this.client.publishedPageSnapshot.findFirst({
      where: {
        ...snapshotScope(context, projectId, pageId),
        id: snapshotId
      }
    });
  }

  async getLatestByPage(
    context: TenantContext,
    projectId: string,
    pageId: string
  ): Promise<PublishedPageSnapshot | null> {
    return this.client.publishedPageSnapshot.findFirst({
      where: snapshotScope(context, projectId, pageId),
      orderBy: {
        version: "desc"
      }
    });
  }

  async findActivePageByHandleAndSlug(
    publicHandle: string,
    pageSlug: string
  ): Promise<ActivePublishedPageLookup | null> {
    const state = await this.client.publishedPageState.findFirst({
      where: publicActiveStateScope(publicHandle, pageSlug),
      include: {
        activeSnapshot: true,
        project: true,
        site: true
      }
    });

    return state === null || state.activeSnapshot === null
      ? null
      : {
          project: state.project,
          site: state.site,
          state,
          snapshot: state.activeSnapshot
        };
  }

  async findActiveHomePageByHandle(
    publicHandle: string
  ): Promise<ActivePublishedPageLookup | null> {
    const state = await this.client.publishedPageState.findFirst({
      where: publicActiveStateScope(publicHandle, undefined, true),
      include: {
        activeSnapshot: true,
        project: true,
        site: true
      },
      orderBy: {
        publishedAt: "desc"
      }
    });

    return state === null || state.activeSnapshot === null
      ? null
      : {
          project: state.project,
          site: state.site,
          state,
          snapshot: state.activeSnapshot
        };
  }

  async listActivePagesForNavigation(
    publicHandle: string
  ): Promise<readonly ActivePublishedPageLookup[]> {
    const states = await this.client.publishedPageState.findMany({
      where: publicActiveStateScope(publicHandle),
      include: {
        activeSnapshot: true,
        project: true,
        site: true,
        page: true
      },
      orderBy: [
        {
          page: {
            isHome: "desc"
          }
        },
        {
          page: {
            createdAt: "asc"
          }
        }
      ]
    });

    return states.flatMap((state) =>
      state.activeSnapshot === null
        ? []
        : [
            {
              project: state.project,
              site: state.site,
              state,
              snapshot: state.activeSnapshot
            }
          ]
    );
  }

  private async getNextVersion(pageId: string): Promise<number> {
    const result = await this.client.publishedPageSnapshot.aggregate({
      where: {
        pageId
      },
      _max: {
        version: true
      }
    });

    return (result._max.version ?? 0) + 1;
  }
}

function toSnapshotJson(value: SiteSettingsSnapshotJson): PrismaJsonInput {
  return value as unknown as PrismaJsonInput;
}

function snapshotScope(
  context: TenantContext,
  projectId: string,
  pageId: string
) {
  return {
    organizationId: context.organizationId,
    projectId,
    pageId,
    page: {
      organizationId: context.organizationId,
      projectId,
      deletedAt: null,
      site: {
        organizationId: context.organizationId,
        projectId,
        status: "ACTIVE" as const
      },
      project: {
        organizationId: context.organizationId,
        deletedAt: null
      }
    }
  };
}

function publicActiveStateScope(
  publicHandle: string,
  pageSlug?: string,
  isHome?: boolean
): Prisma.PublishedPageStateWhereInput {
  return {
    activeSnapshotId: {
      not: null
    },
    project: {
      deletedAt: null,
    },
    site: {
      status: "ACTIVE",
      publicationSettings: {
        publicHandle
      }
    },
    page: {
      deletedAt: null,
      ...(isHome === undefined ? {} : { isHome })
    },
    activeSnapshot:
      pageSlug === undefined
        ? {
            isNot: null
          }
        : {
            is: {
              pageSlug
            }
          }
  };
}

async function findActivePageInProject(
  client: RepositoryPrismaClient,
  context: TenantContext,
  projectId: string,
  pageId: string
) {
  return client.sitePage.findFirst({
    where: {
      organizationId: context.organizationId,
      projectId,
      id: pageId,
      deletedAt: null,
      site: {
        organizationId: context.organizationId,
        projectId,
        status: "ACTIVE"
      },
      project: {
        organizationId: context.organizationId,
        deletedAt: null
      }
    }
  });
}
