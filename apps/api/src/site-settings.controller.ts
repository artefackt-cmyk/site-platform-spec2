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

  @Get(":projectId/sites/:siteId/site-settings")
  async getSiteSettings(
    @Param("projectId") projectId: string,
    @Param("siteId") siteId: string
  ): Promise<ProjectSiteSettingsResponse> {
    return this.siteSettingsService.getSiteSettings(projectId, siteId);
  }

  @Patch(":projectId/sites/:siteId/site-settings")
  async updateSiteSettings(
    @Param("projectId") projectId: string,
    @Param("siteId") siteId: string,
    @Body() body: unknown
  ): Promise<ProjectSiteSettingsResponse> {
    return this.siteSettingsService.updateSiteSettings(projectId, siteId, body);
  }
}
