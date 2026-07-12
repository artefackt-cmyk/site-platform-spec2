# ADR-009: Cart, Checkout And Orders

## Status

Accepted.

## Context

Mercurio already has project-scoped products, variants, local inventory flags,
published storefront routes and authentication. The next MVP commerce step is a
first order loop without payment, delivery, taxes, discounts, refunds, invoices
or external integrations.

## Decision

Cart is client-side storefront state. It is persisted in `localStorage` under a
key scoped by `publicHandle`. Cart data contains product id, variant id,
quantity and display labels only. It is not an authoritative source for prices,
availability, stock, customer data or totals.

Duplicate variant ids in order input are rejected with `CART_ITEM_INVALID`.
The storefront merges duplicates before checkout, while the API keeps the
contract strict for idempotency and auditability.

Checkout requires an idempotency key. The key must be UUID-like and is reused as
the raw public success token for MVP. Only `publicTokenHash` is stored. This
keeps retry responses able to return the same success token without storing a
raw token. The key must be generated with browser `crypto.randomUUID()`.

Public order creation is allowed only for a storefront with publication settings
and at least one active published page state. The API re-loads active products
and variants, verifies availability, validates quantity, recalculates prices and
creates immutable item snapshots.

`Order` belongs to both `Organization` and `Project`. `OrderItem` stores
snapshots for product name, variant name, SKU, unit price, quantity, line total,
currency and optional media URL, so archived or edited products do not change
historical orders.

Order numbers are human-readable integers unique inside one project. The first
number is `1001`. Numbers are allocated through `ProjectOrderCounter` inside the
same database transaction, never through `count()+1`.

Status lifecycle:

- `NEW -> CONFIRMED`
- `NEW -> CANCELLED`
- `CONFIRMED -> PROCESSING`
- `CONFIRMED -> CANCELLED`
- `PROCESSING -> COMPLETED`
- `PROCESSING -> CANCELLED`

`COMPLETED` and `CANCELLED` are terminal. Repeating a transition is rejected and
does not repeat side effects.

Inventory behavior:

- stock is checked when order creation runs;
- when `trackInventory=true` and `allowBackorder=false`, stock is decremented
  atomically only if enough stock remains;
- when `allowBackorder=true`, the existing model allows stock to go negative;
- cancelled orders restore only items that were decremented;
- completed orders do not change stock.

Idempotency behavior:

- same project + same key + same normalized payload returns the existing order;
- same project + same key + different payload returns
  `ORDER_IDEMPOTENCY_CONFLICT`;
- payload hashes are stored, raw customer data is not written into audit log
  metadata.

Customer data is limited to name, email, optional phone and optional comment.
Dashboard APIs are protected by auth/session and tenant isolation. Public DTOs
do not expose organization id, project id, internal order id, internal product
ids, storage keys, phone or full email. Public success lookup masks email.

Audit actions:

- `ORDER_CREATED`
- `ORDER_STATUS_CHANGED`
- `ORDER_CANCELLED`
- `ORDER_COMPLETED`
- `ORDER_STOCK_DECREMENTED`
- `ORDER_STOCK_RESTORED`

## Consequences

Mercurio can now support a first product → cart → checkout → order → dashboard
management loop while preserving tenant isolation and stock safety for local
inventory.

The cart remains intentionally lightweight and can be replaced later by a server
cart if promotions, reservations, multi-device cart sync or external inventory
sources require it.

## Limitations

MVP checkout has no payment, delivery, address, taxes, discounts, returns,
invoice flow, CDEK, MoySklad, webhooks or external analytics. Public order token
uses the UUID idempotency key as raw token; a future payment/order portal ADR may
introduce separate signed or expiring public tokens.
