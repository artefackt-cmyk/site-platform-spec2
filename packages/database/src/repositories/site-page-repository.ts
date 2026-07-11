import type { TenantContext } from "@site-platform/domain";
import type { PrismaClient, SitePage, SitePageStatus } from "@prisma/client";
import { ProjectRepository } from "./project-repository";
import type { RepositoryPrismaClient } from "../types";

export type CreateSitePageInput = {
  readonly title: string;
  readonly slug: string;
  readonly status?: SitePageStatus;
  readonly isHome?: boolean;
};

export class SitePageRepository {
  constructor(private readonly client: RepositoryPrismaClient) {}

  async listByProject(
    context: TenantContext,
    projectId: string
  ): Promise<readonly SitePage[]> {
    return this.client.sitePage.findMany({
      where: activeSitePageScope(context, projectId),
      orderBy: [
        {
          isHome: "desc"
        },
        {
          createdAt: "asc"
        }
      ]
    });
  }

  async findById(
    context: TenantContext,
    projectId: string,
    pageId: string
  ): Promise<SitePage | null> {
    return this.client.sitePage.findFirst({
      where: {
        ...activeSitePageScope(context, projectId),
        id: pageId
      }
    });
  }

  async create(
    context: TenantContext,
    projectId: string,
    input: CreateSitePageInput
  ): Promise<SitePage | null> {
    const project = await new ProjectRepository(
      this.client
    ).findByTenantContextAndId({
      tenantContext: context,
      projectId
    });

    if (project === null) {
      return null;
    }

    if (input.isHome === true) {
      return this.runInTransaction((repository) =>
        repository.createInCurrentScope(context, projectId, input)
      );
    }

    return this.createInCurrentScope(context, projectId, input);
  }

  async softDelete(
    context: TenantContext,
    projectId: string,
    pageId: string
  ): Promise<SitePage | null> {
    const result = await this.client.sitePage.updateMany({
      where: {
        ...activeSitePageScope(context, projectId),
        id: pageId
      },
      data: {
        deletedAt: new Date()
      }
    });

    if (result.count === 0) {
      return null;
    }

    return this.client.sitePage.findFirst({
      where: {
        organizationId: context.organizationId,
        projectId,
        id: pageId
      }
    });
  }

  async setHomePage(
    context: TenantContext,
    projectId: string,
    pageId: string
  ): Promise<SitePage | null> {
    return this.runInTransaction((repository) =>
      repository.setHomePageInCurrentScope(context, projectId, pageId)
    );
  }

  private async createInCurrentScope(
    context: TenantContext,
    projectId: string,
    input: CreateSitePageInput
  ): Promise<SitePage> {
    if (input.isHome === true) {
      await this.client.sitePage.updateMany({
        where: activeSitePageScope(context, projectId),
        data: {
          isHome: false
        }
      });
    }

    return this.client.sitePage.create({
      data: {
        organizationId: context.organizationId,
        projectId,
        title: input.title,
        slug: input.slug,
        ...(input.status === undefined ? {} : { status: input.status }),
        ...(input.isHome === undefined ? {} : { isHome: input.isHome })
      }
    });
  }

  private async setHomePageInCurrentScope(
    context: TenantContext,
    projectId: string,
    pageId: string
  ): Promise<SitePage | null> {
    const page = await this.findById(context, projectId, pageId);

    if (page === null) {
      return null;
    }

    await this.client.sitePage.updateMany({
      where: activeSitePageScope(context, projectId),
      data: {
        isHome: false
      }
    });

    await this.client.sitePage.updateMany({
      where: {
        ...activeSitePageScope(context, projectId),
        id: pageId
      },
      data: {
        isHome: true
      }
    });

    return this.findById(context, projectId, pageId);
  }

  private async runInTransaction<TResult>(
    operation: (repository: SitePageRepository) => Promise<TResult>
  ): Promise<TResult> {
    if (hasTransactionSupport(this.client)) {
      return this.client.$transaction((transaction) =>
        operation(new SitePageRepository(transaction))
      );
    }

    return operation(this);
  }
}

function activeSitePageScope(context: TenantContext, projectId: string) {
  return {
    organizationId: context.organizationId,
    projectId,
    deletedAt: null,
    project: {
      organizationId: context.organizationId,
      deletedAt: null
    }
  };
}

type TransactionCapableClient = RepositoryPrismaClient &
  Pick<PrismaClient, "$transaction">;

function hasTransactionSupport(
  client: RepositoryPrismaClient
): client is TransactionCapableClient {
  return "$transaction" in client;
}
