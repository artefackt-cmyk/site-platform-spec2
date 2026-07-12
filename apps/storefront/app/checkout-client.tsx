"use client";

import { useMemo, useState, type FormEvent } from "react";
import { clearCart, useCart } from "./cart-client";
import { createPublicOrder } from "./public-site-client";

export function CheckoutClient({
  apiUrl,
  publicHandle
}: {
  readonly apiUrl: string;
  readonly publicHandle: string;
}) {
  const cart = useCart(publicHandle);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const subtotalLabel = useMemo(() => "Будет рассчитано при оформлении", []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (cart.lines.length === 0) {
      setError("Корзина пуста.");
      return;
    }

    if (!accepted) {
      setError("Подтвердите согласие на обработку данных.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    setSubmitting(true);

    const response = await createPublicOrder({
      apiUrl,
      publicHandle,
      idempotencyKey,
      customer: toCustomerPayload(formData),
      items: cart.lines.map((line) => ({
        productId: line.productId,
        variantId: line.variantId,
        quantity: line.quantity
      }))
    });

    setSubmitting(false);

    if (!response.ok) {
      setError(toCheckoutError(response.code, response.message));
      return;
    }

    clearCart(publicHandle);
    window.location.assign(
      `/s/${encodeURIComponent(publicHandle)}/order/${encodeURIComponent(
        response.order.successToken ?? idempotencyKey
      )}`
    );
  }

  return (
    <main className="storefront-checkout">
      <a className="storefront-back-link" href={`/s/${publicHandle}/products`}>
        Назад в каталог
      </a>
      <header>
        <p className="storefront-eyebrow">Checkout</p>
        <h1>Оформить заказ</h1>
      </header>
      <form className="storefront-checkout-layout" onSubmit={submit}>
        <section className="storefront-checkout-card">
          <h2>Покупатель</h2>
          <label>
            Имя
            <input
              name="name"
              autoComplete="name"
              required
              placeholder="Анна Иванова"
              disabled={submitting}
            />
          </label>
          <label>
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="name@example.com"
              disabled={submitting}
            />
          </label>
          <label>
            Телефон
            <input
              name="phone"
              autoComplete="tel"
              placeholder="+7"
              disabled={submitting}
            />
          </label>
          <label>
            Комментарий
            <textarea
              name="comment"
              rows={4}
              maxLength={1000}
              placeholder="Уточнение к заказу"
              disabled={submitting}
            />
          </label>
          <label className="storefront-consent">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(event) => setAccepted(event.currentTarget.checked)}
              disabled={submitting}
            />
            Согласен на обработку данных для оформления заказа.
          </label>
          {error === null ? null : (
            <p className="storefront-error" role="alert" aria-live="polite">
              {error}
            </p>
          )}
          <button
            className="storefront-primary-button"
            type="submit"
            disabled={submitting || cart.lines.length === 0}
          >
            {submitting ? "Оформляем..." : "Оформить заказ"}
          </button>
        </section>
        <aside className="storefront-checkout-card">
          <h2>Корзина</h2>
          {cart.lines.length === 0 ? (
            <p className="storefront-muted">Корзина пуста.</p>
          ) : (
            <div className="storefront-cart-list">
              {cart.lines.map((line) => (
                <article key={line.variantId} className="storefront-cart-row">
                  <div>
                    <strong>{line.productTitle}</strong>
                    <span>{line.variantTitle}</span>
                    <span>SKU: {line.sku}</span>
                  </div>
                  <div className="storefront-cart-controls">
                    <button
                      type="button"
                      onClick={() =>
                        cart.setQuantity(line.variantId, line.quantity - 1)
                      }
                      disabled={submitting}
                    >
                      -
                    </button>
                    <span>{line.quantity}</span>
                    <button
                      type="button"
                      onClick={() =>
                        cart.setQuantity(line.variantId, line.quantity + 1)
                      }
                      disabled={submitting}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => cart.remove(line.variantId)}
                      disabled={submitting}
                    >
                      Убрать
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
          <div className="storefront-total-row">
            <span>Итого</span>
            <strong>{subtotalLabel}</strong>
          </div>
        </aside>
      </form>
    </main>
  );
}

function optionalString(value: FormDataEntryValue | null): string | undefined {
  return typeof value === "string" && value.trim() !== ""
    ? value.trim()
    : undefined;
}

function toCustomerPayload(formData: FormData): {
  readonly name: string;
  readonly email: string;
  readonly phone?: string;
  readonly comment?: string;
} {
  const phone = optionalString(formData.get("phone"));
  const comment = optionalString(formData.get("comment"));

  return {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    ...(phone === undefined ? {} : { phone }),
    ...(comment === undefined ? {} : { comment })
  };
}

function toCheckoutError(code: string | undefined, message: string): string {
  if (code === "CART_STOCK_INSUFFICIENT") {
    return "Остаток изменился. Обновите количество и попробуйте снова.";
  }

  if (code === "CART_ITEM_UNAVAILABLE") {
    return "Один из товаров больше недоступен.";
  }

  if (code === "CART_QUANTITY_INVALID") {
    return "Количество должно быть от 1 до 99.";
  }

  if (code === "ORDER_IDEMPOTENCY_CONFLICT") {
    return "Повторная отправка отличается от первой. Обновите страницу.";
  }

  return message;
}
