import {
  createEmptyPageDocument,
  migratePageDocumentToLatest,
  validatePageDocument,
  type PageDocumentV2,
  type PageDocumentValidationError
} from "@site-platform/editor-core";
import type { TenantContext } from "@site-platform/domain";
import type { PageDocument } from "@prisma/client";
import { SitePageRepository } from "./site-page-repository";
import type { PrismaJsonInput, RepositoryPrismaClient } from "../types";

export const PAGE_DOCUMENT_REPOSITORY_ERROR_CODES = {
  revisionConflict: "PAGE_DOCUMENT_REVISION_CONFLICT",
  invalidDocument: "PAGE_DOCUMENT_INVALID"
} as const;

export type PageDocumentRepositoryErrorCode =
  (typeof PAGE_DOCUMENT_REPOSITORY_ERROR_CODES)[keyof typeof PAGE_DOCUMENT_REPOSITORY_ERROR_CODES];

export class PageDocumentRevisionConflictError extends Error {
  readonly code = PAGE_DOCUMENT_REPOSITORY_ERROR_CODES.revisionConflict;

  constructor() {
    super("Page document revision conflict.");
    this.name = "PageDocumentRevisionConflictError";
  }
}

export class PageDocumentInvalidError extends Error {
  readonly code = PAGE_DOCUMENT_REPOSITORY_ERROR_CODES.invalidDocument;
  readonly errors: readonly PageDocumentValidationError[];

  constructor(errors: readonly PageDocumentValidationError[]) {
    super("Page document is invalid.");
    this.name = "PageDocumentInvalidError";
    this.errors = errors;
  }
}

export type PageDocumentRecord = Omit<PageDocument, "document"> & {
  readonly document: PageDocumentV2;
};

export class PageDocumentRepository {
  constructor(private readonly client: RepositoryPrismaClient) {}

  async findByPage(
    context: TenantContext,
    projectId: string,
    pageId: string
  ): Promise<PageDocumentRecord | null> {
    const page = await new SitePageRepository(this.client).findById(
      context,
      projectId,
      pageId
    );

    if (page === null) {
      return null;
    }

    return this.findByPageForSite(context, projectId, page.siteId, pageId);
  }

  async findByPageForSite(
    context: TenantContext,
    projectId: string,
    siteId: string,
    pageId: string
  ): Promise<PageDocumentRecord | null> {
    const pageDocument = await this.client.pageDocument.findFirst({
      where: activePageDocumentScope(context, projectId, siteId, pageId)
    });

    return pageDocument === null ? null : toPageDocumentRecord(pageDocument);
  }

  async createDefault(
    context: TenantContext,
    projectId: string,
    pageId: string
  ): Promise<PageDocumentRecord | null> {
    const page = await new SitePageRepository(this.client).findById(
      context,
      projectId,
      pageId
    );

    if (page === null) {
      return null;
    }

    return this.createDefaultForSite(context, projectId, page.siteId, pageId);
  }

  async createDefaultForSite(
    context: TenantContext,
    projectId: string,
    siteId: string,
    pageId: string
  ): Promise<PageDocumentRecord | null> {
    const existingDocument = await this.findByPageForSite(
      context,
      projectId,
      siteId,
      pageId
    );

    if (existingDocument !== null) {
      return existingDocument;
    }

    const page = await new SitePageRepository(this.client).findByIdForSite(
      context,
      projectId,
      siteId,
      pageId
    );

    if (page === null) {
      return null;
    }

    const document = createEmptyPageDocument();
    const createdDocument = await this.client.pageDocument.create({
      data: {
        organizationId: context.organizationId,
        projectId,
        siteId,
        pageId,
        schemaVersion: document.schemaVersion,
        document: toPrismaJson(document),
        revision: 1
      }
    });

    return toPageDocumentRecord(createdDocument);
  }

  async save(
    context: TenantContext,
    projectId: string,
    pageId: string,
    document: unknown,
    expectedRevision: number
  ): Promise<PageDocumentRecord | null> {
    const page = await new SitePageRepository(this.client).findById(
      context,
      projectId,
      pageId
    );

    if (page === null) {
      return null;
    }

    return this.saveForSite(
      context,
      projectId,
      page.siteId,
      pageId,
      document,
      expectedRevision
    );
  }

  async saveForSite(
    context: TenantContext,
    projectId: string,
    siteId: string,
    pageId: string,
    document: unknown,
    expectedRevision: number
  ): Promise<PageDocumentRecord | null> {
    const validation = validatePageDocument(document);

    if (!validation.ok) {
      throw new PageDocumentInvalidError(validation.errors);
    }

    const result = await this.client.pageDocument.updateMany({
      where: {
        ...activePageDocumentScope(context, projectId, siteId, pageId),
        revision: expectedRevision
      },
      data: {
        schemaVersion: validation.document.schemaVersion,
        document: toPrismaJson(validation.document),
        revision: {
          increment: 1
        }
      }
    });

    if (result.count === 0) {
      const existingDocument = await this.findByPageForSite(
        context,
        projectId,
        siteId,
        pageId
      );

      if (existingDocument === null) {
        const page = await new SitePageRepository(this.client).findByIdForSite(
          context,
          projectId,
          siteId,
          pageId
        );

        return page === null
          ? null
          : this.createDefaultForSite(context, projectId, siteId, pageId);
      }

      throw new PageDocumentRevisionConflictError();
    }

    return this.findByPageForSite(context, projectId, siteId, pageId);
  }
}

function activePageDocumentScope(
  context: TenantContext,
  projectId: string,
  siteId: string,
  pageId: string
) {
  return {
    organizationId: context.organizationId,
    projectId,
    siteId,
    pageId,
    page: {
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
    }
  };
}

export function toPrismaJson(document: PageDocumentV2): PrismaJsonInput {
  return document as unknown as PrismaJsonInput;
}

function toPageDocumentRecord(pageDocument: PageDocument): PageDocumentRecord {
  const migration = migratePageDocumentToLatest(pageDocument.document);

  if (!migration.ok) {
    throw new PageDocumentInvalidError(migration.errors);
  }

  return {
    ...pageDocument,
    schemaVersion: migration.document.schemaVersion,
    document: migration.document
  };
}
