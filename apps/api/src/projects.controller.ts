import { Body, Controller, Get, Inject, Post } from "@nestjs/common";
import {
  type CreateProjectResponse,
  type ProjectsListResponse,
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
}
