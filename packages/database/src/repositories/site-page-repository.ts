import type { TenantContext } from "@site-platform/domain";
import type { PrismaClient, SitePage, SitePageStatus } from "@prisma/client";
import { ProjectRepository } from "./project-repository";
import { SiteRepository } from "./site-repository";
import type { RepositoryPrismaClient } from "../types";

export type CreateSitePageInput = {
  readonly title: string;
  readonly slug: string;
  readonly status?: SitePageStatus;
  readonly isHome?: boolean;
};

export type UpdateSitePageSettingsInput = {
  readonly title: string;
  readonly slug: string;
  readonly isHome: boolean;
};

export class SitePageRepository {
  constructor(private readonly client: RepositoryPrismaClient) {}

  async listByProject(
    context: TenantContext,
    projectId: string
  ): Promise<readonly SitePage[]> {
    const site = await new SiteRepository(this.client).findDefaultOrCreate(
      context,
      projectId
    );

    if (site === null) {
      return [];
    }

    return this.listBySite(context, projectId, site.id);
  }

  async listBySite(
    context: TenantContext,
    projectId: string,
    siteId: string
  ): Promise<readonly SitePage[]> {
    const site = await new SiteRepository(this.client).findById(
      context,
      projectId,
      siteId
    );

    if (site === null || site.status !== "ACTIVE") {
      return [];
    }

    return this.client.sitePage.findMany({
      where: activeSitePageScope(context, projectId, siteId),
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
    const site = await new SiteRepository(this.client).findDefaultOrCreate(
      context,
      projectId
    );

    if (site === null) {
      return null;
    }

    return this.findByIdForSite(context, projectId, site.id, pageId);
  }

  async findByIdForSite(
    context: TenantContext,
    projectId: string,
    siteId: string,
    pageId: string
  ): Promise<SitePage | null> {
    return this.client.sitePage.findFirst({
      where: {
        ...activeSitePageScope(context, projectId, siteId),
        id: pageId
      }
    });
  }

  async create(
    context: TenantContext,
    projectId: string,
    input: CreateSitePageInput
  ): Promise<SitePage | null> {
    const site = await new SiteRepository(this.client).findDefaultOrCreate(
      context,
      projectId
    );

    if (site === null) {
      return null;
    }

    return this.createForSite(context, projectId, site.id, input);
  }

  async createForSite(
    context: TenantContext,
    projectId: string,
    siteId: string,
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

    const site = await new SiteRepository(this.client).findById(
      context,
      projectId,
      siteId
    );

    if (site === null || site.status !== "ACTIVE") {
      return null;
    }

    if (input.isHome === true) {
      return this.runInTransaction((repository) =>
        repository.createInCurrentScope(context, projectId, siteId, input)
      );
    }

    return this.createInCurrentScope(context, projectId, siteId, input);
  }

  async softDelete(
    context: TenantContext,
    projectId: string,
    pageId: string
  ): Promise<SitePage | null> {
    const site = await new SiteRepository(this.client).findDefaultOrCreate(
      context,
      projectId
    );

    if (site === null) {
      return null;
    }

    const result = await this.client.sitePage.updateMany({
      where: {
        ...activeSitePageScope(context, projectId, site.id),
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
        siteId: site.id,
        id: pageId
      }
    });
  }

  async setHomePage(
    context: TenantContext,
    projectId: string,
    pageId: string
  ): Promise<SitePage | null> {
    const site = await new SiteRepository(this.client).findDefaultOrCreate(
      context,
      projectId
    );

    if (site === null) {
      return null;
    }

    return this.runInTransaction((repository) =>
      repository.setHomePageInCurrentScope(context, projectId, site.id, pageId)
    );
  }

  async updateSettings(
    context: TenantContext,
    projectId: string,
    pageId: string,
    input: UpdateSitePageSettingsInput
  ): Promise<SitePage | null> {
    const site = await new SiteRepository(this.client).findDefaultOrCreate(
      context,
      projectId
    );

    if (site === null) {
      return null;
    }

    return this.updateSettingsForSite(context, projectId, site.id, pageId, input);
  }

  async updateSettingsForSite(
    context: TenantContext,
    projectId: string,
    siteId: string,
    pageId: string,
    input: UpdateSitePageSettingsInput
  ): Promise<SitePage | null> {
    return this.runInTransaction((repository) =>
      repository.updateSettingsInCurrentScope(
        context,
        projectId,
        siteId,
        pageId,
        input
      )
    );
  }

  private async createInCurrentScope(
    context: TenantContext,
    projectId: string,
    siteId: string,
    input: CreateSitePageInput
  ): Promise<SitePage> {
    if (input.isHome === true) {
      await this.client.sitePage.updateMany({
        where: activeSitePageScope(context, projectId, siteId),
        data: {
          isHome: false
        }
      });
    }

    return this.client.sitePage.create({
      data: {
        organizationId: context.organizationId,
        projectId,
        siteId,
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
    siteId: string,
    pageId: string
  ): Promise<SitePage | null> {
    const page = await this.findByIdForSite(context, projectId, siteId, pageId);

    if (page === null) {
      return null;
    }

    await this.client.sitePage.updateMany({
      where: activeSitePageScope(context, projectId, siteId),
      data: {
        isHome: false
      }
    });

    await this.client.sitePage.updateMany({
      where: {
        ...activeSitePageScope(context, projectId, siteId),
        id: pageId
      },
      data: {
        isHome: true
      }
    });

    return this.findByIdForSite(context, projectId, siteId, pageId);
  }

  private async updateSettingsInCurrentScope(
    context: TenantContext,
    projectId: string,
    siteId: string,
    pageId: string,
    input: UpdateSitePageSettingsInput
  ): Promise<SitePage | null> {
    const page = await this.findByIdForSite(context, projectId, siteId, pageId);

    if (page === null) {
      return null;
    }

    if (input.isHome) {
      await this.client.sitePage.updateMany({
        where: activeSitePageScope(context, projectId, siteId),
        data: {
          isHome: false
        }
      });
    }

    const result = await this.client.sitePage.updateMany({
      where: {
        ...activeSitePageScope(context, projectId, siteId),
        id: pageId
      },
      data: {
        title: input.title,
        slug: input.slug,
        isHome: input.isHome
      }
    });

    if (result.count === 0) {
      return null;
    }

    return this.findByIdForSite(context, projectId, siteId, pageId);
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

function activeSitePageScope(
  context: TenantContext,
  projectId: string,
  siteId: string
) {
  return {
    organizationId: context.organizationId,
    projectId,
    siteId,
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
  };
}

type TransactionCapableClient = RepositoryPrismaClient &
  Pick<PrismaClient, "$transaction">;

function hasTransactionSupport(
  client: RepositoryPrismaClient
): client is TransactionCapableClient {
  return "$transaction" in client;
}
