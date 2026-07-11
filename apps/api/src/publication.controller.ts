import {
  Body,
  Controller,
  Get,
  Header,
  Inject,
  Param,
  Patch,
  Post,
  Res
} from "@nestjs/common";
import {
  PublicSiteService,
  PublicationService,
  type PublicationHistoryResponse,
  type PublicationSettingsResponse,
  type PublicationStatusResponse,
  type PublicSitePageResponse,
  type PublishPageResponse
} from "./publication.service";

type HeaderResponse = {
  readonly setHeader: (name: string, value: string) => void;
};

@Controller("api/projects/:projectId")
export class PublicationController {
  constructor(
    @Inject(PublicationService)
    private readonly publicationService: PublicationService
  ) {}

  @Get("publication-settings")
  async getPublicationSettings(
    @Param("projectId") projectId: string
  ): Promise<PublicationSettingsResponse> {
    return this.publicationService.getPublicationSettings(projectId);
  }

  @Patch("publication-settings")
  async updatePublicationSettings(
    @Param("projectId") projectId: string,
    @Body() body: unknown
  ): Promise<PublicationSettingsResponse> {
    return this.publicationService.updatePublicationSettings(projectId, body);
  }

  @Get("pages/:pageId/publication-status")
  async getPagePublicationStatus(
    @Param("projectId") projectId: string,
    @Param("pageId") pageId: string
  ): Promise<PublicationStatusResponse> {
    return this.publicationService.getPagePublicationStatus(projectId, pageId);
  }

  @Post("pages/:pageId/publish")
  async publishPage(
    @Param("projectId") projectId: string,
    @Param("pageId") pageId: string,
    @Body() body: unknown
  ): Promise<PublishPageResponse> {
    return this.publicationService.publishPage(projectId, pageId, body);
  }

  @Post("pages/:pageId/unpublish")
  async unpublishPage(
    @Param("projectId") projectId: string,
    @Param("pageId") pageId: string
  ): Promise<{ readonly publicationStatus: PublicationStatusResponse }> {
    return this.publicationService.unpublishPage(projectId, pageId);
  }

  @Get("pages/:pageId/publications")
  async listPagePublications(
    @Param("projectId") projectId: string,
    @Param("pageId") pageId: string
  ): Promise<PublicationHistoryResponse> {
    return this.publicationService.listPagePublications(projectId, pageId);
  }

  @Post("pages/:pageId/publications/:snapshotId/rollback")
  async rollbackPagePublication(
    @Param("projectId") projectId: string,
    @Param("pageId") pageId: string,
    @Param("snapshotId") snapshotId: string
  ): Promise<PublishPageResponse> {
    return this.publicationService.rollbackPagePublication(
      projectId,
      pageId,
      snapshotId
    );
  }
}

@Controller("api/public")
export class PublicSiteController {
  constructor(
    @Inject(PublicSiteService)
    private readonly publicSiteService: PublicSiteService
  ) {}

  @Get("sites/:publicHandle")
  async getPublishedHome(
    @Param("publicHandle") publicHandle: string
  ): Promise<PublicSitePageResponse> {
    return this.publicSiteService.getPublishedHome(publicHandle);
  }

  @Get("sites/:publicHandle/pages/:pageSlug")
  async getPublishedPage(
    @Param("publicHandle") publicHandle: string,
    @Param("pageSlug") pageSlug: string
  ): Promise<PublicSitePageResponse> {
    return this.publicSiteService.getPublishedPage(publicHandle, pageSlug);
  }

  @Get("media/:assetId/content")
  @Header("X-Content-Type-Options", "nosniff")
  async getPublicMediaContent(
    @Param("assetId") assetId: string,
    @Res({ passthrough: true }) response: HeaderResponse
  ) {
    const content = await this.publicSiteService.getPublicMediaContent(assetId);

    response.setHeader("Content-Type", content.mimeType);
    response.setHeader("Cache-Control", content.cacheControl);
    response.setHeader("Last-Modified", content.lastModified);

    return content.file;
  }
}
