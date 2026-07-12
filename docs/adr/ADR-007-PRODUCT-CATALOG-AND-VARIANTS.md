# ADR-007: Product Catalog And Variants

## Status

Accepted

## Context

The MVP needs a first product catalog that can be managed from the project dashboard and rendered in the public storefront. The scope is intentionally limited: no cart, checkout, orders, payments, delivery, taxes, promotions, warehouse model or external integrations are introduced.

The platform remains a modular monolith.

## Decision

`Product` belongs to one `Organization` and one `Project`. It is the main catalog entity and stores marketing data: title, slug, short description, description and status.

`ProductVariant` belongs to the same `Organization`, `Project` and `Product`. It stores commercial data: SKU, price, compare-at price, currency, stock quantity, inventory flags, default marker and stable position.

Even a simple product must have at least one non-deleted variant before it can become active. Product activation validates that a default variant exists and prices/stock are valid.

Money is stored in integer minor units. MVP currency is `RUB`.

Product status is `DRAFT`, `ACTIVE` or `ARCHIVED`. Storefront returns only active, non-deleted products. Product deletion is soft delete. `ARCHIVED` hides a product without deleting variants.

Product slug is unique inside one project. Variant SKU is unique inside one project. API normalizes SKU to uppercase, so dashboard/API flows treat uniqueness as case-insensitive for MVP.

Inventory is local in the MVP. Later, МойСклад can become the source for stock and price data. `Product` and `ProductVariant` include nullable `externalId` and `externalSource` fields so integration identifiers can be added without reshaping the core catalog.

Media assets are not copied into products. Product images are represented by `ProductMedia`, which links one product to project media assets with stable position and optional `isPrimary`. The MVP limit is 10 images per product. Only one image can be primary; if the primary image is removed, the first remaining image becomes primary.

`Product.primaryMediaAssetId` is kept temporarily as a compatibility field. New reads and writes use `ProductMedia`; the migration copies existing primary references into `ProductMedia` with `position=0` and `isPrimary=true`. Keeping the field for this step avoids data loss and lets existing seed/local data migrate safely. A later cleanup can remove the compatibility field after no code path depends on it.

Public media access is allowed when an asset is linked through `ProductMedia` to an active product in a published project, even if the asset is not referenced by a published page snapshot. Legacy `Product.primaryMediaAssetId` is only considered as a fallback for records that have not yet been migrated.

Page publication and product visibility are separate mechanisms. A product becomes visible after activation and does not require a new page snapshot. Product blocks in `PageDocument` store `productId` or a selection strategy; the shared renderer does not query the database. Public API prepares product DTOs and storefront passes them to the renderer context.

No microservices are added.

## Consequences

- Dashboard can create, edit, activate, archive and soft-delete products.
- Storefront can list active products and render product detail pages.
- Published pages can render product card/grid blocks using prepared DTOs.
- Existing PageDocument snapshots remain immutable; product data rendered by product blocks reflects the current active catalog.
- A future МойСклад integration can map external product/variant identifiers without adding integration tables in this MVP step.

## Non-Goals

- Cart and checkout.
- Orders, payments, delivery, taxes and promotions.
- Reservations, warehouses and multi-currency pricing.
- Product option taxonomy, categories or import UI.
- МойСклад synchronization implementation.
- Microservices.
