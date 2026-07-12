import { Body, Controller, Get, Inject, Param, Patch } from "@nestjs/common";
import {
  type ProjectSiteSettingsResponse,
  SiteSettingsService
} from "./site-settings.service";

@Controller("api/projects")
export class SiteSettingsController {
  constructor(
    @Inject(SiteSettingsService)
    private readonly siteSettingsService: SiteSettingsService
  ) {}

  @Get(":projectId/site-settings")
  async getProjectSiteSettings(
    @Param("projectId") projectId: string
  ): Promise<ProjectSiteSettingsResponse> {
    return this.siteSettingsService.getProjectSiteSettings(projectId);
  }

  @Patch(":projectId/site-settings")
  async updateProjectSiteSettings(
    @Param("projectId") projectId: string,
    @Body() body: unknown
  ): Promise<ProjectSiteSettingsResponse> {
    return this.siteSettingsService.updateProjectSiteSettings(projectId, body);
  }
}
