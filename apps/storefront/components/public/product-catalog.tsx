import * as React from "react";
import Link from "next/link";
import type { Product, ProductStatus } from "../../content/public/products";

const catalogGroups: {
  readonly title: string;
  readonly description: string;
  readonly slugs: readonly string[];
}[] = [
  {
    title: "Создание и витрина",
    description: "Страницы, каталог и публичная подача продукта.",
    slugs: ["website-builder", "online-store"]
  },
  {
    title: "Продажи и коммуникации",
    description: "Заказы, клиенты, диалоги и автоматические помощники.",
    slugs: ["orders-payments", "customers-loyalty", "sales-communications", "bots"]
  },
  {
    title: "Рост и аналитика",
    description: "Маркетинг, реклама, соцсети, воронки и показатели.",
    slugs: ["marketing", "advertising", "social-media", "automatic-funnels", "analytics"]
  },
  {
    title: "Управление",
    description: "Команда, роли и связи с внешними сервисами.",
    slugs: ["team-roles", "integrations"]
  }
];

export function ProductCatalog({ products }: { readonly products: readonly Product[] }) {
  const productBySlug = new Map(products.map((product) => [product.slug, product]));

  return (
    <section className="product-catalog" aria-labelledby="product-catalog-title">
      <div className="section-header">
        <p className="eyebrow">Каталог</p>
        <h2 id="product-catalog-title">Выберите продукт под текущий этап роста</h2>
        <p>
          Начните с сайта или магазина, а затем подключайте продажи, коммуникации и аналитику в
          единой публичной системе.
        </p>
      </div>
      <div className="product-group-list">
        {catalogGroups.map((group) => (
          <section className="product-group" key={group.title} aria-label={group.title}>
            <div className="product-group-header">
              <h3>{group.title}</h3>
              <p>{group.description}</p>
            </div>
            <div className="product-grid product-grid-v2">
              {group.slugs.map((slug) => {
                const product = productBySlug.get(slug);

                if (product === undefined) {
                  return null;
                }

                return <ProductCard product={product} key={product.slug} />;
              })}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

function ProductCard({ product }: { readonly product: Product }) {
  return (
    <Link className="product-card product-card-v2" href={`/products/${product.slug}`}>
      <span className="product-card-topline">
        <span className="eyebrow">{product.eyebrow}</span>
        <StatusBadge status={product.status} label={product.badge} />
      </span>
      <span className="product-card-icon" aria-hidden="true">
        {product.name.slice(0, 1)}
      </span>
      <span className="product-card-title">{product.name}</span>
      <span className="product-card-description">{product.description}</span>
      <span className="product-card-link">
        {product.status === "ready" ? "Открыть продукт" : "Посмотреть анонс"}
      </span>
    </Link>
  );
}

function StatusBadge({ status, label }: { readonly status: ProductStatus; readonly label: string }) {
  return (
    <span className={status === "ready" ? "status-pill status-pill-ready" : "status-pill"}>
      {label}
    </span>
  );
}
