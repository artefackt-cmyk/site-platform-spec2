import type { Metadata } from "next";
import { loadPublicConfig } from "@site-platform/config";
import { fetchPublicOrder } from "../../../../public-site-client";

type OrderSuccessPageProps = {
  readonly params: Promise<{
    readonly publicHandle: string;
    readonly publicToken: string;
  }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Заказ принят",
    robots: {
      index: false,
      follow: false
    }
  };
}

export default async function Page({ params }: OrderSuccessPageProps) {
  const { publicHandle, publicToken } = await params;
  const config = loadPublicConfig();
  const response = await fetchPublicOrder({
    apiUrl: config.apiUrl,
    publicHandle,
    publicToken
  });

  if (!response.ok) {
    return (
      <main className="storefront-checkout storefront-success-page">
        <h1>Заказ не найден</h1>
        <p>{response.message}</p>
      </main>
    );
  }

  const order = response.order;

  return (
    <main className="storefront-checkout storefront-success-page">
      <a className="storefront-back-link" href={`/s/${publicHandle}`}>
        На сайт
      </a>
      <header>
        <p className="storefront-eyebrow">Order #{order.orderNumber}</p>
        <h1>Заказ принят</h1>
        <p className="storefront-muted">
          Статус: {toStatusLabel(order.status)} · {formatDate(order.createdAt)}
        </p>
      </header>
      <section className="storefront-checkout-card">
        <h2>Покупатель</h2>
        <p>{order.customerName}</p>
        <p className="storefront-muted">{order.customerEmailMasked}</p>
      </section>
      <section className="storefront-checkout-card">
        <h2>Позиции</h2>
        <div className="storefront-cart-list">
          {order.items.map((item) => (
            <article key={`${item.sku}-${item.variantName}`} className="storefront-cart-row">
              <div>
                <strong>{item.productName}</strong>
                <span>{item.variantName}</span>
                <span>SKU: {item.sku}</span>
              </div>
              <strong>{item.quantity} шт.</strong>
            </article>
          ))}
        </div>
        <div className="storefront-total-row">
          <span>Итого</span>
          <strong>{formatMoney(order.totalMinor)}</strong>
        </div>
      </section>
    </main>
  );
}

function toStatusLabel(status: string): string {
  if (status === "CONFIRMED") {
    return "подтвержден";
  }

  if (status === "PROCESSING") {
    return "в работе";
  }

  if (status === "COMPLETED") {
    return "завершен";
  }

  if (status === "CANCELLED") {
    return "отменен";
  }

  return "новый";
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
