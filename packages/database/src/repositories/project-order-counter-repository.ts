import type { ProjectOrderCounter } from "@prisma/client";
import type { RepositoryPrismaClient } from "../types";

export class ProjectOrderCounterRepository {
  constructor(private readonly client: RepositoryPrismaClient) {}

  async nextOrderNumber(input: {
    readonly organizationId: string;
    readonly projectId: string;
  }): Promise<number> {
    const counter = await this.client.projectOrderCounter.upsert({
      where: {
        projectId: input.projectId
      },
      create: {
        organizationId: input.organizationId,
        projectId: input.projectId,
        lastOrderNumber: 1001
      },
      update: {
        lastOrderNumber: {
          increment: 1
        }
      }
    });

    return counter.lastOrderNumber;
  }

  async findByProject(projectId: string): Promise<ProjectOrderCounter | null> {
    return this.client.projectOrderCounter.findUnique({
      where: {
        projectId
      }
    });
  }
}
