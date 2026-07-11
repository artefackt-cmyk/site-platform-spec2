import "reflect-metadata";
import { Test } from "@nestjs/testing";
import { describe, expect, it, vi } from "vitest";
import {
  PublicationController,
  PublicSiteController
} from "./publication.controller";
import {
  PublicationService,
  PublicSiteService,
  type PublicationSettingsResponse,
  type PublicSitePageResponse
} from "./publication.service";

describe("PublicationController", () => {
  it("receives PublicationService through Nest DI", async () => {
    const response: PublicationSettingsResponse = {
      publicHandle: "demo-store",
      basePublicUrl: "http://localhost:3001",
      projectPublicUrl: "http://localhost:3001/s/demo-store",
      constraints: {
        minLength: 3,
        maxLength: 48,
        pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
        reserved: []
      }
    };
    const getPublicationSettings = vi.fn<
      PublicationService["getPublicationSettings"]
    >(async () => response);
    const moduleRef = await Test.createTestingModule({
      controllers: [PublicationController],
      providers: [
        {
          provide: PublicationService,
          useValue: {
            getPublicationSettings
          }
        }
      ]
    }).compile();

    try {
      const controller = moduleRef.get(PublicationController);

      await expect(
        controller.getPublicationSettings("project-a")
      ).resolves.toBe(response);
      expect(getPublicationSettings).toHaveBeenCalledWith("project-a");
    } finally {
      await moduleRef.close();
    }
  });
});

describe("PublicSiteController", () => {
  it("receives PublicSiteService through Nest DI", async () => {
    const response: PublicSitePageResponse = {
      projectName: "Demo Store",
      pageTitle: "Home",
      pageSlug: "home",
      snapshotVersion: 1,
      document: {
        schemaVersion: 2,
        root: {
          id: "root",
          type: "page",
          children: []
        }
      },
      publishedAt: "2026-01-01T00:00:00.000Z",
      canonicalPath: "/s/demo-store/home",
      navigation: []
    };
    const getPublishedPage = vi.fn<PublicSiteService["getPublishedPage"]>(
      async () => response
    );
    const moduleRef = await Test.createTestingModule({
      controllers: [PublicSiteController],
      providers: [
        {
          provide: PublicSiteService,
          useValue: {
            getPublishedPage
          }
        }
      ]
    }).compile();

    try {
      const controller = moduleRef.get(PublicSiteController);

      await expect(
        controller.getPublishedPage("demo-store", "home")
      ).resolves.toBe(response);
      expect(getPublishedPage).toHaveBeenCalledWith("demo-store", "home");
    } finally {
      await moduleRef.close();
    }
  });
});
