import "reflect-metadata";
import { Test } from "@nestjs/testing";
import { describe, expect, it, vi } from "vitest";
import { MediaController } from "./media.controller";
import {
  type MediaAssetsListResponse,
  MediaService,
  type UploadMediaAssetResponse
} from "./media.service";

describe("MediaController", () => {
  it("receives MediaService through Nest DI for project media endpoints", async () => {
    const listResponse: MediaAssetsListResponse = {
      assets: []
    };
    const uploadResponse: UploadMediaAssetResponse = {
      asset: {
        id: "asset-1",
        originalFilename: "image.png",
        mimeType: "image/png",
        sizeBytes: 67,
        width: 1,
        height: 1,
        altText: "Image",
        url: "http://localhost:3002/api/projects/project-a/media/asset-1/content",
        createdAt: "2026-01-01T00:00:00.000Z",
        usageCount: 0
      }
    };
    const listProjectMedia = vi.fn<MediaService["listProjectMedia"]>(
      async () => listResponse
    );
    const uploadProjectMedia = vi.fn<MediaService["uploadProjectMedia"]>(
      async () => uploadResponse
    );
    const mediaService: Pick<
      MediaService,
      "listProjectMedia" | "uploadProjectMedia"
    > = {
      listProjectMedia,
      uploadProjectMedia
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [MediaController],
      providers: [
        {
          provide: MediaService,
          useValue: mediaService
        }
      ]
    }).compile();

    try {
      const controller = moduleRef.get(MediaController);

      await expect(controller.listProjectMedia("project-a")).resolves.toBe(
        listResponse
      );
      await expect(
        controller.uploadProjectMedia("project-a", undefined, {})
      ).resolves.toBe(uploadResponse);
      expect(listProjectMedia).toHaveBeenCalledWith("project-a");
      expect(uploadProjectMedia).toHaveBeenCalledWith("project-a", undefined, {});
    } finally {
      await moduleRef.close();
    }
  });
});
