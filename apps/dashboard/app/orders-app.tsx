"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DashboardApiError,
  createDashboardApiClient
} from "./dashboard-api-client";
import type {
  OrderDetail,
  OrderStatus,
  OrderSummary,
  ProjectSummary
} from "./dashboard-types";
import { MercurioAppShell } from "./mercurio-shell";

type OrdersState =
  | { readonly status: "loading" }
  | { readonly status: "error"; readonly message: string }
  | {
      readonly status: "ready";
      readonly project: ProjectSummary;
      readonly orders: readonly OrderSummary[];
    };

type OrderDetailState =
  | { readonly status: "loading" }
  | { readonly status: "error"; readonly message: string }
  | {
      readonly status: "ready";
      readonly project: ProjectSummary;
      readonly order: OrderDetail;
    };

export function OrdersApp({
  apiUrl,
  projectId
}: {
  readonly apiUrl: string;
  readonly projectId: string;
}) {
  const apiClient = useMemo(() => createDashboardApiClient(apiUrl), [apiUrl]);
  const [state, setState] = useState<OrdersState>({ status: "loading" });
  const [status, setStatus] = useState<OrderStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setState({ status: "loading" });

    try {
      const [project, ordersResponse] = await Promise.all([
        apiClient.getProject(projectId),
        apiClient.listOrders(projectId, {
          ...(status === "ALL" ? {} : { status }),
          ...(search.trim() === "" ? {} : { search })
        })
      ]);

      setState({
        status: "ready",
        project,
        orders: ordersResponse.orders
      });
    } catch (error) {
      setState({ status: "error", message: toErrorMessage(error) });
    }
  }, [apiClient, projectId, search, status]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.status === "loading") {
    return <CenterState title="Загрузка заказов" text="Получаем список заказов." />;
  }

  if (state.status === "error") {
    return <CenterState title="Заказы не открыты" text={state.message} tone="error" />;
  }

  return (
    <MercurioAppShell activeArea="orders" project={state.project}>
      <header className="topbar workspace-topbar">
        <div>
          <a className="back-link" href={`/projects/${projectId}`}>
            Назад в проект
          </a>
          <p className="eyebrow">Торговля</p>
          <h1>Заказы</h1>
        </div>
      </header>
      <section className="workspace-main orders-surface">
        <div className="workspace-section-heading">
          <div>
            <p className="eyebrow">{state.project.name}</p>
            <h2>Список заказов</h2>
          </div>
          <div className="workspace-actions">
            <input
              aria-label="Поиск заказов"
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              placeholder="Клиент или номер"
            />
            <select
              aria-label="Фильтр статуса"
              value={status}
              onChange={(event) => setStatus(toStatusFilter(event.currentTarget.value))}
            >
              <option value="ALL">Все</option>
              <option value="NEW">Новые</option>
              <option value="CONFIRMED">Подтвержденные</option>
              <option value="PROCESSING">В работе</option>
              <option value="COMPLETED">Завершенные</option>
              <option value="CANCELLED">Отмененные</option>
            </select>
          </div>
        </div>
        {state.orders.length === 0 ? (
          <section className="empty-state">
            <p className="eyebrow">Пока пусто</p>
            <h3>Заказов еще нет</h3>
            <p>Новые заказы появятся после checkout на опубликованной витрине.</p>
          </section>
        ) : (
          <div className="orders-list">
            {state.orders.map((order) => (
              <a
                key={order.id}
                className="order-row"
                href={`/projects/${projectId}/orders/${order.id}`}
              >
                <strong>#{order.orderNumber}</strong>
                <span>{formatDate(order.createdAt)}</span>
                <span>{order.customerName}</span>
                <span>{formatMoney(order.totalMinor)}</span>
                <span className={`order-status order-status-${order.status.toLowerCase()}`}>
                  {toStatusLabel(order.status)}
                </span>
                <span>{order.itemsCount} шт.</span>
              </a>
            ))}
          </div>
        )}
      </section>
    </MercurioAppShell>
  );
}

export function OrderDetailApp({
  apiUrl,
  projectId,
  orderId
}: {
  readonly apiUrl: string;
  readonly projectId: string;
  readonly orderId: string;
}) {
  const apiClient = useMemo(() => createDashboardApiClient(apiUrl), [apiUrl]);
  const [state, setState] = useState<OrderDetailState>({ status: "loading" });
  const [statusError, setStatusError] = useState<string | null>(null);
  const [submittingStatus, setSubmittingStatus] = useState<OrderStatus | null>(null);

  const load = useCallback(async () => {
    setState({ status: "loading" });

    try {
      const [project, order] = await Promise.all([
        apiClient.getProject(projectId),
        apiClient.getOrder(projectId, orderId)
      ]);

      setState({ status: "ready", project, order });
    } catch (error) {
      setState({ status: "error", message: toErrorMessage(error) });
    }
  }, [apiClient, orderId, projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = useCallback(
    async (nextStatus: OrderStatus) => {
      setSubmittingStatus(nextStatus);
      setStatusError(null);

      try {
        const order = await apiClient.updateOrderStatus(
          projectId,
          orderId,
          nextStatus
        );

        setState((current) =>
          current.status === "ready" ? { ...current, order } : current
        );
      } catch (error) {
        setStatusError(toErrorMessage(error));
      } finally {
        setSubmittingStatus(null);
      }
    },
    [apiClient, orderId, projectId]
  );

  if (state.status === "loading") {
    return <CenterState title="Загрузка заказа" text="Получаем карточку заказа." />;
  }

  if (state.status === "error") {
    return <CenterState title="Заказ не открыт" text={state.message} tone="error" />;
  }

  const order = state.order;

  return (
    <MercurioAppShell activeArea="orders" project={state.project}>
      <header className="topbar workspace-topbar">
        <div>
          <a className="back-link" href={`/projects/${projectId}/orders`}>
            Назад к заказам
          </a>
          <p className="eyebrow">Заказ #{order.orderNumber}</p>
          <h1>{toStatusLabel(order.status)}</h1>
        </div>
        <span className={`order-status order-status-${order.status.toLowerCase()}`}>
          {toStatusLabel(order.status)}
        </span>
      </header>
      <section className="workspace-main order-detail-grid">
        <article className="dashboard-card order-detail-card">
          <p className="eyebrow">Клиент</p>
          <h2>{order.customerName}</h2>
          <p>{order.customerEmail}</p>
          {order.customerPhone === null ? null : <p>{order.customerPhone}</p>}
          {order.customerComment === null ? null : (
            <p className="order-comment">{order.customerComment}</p>
          )}
        </article>
        <article className="dashboard-card order-detail-card">
          <p className="eyebrow">Timeline</p>
          <h2>События</h2>
          <p>Создан: {formatDate(order.createdAt)}</p>
          <p>Обновлен: {formatDate(order.updatedAt)}</p>
          {order.cancelledAt === null ? null : (
            <p>Отменен: {formatDate(order.cancelledAt)}</p>
          )}
          {order.completedAt === null ? null : (
            <p>Завершен: {formatDate(order.completedAt)}</p>
          )}
        </article>
        <article className="dashboard-card order-detail-card order-detail-wide">
          <div className="workspace-section-heading">
            <div>
              <p className="eyebrow">Snapshots</p>
              <h2>Позиции заказа</h2>
            </div>
            <strong>{formatMoney(order.totalMinor)}</strong>
          </div>
          <div className="orders-list">
            {order.items.map((item) => (
              <div key={`${item.sku}-${item.variantName}`} className="order-row">
                <strong>{item.productName}</strong>
                <span>{item.variantName}</span>
                <span>SKU: {item.sku}</span>
                <span>{item.quantity} шт.</span>
                <span>{formatMoney(item.unitPriceMinor)}</span>
                <span>{formatMoney(item.lineTotalMinor)}</span>
              </div>
            ))}
          </div>
        </article>
        <article className="dashboard-card order-detail-card">
          <p className="eyebrow">Статус</p>
          <h2>Действия</h2>
          <div className="order-actions">
            {nextStatuses(order.status).map((nextStatus) => (
              <button
                key={nextStatus}
                className="secondary-button"
                type="button"
                disabled={submittingStatus !== null}
                onClick={() => void updateStatus(nextStatus)}
              >
                {submittingStatus === nextStatus
                  ? "Сохраняем..."
                  : toActionLabel(nextStatus)}
              </button>
            ))}
          </div>
          {statusError === null ? null : (
            <p className="form-error" role="alert">
              {statusError}
            </p>
          )}
        </article>
      </section>
    </MercurioAppShell>
  );
}

function CenterState({
  title,
  text,
  tone = "neutral"
}: {
  readonly title: string;
  readonly text: string;
  readonly tone?: "neutral" | "error";
}) {
  return (
    <main className="dashboard-shell">
      <section className={tone === "error" ? "empty-state error-state" : "empty-state"}>
        <p className="eyebrow">{tone === "error" ? "Ошибка" : "Mercurio"}</p>
        <h1>{title}</h1>
        <p>{text}</p>
      </section>
    </main>
  );
}

function nextStatuses(status: OrderStatus): readonly OrderStatus[] {
  if (status === "NEW") {
    return ["CONFIRMED", "CANCELLED"];
  }

  if (status === "CONFIRMED") {
    return ["PROCESSING", "CANCELLED"];
  }

  if (status === "PROCESSING") {
    return ["COMPLETED", "CANCELLED"];
  }

  return [];
}

function toStatusFilter(value: string): OrderStatus | "ALL" {
  return value === "NEW" ||
    value === "CONFIRMED" ||
    value === "PROCESSING" ||
    value === "COMPLETED" ||
    value === "CANCELLED"
    ? value
    : "ALL";
}

function toStatusLabel(status: OrderStatus): string {
  const labels = {
    NEW: "Новый",
    CONFIRMED: "Подтвержден",
    PROCESSING: "В работе",
    COMPLETED: "Завершен",
    CANCELLED: "Отменен"
  } as const satisfies Record<OrderStatus, string>;

  return labels[status];
}

function toActionLabel(status: OrderStatus): string {
  const labels = {
    NEW: "Новый",
    CONFIRMED: "Подтвердить",
    PROCESSING: "Взять в работу",
    COMPLETED: "Завершить",
    CANCELLED: "Отменить"
  } as const satisfies Record<OrderStatus, string>;

  return labels[status];
}

function formatMoney(amountMinor: number): string {
  return `${(amountMinor / 100).toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} ₽`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function toErrorMessage(error: unknown): string {
  if (error instanceof DashboardApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Не удалось выполнить действие.";
}
