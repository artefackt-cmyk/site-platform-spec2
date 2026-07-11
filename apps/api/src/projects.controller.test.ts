import "reflect-metadata";
import { Test } from "@nestjs/testing";
import { describe, expect, it, vi } from "vitest";
import { ProjectsController } from "./projects.controller";
import {
  type CreateProjectResponse,
  type ProjectsListResponse,
  ProjectsService
} from "./projects.service";

describe("ProjectsController", () => {
  it("receives ProjectsService through Nest DI for GET /api/projects", async () => {
    const listResponse: ProjectsListResponse = {
      projects: []
    };
    const createResponse: CreateProjectResponse = {
      project: {
        id: "project-created",
        name: "Created Project",
        slug: "created-project",
        status: "DRAFT",
        createdAt: "2026-01-01T00:00:00.000Z"
      }
    };
    const listProjects = vi.fn<ProjectsService["listProjects"]>(
      async () => listResponse
    );
    const createProject = vi.fn<ProjectsService["createProject"]>(
      async () => createResponse
    );
    const projectsService: Pick<
      ProjectsService,
      "listProjects" | "createProject"
    > = {
      listProjects,
      createProject
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        {
          provide: ProjectsService,
          useValue: projectsService
        }
      ]
    }).compile();

    try {
      const controller = moduleRef.get(ProjectsController);

      await expect(controller.listProjects()).resolves.toBe(listResponse);
      expect(listProjects).toHaveBeenCalledOnce();
    } finally {
      await moduleRef.close();
    }
  });
});
