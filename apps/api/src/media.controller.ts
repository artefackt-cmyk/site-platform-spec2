import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Inject,
  Param,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseInterceptors
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { MEDIA_UPLOAD_MAX_BYTES } from "@site-platform/media-storage";
import {
  type DeleteMediaAssetResponse,
  type MediaAssetsListResponse,
  MediaService,
  type UpdateMediaAssetResponse,
  type UploadMediaAssetResponse,
  type UploadedMediaFile
} from "./media.service";

type HeaderResponse = {
  readonly setHeader: (name: string, value: string) => void;
};

@Controller("api/projects/:projectId/media")
export class MediaController {
  constructor(
    @Inject(MediaService)
    private readonly mediaService: MediaService
  ) {}

  @Get()
  async listProjectMedia(
    @Param("projectId") projectId: string
  ): Promise<MediaAssetsListResponse> {
    return this.mediaService.listProjectMedia(projectId);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor("file", {
      limits: {
        fileSize: MEDIA_UPLOAD_MAX_BYTES
      }
    })
  )
  async uploadProjectMedia(
    @Param("projectId") projectId: string,
    @UploadedFile() file: UploadedMediaFile | undefined,
    @Body() body: unknown
  ): Promise<UploadMediaAssetResponse> {
    return this.mediaService.uploadProjectMedia(projectId, file, body);
  }

  @Patch(":assetId")
  async updateProjectMedia(
    @Param("projectId") projectId: string,
    @Param("assetId") assetId: string,
    @Body() body: unknown
  ): Promise<UpdateMediaAssetResponse> {
    return this.mediaService.updateProjectMedia(projectId, assetId, body);
  }

  @Delete(":assetId")
  async deleteProjectMedia(
    @Param("projectId") projectId: string,
    @Param("assetId") assetId: string
  ): Promise<DeleteMediaAssetResponse> {
    return this.mediaService.deleteProjectMedia(projectId, assetId);
  }

  @Get(":assetId/content")
  @Header("X-Content-Type-Options", "nosniff")
  async getProjectMediaContent(
    @Param("projectId") projectId: string,
    @Param("assetId") assetId: string,
    @Res({ passthrough: true }) response: HeaderResponse
  ) {
    const content = await this.mediaService.getProjectMediaContent(
      projectId,
      assetId
    );

    response.setHeader("Content-Type", content.mimeType);
    response.setHeader("Cache-Control", content.cacheControl);

    return content.file;
  }
}
