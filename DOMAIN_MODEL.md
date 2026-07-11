# Domain Model

## Базовые сущности SaaS

- User
- Organization
- Membership
- Role
- Project
- Subscription
- FeatureLimit
- Domain
- AuditLog

## Сайт и редактор

- Site
- Page
- PageDocument
- PageNode
- BlockDefinition
- BlockVariant
- GlobalStyle
- Navigation
- Form
- FormSubmission
- Publication
- PublicationVersion
- Redirect

## Контент

- MediaAsset
- ContentCollection
- ContentEntry
- SEOSettings

## Commerce

- Product
- ProductVariant
- Category
- Collection
- ProductMedia
- Price
- InventoryRecord
- Cart
- CartItem
- Promotion
- Customer
- CustomerAddress
- CheckoutSession
- Order
- OrderItem
- Payment
- Shipment
- Refund
- DigitalAsset
- DownloadGrant

## Интеграции

- IntegrationConnection
- IntegrationCredential
- IntegrationMapping
- SyncJob
- SyncEvent
- WebhookEndpoint
- WebhookDelivery

## Мультитенантность

Все бизнес-сущности должны быть связаны с organizationId и/или projectId. Любая операция обязана проверять принадлежность данных текущему tenant.

## Модель страницы

Страница хранится как версионируемый JSON-документ, а не как HTML.

Каждый узел содержит:

- id;
- type;
- props;
- styles;
- responsive settings;
- children;
- data bindings;
- visibility rules.

Один renderer используется в редакторе, preview и опубликованной витрине.

## Источники данных для товаров

МойСклад по умолчанию является главным источником для:

- артикулов;
- вариантов;
- складских остатков;
- закупочных данных;
- учетных названий;
- части цен.

Платформа является главным источником для:

- маркетингового названия;
- описания;
- SEO;
- визуальной подачи;
- блоков и коллекций;
- части изображений.

Право владения отдельными полями должно настраиваться.
