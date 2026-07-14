import type { TenantContext } from "@site-platform/domain";
import type { PublishedPageState } from "@prisma/client";
import type { RepositoryPrismaClient } from "../types";

export type ActivatePublishedPageInput = {
  readonly tenantContext: TenantContext;
  readonly projectId: string;
  readonly pageId: string;
  readonly snapshotId: string;
  readonly publishedAt: Date;
};

export class PublishedPageStateRepository {
  constructor(private readonly client: RepositoryPrismaClient) {}

  async findByPage(
    context: TenantContext,
    projectId: string,
    pageId: string
  ): Promise<PublishedPageState | null> {
    return this.client.publishedPageState.findFirst({
      where: activeStateScope(context, projectId, pageId)
    });
  }

  async activate(
    input: ActivatePublishedPageInput
  ): Promise<PublishedPageState | null> {
    const page = await this.client.sitePage.findFirst({
      where: {
        organizationId: input.tenantContext.organizationId,
        projectId: input.projectId,
        id: input.pageId,
        deletedAt: null,
        site: {
          organizationId: input.tenantContext.organizationId,
          projectId: input.projectId,
          status: "ACTIVE"
        },
        project: {
          organizationId: input.tenantContext.organizationId,
          deletedAt: null
        }
      }
    });

    if (page === null) {
      return null;
    }

    return this.client.publishedPageState.upsert({
      where: {
        pageId: input.pageId
      },
      create: {
        organizationId: input.tenantContext.organizationId,
        projectId: input.projectId,
        siteId: page.siteId,
        pageId: input.pageId,
        activeSnapshotId: input.snapshotId,
        publishedAt: input.publishedAt,
        unpublishedAt: null
      },
      update: {
        activeSnapshotId: input.snapshotId,
        publishedAt: input.publishedAt,
        unpublishedAt: null
      }
    });
  }

  async unpublish(
    context: TenantContext,
    projectId: string,
    pageId: string,
    unpublishedAt: Date
  ): Promise<PublishedPageState | null> {
    const result = await this.client.publishedPageState.updateMany({
      where: activeStateScope(context, projectId, pageId),
      data: {
        activeSnapshotId: null,
        unpublishedAt
      }
    });

    if (result.count === 0) {
      return null;
    }

    return this.findByPage(context, projectId, pageId);
  }
}

function activeStateScope(
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
