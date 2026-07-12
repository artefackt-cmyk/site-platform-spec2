import { Inject, Injectable } from "@nestjs/common";
import {
  AuditLogRepository,
  type DatabasePrismaClient,
  OrderRepository,
  type OrderStatus,
  type OrderWithItems,
  ProductVariantRepository,
  type ProductVariant,
  ProjectOrderCounterRepository,
  ProjectPublicationSettingsRepository,
  ProjectRepository,
  type RepositoryPrismaClient
} from "@site-platform/database";
import {
  ORDER_ERROR_CODES,
  canTransitionOrderStatus,
  formatRubMoney,
  isOrderStatus,
  validateCreateOrderInput,
  type CartItem,
  type CreateOrderInput as DomainCreateOrderInput,
  type TenantContext
} from "@site-platform/domain";
import { API_ERROR_CODES, badRequest, conflict, forbidden, notFound } from "./api-errors";
import {
  CURRENT_IDENTITY_RESOLVER,
  type CurrentIdentityResolver
} from "./current-identity";
import { DATABASE_CLIENT } from "./database.provider";
import { hashSecretToken } from "./auth-security";

export type PublicOrderItemResponse = {
  readonly productName: string;
  readonly variantName: string;
  readonly sku: string;
  readonly unitPriceMinor: number;
  readonly quantity: number;
  readonly lineTotalMinor: number;
  readonly currency: "RUB";
};

export type PublicOrderResponse = {
  readonly orderNumber: number;
  readonly status: OrderStatus;
  readonly totalMinor: number;
  readonly subtotalMinor: number;
  readonly currency: "RUB";
  readonly customerName: string;
  readonly customerEmailMasked: string;
  readonly items: readonly PublicOrderItemResponse[];
  readonly createdAt: string;
  readonly successToken?: string;
};

export type DashboardOrderSummaryResponse = {
  readonly id: string;
  readonly orderNumber: number;
  readonly status: OrderStatus;
  readonly customerName: string;
  readonly customerEmail: string;
  readonly totalMinor: number;
  readonly currency: "RUB";
  readonly itemsCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type DashboardOrderDetailResponse = DashboardOrderSummaryResponse & {
  readonly customerPhone: string | null;
  readonly customerComment: string | null;
  readonly subtotalMinor: number;
  readonly cancelledAt: string | null;
  readonly completedAt: string | null;
  readonly items: readonly (PublicOrderItemResponse & {
    readonly productId: string | null;
    readonly variantId: string | null;
    readonly mediaUrl: string | null;
  })[];
};

export type DashboardOrdersListResponse = {
  readonly orders: readonly DashboardOrderSummaryResponse[];
  readonly pagination: {
    readonly page: number;
    readonly pageSize: number;
  };
};

@Injectable()
export class OrderService {
  constructor(
    @Inject(DATABASE_CLIENT) private readonly client: DatabasePrismaClient,
    @Inject(CURRENT_IDENTITY_RESOLVER)
    private readonly currentIdentityResolver: CurrentIdentityResolver
  ) {}

  async createPublicOrder(
    publicHandle: string,
    body: unknown
  ): Promise<PublicOrderResponse> {
    const payload = parseCreateOrderBody(publicHandle, body);
    const validation = validateCreateOrderInput(payload);

    if (!validation.ok) {
      throw orderValidationError(validation.code);
    }

    const normalizedInput = validation.value;
    const projectLookup =
      await new ProjectPublicationSettingsRepository(
        this.client
      ).findProjectByPublicHandle(normalizedInput.publicHandle);

    if (projectLookup === null) {
      throw notFound(
        API_ERROR_CODES.orderProjectUnavailable,
        "Published storefront was not found."
      );
    }

    const activeSnapshot = await this.client.publishedPageState.findFirst({
      where: {
        projectId: projectLookup.project.id,
        activeSnapshotId: {
          not: null
        }
      },
      select: {
        id: true
      }
    });

    if (activeSnapshot === null) {
      throw notFound(
        API_ERROR_CODES.orderProjectUnavailable,
        "Published storefront was not found."
      );
    }

    const payloadHash = hashOrderPayload(normalizedInput);

    return this.client.$transaction(async (transaction) => {
      const orderRepository = new OrderRepository(transaction);
      const existingOrder = await orderRepository.findByProjectAndIdempotency({
        projectId: projectLookup.project.id,
        idempotencyKey: normalizedInput.idempotencyKey
      });

      if (existingOrder !== null) {
        if (existingOrder.idempotencyPayloadHash !== payloadHash) {
          throw conflict(
            API_ERROR_CODES.orderIdempotencyConflict,
            "Idempotency key was already used for a different order payload."
          );
        }

        return toPublicOrderResponse(existingOrder, normalizedInput.idempotencyKey);
      }

      const resolvedItems = await resolveCheckoutItems(
        transaction,
        projectLookup.project.organizationId,
        projectLookup.project.id,
        normalizedInput.items
      );
      const subtotalMinor = resolvedItems.reduce(
        (sum, item) => sum + item.lineTotalMinor,
        0
      );
      const orderNumber = await new ProjectOrderCounterRepository(
        transaction
      ).nextOrderNumber({
        organizationId: projectLookup.project.organizationId,
        projectId: projectLookup.project.id
      });
      const publicTokenHash = hashSecretToken(normalizedInput.idempotencyKey);
      const variantRepository = new ProductVariantRepository(transaction);

      for (const item of resolvedItems) {
        if (!item.inventoryDecremented) {
          continue;
        }

        const decremented = await variantRepository.decrementStockIfAvailable({
          organizationId: projectLookup.project.organizationId,
          projectId: projectLookup.project.id,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          requireAvailableStock: item.requireAvailableStock
        });

        if (!decremented) {
          throw badRequest(
            API_ERROR_CODES.cartStockInsufficient,
            "Insufficient stock for cart item."
          );
        }
      }

      const order = await orderRepository.create({
        organizationId: projectLookup.project.organizationId,
        projectId: projectLookup.project.id,
        orderNumber,
        currency: "RUB",
        subtotalMinor,
        totalMinor: subtotalMinor,
        customerName: normalizedInput.customer.name,
        customerEmail: normalizedInput.customer.email,
        customerPhone: normalizedInput.customer.phone ?? null,
        customerComment: normalizedInput.customer.comment ?? null,
        idempotencyKey: normalizedInput.idempotencyKey,
        idempotencyPayloadHash: payloadHash,
        publicHandleSnapshot: normalizedInput.publicHandle,
        publicTokenHash,
        items: resolvedItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          productNameSnapshot: item.productNameSnapshot,
          variantNameSnapshot: item.variantNameSnapshot,
          skuSnapshot: item.skuSnapshot,
          unitPriceMinor: item.unitPriceMinor,
          quantity: item.quantity,
          lineTotalMinor: item.lineTotalMinor,
          currency: "RUB",
          mediaUrlSnapshot: item.mediaUrlSnapshot,
          inventoryDecremented: item.inventoryDecremented
        }))
      });

      await new AuditLogRepository(transaction).create({
        organizationId: projectLookup.project.organizationId,
        actorUserId: null,
        action: "ORDER_CREATED",
        entityType: "Order",
        entityId: order.id,
        metadata: {
          projectId: projectLookup.project.id,
          orderNumber: order.orderNumber,
          itemsCount: order.items.length
        }
      });

      if (resolvedItems.some((item) => item.inventoryDecremented)) {
        await new AuditLogRepository(transaction).create({
          organizationId: projectLookup.project.organizationId,
          actorUserId: null,
          action: "ORDER_STOCK_DECREMENTED",
          entityType: "Order",
          entityId: order.id,
          metadata: {
            projectId: projectLookup.project.id,
            orderNumber: order.orderNumber
          }
        });
      }

      return toPublicOrderResponse(order, normalizedInput.idempotencyKey);
    });
  }

  async getPublicOrder(
    publicHandle: string,
    publicToken: string
  ): Promise<PublicOrderResponse> {
    const order = await new OrderRepository(this.client).findByPublicTokenHash(
      hashSecretToken(publicToken)
    );

    if (order === null || order.publicHandleSnapshot !== publicHandle) {
      throw notFound(API_ERROR_CODES.orderNotFound, "Order was not found.");
    }

    return toPublicOrderResponse(order);
  }

  async listProjectOrders(
    projectId: string,
    query: Record<string, string | undefined>
  ): Promise<DashboardOrdersListResponse> {
    const identity = await this.currentIdentityResolver.getCurrentIdentity();
    await this.requireProject(identity.tenantContext, projectId);
    const pageSize = parsePageSize(query.pageSize);
    const page = parsePage(query.page);
    const status = parseOrderStatus(query.status);
    const orders = await new OrderRepository(this.client).listByProject({
      tenantContext: identity.tenantContext,
      projectId,
      ...(status === undefined ? {} : { status }),
      ...(query.search === undefined ? {} : { search: query.search }),
      skip: (page - 1) * pageSize,
      take: pageSize
    });

    return {
      orders: orders.map(toDashboardOrderSummary),
      pagination: {
        page,
        pageSize
      }
    };
  }

  async getProjectOrder(
    projectId: string,
    orderId: string
  ): Promise<DashboardOrderDetailResponse> {
    const identity = await this.currentIdentityResolver.getCurrentIdentity();
    await this.requireProject(identity.tenantContext, projectId);
    const order = await new OrderRepository(this.client).getByProjectAndId({
      tenantContext: identity.tenantContext,
      projectId,
      orderId
    });

    if (order === null) {
      throw notFound(API_ERROR_CODES.orderNotFound, "Order was not found.");
    }

    return toDashboardOrderDetail(order);
  }

  async updateProjectOrderStatus(
    projectId: string,
    orderId: string,
    body: unknown
  ): Promise<DashboardOrderDetailResponse> {
    const identity = await this.currentIdentityResolver.getCurrentIdentity();

    if (
      identity.role !== "OWNER" &&
      identity.role !== "ADMIN" &&
      identity.role !== "STORE_MANAGER"
    ) {
      throw forbidden(
        API_ERROR_CODES.permissionDenied,
        "Current user cannot change order status."
      );
    }

    await this.requireProject(identity.tenantContext, projectId);
    const nextStatus = parseStatusBody(body);

    return this.client.$transaction(async (transaction) => {
      const orderRepository = new OrderRepository(transaction);
      const currentOrder = await orderRepository.getByProjectAndId({
        tenantContext: identity.tenantContext,
        projectId,
        orderId
      });

      if (currentOrder === null) {
        throw notFound(API_ERROR_CODES.orderNotFound, "Order was not found.");
      }

      if (!canTransitionOrderStatus(currentOrder.status, nextStatus)) {
        throw badRequest(
          API_ERROR_CODES.orderStatusTransitionInvalid,
          "Order status transition is invalid."
        );
      }

      if (nextStatus === "CANCELLED") {
        const variantRepository = new ProductVariantRepository(transaction);

        for (const item of currentOrder.items) {
          if (!item.inventoryDecremented || item.variantId === null) {
            continue;
          }

          await variantRepository.restoreStock({
            organizationId: currentOrder.organizationId,
            projectId: currentOrder.projectId,
            variantId: item.variantId,
            quantity: item.quantity
          });
        }
      }

      const now = new Date();
      const updated = await orderRepository.updateStatus({
        tenantContext: identity.tenantContext,
        projectId,
        orderId,
        status: nextStatus,
        ...(nextStatus === "CANCELLED" ? { cancelledAt: now } : {}),
        ...(nextStatus === "COMPLETED" ? { completedAt: now } : {})
      });

      if (updated === null) {
        throw notFound(API_ERROR_CODES.orderNotFound, "Order was not found.");
      }

      await new AuditLogRepository(transaction).create({
        organizationId: identity.tenantContext.organizationId,
        actorUserId: identity.user.id,
        action: "ORDER_STATUS_CHANGED",
        entityType: "Order",
        entityId: updated.id,
        metadata: {
          projectId,
          orderNumber: updated.orderNumber,
          from: currentOrder.status,
          to: nextStatus
        }
      });

      if (nextStatus === "CANCELLED") {
        await new AuditLogRepository(transaction).create({
          organizationId: identity.tenantContext.organizationId,
          actorUserId: identity.user.id,
          action: "ORDER_CANCELLED",
          entityType: "Order",
          entityId: updated.id,
          metadata: {
            projectId,
            orderNumber: updated.orderNumber
          }
        });
        await new AuditLogRepository(transaction).create({
          organizationId: identity.tenantContext.organizationId,
          actorUserId: identity.user.id,
          action: "ORDER_STOCK_RESTORED",
          entityType: "Order",
          entityId: updated.id,
          metadata: {
            projectId,
            orderNumber: updated.orderNumber
          }
        });
      }

      if (nextStatus === "COMPLETED") {
        await new AuditLogRepository(transaction).create({
          organizationId: identity.tenantContext.organizationId,
          actorUserId: identity.user.id,
          action: "ORDER_COMPLETED",
          entityType: "Order",
          entityId: updated.id,
          metadata: {
            projectId,
            orderNumber: updated.orderNumber
          }
        });
      }

      return toDashboardOrderDetail(updated);
    });
  }

  private async requireProject(
    tenantContext: TenantContext,
    projectId: string
  ) {
    const project = await new ProjectRepository(
      this.client
    ).findByTenantContextAndId({
      tenantContext,
      projectId
    });

    if (project === null) {
      throw notFound(API_ERROR_CODES.projectNotFound, "Project was not found.");
    }
  }
}

type ResolvedCheckoutItem = {
  readonly productId: string;
  readonly variantId: string;
  readonly productNameSnapshot: string;
  readonly variantNameSnapshot: string;
  readonly skuSnapshot: string;
  readonly unitPriceMinor: number;
  readonly quantity: number;
  readonly lineTotalMinor: number;
  readonly mediaUrlSnapshot: string | null;
  readonly inventoryDecremented: boolean;
  readonly requireAvailableStock: boolean;
};

async function resolveCheckoutItems(
  client: Pick<RepositoryPrismaClient, "productVariant">,
  organizationId: string,
  projectId: string,
  cartItems: readonly CartItem[]
): Promise<readonly ResolvedCheckoutItem[]> {
  const variants = await client.productVariant.findMany({
    where: {
      organizationId,
      projectId,
      id: {
        in: cartItems.map((item) => item.variantId)
      },
      deletedAt: null,
      product: {
        organizationId,
        projectId,
        deletedAt: null,
        status: "ACTIVE"
      }
    },
    include: {
      product: true
    }
  });
  const variantById = new Map<string, ProductVariant & { product: { title: string } }>(
    variants.map((variant) => [variant.id, variant])
  );
  const resolved: ResolvedCheckoutItem[] = [];

  for (const cartItem of cartItems) {
    const variant = variantById.get(cartItem.variantId);

    if (variant === undefined || variant.productId !== cartItem.productId) {
      throw badRequest(
        API_ERROR_CODES.cartItemUnavailable,
        "Cart item is unavailable."
      );
    }

    if (
      variant.trackInventory &&
      !variant.allowBackorder &&
      variant.stockQuantity < cartItem.quantity
    ) {
      throw badRequest(
        API_ERROR_CODES.cartStockInsufficient,
        "Insufficient stock for cart item."
      );
    }

    resolved.push({
      productId: variant.productId,
      variantId: variant.id,
      productNameSnapshot: variant.product.title,
      variantNameSnapshot: variant.title,
      skuSnapshot: variant.sku,
      unitPriceMinor: variant.priceMinor,
      quantity: cartItem.quantity,
      lineTotalMinor: variant.priceMinor * cartItem.quantity,
      mediaUrlSnapshot: null,
      inventoryDecremented: variant.trackInventory,
      requireAvailableStock: variant.trackInventory && !variant.allowBackorder
    });
  }

  return resolved;
}

function parseCreateOrderBody(
  publicHandle: string,
  body: unknown
): DomainCreateOrderInput {
  const record = requireRecord(body);
  const customer = requireRecord(record.customer);

  if (!Array.isArray(record.items)) {
    throw orderValidationError(ORDER_ERROR_CODES.cartEmpty);
  }

  return {
    publicHandle,
    idempotencyKey: getRequiredString(record.idempotencyKey),
    customer: {
      name: getRequiredString(customer.name),
      email: getRequiredString(customer.email),
      ...(typeof customer.phone === "string" ? { phone: customer.phone } : {}),
      ...(typeof customer.comment === "string"
        ? { comment: customer.comment }
        : {})
    },
    items: record.items.map((item) => {
      const itemRecord = requireRecord(item);

      return {
        productId: getRequiredString(itemRecord.productId),
        variantId: getRequiredString(itemRecord.variantId),
        quantity: Number(itemRecord.quantity)
      };
    })
  };
}

function parseStatusBody(body: unknown): OrderStatus {
  const record = requireRecord(body);

  if (typeof record.status !== "string" || !isOrderStatus(record.status)) {
    throw badRequest(API_ERROR_CODES.orderStatusInvalid, "Order status is invalid.");
  }

  return record.status;
}

function parseOrderStatus(status: string | undefined): OrderStatus | undefined {
  return status !== undefined && isOrderStatus(status) ? status : undefined;
}

function parsePage(value: string | undefined): number {
  const parsed = value === undefined ? 1 : Number.parseInt(value, 10);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function parsePageSize(value: string | undefined): number {
  const parsed = value === undefined ? 50 : Number.parseInt(value, 10);

  return Number.isInteger(parsed) && parsed > 0 && parsed <= 100 ? parsed : 50;
}

function toPublicOrderResponse(
  order: OrderWithItems,
  successToken?: string
): PublicOrderResponse {
  return {
    orderNumber: order.orderNumber,
    status: order.status,
    subtotalMinor: order.subtotalMinor,
    totalMinor: order.totalMinor,
    currency: order.currency,
    customerName: order.customerName,
    customerEmailMasked: maskEmail(order.customerEmail),
    items: order.items.map(toPublicOrderItem),
    createdAt: order.createdAt.toISOString(),
    ...(successToken === undefined ? {} : { successToken })
  };
}

function toDashboardOrderSummary(
  order: OrderWithItems
): DashboardOrderSummaryResponse {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    totalMinor: order.totalMinor,
    currency: order.currency,
    itemsCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString()
  };
}

function toDashboardOrderDetail(
  order: OrderWithItems
): DashboardOrderDetailResponse {
  return {
    ...toDashboardOrderSummary(order),
    customerPhone: order.customerPhone,
    customerComment: order.customerComment,
    subtotalMinor: order.subtotalMinor,
    cancelledAt: order.cancelledAt?.toISOString() ?? null,
    completedAt: order.completedAt?.toISOString() ?? null,
    items: order.items.map((item) => ({
      ...toPublicOrderItem(item),
      productId: item.productId,
      variantId: item.variantId,
      mediaUrl: item.mediaUrlSnapshot
    }))
  };
}

function toPublicOrderItem(
  item: OrderWithItems["items"][number]
): PublicOrderItemResponse {
  return {
    productName: item.productNameSnapshot,
    variantName: item.variantNameSnapshot,
    sku: item.skuSnapshot,
    unitPriceMinor: item.unitPriceMinor,
    quantity: item.quantity,
    lineTotalMinor: item.lineTotalMinor,
    currency: item.currency
  };
}

function hashOrderPayload(input: DomainCreateOrderInput): string {
  return hashSecretToken(
    JSON.stringify({
      publicHandle: input.publicHandle,
      customer: input.customer,
      items: input.items,
      idempotencyKey: input.idempotencyKey
    })
  );
}

function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  const visibleLocal = local.length <= 2 ? local[0] ?? "*" : local.slice(0, 2);

  return `${visibleLocal}${"*".repeat(Math.max(2, local.length - visibleLocal.length))}@${domain}`;
}

function getRequiredString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function requireRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw badRequest(API_ERROR_CODES.validationFailed, "Request body is invalid.");
  }

  return value as Record<string, unknown>;
}

function orderValidationError(code: string) {
  if (code === ORDER_ERROR_CODES.cartEmpty) {
    return badRequest(API_ERROR_CODES.cartEmpty, "Cart is empty.");
  }

  if (code === ORDER_ERROR_CODES.cartQuantityInvalid) {
    return badRequest(API_ERROR_CODES.cartQuantityInvalid, "Cart quantity is invalid.");
  }

  if (code === ORDER_ERROR_CODES.orderCustomerInvalid) {
    return badRequest(API_ERROR_CODES.orderCustomerInvalid, "Customer data is invalid.");
  }

  if (code === ORDER_ERROR_CODES.orderProjectUnavailable) {
    return notFound(
      API_ERROR_CODES.orderProjectUnavailable,
      "Published storefront was not found."
    );
  }

  if (code === ORDER_ERROR_CODES.orderIdempotencyConflict) {
    return conflict(
      API_ERROR_CODES.orderIdempotencyConflict,
      "Idempotency key is invalid."
    );
  }

  return badRequest(API_ERROR_CODES.cartItemInvalid, "Cart item is invalid.");
}

export function formatOrderMoney(amountMinor: number): string {
  return formatRubMoney({
    amountMinor,
    currency: "RUB"
  });
}
