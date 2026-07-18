import type { TenantContext } from "@site-platform/domain";
import type { PrismaClient, Site, SiteStatus } from "@prisma/client";
import { ProjectRepository } from "./project-repository";
import type { RepositoryPrismaClient } from "../types";

export type CreateSiteInput = {
  readonly tenantContext: TenantContext;
  readonly projectId: string;
  readonly name: string;
  readonly slug: string;
  readonly isDefault?: boolean;
  readonly status?: SiteStatus;
};

export type UpdateSiteInput = {
  readonly tenantContext: TenantContext;
  readonly projectId: string;
  readonly siteId: string;
  readonly name?: string;
  readonly slug?: string;
};

export class SiteRepository {
  constructor(private readonly client: RepositoryPrismaClient) {}

  async listByProject(
    context: TenantContext,
    projectId: string
  ): Promise<readonly Site[]> {
    return this.listByProjectWithScope(context, projectId, activeSiteScope(context, projectId));
  }

  async listAllByProject(
    context: TenantContext,
    projectId: string
  ): Promise<readonly Site[]> {
    return this.listByProjectWithScope(context, projectId, siteScope(context, projectId));
  }

  private async listByProjectWithScope(
    context: TenantContext,
    projectId: string,
    scope: ReturnType<typeof siteScope>
  ): Promise<readonly Site[]> {
    const project = await new ProjectRepository(
      this.client
    ).findByTenantContextAndId({
      tenantContext: context,
      projectId
    });

    if (project === null) {
      return [];
    }

    return this.client.site.findMany({
      where: scope,
      orderBy: [
        {
          isDefault: "desc"
        },
        {
          status: "asc"
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
    siteId: string
  ): Promise<Site | null> {
    return this.client.site.findFirst({
      where: {
        ...siteScope(context, projectId),
        id: siteId
      }
    });
  }

  async findDefault(
    context: TenantContext,
    projectId: string
  ): Promise<Site | null> {
    return this.client.site.findFirst({
      where: {
        ...activeSiteScope(context, projectId),
        isDefault: true
      }
    });
  }

  async findDefaultOrCreate(
    context: TenantContext,
    projectId: string
  ): Promise<Site | null> {
    const existing = await this.findDefault(context, projectId);

    if (existing !== null) {
      return existing;
    }

    const project = await new ProjectRepository(
      this.client
    ).findByTenantContextAndId({
      tenantContext: context,
      projectId
    });

    if (project === null) {
      return null;
    }

    return this.createDefaultForProject({
      organizationId: context.organizationId,
      projectId,
      name: project.name,
      slug: project.slug
    });
  }

  async create(input: CreateSiteInput): Promise<Site | null> {
    const project = await new ProjectRepository(
      this.client
    ).findByTenantContextAndId({
      tenantContext: input.tenantContext,
      projectId: input.projectId
    });

    if (project === null) {
      return null;
    }

    if (input.isDefault === true) {
      return this.runInTransaction((repository) =>
        repository.createInCurrentScope(input)
      );
    }

    return this.createInCurrentScope(input);
  }

  async createDefaultForProject(input: {
    readonly organizationId: string;
    readonly projectId: string;
    readonly name: string;
    readonly slug: string;
  }): Promise<Site> {
    return this.client.site.create({
      data: {
        organizationId: input.organizationId,
        projectId: input.projectId,
        name: input.name,
        slug: input.slug,
        status: "ACTIVE",
        isDefault: true
      }
    });
  }

  async update(input: UpdateSiteInput): Promise<Site | null> {
    const result = await this.client.site.updateMany({
      where: {
        ...activeSiteScope(input.tenantContext, input.projectId),
        id: input.siteId
      },
      data: {
        ...(input.name === undefined ? {} : { name: input.name }),
        ...(input.slug === undefined ? {} : { slug: input.slug })
      }
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(input.tenantContext, input.projectId, input.siteId);
  }

  async archive(
    context: TenantContext,
    projectId: string,
    siteId: string
  ): Promise<Site | null> {
    return this.runInTransaction((repository) =>
      repository.archiveInCurrentScope(context, projectId, siteId)
    );
  }

  async setDefault(
    context: TenantContext,
    projectId: string,
    siteId: string
  ): Promise<Site | null> {
    return this.runInTransaction((repository) =>
      repository.setDefaultInCurrentScope(context, projectId, siteId)
    );
  }

  private async createInCurrentScope(input: CreateSiteInput): Promise<Site> {
    if (input.isDefault === true) {
      await this.client.site.updateMany({
        where: activeSiteScope(input.tenantContext, input.projectId),
        data: {
          isDefault: false
        }
      });
    }

    return this.client.site.create({
      data: {
        organizationId: input.tenantContext.organizationId,
        projectId: input.projectId,
        name: input.name,
        slug: input.slug,
        ...(input.status === undefined ? {} : { status: input.status }),
        ...(input.isDefault === undefined ? {} : { isDefault: input.isDefault })
      }
    });
  }

  private async archiveInCurrentScope(
    context: TenantContext,
    projectId: string,
    siteId: string
  ): Promise<Site | null> {
    const site = await this.findById(context, projectId, siteId);

    if (site === null || site.status === "ARCHIVED") {
      return site;
    }

    const activeSites = await this.listByProject(context, projectId);

    if (activeSites.length <= 1) {
      throw new CannotArchiveOnlyActiveSiteError();
    }

    if (site.isDefault) {
      throw new CannotArchiveDefaultSiteError();
    }

    await this.client.site.update({
      where: {
        id: siteId
      },
      data: {
        status: "ARCHIVED"
      }
    });

    return this.findById(context, projectId, siteId);
  }

  private async setDefaultInCurrentScope(
    context: TenantContext,
    projectId: string,
    siteId: string
  ): Promise<Site | null> {
    const site = await this.findById(context, projectId, siteId);

    if (site === null || site.status !== "ACTIVE") {
      return null;
    }

    await this.client.site.updateMany({
      where: activeSiteScope(context, projectId),
      data: {
        isDefault: false
      }
    });

    await this.client.site.update({
      where: {
        id: siteId
      },
      data: {
        isDefault: true
      }
    });

    return this.findById(context, projectId, siteId);
  }

  private async runInTransaction<TResult>(
    operation: (repository: SiteRepository) => Promise<TResult>
  ): Promise<TResult> {
    if (hasTransactionSupport(this.client)) {
      return this.client.$transaction((transaction) =>
        operation(new SiteRepository(transaction))
      );
    }

    return operation(this);
  }
}

export const SITE_REPOSITORY_ERROR_CODES = {
  cannotArchiveOnlyActiveSite: "SITE_CANNOT_ARCHIVE_ONLY_ACTIVE",
  cannotArchiveDefaultSite: "SITE_CANNOT_ARCHIVE_DEFAULT"
} as const;

export class CannotArchiveOnlyActiveSiteError extends Error {
  readonly code = SITE_REPOSITORY_ERROR_CODES.cannotArchiveOnlyActiveSite;

  constructor() {
    super("Cannot archive the only active site in a project.");
    this.name = "CannotArchiveOnlyActiveSiteError";
  }
}

export class CannotArchiveDefaultSiteError extends Error {
  readonly code = SITE_REPOSITORY_ERROR_CODES.cannotArchiveDefaultSite;

  constructor() {
    super("Cannot archive the default site before choosing another default.");
    this.name = "CannotArchiveDefaultSiteError";
  }
}

function siteScope(context: TenantContext, projectId: string) {
  return {
    organizationId: context.organizationId,
    projectId,
    project: {
      organizationId: context.organizationId,
      deletedAt: null
    }
  };
}

function activeSiteScope(context: TenantContext, projectId: string) {
  return {
    ...siteScope(context, projectId),
    status: "ACTIVE" as const
  };
}

type TransactionCapableClient = RepositoryPrismaClient &
  Pick<PrismaClient, "$transaction">;

function hasTransactionSupport(
  client: RepositoryPrismaClient
): client is TransactionCapableClient {
  return "$transaction" in client;
}
