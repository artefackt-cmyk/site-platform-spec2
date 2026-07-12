import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("dashboard orders UI", () => {
  it("defines real orders list and detail routes without payment or shipping UI", () => {
    const source = readFileSync(new URL("./orders-app.tsx", import.meta.url), "utf8");

    expect(source).toContain("Заказы");
    expect(source).toContain("Позиции заказа");
    expect(source).toContain("order-status");
    expect(source).not.toContain("Оплата");
    expect(source).not.toContain("Доставка");
    expect(source).not.toContain("Возврат");
  });

  it("ships responsive order list and status classes", () => {
    const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");

    expect(css).toContain(".orders-list");
    expect(css).toContain(".order-row");
    expect(css).toContain(".order-status-completed");
    expect(css).toContain(".order-status-cancelled");
    expect(css).toContain(".order-detail-grid");
  });
});
