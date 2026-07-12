import { Body, Controller, Get, Inject, Param, Patch, Post, Query } from "@nestjs/common";
import {
  OrderService,
  type DashboardOrderDetailResponse,
  type DashboardOrdersListResponse,
  type PublicOrderResponse
} from "./order.service";

@Controller("api/public/sites/:publicHandle/orders")
export class PublicOrderController {
  constructor(
    @Inject(OrderService)
    private readonly orderService: OrderService
  ) {}

  @Post()
  async createOrder(
    @Param("publicHandle") publicHandle: string,
    @Body() body: unknown
  ): Promise<PublicOrderResponse> {
    return this.orderService.createPublicOrder(publicHandle, body);
  }

  @Get(":publicToken")
  async getOrder(
    @Param("publicHandle") publicHandle: string,
    @Param("publicToken") publicToken: string
  ): Promise<PublicOrderResponse> {
    return this.orderService.getPublicOrder(publicHandle, publicToken);
  }
}

@Controller("api/projects/:projectId/orders")
export class OrderController {
  constructor(
    @Inject(OrderService)
    private readonly orderService: OrderService
  ) {}

  @Get()
  async listOrders(
    @Param("projectId") projectId: string,
    @Query() query: Record<string, string | undefined>
  ): Promise<DashboardOrdersListResponse> {
    return this.orderService.listProjectOrders(projectId, query);
  }

  @Get(":orderId")
  async getOrder(
    @Param("projectId") projectId: string,
    @Param("orderId") orderId: string
  ): Promise<DashboardOrderDetailResponse> {
    return this.orderService.getProjectOrder(projectId, orderId);
  }

  @Patch(":orderId/status")
  async updateStatus(
    @Param("projectId") projectId: string,
    @Param("orderId") orderId: string,
    @Body() body: unknown
  ): Promise<DashboardOrderDetailResponse> {
    return this.orderService.updateProjectOrderStatus(projectId, orderId, body);
  }
}
