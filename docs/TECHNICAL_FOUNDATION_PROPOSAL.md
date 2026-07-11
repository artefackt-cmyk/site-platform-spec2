# Technical Foundation Proposal

## Назначение документа

Этот документ фиксирует архитектурный аудит стартовой спецификации и предлагает технический фундамент для MVP. Он не расширяет продуктовые границы, не предлагает микросервисы и не заменяет продуктовые решения без явного обоснования.

Рассмотренные источники:

- `AGENTS.md`
- `PRODUCT_VISION.md`
- `MVP_SCOPE.md`
- `DOMAIN_MODEL.md`
- `INTEGRATIONS.md`
- `ROADMAP.md`
- `USER_JOURNEYS.md`
- `USER_ROLES.md`
- `README.md`

## Краткий вывод

Спецификации достаточно, чтобы создать технический каркас платформы: monorepo, приложения, пакеты, базовую инфраструктуру, правила мультитенантности, каркас доменной модели, тестовую основу и контракты интеграций.

Спецификации пока недостаточно, чтобы безопасно реализовывать редактор, commerce core и интеграции как полноценные пользовательские сценарии без дополнительных ADR и прикладных контрактов. Основные пробелы находятся в модели прав, схемах статусов, публикации, версии JSON-документа страницы, правилах синхронизации с МойСклад, checkout/payment flow и доменах/SSL.

Главная архитектурная линия уже задана и должна быть сохранена:

- модульный монолит;
- единый TypeScript-стек;
- один общий renderer для редактора, preview и опубликованной витрины;
- страницы как версионируемые JSON-документы;
- бизнес-логика вне React-компонентов;
- все внешние сервисы через adapter-интерфейсы;
- обязательная tenant isolation на уровне запросов, мутаций и репозиториев.

## Противоречия, пробелы и неоднозначности

### 1. Порядок и содержание релизов

В `MVP_SCOPE.md` главный сквозной сценарий сразу включает домен, МойСклад, ЮKassa, СДЭК и передачу заказа. При этом roadmap разделяет это на несколько фаз: foundation, builder alpha, website operations, commerce core и только затем sales integrations.

Обоснованное решение: считать сквозной сценарий целевым MVP-сценарием, а roadmap - порядком реализации. Технический каркас не должен пытаться реализовать весь сквозной сценарий сразу.

### 2. Формы появляются в двух местах

В релизе 0.1 указаны `формы`, а в релизе 0.2 - `заявки из форм`, email- и Telegram-уведомления. Неясно, должны ли формы в 0.1 быть только визуальным блоком или уже сохранять submissions.

Решение для MVP без расширения: в 0.1 допустим только блок формы и схема данных; сохранение заявок и уведомления относить к 0.2.

### 3. CRM-light не определена

`MVP_SCOPE.md` включает `CRM-light`, а `PRODUCT_VISION.md` явно исключает полноценную CRM. Граница между заказами, клиентами и CRM-light не описана.

Решение для MVP: определить CRM-light как минимальный просмотр клиентов, заказов, контактов и истории заказов без воронок, задач, сделок, омниканальности и автоматизаций.

### 4. Роли описаны текстом, но нет матрицы прав

`USER_ROLES.md` задает роли, но не определяет permissions, наследование и project-level/organization-level действия. Например, контент-менеджер может управлять товарами, но неясно, может ли менять цены, остатки или поля, принадлежащие МойСклад.

Нужен ADR или отдельный документ `docs/RBAC_MATRIX.md` до реализации UI и API.

### 5. `organizationId and/or projectId` неоднозначно

Требование tenant isolation сформулировано как наличие `organizationId` и/или `projectId`. Для реализации репозиториев этого недостаточно: разные сущности должны иметь стабильное правило владения.

Решение для каркаса:

- organization-scoped: `User`, `Membership`, `Role`, `Subscription`, `FeatureLimit`, `IntegrationConnection`, `AuditLog`;
- project-scoped: `Site`, `Page`, `Publication`, `Product`, `Order`, `Customer`, `Domain`, `FormSubmission`;
- все project-scoped сущности должны позволять вывести `organizationId` через `projectId`, а в критичных таблицах допустимо дублировать `organizationId` для упрощения tenant guard и индексов.

### 6. PageNode как сущность конфликтует с JSON-документом

`DOMAIN_MODEL.md` перечисляет `PageNode`, но также говорит, что страница хранится как версионируемый JSON-документ, а не HTML. Неясно, является ли `PageNode` таблицей или элементом JSON-схемы.

Решение: в MVP `PageNode` должен быть частью JSON-схемы, а не отдельной таблицей. Таблицы нужны для `Page`, `PageDocument`, `Publication` и `PublicationVersion`.

### 7. Версионирование страницы не описывает миграции схемы

Есть требование хранить страницы как versioned JSON, но нет правил:

- `schemaVersion`;
- миграций документа;
- совместимости старых публикаций;
- отката опубликованной версии;
- preview draft против published snapshot.

Это нужно определить до реализации editor-core и renderer.

### 8. Собственный домен и SSL не имеют технического сценария

В 0.2 есть custom domain и SSL, но не указаны:

- DNS flow;
- проверка владения доменом;
- выпуск и обновление сертификатов;
- поведение при ошибках DNS;
- связь домена с проектом и публикацией.

Для каркаса достаточно сущности `Domain` и статусов, но реализацию SSL нужно выносить в отдельную задачу/ADR.

### 9. СБП описан и как часть ЮKassa, и как отдельная интеграция

`INTEGRATIONS.md` говорит `СБП через поддерживаемый сценарий` в ЮKassa, а `MVP_SCOPE.md` и `ROADMAP.md` перечисляют СБП отдельно.

Решение для MVP: считать СБП payment method внутри провайдера ЮKassa, пока не принят ADR о прямом провайдере СБП.

### 10. Checkout flow и момент создания заказа не определены

`USER_JOURNEYS.md` говорит: покупатель оплачивает, затем платформа создает заказ и передает его в МойСклад. На практике платеж обычно требует предварительного checkout/order/payment intent с суммой и позициями.

Решение для MVP: ввести `CheckoutSession` и локальный `Order` со статусами. Экспорт в МойСклад должен быть идемпотентным и запускаться по явно выбранному событию, например `paid` или `accepted`. Это решение нужно закрепить в ADR до реализации платежей.

### 11. СДЭК: расчет доставки входит в MVP, создание отправления отложено

`INTEGRATIONS.md` указывает расчет доставки, ПВЗ, курьерскую доставку, статусы и создание отправления на следующем этапе. Нужно не смешивать эти уровни.

Решение для MVP: в релизе 0.4 поддержать расчет, выбор доставки и хранение статуса, но создание отправления считать post-MVP или отдельным последующим этапом, если оно явно не будет включено.

### 12. Цифровые продукты и услуги не полностью ложатся на МойСклад

MVP включает физические товары, цифровые продукты и услуги без календаря. МойСклад при этом является главным источником для артикулов, вариантов, остатков и закупочных данных. Для цифровых продуктов и услуг нужно определить, обязательна ли связь с МойСклад и как трактуются остатки.

Решение для MVP: разрешить товары без inventory tracking для цифровых продуктов и услуг, но явно хранить тип продукта и правила синхронизации.

### 13. Управление тарифом появляется раньше коммерческого MVP

`USER_ROLES.md` говорит, что владелец может управлять тарифом, а `ROADMAP.md` относит billing, plans and limits к Phase 7.

Решение: в foundation можно заложить сущности `Subscription` и `FeatureLimit`, но не реализовывать биллинг до Phase 7.

### 14. Нужны state machines

В спецификации есть статусы оплаты, доставки, заказа, публикации, домена, синхронизации и webhook delivery, но сами состояния и переходы не описаны.

Минимально нужны state machines для:

- `Publication`;
- `Domain`;
- `CheckoutSession`;
- `Order`;
- `Payment`;
- `Shipment`;
- `IntegrationConnection`;
- `SyncJob`;
- `WebhookDelivery`.

### 15. Не определен API style

Стек фиксирует Next.js и NestJS, но не говорит, будет ли API REST, GraphQL или tRPC.

Решение для небольшой команды: REST/JSON в NestJS с OpenAPI-документацией, DTO validation через Zod и typed API client для dashboard/storefront. Это проще для Codex, тестирования, webhooks и интеграций.

## Достаточно ли информации для технического каркаса

Да, если каркас понимается как foundation, а не как готовый продуктовый MVP.

Можно начинать:

- pnpm/Turborepo workspace;
- базовые apps и packages;
- strict TypeScript;
- Docker Compose для PostgreSQL, Redis и S3-compatible storage;
- Prisma setup и первые migration conventions;
- базовые SaaS-сущности;
- tenant-aware repository pattern;
- shared config и env validation;
- integration contracts без реальных провайдеров;
- worker/job contracts;
- тестовую инфраструктуру;
- CI pipeline.

Нельзя начинать без уточнений:

- полноценный визуальный редактор;
- production-публикацию с доменами и SSL;
- checkout и платежные сценарии;
- синхронизацию с МойСклад на реальных данных;
- СДЭК-сценарии beyond расчет/выбор;
- CRM-light UI;
- billing и тарифы.

## Единый TypeScript-стек

Рекомендуется сохранить стек из `AGENTS.md` без замены ключевых решений.

### Runtime и workspace

- Node.js LTS.
- TypeScript strict mode.
- pnpm workspaces.
- Turborepo для orchestration команд.
- Docker Compose для локальной инфраструктуры.
- GitHub Actions для CI.

### Frontend

- Next.js App Router.
- React.
- TanStack Query для server state.
- Zustand для локального состояния редактора.
- dnd-kit для drag-and-drop в editor canvas.
- Zod для схем page document, форм и API DTO.

Приложения:

- `apps/dashboard`: личный кабинет, проекты, редактор, настройки, commerce admin, интеграции.
- `apps/storefront`: публичные сайты и магазины, использующие тот же renderer.

### Backend

- `apps/api`: NestJS modular monolith.
- REST/JSON API с OpenAPI-документацией.
- Prisma как ORM.
- PostgreSQL как основная БД.
- Redis для cache, locks, rate limiting и job coordination.
- S3-compatible object storage для медиа и цифровых файлов.
- Adapter interfaces для внешних интеграций.

### Worker

- `apps/worker`: фоновая обработка в том же monorepo и том же доменном коде.
- Задачи: публикации, уведомления, webhooks, retries, imports/exports, sync jobs, digital download grants.
- Для очередей нужен отдельный выбор реализации. Рекомендуемый кандидат: BullMQ поверх Redis, но это новая зависимость и должна быть явно утверждена, так как `AGENTS.md` требует обоснования новых зависимостей.

### Testing

- Vitest для unit и service tests.
- Testing Library для React components.
- Playwright для критичных user journeys.
- Integration tests для API + database behavior.
- Отдельные tenant isolation tests.
- Webhook/retry/idempotency tests для интеграций.

## Предлагаемая структура monorepo

```text
.
├── apps
│   ├── api
│   ├── dashboard
│   ├── storefront
│   └── worker
├── packages
│   ├── block-library
│   ├── config
│   ├── database
│   ├── domain
│   ├── editor-core
│   ├── integrations
│   ├── renderer
│   ├── testing
│   └── ui
├── docs
│   ├── adr
│   └── TECHNICAL_FOUNDATION_PROPOSAL.md
├── infra
│   └── docker-compose
├── scripts
├── .github
│   └── workflows
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.base.json
```

Назначение пакетов:

- `packages/domain`: доменные типы, value objects, state machines, error codes, shared contracts.
- `packages/database`: Prisma schema, migrations, repositories, tenant guards.
- `packages/config`: env schema, typed config, shared constants.
- `packages/ui`: дизайн-система dashboard/editor.
- `packages/editor-core`: page document schema, editor commands, history, validations.
- `packages/renderer`: shared renderer для editor preview и storefront.
- `packages/block-library`: definitions, variants, default props и schemas блоков.
- `packages/integrations`: provider contracts, adapter interfaces, DTO mapping, fake adapters for tests.
- `packages/testing`: factories, fixtures, test database helpers, integration test utilities.

## Основные архитектурные модули

### Identity and tenancy

Регистрация, авторизация, organizations, memberships, roles, tenant context, audit logs.

Ключевое требование: каждый API handler, repository method и worker job должны получать tenant context явно.

### Project and site management

Projects, sites, global style, navigation, menus, settings, favicon, SEO defaults.

### Page documents and editor

Page, PageDocument, schemaVersion, draft/published separation, editor commands, undo/redo, responsive settings, data bindings, visibility rules.

### Renderer and block library

Единый renderer, block definitions, block variants, validation of props, server-safe rendering для storefront.

### Publication

Publication, PublicationVersion, immutable published snapshots, rollback, platform subdomain resolution, later custom domains.

### Media and digital assets

MediaAsset, image uploads, object storage, signed URLs, digital files, DownloadGrant, expiration and download limits.

### Forms and notifications

Form definitions, FormSubmission, email notifications, Telegram notifications, later CRM handoff.

### Commerce core

Products, variants, categories, collections, prices, inventory, cart, checkout session, customer, order, order item, payment, shipment, refund.

Commerce core должен работать без привязки UI к конкретной интеграции.

### Payments

Payment provider contract, ЮKassa adapter, payment creation, status polling, webhooks, refunds, idempotency keys, fiscalization data when applicable.

### Delivery

Delivery provider contract, СДЭК adapter, pickup points, delivery calculation, selected delivery option, shipment status model.

### Integrations framework

IntegrationConnection, encrypted credentials, health status, WebhookEndpoint, WebhookDelivery, SyncJob, SyncEvent, retry policy, dead-letter handling.

### МойСклад sync module

Отдельный модуль внутри modular monolith, а не сервис. Отвечает за mapping, import, conflict detection, field ownership, export orders and customers, sync logs and retries.

### Observability and operations

Structured logs, stable error codes, audit logs, health checks, background job visibility, user-facing integration errors.

## Первые 15 небольших задач разработки

Эти задачи ограничены foundation и не реализуют весь продуктовый MVP.

1. Инициализировать pnpm workspace, Turborepo, базовые `package.json`, `tsconfig.base.json`, shared lint/typecheck/test/build scripts.
2. Создать пустые приложения `apps/dashboard`, `apps/storefront`, `apps/api`, `apps/worker` с минимальными health/smoke страницами или endpoints.
3. Создать пакеты `ui`, `domain`, `database`, `config`, `testing`, `editor-core`, `renderer`, `block-library`, `integrations` с публичными entrypoints.
4. Добавить Docker Compose для PostgreSQL, Redis и S3-compatible object storage для локальной разработки.
5. Реализовать `packages/config`: Zod-схему env-переменных, typed config и fail-fast validation.
6. Подключить Prisma в `packages/database`, создать conventions для migrations и seed/test database.
7. Смоделировать базовые SaaS-сущности: `User`, `Organization`, `Membership`, `Role`, `Project`, `AuditLog`.
8. Реализовать tenant context и repository base pattern с обязательной проверкой `organizationId`/`projectId`.
9. Добавить unit/integration tests, доказывающие tenant isolation на примере `Project` и `Membership`.
10. Описать в `packages/domain` стабильные error codes, result/error shape и базовые state machine types.
11. Создать ADR для API style: NestJS REST/JSON, OpenAPI, DTO validation, typed client generation strategy.
12. Описать первую версию page document schema в `packages/editor-core`: `schemaVersion`, node shape, props/styles/responsive/data bindings/visibility rules.
13. Создать renderer contract в `packages/renderer` и один минимальный test block в `packages/block-library` для smoke-теста общего renderer.
14. Создать integration provider contracts в `packages/integrations`: credentials, health, webhook, sync job, idempotent command interfaces, fake adapter for tests.
15. Создать ADR по МойСклад MVP sync: ownership fields, mapping identity, import/export triggers, retry policy, conflict handling and order export moment.

## ADR, которые нужны до продуктовой реализации

- API style and typed client strategy.
- Auth/session strategy.
- RBAC matrix and permission naming.
- Tenant ownership rules by entity.
- Page document schema versioning and migrations.
- Publication snapshots and rollback behavior.
- Domain/SSL ownership verification.
- Order/payment/shipment state machines.
- МойСклад field ownership and sync contract.
- Job queue implementation over Redis.
- Secrets encryption strategy.

## Риски интеграции с МойСклад

### 1. Владение полями

Спецификация говорит, что МойСклад является источником для артикулов, вариантов, складских остатков, закупочных данных, учетных названий и части цен, а платформа - для маркетингового названия, описания, SEO, визуальной подачи, блоков, коллекций и части изображений. При этом право владения отдельными полями должно настраиваться.

Риск: без формальной матрицы field ownership синхронизация будет перетирать ручные правки пользователя или оставлять конфликтующие данные.

Требование: для каждого синхронизируемого поля хранить owner, last synced external value/hash, local override и conflict status.

### 2. Идентичность товаров и вариантов

Нужна стабильная связь локальных сущностей с объектами МойСклад.

Требование:

- хранить external id/href/meta для товара, варианта, категории, цены, склада и покупателя;
- запрещать неявное сопоставление только по названию;
- для ручного сопоставления иметь `IntegrationMapping`;
- поддерживать unlink/relink без удаления локального маркетингового контента.

### 3. Первичный импорт и повторный импорт

Риск: первичный импорт может быть долгим, частично успешным и требовать повторов.

Требование:

- импорт должен выполняться через `SyncJob`;
- каждый объект должен иметь отдельный `SyncEvent`;
- повторный запуск должен быть идемпотентным;
- пользователь должен видеть количество импортированных, пропущенных, конфликтующих и ошибочных объектов.

### 4. Цены

Цены в МойСклад могут зависеть от типов цен, валюты, НДС, скидок и округления. Спецификация говорит только о `части цен`.

Требование:

- явно выбрать price type для витрины;
- хранить источник цены на уровне поля;
- фиксировать currency и rounding rules;
- не смешивать закупочные и продажные цены в storefront;
- логировать конфликт, если локальная цена и цена МойСклад изменились после последней синхронизации.

### 5. Остатки

MVP исключает многоскладовость внутри платформы, но user journey требует выбор организации и склада. Это значит, что в MVP нужно выбрать один склад или одну агрегированную стратегию.

Требование:

- в настройках подключения выбрать один склад или явно утвержденную стратегию агрегации;
- хранить inventory snapshot with `syncedAt`;
- показывать stale inventory status;
- при checkout повторно проверять доступность товара;
- не позволять продать больше доступного остатка без явного решения о backorder.

### 6. Заказы

Передача заказов в МойСклад - критичный участок с риском дублей.

Требование:

- экспорт заказа должен быть идемпотентным;
- локальный `Order` должен хранить external order id после успешной передачи;
- повтор после ошибки не должен создавать дубль;
- нужен mapping статусов заказа, оплаты и доставки;
- нужно определить момент экспорта: после создания заказа, после успешной оплаты или после ручного подтверждения.

Рекомендуемое MVP-решение для ADR: экспортировать заказ после подтверждения оплаты для online payment сценария, а unpaid/manual сценарии не добавлять без отдельного продуктового решения.

### 7. Покупатели

Спецификация требует передачу покупателей.

Требование:

- создать mapping локального `Customer` к контрагенту/покупателю в МойСклад;
- не использовать email/phone как единственный внешний ключ;
- корректно обрабатывать повторные заказы одного покупателя;
- не блокировать заказ, если покупатель экспортировался, а заказ временно не экспортировался.

### 8. Изображения

Импорт изображений указан как поддерживаемый сценарий, но ownership изображений частично принадлежит платформе.

Требование:

- считать импорт изображений опциональным;
- хранить imported media отдельно от manually uploaded media;
- не удалять локальные изображения при исчезновении изображения во внешней системе без явного правила;
- дедуплицировать файлы в object storage.

### 9. Webhooks, polling and consistency

Спецификация требует webhooks, retries и health status, но для МойСклад нужно учитывать, что не все изменения удобно или надежно получать push-событиями.

Требование:

- поддержать manual sync;
- поддержать scheduled incremental sync;
- webhooks использовать как ускоритель, если конкретный сценарий доступен и надежен;
- иметь full resync для восстановления;
- хранить cursor/timestamp последней успешной синхронизации по типам данных.

### 10. Ошибки и пользовательская диагностика

Риск: пользователь без технических знаний не сможет понять, почему товары или заказы не синхронизируются.

Требование:

- `SyncEvent` должен хранить user-facing error message и technical details отдельно;
- ошибки должны иметь stable error code;
- retry должен быть доступен на уровне job и отдельных failed items;
- отключение интеграции не должно удалять локальные товары, заказы и маркетинговый контент.

## Минимальные требования к синхронизации МойСклад для MVP

### Входящие данные в платформу

- товары;
- варианты;
- категории;
- выбранный тип цен;
- остатки по выбранному складу или утвержденной стратегии;
- изображения, если сценарий подтвержден;
- учетные названия и артикулы как поля, которыми владеет МойСклад.

### Данные, которыми владеет платформа

- маркетинговое название;
- описание;
- SEO fields;
- визуальная подача;
- коллекции и блоки;
- часть изображений;
- published storefront representation.

### Исходящие данные в МойСклад

- заказы;
- позиции заказа;
- покупатели;
- статусы, только после утверждения mapping;
- платежная/доставочная информация в объеме, нужном для учета заказа.

### Режимы синхронизации

- primary import;
- manual sync;
- scheduled incremental sync;
- retry failed sync;
- order export on approved order event;
- full resync for recovery.

### Инварианты

- синхронизация не должна нарушать tenant isolation;
- каждое внешнее действие должно быть идемпотентным;
- credentials encrypted at rest;
- все sync jobs audit logged;
- user-facing logs обязательны;
- отключение интеграции не удаляет локальные данные;
- локальные published versions не должны меняться задним числом из-за sync без новой публикации.

## Ограничения MVP, которые нужно сохранить

- Не делать микросервисы.
- Не делать свободный canvas/Zero Block.
- Не делать marketplace приложений.
- Не делать сложную CRM.
- Не делать многоскладовость внутри платформы.
- Не делать личный кабинет покупателя.
- Не делать бронирование, LMS, подписки на контент.
- Не делать международные платежи и налоги.
- Не делать AI-first сценарии.

## Рекомендуемый следующий шаг

Следующая задача после этого документа: инициализировать monorepo foundation по первым 10-12 задачам из списка, не реализуя editor, commerce или реальные интеграции. Параллельно нужно создать ADR для API style, RBAC, tenant ownership и page document versioning, потому что эти решения определяют форму всего дальнейшего кода.
