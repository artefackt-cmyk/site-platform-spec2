import { Body, Controller, Get, Inject, Param, Post } from "@nestjs/common";
import {
  type CreateProjectPageResponse,
  type CreateProjectResponse,
  type ProjectPagesListResponse,
  type ProjectResponse,
  type ProjectsListResponse,
  type SitePageResponse,
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
}
