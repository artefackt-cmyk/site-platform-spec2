import { Inject, Injectable } from "@nestjs/common";
import type { AppConfig } from "@site-platform/config";
import {
  CannotArchiveDefaultSiteError,
  CannotArchiveOnlyActiveSiteError,
  PageDocumentInvalidError,
  PageDocumentRevisionConflictError,
  type PageDocumentRecord,
  type Project,
  type Site,
  type SitePage
} from "@site-platform/database";
import {
  PAGE_DOCUMENT_SCHEMA_VERSION,
  PAGE_SECTION_OPERATION_ERROR_CODES,
  PageSectionOperationError,
  addSectionAtEnd,
  collectPageDocumentImageAssetReferences,
  createDefaultBlock,
  createDefaultColumn,
  createDefaultSection,
  deleteSection,
  duplicateSection,
  hideSection,
  insertSectionAfter,
  insertSectionBefore,
  renameSection,
  reorderSectionsByIds,
  showSection,
  validatePageDocument,
  type SectionNode,
  type PageDocumentV2
} from "@site-platform/editor-core";
import {
  DOMAIN_ERROR_CODES,
  PERMISSIONS,
  hasPermission,
  type TenantContext,
  validatePageSlug,
  validatePageTitle,
  validateProjectName,
  validateProjectSlug
} from "@site-platform/domain";
import {
  API_ERROR_CODES,
  badRequest,
  conflict,
  forbidden,
  notFound,
  type ApiValidationIssue
} from "./api-errors";
import { APP_CONFIG } from "./app-config.provider";
import {
  CURRENT_IDENTITY_RESOLVER,
  type CurrentIdentityResolver
} from "./current-identity";
import {
  PROJECT_STORE,
  isPageSlugUniqueError,
  isProjectSlugUniqueError,
  type ProjectStore
} from "./project-store";
import { createMediaAssetUrl } from "./media.service";

export type ProjectResponse = {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  readonly createdAt: string;
};

export type ProjectsListResponse = {
  readonly projects: readonly ProjectResponse[];
};

export type CreateProjectResponse = {
  readonly project: ProjectResponse;
};

export type SitePageResponse = {
  readonly id: string;
  readonly projectId: string;
  readonly siteId: string;
  readonly title: string;
  readonly slug: string;
  readonly status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  readonly isHome: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type SiteResponse = {
  readonly id: string;
  readonly projectId: string;
  readonly name: string;
  readonly slug: string;
  readonly status: "ACTIVE" | "ARCHIVED";
  readonly isDefault: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type SitesListResponse = {
  readonly sites: readonly SiteResponse[];
};

export type CreateSiteResponse = {
  readonly site: SiteResponse;
};

export type UpdateSiteResponse = {
  readonly site: SiteResponse;
};

export type ProjectPagesListResponse = {
  readonly pages: readonly SitePageResponse[];
};

export type CreateProjectPageResponse = {
  readonly page: SitePageResponse;
};

export type UpdateProjectPageResponse = {
  readonly page: SitePageResponse;
};

export type PageDocumentResponse = {
  readonly pageId: string;
  readonly schemaVersion: 2;
  readonly revision: number;
  readonly document: PageDocumentV2;
};

export type PageSectionMutationResponse = PageDocumentResponse & {
  readonly selectedSectionId: string | null;
};

@Injectable()
export class ProjectsService {
  constructor(
    @Inject(CURRENT_IDENTITY_RESOLVER)
    private readonly currentIdentityResolver: CurrentIdentityResolver,
    @Inject(PROJECT_STORE) private readonly projectStore: ProjectStore,
    @Inject(APP_CONFIG) private readonly config: AppConfig
  ) {}

  async listProjects(): Promise<ProjectsListResponse> {
    const identity = await this.currentIdentityResolver.getCurrentIdentity();
    const projects = await this.projectStore.listByTenant(identity.tenantContext);

    return {
      projects: projects.map(toProjectResponse)
    };
  }

  async getProject(projectId: string): Promise<ProjectResponse> {
    const identity = await this.currentIdentityResolver.getCurrentIdentity();
    const project = await this.getProjectOrThrow(identity.tenantContext, projectId);

    return toProjectResponse(project);
  }

  async createProject(body: unknown): Promise<CreateProjectResponse> {
    const identity = await this.currentIdentityResolver.getCurrentIdentity();

    if (!hasPermission(identity.role, PERMISSIONS.projectCreate)) {
      throw forbidden(
        API_ERROR_CODES.permissionDenied,
        "Current user does not have permission to create projects."
      );
    }

    const payload = parseCreateProjectPayload(body);
    const existingProject = await this.projectStore.findByTenantAndSlug(
      identity.tenantContext,
      payload.slug
    );

    if (existingProject !== null) {
      throw duplicateSlugError();
    }

    try {
      const project = await this.projectStore.createDraftWithAudit({
        tenantContext: identity.tenantContext,
        name: payload.name,
        slug: payload.slug
      });

      return {
        project: toProjectResponse(project)
      };
    } catch (error) {
      if (isProjectSlugUniqueError(error)) {
        throw duplicateSlugError();
      }

      throw error;
    }
  }

  async listProjectSites(projectId: string): Promise<SitesListResponse> {
    const identity = await this.currentIdentityResolver.getCurrentIdentity();

    await this.getProjectOrThrow(identity.tenantContext, projectId);

    if (!hasPermission(identity.role, PERMISSIONS.projectRead)) {
      throw forbidden(
        API_ERROR_CODES.permissionDenied,
        "Current user does not have permission to read sites."
      );
    }

    const sites = await this.projectStore.listSitesByProject(
      identity.tenantContext,
      projectId
    );

    return {
      sites: sites.map(toSiteResponse)
    };
  }

  async createProjectSite(
    projectId: string,
    body: unknown
  ): Promise<CreateSiteResponse> {
    const identity = await this.currentIdentityResolver.getCurrentIdentity();

    await this.getProjectOrThrow(identity.tenantContext, projectId);

    if (!hasPermission(identity.role, PERMISSIONS.projectUpdate)) {
      throw forbidden(
        API_ERROR_CODES.permissionDenied,
        "Current user does not have permission to create sites."
      );
    }

    const payload = parseCreateSitePayload(body);

    try {
      const site = await this.projectStore.createSiteWithAudit({
        tenantContext: identity.tenantContext,
        projectId,
        name: payload.name,
        slug: payload.slug,
        isDefault: payload.isDefault
      });

      if (site === null) {
        throw siteNotFoundError();
      }

      return {
        site: toSiteResponse(site)
      };
    } catch (error) {
      if (isProjectSlugUniqueError(error)) {
        throw duplicateSiteSlugError();
      }

      throw error;
    }
  }

  async getProjectSite(projectId: string, siteId: string): Promise<SiteResponse> {
    const identity = await this.currentIdentityResolver.getCurrentIdentity();

    await this.getProjectOrThrow(identity.tenantContext, projectId);

    if (!hasPermission(identity.role, PERMISSIONS.projectRead)) {
      throw forbidden(
        API_ERROR_CODES.permissionDenied,
        "Current user does not have permission to read sites."
      );
    }

    const site = await this.getSiteOrThrow(
      identity.tenantContext,
      projectId,
      siteId
    );

    return toSiteResponse(site);
  }

  async updateProjectSite(
    projectId: string,
    siteId: string,
    body: unknown
  ): Promise<UpdateSiteResponse> {
    const identity = await this.currentIdentityResolver.getCurrentIdentity();

    await this.getProjectOrThrow(identity.tenantContext, projectId);

    if (!hasPermission(identity.role, PERMISSIONS.projectUpdate)) {
      throw forbidden(
        API_ERROR_CODES.permissionDenied,
        "Current user does not have permission to update sites."
      );
    }

    await this.getSiteOrThrow(identity.tenantContext, projectId, siteId);
    const payload = parseUpdateSitePayload(body);

    try {
      const site = await this.projectStore.updateSiteWithAudit({
        tenantContext: identity.tenantContext,
        projectId,
        siteId,
        ...payload
      });

      if (site === null) {
        throw siteNotFoundError();
      }

      return {
        site: toSiteResponse(site)
      };
    } catch (error) {
      if (isProjectSlugUniqueError(error)) {
        throw duplicateSiteSlugError();
      }

      throw error;
    }
  }

  async archiveProjectSite(
    projectId: string,
    siteId: string
  ): Promise<UpdateSiteResponse> {
    const identity = await this.currentIdentityResolver.getCurrentIdentity();

    await this.getProjectOrThrow(identity.tenantContext, projectId);

    if (!hasPermission(identity.role, PERMISSIONS.projectUpdate)) {
      throw forbidden(
        API_ERROR_CODES.permissionDenied,
        "Current user does not have permission to archive sites."
      );
    }

    try {
      const site = await this.projectStore.archiveSiteWithAudit(
        identity.tenantContext,
        projectId,
        siteId
      );

      if (site === null) {
        throw siteNotFoundError();
      }

      return {
        site: toSiteResponse(site)
      };
    } catch (error) {
      if (error instanceof CannotArchiveOnlyActiveSiteError) {
        throw badRequest(
          API_ERROR_CODES.siteCannotArchiveOnlyActive,
          "Cannot archive the only active site in a project."
        );
      }

      if (error instanceof CannotArchiveDefaultSiteError) {
        throw badRequest(
          API_ERROR_CODES.siteCannotArchiveDefault,
          "Cannot archive the default site before choosing another default."
        );
      }

      throw error;
    }
  }

  async setDefaultProjectSite(
    projectId: string,
    siteId: string
  ): Promise<UpdateSiteResponse> {
    const identity = await this.currentIdentityResolver.getCurrentIdentity();

    await this.getProjectOrThrow(identity.tenantContext, projectId);

    if (!hasPermission(identity.role, PERMISSIONS.projectUpdate)) {
      throw forbidden(
        API_ERROR_CODES.permissionDenied,
        "Current user does not have permission to update sites."
      );
    }

    const site = await this.projectStore.setDefaultSiteWithAudit(
      identity.tenantContext,
      projectId,
      siteId
    );

    if (site === null) {
      throw siteNotFoundError();
    }

    return {
      site: toSiteResponse(site)
    };
  }

  async listProjectPages(projectId: string): Promise<ProjectPagesListResponse> {
    const identity = await this.currentIdentityResolver.getCurrentIdentity();

    await this.getProjectOrThrow(identity.tenantContext, projectId);

    if (!hasPermission(identity.role, PERMISSIONS.pageRead)) {
      throw forbidden(
        API_ERROR_CODES.permissionDenied,
        "Current user does not have permission to read pages."
      );
    }

    const pages = await this.projectStore.listPagesByProject(
      identity.tenantContext,
      projectId
    );

    return {
      pages: pages.map(toSitePageResponse)
    };
  }

  async listSitePages(
    projectId: string,
    siteId: string
  ): Promise<ProjectPagesListResponse> {
    const identity = await this.currentIdentityResolver.getCurrentIdentity();

    await this.getProjectOrThrow(identity.tenantContext, projectId);
    await this.getSiteOrThrow(identity.tenantContext, projectId, siteId);

    if (!hasPermission(identity.role, PERMISSIONS.pageRead)) {
      throw forbidden(
        API_ERROR_CODES.permissionDenied,
        "Current user does not have permission to read pages."
      );
    }

    const pages = await this.projectStore.listPagesBySite(
      identity.tenantContext,
      projectId,
      siteId
    );

    return {
      pages: pages.map(toSitePageResponse)
    };
  }

  async createProjectPage(
    projectId: string,
    body: unknown
  ): Promise<CreateProjectPageResponse> {
    const identity = await this.currentIdentityResolver.getCurrentIdentity();

    await this.getProjectOrThrow(identity.tenantContext, projectId);

    if (!hasPermission(identity.role, PERMISSIONS.pageCreate)) {
      throw forbidden(
        API_ERROR_CODES.permissionDenied,
        "Current user does not have permission to create pages."
      );
    }

    const payload = parseCreatePagePayload(body);

    try {
      const page = await this.projectStore.createPageWithAudit({
        tenantContext: identity.tenantContext,
        projectId,
        title: payload.title,
        slug: payload.slug,
        isHome: payload.isHome
      });

      if (page === null) {
        throw projectNotFoundError();
      }

      return {
        page: toSitePageResponse(page)
      };
    } catch (error) {
      if (isPageSlugUniqueError(error)) {
        throw duplicatePageSlugError();
      }

      throw error;
    }
  }

  async createSitePage(
    projectId: string,
    siteId: string,
    body: unknown
  ): Promise<CreateProjectPageResponse> {
    const identity = await this.currentIdentityResolver.getCurrentIdentity();

    await this.getProjectOrThrow(identity.tenantContext, projectId);
    await this.getSiteOrThrow(identity.tenantContext, projectId, siteId);

    if (!hasPermission(identity.role, PERMISSIONS.pageCreate)) {
      throw forbidden(
        API_ERROR_CODES.permissionDenied,
        "Current user does not have permission to create pages."
      );
    }

    const payload = parseCreatePagePayload(body);

    try {
      const page = await this.projectStore.createPageWithAudit({
        tenantContext: identity.tenantContext,
        projectId,
        siteId,
        title: payload.title,
        slug: payload.slug,
        isHome: payload.isHome
      });

      if (page === null) {
        throw siteNotFoundError();
      }

      return {
        page: toSitePageResponse(page)
      };
    } catch (error) {
      if (isPageSlugUniqueError(error)) {
        throw duplicatePageSlugError();
      }

      throw error;
    }
  }

  async getProjectPage(
    projectId: string,
    pageId: string
  ): Promise<SitePageResponse> {
    const identity = await this.currentIdentityResolver.getCurrentIdentity();

    await this.getProjectOrThrow(identity.tenantContext, projectId);

    if (!hasPermission(identity.role, PERMISSIONS.pageRead)) {
      throw forbidden(
        API_ERROR_CODES.permissionDenied,
        "Current user does not have permission to read pages."
      );
    }

    const page = await this.projectStore.findPageById(
      identity.tenantContext,
      projectId,
      pageId
    );

    if (page === null) {
      throw notFound(
        API_ERROR_CODES.pageNotFound,
        "Project page was not found."
      );
    }

    return toSitePageResponse(page);
  }

  async getSitePage(
    projectId: string,
    siteId: string,
    pageId: string
  ): Promise<SitePageResponse> {
    const identity = await this.currentIdentityResolver.getCurrentIdentity();

    await this.getProjectOrThrow(identity.tenantContext, projectId);
    await this.getSiteOrThrow(identity.tenantContext, projectId, siteId);

    if (!hasPermission(identity.role, PERMISSIONS.pageRead)) {
      throw forbidden(
        API_ERROR_CODES.permissionDenied,
        "Current user does not have permission to read pages."
      );
    }

    const page = await this.projectStore.findPageByIdForSite(
      identity.tenantContext,
      projectId,
      siteId,
      pageId
    );

    if (page === null) {
      throw pageNotFoundError();
    }

    return toSitePageResponse(page);
  }

  async updateProjectPage(
    projectId: string,
    pageId: string,
    body: unknown
  ): Promise<UpdateProjectPageResponse> {
    const identity = await this.currentIdentityResolver.getCurrentIdentity();

    await this.getProjectOrThrow(identity.tenantContext, projectId);

    if (!hasPermission(identity.role, PERMISSIONS.pageUpdate)) {
      throw forbidden(
        API_ERROR_CODES.permissionDenied,
        "Current user does not have permission to update pages."
      );
    }

    await this.getPageOrThrow(identity.tenantContext, projectId, pageId);

    const payload = parseUpdatePagePayload(body);

    try {
      const page = await this.projectStore.updatePageWithAudit({
        tenantContext: identity.tenantContext,
        projectId,
        pageId,
        title: payload.title,
        slug: payload.slug,
        isHome: payload.isHome
      });

      if (page === null) {
        throw pageNotFoundError();
      }

      return {
        page: toSitePageResponse(page)
      };
    } catch (error) {
      if (isPageSlugUniqueError(error)) {
        throw duplicatePageSlugError();
      }

      throw error;
    }
  }

  async updateSitePage(
    projectId: string,
    siteId: string,
    pageId: string,
    body: unknown
  ): Promise<UpdateProjectPageResponse> {
    const identity = await this.currentIdentityResolver.getCurrentIdentity();

    await this.getProjectOrThrow(identity.tenantContext, projectId);
    await this.getSiteOrThrow(identity.tenantContext, projectId, siteId);

    if (!hasPermission(identity.role, PERMISSIONS.pageUpdate)) {
      throw forbidden(
        API_ERROR_CODES.permissionDenied,
        "Current user does not have permission to update pages."
      );
    }

    await this.getPageForSiteOrThrow(
      identity.tenantContext,
      projectId,
      siteId,
      pageId
    );

    const payload = parseUpdatePagePayload(body);

    try {
      const page = await this.projectStore.updatePageWithAudit({
        tenantContext: identity.tenantContext,
        projectId,
        siteId,
        pageId,
        title: payload.title,
        slug: payload.slug,
        isHome: payload.isHome
      });

      if (page === null) {
        throw pageNotFoundError();
      }

      return {
        page: toSitePageResponse(page)
      };
    } catch (error) {
      if (isPageSlugUniqueError(error)) {
        throw duplicatePageSlugError();
      }

      throw error;
    }
  }

  async getProjectPageDocument(
    projectId: string,
    pageId: string
  ): Promise<PageDocumentResponse> {
    const identity = await this.currentIdentityResolver.getCurrentIdentity();

    await this.getProjectOrThrow(identity.tenantContext, projectId);

    if (!hasPermission(identity.role, PERMISSIONS.pageRead)) {
      throw forbidden(
        API_ERROR_CODES.permissionDenied,
        "Current user does not have permission to read pages."
      );
    }

    await this.getPageOrThrow(identity.tenantContext, projectId, pageId);

    const pageDocument = await this.projectStore.getOrCreatePageDocument(
      identity.tenantContext,
      projectId,
      pageId
    );

    if (pageDocument === null) {
      throw pageNotFoundError();
    }

    return toPageDocumentResponse(pageDocument);
  }

  async getSitePageDocument(
    projectId: string,
    siteId: string,
    pageId: string
  ): Promise<PageDocumentResponse> {
    const identity = await this.currentIdentityResolver.getCurrentIdentity();

    await this.getProjectOrThrow(identity.tenantContext, projectId);
    await this.getSiteOrThrow(identity.tenantContext, projectId, siteId);

    if (!hasPermission(identity.role, PERMISSIONS.pageRead)) {
      throw forbidden(
        API_ERROR_CODES.permissionDenied,
        "Current user does not have permission to read pages."
      );
    }

    await this.getPageForSiteOrThrow(
      identity.tenantContext,
      projectId,
      siteId,
      pageId
    );

    const pageDocument = await this.projectStore.getOrCreatePageDocumentForSite(
      identity.tenantContext,
      projectId,
      siteId,
      pageId
    );

    if (pageDocument === null) {
      throw pageNotFoundError();
    }

    return toPageDocumentResponse(pageDocument);
  }

  async saveProjectPageDocument(
    projectId: string,
    pageId: string,
    body: unknown
  ): Promise<PageDocumentResponse> {
    const identity = await this.currentIdentityResolver.getCurrentIdentity();

    await this.getProjectOrThrow(identity.tenantContext, projectId);

    if (!hasPermission(identity.role, PERMISSIONS.pageUpdate)) {
      throw forbidden(
        API_ERROR_CODES.permissionDenied,
        "Current user does not have permission to update pages."
      );
    }

    await this.getPageOrThrow(identity.tenantContext, projectId, pageId);

    const payload = parseSavePageDocumentPayload(body);
    const mediaIssues = await validatePageDocumentMediaAssets({
      tenantContext: identity.tenantContext,
      projectId,
      document: payload.document,
      projectStore: this.projectStore,
      config: this.config
    });

    if (mediaIssues.length > 0) {
      throw badRequest(
        API_ERROR_CODES.pageDocumentInvalid,
        "Page document is invalid.",
        mediaIssues
      );
    }

    try {
      const pageDocument = await this.projectStore.savePageDocumentWithAudit({
        tenantContext: identity.tenantContext,
        projectId,
        pageId,
        document: payload.document,
        expectedRevision: payload.revision
      });

      if (pageDocument === null) {
        throw pageNotFoundError();
      }

      return toPageDocumentResponse(pageDocument);
    } catch (error) {
      if (error instanceof PageDocumentRevisionConflictError) {
        throw conflict(
          API_ERROR_CODES.pageDocumentRevisionConflict,
          "Page document was changed by another save."
        );
      }

      if (error instanceof PageDocumentInvalidError) {
        throw badRequest(
          API_ERROR_CODES.pageDocumentInvalid,
          "Page document is invalid.",
          toDocumentValidationIssues(error.errors)
        );
      }

      throw error;
    }
  }

  async saveSitePageDocument(
    projectId: string,
    siteId: string,
    pageId: string,
    body: unknown
  ): Promise<PageDocumentResponse> {
    const identity = await this.currentIdentityResolver.getCurrentIdentity();

    await this.getProjectOrThrow(identity.tenantContext, projectId);
    await this.getSiteOrThrow(identity.tenantContext, projectId, siteId);

    if (!hasPermission(identity.role, PERMISSIONS.pageUpdate)) {
      throw forbidden(
        API_ERROR_CODES.permissionDenied,
        "Current user does not have permission to update pages."
      );
    }

    await this.getPageForSiteOrThrow(
      identity.tenantContext,
      projectId,
      siteId,
      pageId
    );

    const payload = parseSavePageDocumentPayload(body);
    const mediaIssues = await validatePageDocumentMediaAssets({
      tenantContext: identity.tenantContext,
      projectId,
      document: payload.document,
      projectStore: this.projectStore,
      config: this.config
    });

    if (mediaIssues.length > 0) {
      throw badRequest(
        API_ERROR_CODES.pageDocumentInvalid,
        "Page document is invalid.",
        mediaIssues
      );
    }

    try {
      const pageDocument = await this.projectStore.savePageDocumentForSiteWithAudit({
        tenantContext: identity.tenantContext,
        projectId,
        siteId,
        pageId,
        document: payload.document,
        expectedRevision: payload.revision
      });

      if (pageDocument === null) {
        throw pageNotFoundError();
      }

      return toPageDocumentResponse(pageDocument);
    } catch (error) {
      if (error instanceof PageDocumentRevisionConflictError) {
        throw conflict(
          API_ERROR_CODES.pageDocumentRevisionConflict,
          "Page document was changed by another save."
        );
      }

      if (error instanceof PageDocumentInvalidError) {
        throw badRequest(
          API_ERROR_CODES.pageDocumentInvalid,
          "Page document is invalid.",
          toDocumentValidationIssues(error.errors)
        );
      }

      throw error;
    }
  }

  async addPageSection(
    projectId: string,
    pageId: string,
    body: unknown
  ): Promise<PageSectionMutationResponse> {
    const payload = parseSectionCreatePayload(body);
    const section = createSectionFromPreset(payload.type, payload.name);

    return this.mutatePageSections({
      projectId,
      pageId,
      revision: payload.revision,
      auditAction: "PAGE_SECTION_ADDED",
      auditMetadata: {
        sectionId: section.id,
        insert: payload.insert
      },
      mutate: (document) => {
        if (payload.insert?.beforeSectionId !== undefined) {
          return {
            document: insertSectionBefore(
              document,
              payload.insert.beforeSectionId,
              section
            ),
            selectedSectionId: section.id
          };
        }

        if (payload.insert?.afterSectionId !== undefined) {
          return {
            document: insertSectionAfter(
              document,
              payload.insert.afterSectionId,
              section
            ),
            selectedSectionId: section.id
          };
        }

        return {
          document: addSectionAtEnd(document, section),
          selectedSectionId: section.id
        };
      }
    });
  }

  async duplicatePageSection(
    projectId: string,
    pageId: string,
    sectionId: string,
    body: unknown
  ): Promise<PageSectionMutationResponse> {
    const payload = parseRevisionOnlyPayload(body);

    return this.mutatePageSections({
      projectId,
      pageId,
      revision: payload.revision,
      auditAction: "PAGE_SECTION_DUPLICATED",
      auditMetadata: {
        sectionId
      },
      mutate: (document) => {
        const nextDocument = duplicateSection(document, sectionId);
        const originalIndex = document.root.children.findIndex(
          (section) => section.id === sectionId
        );

        return {
          document: nextDocument,
          selectedSectionId: nextDocument.root.children[originalIndex + 1]?.id ?? null
        };
      }
    });
  }

  async updatePageSection(
    projectId: string,
    pageId: string,
    sectionId: string,
    body: unknown
  ): Promise<PageSectionMutationResponse> {
    const payload = parseSectionPatchPayload(body);
    const auditAction =
      payload.name !== undefined
        ? "PAGE_SECTION_RENAMED"
        : payload.isHidden === true
          ? "PAGE_SECTION_HIDDEN"
          : "PAGE_SECTION_SHOWN";

    return this.mutatePageSections({
      projectId,
      pageId,
      revision: payload.revision,
      auditAction,
      auditMetadata: {
        sectionId,
        nameChanged: payload.name !== undefined,
        hiddenChanged: payload.isHidden !== undefined
      },
      mutate: (document) => {
        let nextDocument = document;

        if (payload.name !== undefined) {
          nextDocument = renameSection(nextDocument, sectionId, payload.name);
        }

        if (payload.isHidden === true) {
          nextDocument = hideSection(nextDocument, sectionId);
        }

        if (payload.isHidden === false) {
          nextDocument = showSection(nextDocument, sectionId);
        }

        return {
          document: nextDocument,
          selectedSectionId: sectionId
        };
      }
    });
  }

  async deletePageSection(
    projectId: string,
    pageId: string,
    sectionId: string,
    body: unknown
  ): Promise<PageSectionMutationResponse> {
    const payload = parseRevisionOnlyPayload(body);

    return this.mutatePageSections({
      projectId,
      pageId,
      revision: payload.revision,
      auditAction: "PAGE_SECTION_DELETED",
      auditMetadata: {
        sectionId
      },
      mutate: (document) => {
        const index = document.root.children.findIndex(
          (section) => section.id === sectionId
        );
        const nextDocument = deleteSection(document, sectionId);

        return {
          document: nextDocument,
          selectedSectionId:
            nextDocument.root.children[Math.min(index, nextDocument.root.children.length - 1)]
              ?.id ?? null
        };
      }
    });
  }

  async reorderPageSections(
    projectId: string,
    pageId: string,
    body: unknown
  ): Promise<PageSectionMutationResponse> {
    const payload = parseSectionReorderPayload(body);

    return this.mutatePageSections({
      projectId,
      pageId,
      revision: payload.revision,
      auditAction: "PAGE_SECTION_REORDERED",
      auditMetadata: {
        sectionIds: payload.sectionIds
      },
      mutate: (document) => ({
        document: reorderSectionsByIds(document, payload.sectionIds),
        selectedSectionId: payload.sectionIds[0] ?? null
      })
    });
  }

  private async mutatePageSections(input: {
    readonly projectId: string;
    readonly pageId: string;
    readonly revision: number;
    readonly auditAction: string;
    readonly auditMetadata: Record<string, unknown>;
    readonly mutate: (document: PageDocumentV2) => {
      readonly document: PageDocumentV2;
      readonly selectedSectionId: string | null;
    };
  }): Promise<PageSectionMutationResponse> {
    const identity = await this.currentIdentityResolver.getCurrentIdentity();

    await this.getProjectOrThrow(identity.tenantContext, input.projectId);

    if (!hasPermission(identity.role, PERMISSIONS.pageUpdate)) {
      throw forbidden(
        API_ERROR_CODES.permissionDenied,
        "Current user does not have permission to update pages."
      );
    }

    await this.getPageOrThrow(
      identity.tenantContext,
      input.projectId,
      input.pageId
    );

    const pageDocument = await this.projectStore.getOrCreatePageDocument(
      identity.tenantContext,
      input.projectId,
      input.pageId
    );

    if (pageDocument === null) {
      throw pageNotFoundError();
    }

    if (pageDocument.revision !== input.revision) {
      throw conflict(
        API_ERROR_CODES.pageDocumentRevisionConflict,
        "Page document was changed by another save."
      );
    }

    try {
      const mutation = input.mutate(pageDocument.document);
      const mediaIssues = await validatePageDocumentMediaAssets({
        tenantContext: identity.tenantContext,
        projectId: input.projectId,
        document: mutation.document,
        projectStore: this.projectStore,
        config: this.config
      });

      if (mediaIssues.length > 0) {
        throw badRequest(
          API_ERROR_CODES.pageDocumentInvalid,
          "Page document is invalid.",
          mediaIssues
        );
      }

      const saved = await this.projectStore.savePageDocumentWithAudit({
        tenantContext: identity.tenantContext,
        projectId: input.projectId,
        pageId: input.pageId,
        document: mutation.document,
        expectedRevision: input.revision,
        auditAction: input.auditAction,
        auditMetadata: input.auditMetadata
      });

      if (saved === null) {
        throw pageNotFoundError();
      }

      return {
        ...toPageDocumentResponse(saved),
        selectedSectionId: mutation.selectedSectionId
      };
    } catch (error) {
      if (error instanceof PageSectionOperationError) {
        throw toPageSectionApiError(error);
      }

      if (error instanceof PageDocumentRevisionConflictError) {
        throw conflict(
          API_ERROR_CODES.pageDocumentRevisionConflict,
          "Page document was changed by another save."
        );
      }

      if (error instanceof PageDocumentInvalidError) {
        throw badRequest(
          API_ERROR_CODES.pageDocumentInvalid,
          "Page document is invalid.",
          toDocumentValidationIssues(error.errors)
        );
      }

      throw error;
    }
  }

  private async getProjectOrThrow(
    tenantContext: TenantContext,
    projectId: string
  ): Promise<Project> {
    const project = await this.projectStore.findByTenantAndId(
      tenantContext,
      projectId
    );

    if (project === null) {
      throw projectNotFoundError();
    }

    return project;
  }

  private async getPageOrThrow(
    tenantContext: TenantContext,
    projectId: string,
    pageId: string
  ): Promise<SitePage> {
    const page = await this.projectStore.findPageById(
      tenantContext,
      projectId,
      pageId
    );

    if (page === null) {
      throw pageNotFoundError();
    }

    return page;
  }

  private async getSiteOrThrow(
    tenantContext: TenantContext,
    projectId: string,
    siteId: string
  ): Promise<Site> {
    const site = await this.projectStore.findSiteById(
      tenantContext,
      projectId,
      siteId
    );

    if (site === null) {
      throw siteNotFoundError();
    }

    return site;
  }

  private async getPageForSiteOrThrow(
    tenantContext: TenantContext,
    projectId: string,
    siteId: string,
    pageId: string
  ): Promise<SitePage> {
    const page = await this.projectStore.findPageByIdForSite(
      tenantContext,
      projectId,
      siteId,
      pageId
    );

    if (page === null) {
      throw pageNotFoundError();
    }

    return page;
  }
}

async function validatePageDocumentMediaAssets(input: {
  readonly tenantContext: TenantContext;
  readonly projectId: string;
  readonly document: PageDocumentV2;
  readonly projectStore: ProjectStore;
  readonly config: AppConfig;
}): Promise<readonly ApiValidationIssue[]> {
  const issues: ApiValidationIssue[] = [];
  const references = collectPageDocumentImageAssetReferences(input.document);

  for (const reference of references) {
    const asset = await input.projectStore.findMediaAssetById(
      input.tenantContext,
      input.projectId,
      reference.assetId
    );

    if (asset === null) {
      issues.push({
        field: `document.image.${reference.blockId}.assetId`,
        code: "DOCUMENT_INVALID",
        message: "Image asset was not found in this project."
      });
      continue;
    }

    const expectedUrl = createMediaAssetUrl(input.config, input.projectId, asset.id);

    if (reference.src !== expectedUrl) {
      issues.push({
        field: `document.image.${reference.blockId}.src`,
        code: "DOCUMENT_INVALID",
        message: "Image asset URL does not match the selected asset."
      });
    }
  }

  return issues;
}

export function toProjectResponse(project: Project): ProjectResponse {
  return {
    id: project.id,
    name: project.name,
    slug: project.slug,
    status: project.status,
    createdAt: project.createdAt.toISOString()
  };
}

export function toSitePageResponse(page: SitePage): SitePageResponse {
  return {
    id: page.id,
    projectId: page.projectId,
    siteId: page.siteId,
    title: page.title,
    slug: page.slug,
    status: page.status,
    isHome: page.isHome,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString()
  };
}

export function toSiteResponse(site: Site): SiteResponse {
  return {
    id: site.id,
    projectId: site.projectId,
    name: site.name,
    slug: site.slug,
    status: site.status,
    isDefault: site.isDefault,
    createdAt: site.createdAt.toISOString(),
    updatedAt: site.updatedAt.toISOString()
  };
}

export function toPageDocumentResponse(
  pageDocument: PageDocumentRecord
): PageDocumentResponse {
  return {
    pageId: pageDocument.pageId,
    schemaVersion: PAGE_DOCUMENT_SCHEMA_VERSION,
    revision: pageDocument.revision,
    document: pageDocument.document
  };
}

function parseCreateProjectPayload(body: unknown): {
  readonly name: string;
  readonly slug: string;
} {
  if (!isRecord(body)) {
    throw badRequest(API_ERROR_CODES.validationFailed, "Request body is invalid.", [
      {
        field: "body",
        code: "FIELD_INVALID_TYPE",
        message: "Request body must be an object."
      }
    ]);
  }

  if ("organizationId" in body) {
    throw badRequest(
      API_ERROR_CODES.organizationIdNotAllowed,
      "organizationId must not be provided in the request body."
    );
  }

  const issues: ApiValidationIssue[] = [];
  const rawName = body.name;
  const rawSlug = body.slug;

  if (typeof rawName !== "string") {
    issues.push({
      field: "name",
      code: rawName === undefined ? "FIELD_REQUIRED" : "FIELD_INVALID_TYPE",
      message: "Project name is required."
    });
  }

  if (typeof rawSlug !== "string") {
    issues.push({
      field: "slug",
      code: rawSlug === undefined ? "FIELD_REQUIRED" : "FIELD_INVALID_TYPE",
      message: "Project slug is required."
    });
  }

  if (typeof rawName !== "string" || typeof rawSlug !== "string") {
    throw badRequest(
      API_ERROR_CODES.validationFailed,
      "Project payload is invalid.",
      issues
    );
  }

  const nameResult = validateProjectName(rawName);
  const slugResult = validateProjectSlug(rawSlug);

  if (!nameResult.ok) {
    issues.push({
      field: "name",
      code: nameResult.code,
      message: toValidationMessage(nameResult.code)
    });
  }

  if (!slugResult.ok) {
    issues.push({
      field: "slug",
      code: slugResult.code,
      message: toValidationMessage(slugResult.code)
    });
  }

  if (!nameResult.ok || !slugResult.ok) {
    throw badRequest(
      API_ERROR_CODES.validationFailed,
      "Project payload is invalid.",
      issues
    );
  }

  return {
    name: nameResult.value,
    slug: slugResult.value
  };
}

function parseCreateSitePayload(body: unknown): {
  readonly name: string;
  readonly slug: string;
  readonly isDefault: boolean;
} {
  if (!isRecord(body)) {
    throw badRequest(API_ERROR_CODES.validationFailed, "Request body is invalid.", [
      {
        field: "body",
        code: "FIELD_INVALID_TYPE",
        message: "Request body must be an object."
      }
    ]);
  }

  if ("organizationId" in body || "projectId" in body) {
    throw badRequest(
      API_ERROR_CODES.organizationIdNotAllowed,
      "organizationId and projectId must not be provided in the request body."
    );
  }

  const issues: ApiValidationIssue[] = [];
  const rawName = body.name;
  const rawSlug = body.slug;
  const rawIsDefault = body.isDefault;

  if (typeof rawName !== "string") {
    issues.push({
      field: "name",
      code: rawName === undefined ? "FIELD_REQUIRED" : "FIELD_INVALID_TYPE",
      message: "Site name is required."
    });
  }

  if (typeof rawSlug !== "string") {
    issues.push({
      field: "slug",
      code: rawSlug === undefined ? "FIELD_REQUIRED" : "FIELD_INVALID_TYPE",
      message: "Site slug is required."
    });
  }

  if (rawIsDefault !== undefined && typeof rawIsDefault !== "boolean") {
    issues.push({
      field: "isDefault",
      code: "FIELD_INVALID_TYPE",
      message: "isDefault must be a boolean."
    });
  }

  if (typeof rawName !== "string" || typeof rawSlug !== "string") {
    throw badRequest(
      API_ERROR_CODES.validationFailed,
      "Site payload is invalid.",
      issues
    );
  }

  const nameResult = validateProjectName(rawName);
  const slugResult = validateProjectSlug(rawSlug);

  if (!nameResult.ok) {
    issues.push({
      field: "name",
      code: nameResult.code,
      message: toValidationMessage(nameResult.code)
    });
  }

  if (!slugResult.ok) {
    issues.push({
      field: "slug",
      code: slugResult.code,
      message: toValidationMessage(slugResult.code)
    });
  }

  if (!nameResult.ok || !slugResult.ok || issues.length > 0) {
    throw badRequest(
      API_ERROR_CODES.validationFailed,
      "Site payload is invalid.",
      issues
    );
  }

  return {
    name: nameResult.value,
    slug: slugResult.value,
    isDefault: rawIsDefault === true
  };
}

function parseUpdateSitePayload(body: unknown): {
  readonly name?: string;
  readonly slug?: string;
} {
  if (!isRecord(body)) {
    throw badRequest(API_ERROR_CODES.validationFailed, "Request body is invalid.", [
      {
        field: "body",
        code: "FIELD_INVALID_TYPE",
        message: "Request body must be an object."
      }
    ]);
  }

  if ("organizationId" in body || "projectId" in body || "isDefault" in body) {
    throw badRequest(
      API_ERROR_CODES.validationFailed,
      "organizationId, projectId and isDefault must not be provided in the request body."
    );
  }

  const issues: ApiValidationIssue[] = [];
  const rawName = body.name;
  const rawSlug = body.slug;
  const nameResult =
    rawName === undefined
      ? undefined
      : typeof rawName === "string"
        ? validateProjectName(rawName)
        : null;
  const slugResult =
    rawSlug === undefined
      ? undefined
      : typeof rawSlug === "string"
        ? validateProjectSlug(rawSlug)
        : null;

  if (nameResult === null) {
    issues.push({
      field: "name",
      code: "FIELD_INVALID_TYPE",
      message: "Site name must be a string."
    });
  } else if (nameResult !== undefined && !nameResult.ok) {
    issues.push({
      field: "name",
      code: nameResult.code,
      message: toValidationMessage(nameResult.code)
    });
  }

  if (slugResult === null) {
    issues.push({
      field: "slug",
      code: "FIELD_INVALID_TYPE",
      message: "Site slug must be a string."
    });
  } else if (slugResult !== undefined && !slugResult.ok) {
    issues.push({
      field: "slug",
      code: slugResult.code,
      message: toValidationMessage(slugResult.code)
    });
  }

  if (issues.length > 0) {
    throw badRequest(
      API_ERROR_CODES.validationFailed,
      "Site payload is invalid.",
      issues
    );
  }

  return {
    ...(nameResult === undefined || nameResult === null || !nameResult.ok
      ? {}
      : { name: nameResult.value }),
    ...(slugResult === undefined || slugResult === null || !slugResult.ok
      ? {}
      : { slug: slugResult.value })
  };
}

function parseCreatePagePayload(body: unknown): {
  readonly title: string;
  readonly slug: string;
  readonly isHome: boolean;
} {
  if (!isRecord(body)) {
    throw badRequest(API_ERROR_CODES.validationFailed, "Request body is invalid.", [
      {
        field: "body",
        code: "FIELD_INVALID_TYPE",
        message: "Request body must be an object."
      }
    ]);
  }

  if ("organizationId" in body) {
    throw badRequest(
      API_ERROR_CODES.organizationIdNotAllowed,
      "organizationId must not be provided in the request body."
    );
  }

  const issues: ApiValidationIssue[] = [];
  const rawTitle = body.title;
  const rawSlug = body.slug;
  const rawIsHome = body.isHome;

  if (typeof rawTitle !== "string") {
    issues.push({
      field: "title",
      code: rawTitle === undefined ? "FIELD_REQUIRED" : "FIELD_INVALID_TYPE",
      message: "Page title is required."
    });
  }

  if (typeof rawSlug !== "string") {
    issues.push({
      field: "slug",
      code: rawSlug === undefined ? "FIELD_REQUIRED" : "FIELD_INVALID_TYPE",
      message: "Page slug is required."
    });
  }

  if (rawIsHome !== undefined && typeof rawIsHome !== "boolean") {
    issues.push({
      field: "isHome",
      code: "FIELD_INVALID_TYPE",
      message: "isHome must be a boolean."
    });
  }

  if (typeof rawTitle !== "string" || typeof rawSlug !== "string") {
    throw badRequest(
      API_ERROR_CODES.validationFailed,
      "Page payload is invalid.",
      issues
    );
  }

  const titleResult = validatePageTitle(rawTitle);
  const slugResult = validatePageSlug(rawSlug);

  if (!titleResult.ok) {
    issues.push({
      field: "title",
      code: titleResult.code,
      message: toValidationMessage(titleResult.code)
    });
  }

  if (!slugResult.ok) {
    issues.push({
      field: "slug",
      code: slugResult.code,
      message: toValidationMessage(slugResult.code)
    });
  }

  if (!titleResult.ok || !slugResult.ok || issues.length > 0) {
    throw badRequest(
      API_ERROR_CODES.validationFailed,
      "Page payload is invalid.",
      issues
    );
  }

  return {
    title: titleResult.value,
    slug: slugResult.value,
    isHome: rawIsHome === true
  };
}

function parseUpdatePagePayload(body: unknown): {
  readonly title: string;
  readonly slug: string;
  readonly isHome: boolean;
} {
  if (!isRecord(body)) {
    throw badRequest(API_ERROR_CODES.validationFailed, "Request body is invalid.", [
      {
        field: "body",
        code: "FIELD_INVALID_TYPE",
        message: "Request body must be an object."
      }
    ]);
  }

  if ("organizationId" in body || "projectId" in body) {
    throw badRequest(
      API_ERROR_CODES.organizationIdNotAllowed,
      "organizationId and projectId must not be provided in the request body."
    );
  }

  const issues: ApiValidationIssue[] = [];
  const rawTitle = body.title;
  const rawSlug = body.slug;
  const rawIsHome = body.isHome;

  if (typeof rawTitle !== "string") {
    issues.push({
      field: "title",
      code: rawTitle === undefined ? "FIELD_REQUIRED" : "FIELD_INVALID_TYPE",
      message: "Page title is required."
    });
  }

  if (typeof rawSlug !== "string") {
    issues.push({
      field: "slug",
      code: rawSlug === undefined ? "FIELD_REQUIRED" : "FIELD_INVALID_TYPE",
      message: "Page slug is required."
    });
  }

  if (typeof rawIsHome !== "boolean") {
    issues.push({
      field: "isHome",
      code: rawIsHome === undefined ? "FIELD_REQUIRED" : "FIELD_INVALID_TYPE",
      message: "isHome must be a boolean."
    });
  }

  if (
    typeof rawTitle !== "string" ||
    typeof rawSlug !== "string" ||
    typeof rawIsHome !== "boolean"
  ) {
    throw badRequest(
      API_ERROR_CODES.validationFailed,
      "Page payload is invalid.",
      issues
    );
  }

  const titleResult = validatePageTitle(rawTitle);
  const slugResult = validatePageSlug(rawSlug);

  if (!titleResult.ok) {
    issues.push({
      field: "title",
      code: titleResult.code,
      message: toValidationMessage(titleResult.code)
    });
  }

  if (!slugResult.ok) {
    issues.push({
      field: "slug",
      code: slugResult.code,
      message: toValidationMessage(slugResult.code)
    });
  }

  if (!titleResult.ok || !slugResult.ok || issues.length > 0) {
    throw badRequest(
      API_ERROR_CODES.validationFailed,
      "Page payload is invalid.",
      issues
    );
  }

  return {
    title: titleResult.value,
    slug: slugResult.value,
    isHome: rawIsHome
  };
}

function parseSavePageDocumentPayload(body: unknown): {
  readonly revision: number;
  readonly document: PageDocumentV2;
} {
  if (!isRecord(body)) {
    throw badRequest(API_ERROR_CODES.validationFailed, "Request body is invalid.", [
      {
        field: "body",
        code: "FIELD_INVALID_TYPE",
        message: "Request body must be an object."
      }
    ]);
  }

  if ("organizationId" in body || "projectId" in body) {
    throw badRequest(
      API_ERROR_CODES.organizationIdNotAllowed,
      "organizationId and projectId must not be provided in the request body."
    );
  }

  const issues: ApiValidationIssue[] = [];
  const rawSchemaVersion = body.schemaVersion;
  const rawRevision = body.revision;
  const rawDocument = body.document;
  const revision =
    typeof rawRevision === "number" &&
    Number.isInteger(rawRevision) &&
    rawRevision >= 1
      ? rawRevision
      : null;

  if (rawSchemaVersion !== PAGE_DOCUMENT_SCHEMA_VERSION) {
    issues.push({
      field: "schemaVersion",
      code: "FIELD_INVALID_VALUE",
      message: "schemaVersion must be 2."
    });
  }

  if (revision === null) {
    issues.push({
      field: "revision",
      code: "FIELD_INVALID_VALUE",
      message: "revision must be a positive integer."
    });
  }

  const documentValidation = validatePageDocument(rawDocument);

  if (!documentValidation.ok) {
    issues.push(...toDocumentValidationIssues(documentValidation.errors));
  }

  if (issues.length > 0) {
    throw badRequest(
      API_ERROR_CODES.pageDocumentInvalid,
      "Page document is invalid.",
      issues
    );
  }

  if (revision === null || !documentValidation.ok) {
    throw new Error("Unexpected invalid page document payload.");
  }

  return {
    revision,
    document: documentValidation.document
  };
}

function parseRevisionOnlyPayload(body: unknown): { readonly revision: number } {
  if (!isRecord(body)) {
    throw badRequest(API_ERROR_CODES.validationFailed, "Request body is invalid.", [
      {
        field: "body",
        code: "FIELD_INVALID_TYPE",
        message: "Request body must be an object."
      }
    ]);
  }

  return {
    revision: parseRevision(body.revision)
  };
}

function parseSectionCreatePayload(body: unknown): {
  readonly revision: number;
  readonly type: "empty" | "text" | "image-text" | "product";
  readonly name: string | null;
  readonly insert:
    | {
        readonly beforeSectionId?: string | undefined;
        readonly afterSectionId?: string | undefined;
      }
    | undefined;
} {
  if (!isRecord(body)) {
    throw badRequest(API_ERROR_CODES.validationFailed, "Request body is invalid.", [
      {
        field: "body",
        code: "FIELD_INVALID_TYPE",
        message: "Request body must be an object."
      }
    ]);
  }

  const type =
    body.type === undefined || body.type === "empty"
      ? "empty"
      : body.type === "text" ||
          body.type === "image-text" ||
          body.type === "product"
        ? body.type
        : null;

  if (type === null) {
    throw badRequest(API_ERROR_CODES.validationFailed, "Section payload is invalid.", [
      {
        field: "type",
        code: "FIELD_INVALID_VALUE",
        message: "Section type is invalid."
      }
    ]);
  }

  const beforeSectionId =
    typeof body.beforeSectionId === "string" && body.beforeSectionId.trim() !== ""
      ? body.beforeSectionId.trim()
      : undefined;
  const afterSectionId =
    typeof body.afterSectionId === "string" && body.afterSectionId.trim() !== ""
      ? body.afterSectionId.trim()
      : undefined;

  if (beforeSectionId !== undefined && afterSectionId !== undefined) {
    throw badRequest(API_ERROR_CODES.pageSectionOrderInvalid, "Section insert position is invalid.");
  }

  const name = body.name === undefined || body.name === null ? null : parseSectionNamePayload(body.name);

  return {
    revision: parseRevision(body.revision),
    type,
    name,
    insert:
      beforeSectionId === undefined && afterSectionId === undefined
        ? undefined
        : {
            beforeSectionId,
            afterSectionId
          }
  };
}

function parseSectionPatchPayload(body: unknown): {
  readonly revision: number;
  readonly name?: string | undefined;
  readonly isHidden?: boolean | undefined;
} {
  if (!isRecord(body)) {
    throw badRequest(API_ERROR_CODES.validationFailed, "Request body is invalid.", [
      {
        field: "body",
        code: "FIELD_INVALID_TYPE",
        message: "Request body must be an object."
      }
    ]);
  }

  if (body.name === undefined && body.isHidden === undefined) {
    throw badRequest(API_ERROR_CODES.validationFailed, "Section patch is empty.");
  }

  if (body.isHidden !== undefined && typeof body.isHidden !== "boolean") {
    throw badRequest(API_ERROR_CODES.validationFailed, "Section hidden state is invalid.", [
      {
        field: "isHidden",
        code: "FIELD_INVALID_TYPE",
        message: "isHidden must be a boolean."
      }
    ]);
  }

  return {
    revision: parseRevision(body.revision),
    ...(body.name === undefined
      ? {}
      : {
          name: parseSectionNamePayload(body.name)
        }),
    ...(body.isHidden === undefined
      ? {}
      : {
          isHidden: body.isHidden
        })
  };
}

function parseSectionReorderPayload(body: unknown): {
  readonly revision: number;
  readonly sectionIds: readonly string[];
} {
  if (!isRecord(body)) {
    throw badRequest(API_ERROR_CODES.validationFailed, "Request body is invalid.", [
      {
        field: "body",
        code: "FIELD_INVALID_TYPE",
        message: "Request body must be an object."
      }
    ]);
  }

  if (!Array.isArray(body.sectionIds)) {
    throw badRequest(API_ERROR_CODES.pageSectionOrderInvalid, "Section order is invalid.");
  }

  const sectionIds = body.sectionIds.map((sectionId) =>
    typeof sectionId === "string" ? sectionId.trim() : ""
  );

  if (sectionIds.some((sectionId) => sectionId === "")) {
    throw badRequest(API_ERROR_CODES.pageSectionOrderInvalid, "Section order is invalid.");
  }

  return {
    revision: parseRevision(body.revision),
    sectionIds
  };
}

function parseRevision(value: unknown): number {
  if (typeof value === "number" && Number.isInteger(value) && value >= 1) {
    return value;
  }

  throw badRequest(API_ERROR_CODES.validationFailed, "Revision is invalid.", [
    {
      field: "revision",
      code: "FIELD_INVALID_VALUE",
      message: "revision must be a positive integer."
    }
  ]);
}

function parseSectionNamePayload(value: unknown): string {
  if (typeof value !== "string") {
    throw badRequest(API_ERROR_CODES.pageSectionNameInvalid, "Section name is invalid.");
  }

  const name = value.trim();

  if (name.length === 0 || name.length > 80) {
    throw badRequest(API_ERROR_CODES.pageSectionNameInvalid, "Section name is invalid.");
  }

  return name;
}

function createSectionFromPreset(
  type: "empty" | "text" | "image-text" | "product",
  name: string | null
): SectionNode {
  const section = {
    ...createDefaultSection(),
    name: name ?? defaultSectionName(type),
    metadata: {
      preset: type
    }
  };

  if (type === "text") {
    return {
      ...section,
      children: [createDefaultBlock("heading"), createDefaultBlock("text")]
    };
  }

  if (type === "image-text") {
    const leftColumn = createDefaultColumn();
    const rightColumn = createDefaultColumn();

    return {
      ...section,
      props: {
        ...section.props,
        layout: "two-columns"
      },
      children: [
        {
          ...leftColumn,
          children: [createDefaultBlock("image")]
        },
        {
          ...rightColumn,
          children: [createDefaultBlock("heading"), createDefaultBlock("text")]
        }
      ]
    };
  }

  if (type === "product") {
    return {
      ...section,
      children: [createDefaultBlock("product-grid")]
    };
  }

  return section;
}

function defaultSectionName(type: "empty" | "text" | "image-text" | "product"): string {
  switch (type) {
    case "empty":
      return "Пустая секция";
    case "text":
      return "Текст";
    case "image-text":
      return "Изображение и текст";
    case "product":
      return "Товары";
  }
}

function toPageSectionApiError(error: PageSectionOperationError) {
  switch (error.code) {
    case PAGE_SECTION_OPERATION_ERROR_CODES.sectionNotFound:
      return notFound(API_ERROR_CODES.pageSectionNotFound, error.message);
    case PAGE_SECTION_OPERATION_ERROR_CODES.sectionLimitReached:
      return badRequest(API_ERROR_CODES.pageSectionLimitReached, error.message);
    case PAGE_SECTION_OPERATION_ERROR_CODES.sectionNameInvalid:
      return badRequest(API_ERROR_CODES.pageSectionNameInvalid, error.message);
    case PAGE_SECTION_OPERATION_ERROR_CODES.sectionOrderInvalid:
      return badRequest(API_ERROR_CODES.pageSectionOrderInvalid, error.message);
    case PAGE_SECTION_OPERATION_ERROR_CODES.sectionDuplicationFailed:
      return badRequest(API_ERROR_CODES.pageSectionDuplicationFailed, error.message);
    case PAGE_SECTION_OPERATION_ERROR_CODES.globalRegionInvalid:
      return badRequest(API_ERROR_CODES.pageGlobalRegionInvalid, error.message);
  }
}

function duplicateSlugError() {
  return conflict(
    API_ERROR_CODES.projectSlugAlreadyExists,
    "Project slug already exists inside the active organization."
  );
}

function duplicatePageSlugError() {
  return conflict(
    API_ERROR_CODES.pageSlugAlreadyExists,
    "Page slug already exists inside this site."
  );
}

function duplicateSiteSlugError() {
  return conflict(
    API_ERROR_CODES.siteSlugAlreadyExists,
    "Site slug already exists inside this project."
  );
}

function projectNotFoundError() {
  return notFound(API_ERROR_CODES.projectNotFound, "Project was not found.");
}

function siteNotFoundError() {
  return notFound(API_ERROR_CODES.siteNotFound, "Site was not found.");
}

function pageNotFoundError() {
  return notFound(API_ERROR_CODES.pageNotFound, "Project page was not found.");
}

function toDocumentValidationIssues(
  errors: readonly {
    readonly path: readonly (string | number)[];
    readonly message: string;
  }[]
): readonly ApiValidationIssue[] {
  return errors.map((error) => ({
    field: error.path.length === 0 ? "document" : `document.${error.path.join(".")}`,
    code: "DOCUMENT_INVALID",
    message: error.message
  }));
}

function toValidationMessage(code: string): string {
  switch (code) {
    case DOMAIN_ERROR_CODES.projectNameRequired:
      return "Project name is required.";
    case DOMAIN_ERROR_CODES.projectNameTooShort:
      return "Project name is too short.";
    case DOMAIN_ERROR_CODES.projectNameTooLong:
      return "Project name is too long.";
    case DOMAIN_ERROR_CODES.projectSlugRequired:
      return "Project slug is required.";
    case DOMAIN_ERROR_CODES.projectSlugTooShort:
      return "Project slug is too short.";
    case DOMAIN_ERROR_CODES.projectSlugTooLong:
      return "Project slug is too long.";
    case DOMAIN_ERROR_CODES.projectSlugInvalidFormat:
      return "Project slug may contain lowercase letters, numbers and hyphens.";
    case DOMAIN_ERROR_CODES.pageTitleRequired:
      return "Page title is required.";
    case DOMAIN_ERROR_CODES.pageTitleTooShort:
      return "Page title is too short.";
    case DOMAIN_ERROR_CODES.pageTitleTooLong:
      return "Page title is too long.";
    case DOMAIN_ERROR_CODES.pageSlugRequired:
      return "Page slug is required.";
    case DOMAIN_ERROR_CODES.pageSlugTooShort:
      return "Page slug is too short.";
    case DOMAIN_ERROR_CODES.pageSlugTooLong:
      return "Page slug is too long.";
    case DOMAIN_ERROR_CODES.pageSlugInvalidFormat:
      return "Page slug may contain lowercase letters, numbers and hyphens.";
    default:
      return "Value is invalid.";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
