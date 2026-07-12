import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Put } from "@nestjs/common";
import {
  type CreateProjectPageResponse,
  type CreateProjectResponse,
  type PageDocumentResponse,
  type PageSectionMutationResponse,
  type ProjectPagesListResponse,
  type ProjectResponse,
  type ProjectsListResponse,
  type SitePageResponse,
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
