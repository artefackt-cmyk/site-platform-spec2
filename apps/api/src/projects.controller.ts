import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Put } from "@nestjs/common";
import {
  type CreateProjectPageResponse,
  type CreateProjectResponse,
  type CreateSiteResponse,
  type PageDocumentResponse,
  type PageSectionMutationResponse,
  type ProjectPagesListResponse,
  type ProjectResponse,
  type ProjectsListResponse,
  type SiteResponse,
  type SitesListResponse,
  type SitePageResponse,
  type UpdateSiteResponse,
  type UpdateProjectPageResponse,
  ProjectsService
} from "./projects.service";

@Controller("api/projects")
export class ProjectsController {
  constructor(
    @Inject(ProjectsService)
    private readonly projectsService: ProjectsService
  ) {}

  @Get()
  async listProjects(): Promise<ProjectsListResponse> {
    return this.projectsService.listProjects();
  }

  @Post()
  async createProject(@Body() body: unknown): Promise<CreateProjectResponse> {
    return this.projectsService.createProject(body);
  }

  @Get(":projectId")
  async getProject(
    @Param("projectId") projectId: string
  ): Promise<ProjectResponse> {
    return this.projectsService.getProject(projectId);
  }

  @Get(":projectId/sites")
  async listProjectSites(
    @Param("projectId") projectId: string
  ): Promise<SitesListResponse> {
    return this.projectsService.listProjectSites(projectId);
  }

  @Post(":projectId/sites")
  async createProjectSite(
    @Param("projectId") projectId: string,
    @Body() body: unknown
  ): Promise<CreateSiteResponse> {
    return this.projectsService.createProjectSite(projectId, body);
  }

  @Get(":projectId/sites/:siteId")
  async getProjectSite(
    @Param("projectId") projectId: string,
    @Param("siteId") siteId: string
  ): Promise<SiteResponse> {
    return this.projectsService.getProjectSite(projectId, siteId);
  }

  @Patch(":projectId/sites/:siteId")
  async updateProjectSite(
    @Param("projectId") projectId: string,
    @Param("siteId") siteId: string,
    @Body() body: unknown
  ): Promise<UpdateSiteResponse> {
    return this.projectsService.updateProjectSite(projectId, siteId, body);
  }

  @Delete(":projectId/sites/:siteId")
  async archiveProjectSite(
    @Param("projectId") projectId: string,
    @Param("siteId") siteId: string
  ): Promise<UpdateSiteResponse> {
    return this.projectsService.archiveProjectSite(projectId, siteId);
  }

  @Post(":projectId/sites/:siteId/set-default")
  async setDefaultProjectSite(
    @Param("projectId") projectId: string,
    @Param("siteId") siteId: string
  ): Promise<UpdateSiteResponse> {
    return this.projectsService.setDefaultProjectSite(projectId, siteId);
  }

  @Get(":projectId/sites/:siteId/pages")
  async listSitePages(
    @Param("projectId") projectId: string,
    @Param("siteId") siteId: string
  ): Promise<ProjectPagesListResponse> {
    return this.projectsService.listSitePages(projectId, siteId);
  }

  @Post(":projectId/sites/:siteId/pages")
  async createSitePage(
    @Param("projectId") projectId: string,
    @Param("siteId") siteId: string,
    @Body() body: unknown
  ): Promise<CreateProjectPageResponse> {
    return this.projectsService.createSitePage(projectId, siteId, body);
  }

  @Get(":projectId/sites/:siteId/pages/:pageId")
  async getSitePage(
    @Param("projectId") projectId: string,
    @Param("siteId") siteId: string,
    @Param("pageId") pageId: string
  ): Promise<SitePageResponse> {
    return this.projectsService.getSitePage(projectId, siteId, pageId);
  }

  @Patch(":projectId/sites/:siteId/pages/:pageId")
  async updateSitePage(
    @Param("projectId") projectId: string,
    @Param("siteId") siteId: string,
    @Param("pageId") pageId: string,
    @Body() body: unknown
  ): Promise<UpdateProjectPageResponse> {
    return this.projectsService.updateSitePage(projectId, siteId, pageId, body);
  }

  @Get(":projectId/sites/:siteId/pages/:pageId/document")
  async getSitePageDocument(
    @Param("projectId") projectId: string,
    @Param("siteId") siteId: string,
    @Param("pageId") pageId: string
  ): Promise<PageDocumentResponse> {
    return this.projectsService.getSitePageDocument(projectId, siteId, pageId);
  }

  @Put(":projectId/sites/:siteId/pages/:pageId/document")
  async saveSitePageDocument(
    @Param("projectId") projectId: string,
    @Param("siteId") siteId: string,
    @Param("pageId") pageId: string,
    @Body() body: unknown
  ): Promise<PageDocumentResponse> {
    return this.projectsService.saveSitePageDocument(
      projectId,
      siteId,
      pageId,
      body
    );
  }

  @Get(":projectId/pages")
  async listProjectPages(
    @Param("projectId") projectId: string
  ): Promise<ProjectPagesListResponse> {
    return this.projectsService.listProjectPages(projectId);
  }

  @Post(":projectId/pages")
  async createProjectPage(
    @Param("projectId") projectId: string,
    @Body() body: unknown
  ): Promise<CreateProjectPageResponse> {
    return this.projectsService.createProjectPage(projectId, body);
  }

  @Get(":projectId/pages/:pageId")
  async getProjectPage(
    @Param("projectId") projectId: string,
    @Param("pageId") pageId: string
  ): Promise<SitePageResponse> {
    return this.projectsService.getProjectPage(projectId, pageId);
  }

  @Patch(":projectId/pages/:pageId")
  async updateProjectPage(
    @Param("projectId") projectId: string,
    @Param("pageId") pageId: string,
    @Body() body: unknown
  ): Promise<UpdateProjectPageResponse> {
    return this.projectsService.updateProjectPage(projectId, pageId, body);
  }

  @Get(":projectId/pages/:pageId/document")
  async getProjectPageDocument(
    @Param("projectId") projectId: string,
    @Param("pageId") pageId: string
  ): Promise<PageDocumentResponse> {
    return this.projectsService.getProjectPageDocument(projectId, pageId);
  }

  @Put(":projectId/pages/:pageId/document")
  async saveProjectPageDocument(
    @Param("projectId") projectId: string,
    @Param("pageId") pageId: string,
    @Body() body: unknown
  ): Promise<PageDocumentResponse> {
    return this.projectsService.saveProjectPageDocument(projectId, pageId, body);
  }

  @Post(":projectId/pages/:pageId/sections")
  async addPageSection(
    @Param("projectId") projectId: string,
    @Param("pageId") pageId: string,
    @Body() body: unknown
  ): Promise<PageSectionMutationResponse> {
    return this.projectsService.addPageSection(projectId, pageId, body);
  }

  @Post(":projectId/pages/:pageId/sections/reorder")
  async reorderPageSections(
    @Param("projectId") projectId: string,
    @Param("pageId") pageId: string,
    @Body() body: unknown
  ): Promise<PageSectionMutationResponse> {
    return this.projectsService.reorderPageSections(projectId, pageId, body);
  }

  @Post(":projectId/pages/:pageId/sections/:sectionId/duplicate")
  async duplicatePageSection(
    @Param("projectId") projectId: string,
    @Param("pageId") pageId: string,
    @Param("sectionId") sectionId: string,
    @Body() body: unknown
  ): Promise<PageSectionMutationResponse> {
    return this.projectsService.duplicatePageSection(
      projectId,
      pageId,
      sectionId,
      body
    );
  }

  @Patch(":projectId/pages/:pageId/sections/:sectionId")
  async updatePageSection(
    @Param("projectId") projectId: string,
    @Param("pageId") pageId: string,
    @Param("sectionId") sectionId: string,
    @Body() body: unknown
  ): Promise<PageSectionMutationResponse> {
    return this.projectsService.updatePageSection(projectId, pageId, sectionId, body);
  }

  @Delete(":projectId/pages/:pageId/sections/:sectionId")
  async deletePageSection(
    @Param("projectId") projectId: string,
    @Param("pageId") pageId: string,
    @Param("sectionId") sectionId: string,
    @Body() body: unknown
  ): Promise<PageSectionMutationResponse> {
    return this.projectsService.deletePageSection(projectId, pageId, sectionId, body);
  }
}
