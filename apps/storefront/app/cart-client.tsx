"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import type { PublicProductVariantResponse } from "./public-site-client";

export type CartLine = {
  readonly productId: string;
  readonly variantId: string;
  readonly productTitle: string;
  readonly variantTitle: string;
  readonly sku: string;
  readonly quantity: number;
};

const CART_EVENT = "mercurio-cart-updated";

export function CartBadge({ publicHandle }: { readonly publicHandle: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const update = () => setCount(getCart(publicHandle).itemCount);

    update();
    window.addEventListener(CART_EVENT, update);
    window.addEventListener("storage", update);

    return () => {
      window.removeEventListener(CART_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, [publicHandle]);

  return (
    <a className="storefront-cart-link" href={`/s/${publicHandle}/checkout`}>
      Корзина <span aria-label={`${count} товаров в корзине`}>{count}</span>
    </a>
  );
}

export function ProductAddToCart({
  publicHandle,
  productId,
  productTitle,
  variants,
  defaultVariantId
}: {
  readonly publicHandle: string;
  readonly productId: string;
  readonly productTitle: string;
  readonly variants: readonly PublicProductVariantResponse[];
  readonly defaultVariantId: string | null;
}) {
  const initialVariantId = defaultVariantId ?? variants[0]?.id ?? "";
  const [variantId, setVariantId] = useState(initialVariantId);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const selectedVariant =
    variants.find((variant) => variant.id === variantId) ?? variants[0] ?? null;
  const unavailable =
    selectedVariant === null || selectedVariant.availability === "out-of-stock";

  return (
    <section className="storefront-cart-panel" aria-label="Покупка товара">
      <label>
        Вариант
        <select
          value={selectedVariant?.id ?? ""}
          onChange={(event) => setVariantId(event.currentTarget.value)}
        >
          {variants.map((variant) => (
            <option key={variant.id} value={variant.id}>
              {variant.title} · {variant.price.formatted}
            </option>
          ))}
        </select>
      </label>
      <label>
        Количество
        <input
          min={1}
          max={99}
          type="number"
          value={quantity}
          onChange={(event) =>
            setQuantity(clampQuantity(Number(event.currentTarget.value)))
          }
        />
      </label>
      <p className="storefront-stock-hint">
        {selectedVariant === null
          ? "Товар недоступен"
          : toStockHint(selectedVariant)}
      </p>
      <button
        className="storefront-primary-button"
        type="button"
        disabled={unavailable}
        onClick={() => {
          if (selectedVariant === null) {
            return;
          }

          addCartItem(publicHandle, {
            productId,
            productTitle,
            variantId: selectedVariant.id,
            variantTitle: selectedVariant.title,
            sku: selectedVariant.sku,
            quantity
          });
          setMessage("Товар добавлен в корзину.");
        }}
      >
        {unavailable ? "Нет в наличии" : "В корзину"}
      </button>
      <div className="storefront-cart-feedback" aria-live="polite">
        {message}
      </div>
    </section>
  );
}

export function CatalogCartAction({
  publicHandle,
  productId,
  productTitle,
  productSlug,
  defaultVariant
}: {
  readonly publicHandle: string;
  readonly productId: string;
  readonly productTitle: string;
  readonly productSlug: string;
  readonly defaultVariant: PublicProductVariantResponse | null;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const canAdd =
    defaultVariant !== null && defaultVariant.availability !== "out-of-stock";

  if (!canAdd) {
    return (
      <a
        className="storefront-secondary-button"
        href={`/s/${publicHandle}/products/${productSlug}`}
      >
        Выбрать варианты
      </a>
    );
  }

  return (
    <div className="storefront-card-action">
      <button
        className="storefront-primary-button"
        type="button"
        onClick={() => {
          addCartItem(publicHandle, {
            productId,
            productTitle,
            variantId: defaultVariant.id,
            variantTitle: defaultVariant.title,
            sku: defaultVariant.sku,
            quantity: 1
          });
          setMessage("Добавлено.");
        }}
      >
        В корзину
      </button>
      <a
        className="storefront-secondary-button"
        href={`/s/${publicHandle}/products/${productSlug}`}
      >
        Подробнее
      </a>
      <span aria-live="polite">{message}</span>
    </div>
  );
}

export function useCart(publicHandle: string) {
  const [lines, setLines] = useState<readonly CartLine[]>([]);

  useEffect(() => {
    const update = () => setLines(getCart(publicHandle).lines);

    update();
    window.addEventListener(CART_EVENT, update);
    window.addEventListener("storage", update);

    return () => {
      window.removeEventListener(CART_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, [publicHandle]);

  return useMemo(
    () => ({
      lines,
      itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
      setQuantity: (variantId: string, quantity: number) =>
        setCartQuantity(publicHandle, variantId, quantity),
      remove: (variantId: string) => removeCartItem(publicHandle, variantId),
      clear: () => clearCart(publicHandle)
    }),
    [lines, publicHandle]
  );
}

export function getCart(publicHandle: string): {
  readonly lines: readonly CartLine[];
  readonly itemCount: number;
} {
  if (typeof window === "undefined") {
    return {
      lines: [],
      itemCount: 0
    };
  }

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(cartKey(publicHandle)) ?? "[]"
    ) as unknown;
    const lines = Array.isArray(parsed) ? parsed.flatMap(parseCartLine) : [];

    return {
      lines,
      itemCount: lines.reduce((sum, line) => sum + line.quantity, 0)
    };
  } catch {
    return {
      lines: [],
      itemCount: 0
    };
  }
}

export function addCartItem(publicHandle: string, line: CartLine) {
  const cart = getCart(publicHandle);
  const existing = cart.lines.find((item) => item.variantId === line.variantId);
  const nextLines =
    existing === undefined
      ? [...cart.lines, { ...line, quantity: clampQuantity(line.quantity) }]
      : cart.lines.map((item) =>
          item.variantId === line.variantId
            ? {
                ...item,
                quantity: clampQuantity(item.quantity + line.quantity)
              }
            : item
        );

  writeCart(publicHandle, nextLines);
}

function setCartQuantity(
  publicHandle: string,
  variantId: string,
  quantity: number
) {
  const nextLines = getCart(publicHandle).lines
    .map((line) =>
      line.variantId === variantId
        ? { ...line, quantity: clampQuantity(quantity) }
        : line
    )
    .filter((line) => line.quantity > 0);

  writeCart(publicHandle, nextLines);
}

function removeCartItem(publicHandle: string, variantId: string) {
  writeCart(
    publicHandle,
    getCart(publicHandle).lines.filter((line) => line.variantId !== variantId)
  );
}

export function clearCart(publicHandle: string) {
  writeCart(publicHandle, []);
}

function writeCart(publicHandle: string, lines: readonly CartLine[]) {
  window.localStorage.setItem(cartKey(publicHandle), JSON.stringify(lines));
  window.dispatchEvent(new Event(CART_EVENT));
}

function parseCartLine(value: unknown): CartLine[] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return [];
  }

  const record = value as Record<string, unknown>;

  if (
    typeof record.productId !== "string" ||
    typeof record.variantId !== "string" ||
    typeof record.productTitle !== "string" ||
    typeof record.variantTitle !== "string" ||
    typeof record.sku !== "string" ||
    typeof record.quantity !== "number"
  ) {
    return [];
  }

  return [
    {
      productId: record.productId,
      variantId: record.variantId,
      productTitle: record.productTitle,
      variantTitle: record.variantTitle,
      sku: record.sku,
      quantity: clampQuantity(record.quantity)
    }
  ];
}

function cartKey(publicHandle: string): string {
  return `mercurio-cart:${publicHandle}`;
}

function clampQuantity(quantity: number): number {
  return Number.isInteger(quantity) ? Math.min(99, Math.max(1, quantity)) : 1;
}

function toStockHint(variant: PublicProductVariantResponse): string {
  if (variant.availability === "preorder") {
    return "Можно оформить предзаказ.";
  }

  if (!variant.trackInventory) {
    return "В наличии.";
  }

  return variant.stockQuantity > 0
    ? `В наличии: ${variant.stockQuantity}`
    : "Нет в наличии.";
}
