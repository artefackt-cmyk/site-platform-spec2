import type { Order, OrderItem, OrderStatus, ProductCurrency } from "@prisma/client";
import type { TenantContext } from "@site-platform/domain";
import type { RepositoryPrismaClient } from "../types";

export type OrderWithItems = Order & {
  readonly items: readonly OrderItem[];
};

export type CreateOrderItemSnapshotInput = {
  readonly productId: string | null;
  readonly variantId: string | null;
  readonly productNameSnapshot: string;
  readonly variantNameSnapshot: string;
  readonly skuSnapshot: string;
  readonly unitPriceMinor: number;
  readonly quantity: number;
  readonly lineTotalMinor: number;
  readonly currency: ProductCurrency;
  readonly mediaUrlSnapshot?: string | null;
  readonly inventoryDecremented: boolean;
};

export type CreateOrderInput = {
  readonly organizationId: string;
  readonly projectId: string;
  readonly orderNumber: number;
  readonly status?: OrderStatus;
  readonly currency: ProductCurrency;
  readonly subtotalMinor: number;
  readonly totalMinor: number;
  readonly customerName: string;
  readonly customerEmail: string;
  readonly customerPhone?: string | null;
  readonly customerComment?: string | null;
  readonly idempotencyKey: string;
  readonly idempotencyPayloadHash: string;
  readonly publicHandleSnapshot: string;
  readonly publicTokenHash: string;
  readonly items: readonly CreateOrderItemSnapshotInput[];
};

export class OrderRepository {
  constructor(private readonly client: RepositoryPrismaClient) {}

  async create(input: CreateOrderInput): Promise<OrderWithItems> {
    return this.client.order.create({
      data: {
        organizationId: input.organizationId,
        projectId: input.projectId,
        orderNumber: input.orderNumber,
        status: input.status ?? "NEW",
        currency: input.currency,
        subtotalMinor: input.subtotalMinor,
        totalMinor: input.totalMinor,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone ?? null,
        customerComment: input.customerComment ?? null,
        idempotencyKey: input.idempotencyKey,
        idempotencyPayloadHash: input.idempotencyPayloadHash,
        publicHandleSnapshot: input.publicHandleSnapshot,
        publicTokenHash: input.publicTokenHash,
        items: {
          create: input.items.map((item) => ({
            organizationId: input.organizationId,
            projectId: input.projectId,
            productId: item.productId,
            variantId: item.variantId,
            productNameSnapshot: item.productNameSnapshot,
            variantNameSnapshot: item.variantNameSnapshot,
            skuSnapshot: item.skuSnapshot,
            unitPriceMinor: item.unitPriceMinor,
            quantity: item.quantity,
            lineTotalMinor: item.lineTotalMinor,
            currency: item.currency,
            mediaUrlSnapshot: item.mediaUrlSnapshot ?? null,
            inventoryDecremented: item.inventoryDecremented
          }))
        }
      },
      include: orderItemsInclude
    });
  }

  async findByProjectAndIdempotency(input: {
    readonly projectId: string;
    readonly idempotencyKey: string;
  }): Promise<OrderWithItems | null> {
    return this.client.order.findUnique({
      where: {
        projectId_idempotencyKey: {
          projectId: input.projectId,
          idempotencyKey: input.idempotencyKey
        }
      },
      include: orderItemsInclude
    });
  }

  async listByProject(input: {
    readonly tenantContext: TenantContext;
    readonly projectId: string;
    readonly status?: OrderStatus;
    readonly search?: string;
    readonly skip?: number;
    readonly take?: number;
  }): Promise<readonly OrderWithItems[]> {
    const search = input.search?.trim();
    const orderNumberSearch =
      search === undefined || search === "" ? Number.NaN : Number.parseInt(search, 10);

    return this.client.order.findMany({
      where: {
        organizationId: input.tenantContext.organizationId,
        projectId: input.projectId,
        ...(input.status === undefined ? {} : { status: input.status }),
        ...(search === undefined || search === ""
          ? {}
          : {
              OR: [
                {
                  customerName: {
                    contains: search,
                    mode: "insensitive"
                  }
                },
                {
                  customerEmail: {
                    contains: search,
                    mode: "insensitive"
                  }
                },
                ...(Number.isInteger(orderNumberSearch)
                  ? [{ orderNumber: orderNumberSearch }]
                  : [])
              ]
            })
      },
      include: orderItemsInclude,
      orderBy: {
        createdAt: "desc"
      },
      skip: input.skip ?? 0,
      take: input.take ?? 50
    });
  }

  async getByProjectAndId(input: {
    readonly tenantContext: TenantContext;
    readonly projectId: string;
    readonly orderId: string;
  }): Promise<OrderWithItems | null> {
    return this.client.order.findFirst({
      where: {
        organizationId: input.tenantContext.organizationId,
        projectId: input.projectId,
        id: input.orderId
      },
      include: orderItemsInclude
    });
  }

  async findByPublicTokenHash(
    publicTokenHash: string
  ): Promise<OrderWithItems | null> {
    return this.client.order.findUnique({
      where: {
        publicTokenHash
      },
      include: orderItemsInclude
    });
  }

  async updateStatus(input: {
    readonly tenantContext: TenantContext;
    readonly projectId: string;
    readonly orderId: string;
    readonly status: OrderStatus;
    readonly cancelledAt?: Date | null;
    readonly completedAt?: Date | null;
  }): Promise<OrderWithItems | null> {
    const result = await this.client.order.updateMany({
      where: {
        organizationId: input.tenantContext.organizationId,
        projectId: input.projectId,
        id: input.orderId
      },
      data: {
        status: input.status,
        ...(input.cancelledAt === undefined
          ? {}
          : { cancelledAt: input.cancelledAt }),
        ...(input.completedAt === undefined
          ? {}
          : { completedAt: input.completedAt })
      }
    });

    if (result.count === 0) {
      return null;
    }

    return this.getByProjectAndId(input);
  }
}

const orderItemsInclude = {
  items: {
    orderBy: {
      createdAt: "asc"
    }
  }
} as const;
