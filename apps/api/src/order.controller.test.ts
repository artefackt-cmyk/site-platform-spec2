import "reflect-metadata";
import { Test } from "@nestjs/testing";
import { describe, expect, it, vi } from "vitest";
import { OrderController, PublicOrderController } from "./order.controller";
import {
  OrderService,
  type DashboardOrdersListResponse,
  type PublicOrderResponse
} from "./order.service";

describe("OrderController", () => {
  it("delegates public order creation to OrderService", async () => {
    const response: PublicOrderResponse = createPublicOrderResponse();
    const createPublicOrder = vi.fn<OrderService["createPublicOrder"]>(
      async () => response
    );
    const moduleRef = await Test.createTestingModule({
      controllers: [PublicOrderController],
      providers: [
        {
          provide: OrderService,
          useValue: {
            createPublicOrder
          }
        }
      ]
    }).compile();

    try {
      const controller = moduleRef.get(PublicOrderController);
      const body = { idempotencyKey: "key" };

      await expect(controller.createOrder("demo-store", body)).resolves.toBe(
        response
      );
      expect(createPublicOrder).toHaveBeenCalledWith("demo-store", body);
    } finally {
      await moduleRef.close();
    }
  });

  it("delegates admin order list to OrderService", async () => {
    const response: DashboardOrdersListResponse = {
      orders: [],
      pagination: {
        page: 1,
        pageSize: 50
      }
    };
    const listProjectOrders = vi.fn<OrderService["listProjectOrders"]>(
      async () => response
    );
    const moduleRef = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        {
          provide: OrderService,
          useValue: {
            listProjectOrders
          }
        }
      ]
    }).compile();

    try {
      const controller = moduleRef.get(OrderController);

      await expect(controller.listOrders("project-1", {})).resolves.toBe(response);
      expect(listProjectOrders).toHaveBeenCalledWith("project-1", {});
    } finally {
      await moduleRef.close();
    }
  });
});

function createPublicOrderResponse(): PublicOrderResponse {
  return {
    orderNumber: 1001,
    status: "NEW",
    totalMinor: 10000,
    subtotalMinor: 10000,
    currency: "RUB",
    customerName: "Анна",
    customerEmailMasked: "an***@example.com",
    createdAt: "2026-07-12T00:00:00.000Z",
    successToken: "8d30d36e-5984-4c21-a66f-40f6f7dc71c2",
    items: [
      {
        productName: "Демо футболка",
        variantName: "Основной вариант",
        sku: "TSHIRT",
        unitPriceMinor: 10000,
        quantity: 1,
        lineTotalMinor: 10000,
        currency: "RUB"
      }
    ]
  };
}
