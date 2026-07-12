# Site Platform Spec 2

Минимальный технический каркас monorepo для будущей SaaS-платформы. В репозитории есть foundation-модели для организаций, участников, проектов, страниц и audit log, production-style authentication foundation, development dashboard с блочным редактором страниц, локальная media library, публикация immutable snapshots, первый product catalog и MVP торговый контур cart → checkout → order. Реальных платежей, доставки, налогов, очередей и внешних интеграций пока нет.

## Требования к окружению

- Node.js LTS 22 или новее.
- pnpm 10 или новее.
- Docker с поддержкой Docker Compose для локального PostgreSQL.

## Установка

```bash
pnpm install
cp .env.example .env
```

Значения в `.env.example` предназначены только для локальной разработки. Не используйте их как production credentials.

Минимальный набор значений для локального dashboard/API:

```bash
DATABASE_URL=postgresql://site_platform:site_platform_local_password@localhost:5432/site_platform_dev?schema=public
TEST_DATABASE_URL=postgresql://site_platform:site_platform_local_password@localhost:5432/site_platform_test?schema=public
DEV_USER_EMAIL=owner@example.com
DASHBOARD_ORIGIN=http://localhost:3000
STOREFRONT_ORIGIN=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3002
NEXT_PUBLIC_STOREFRONT_URL=http://localhost:3001
NEXT_PUBLIC_DASHBOARD_URL=http://localhost:3000
MEDIA_STORAGE_DIR=.local-media
MEDIA_PUBLIC_BASE_URL=http://localhost:3002
```

Auth использует server-side session и HttpOnly cookie `mercurio_session`. Для локальной разработки seed создаёт пользователя `owner@example.com`; пароль берётся из `DEV_SEED_USER_PASSWORD` (`development123` в `.env.example`).

`DEV_USER_EMAIL` больше не является обычным dashboard flow. Development identity доступен только при явном `AUTH_ALLOW_DEV_IDENTITY=true`, только в `NODE_ENV=development`, и запрещён в production.
`MEDIA_STORAGE_DIR` используется только локальным storage adapter для development uploads. Не указывайте production bucket credentials в `.env`.

## PostgreSQL

Запустить локальный PostgreSQL:

```bash
pnpm db:up
```

Docker Compose поднимает только PostgreSQL:

- development database: `site_platform_dev`;
- test database: `site_platform_test`;
- named volume: `site_platform_postgres_data`.

Остановить PostgreSQL:

```bash
pnpm db:down
```

## Prisma

Сгенерировать Prisma Client:

```bash
pnpm db:generate
```

Применить миграции к development database:

```bash
pnpm db:migrate
```

Применить миграции к test database:

```bash
pnpm db:migrate:test
```

Миграции находятся в `packages/database/prisma/migrations`. Текущие миграции добавляют foundation-модели и первый каркас страниц проекта:

- `User`;
- `Organization`;
- `Membership`;
- `Project`;
- `SitePage`;
- `PageDocument`;
- `MediaAsset`;
- `Product`;
- `ProductMedia`;
- `ProductVariant`;
- `ProjectPublicationSettings`;
- `PublishedPageSnapshot`;
- `PublishedPageState`;
- `AuditLog`.

Открыть Prisma Studio:

```bash
pnpm db:studio
```

Безопасно сбросить test database:

```bash
pnpm db:reset:test
```

`db:reset:test` откажется выполняться, если активное окружение не `test`, если `TEST_DATABASE_URL` совпадает с `DATABASE_URL`, или если URL не распознан как тестовая база.

Commerce и integration-модели пока намеренно не добавлены. `PageDocument` хранит только текущий draft-документ страницы; published snapshot пока отсутствует.

## Development Seed

После применения миграций заполнить development database начальными данными:

```bash
pnpm db:seed
```

Seed работает только вне production и идемпотентно создает:

- пользователя `owner@example.com`;
- `PasswordCredential` для demo owner с development password из `DEV_SEED_USER_PASSWORD`, если credential ещё нет;
- организацию `Demo Brand`;
- `OWNER` membership;
- проект `Demo Store` со slug `demo-store`;
- страницы проекта `Главная`, `Каталог` и `О бренде`;
- draft-документы страниц в PageDocument V2 с начальными секциями, если документа еще нет;
- demo products `Демо футболка` и `Демо худи` с default variants;
- publication settings с handle `demo-store`, если settings отсутствует;
- audit log записи для создания организации и проекта.

Повторный запуск не создает дубликаты, не удаляет существующие данные, не перетирает пользовательские `PageDocument` и не меняет существующий public handle.

Seed не мигрирует и не перезаписывает существующие V1/V2 документы. V1 документы мигрируются в памяти при чтении и становятся V2 только после явного сохранения.
Seed не публикует страницы автоматически: publication flow проверяется вручную через dashboard.

Для повторного запуска seed после изменения локальных данных выполните:

```bash
pnpm db:seed
```

## Запуск

```bash
pnpm dev
```

Команда запускает доступные dev-процессы через Turborepo:

- `apps/dashboard` - Next.js dashboard, порт `3000`;
- `apps/storefront` - Next.js storefront, порт `3001`;
- `apps/api` - NestJS API, порт из `API_PORT`;
- `apps/worker` - минимальный Node.js worker.

API endpoints:

- `GET /health` - не требует подключения к базе;
- `GET /health/database` - проверяет PostgreSQL и возвращает стабильную ошибку без раскрытия connection string.
- `POST /api/auth/register` - создаёт пользователя, credential, организацию, OWNER membership, optional project и session cookie;
- `POST /api/auth/login` - проверяет email/password и создаёт новую server-side session;
- `POST /api/auth/logout` - идемпотентно отзывает текущую session и очищает cookie;
- `GET /api/auth/session` - возвращает текущего пользователя, активную организацию, роль и onboarding status;
- `POST /api/auth/password-reset/request` - создаёт reset token с generic public response;
- `POST /api/auth/password-reset/confirm` - меняет пароль, помечает token used, отзывает старые sessions и создаёт новую;
- `POST /api/auth/onboarding/complete` - завершает первый onboarding;
- `GET /api/me` - текущий пользователь и активная организация из auth session;
- `GET /api/projects` - проекты активной организации;
- `POST /api/projects` - создание проекта в активной организации;
- `GET /api/projects/:projectId` - данные проекта активной организации;
- `GET /api/projects/:projectId/pages` - страницы проекта;
- `POST /api/projects/:projectId/pages` - создание страницы проекта;
- `GET /api/projects/:projectId/pages/:pageId` - данные страницы проекта.
- `PATCH /api/projects/:projectId/pages/:pageId` - обновление title, slug и home flag страницы;
- `GET /api/projects/:projectId/pages/:pageId/document` - draft-документ страницы; если документа нет, API создает пустой документ.
- `PUT /api/projects/:projectId/pages/:pageId/document` - сохранение draft-документа с optimistic concurrency по `revision`.
- `GET /api/projects/:projectId/media` - изображения проекта;
- `POST /api/projects/:projectId/media` - загрузка JPEG, PNG или WebP до 10 MB;
- `PATCH /api/projects/:projectId/media/:assetId` - обновление media metadata;
- `DELETE /api/projects/:projectId/media/:assetId` - удаление неиспользуемого media asset;
- `GET /api/projects/:projectId/media/:assetId/content` - project-scoped выдача файла.
- `GET /api/projects/:projectId/products` - товары проекта;
- `POST /api/projects/:projectId/products` - создание draft-товара с default variant;
- `GET /api/projects/:projectId/products/:productId` - товар и варианты;
- `PATCH /api/projects/:projectId/products/:productId` - обновление маркетинговых полей;
- `DELETE /api/projects/:projectId/products/:productId` - soft delete товара;
- `POST /api/projects/:projectId/products/:productId/activate` - показать товар в storefront;
- `POST /api/projects/:projectId/products/:productId/archive` - скрыть товар из storefront без удаления;
- `GET /api/projects/:projectId/products/:productId/media` - галерея изображений товара;
- `POST /api/projects/:projectId/products/:productId/media` - добавить media asset в галерею;
- `DELETE /api/projects/:projectId/products/:productId/media/:productMediaId` - удалить изображение из галереи;
- `POST /api/projects/:projectId/products/:productId/media/:productMediaId/set-primary` - назначить основное изображение;
- `PATCH /api/projects/:projectId/products/:productId/media/reorder` - сохранить порядок изображений;
- `POST /api/projects/:projectId/products/:productId/variants` - добавить variant;
- `PATCH /api/projects/:projectId/products/:productId/variants/:variantId` - обновить variant;
- `DELETE /api/projects/:projectId/products/:productId/variants/:variantId` - soft delete variant;
- `POST /api/projects/:projectId/products/:productId/variants/:variantId/set-default` - назначить default variant;
- `GET /api/projects/:projectId/publication-settings` - project public handle и URL;
- `PATCH /api/projects/:projectId/publication-settings` - изменение public handle;
- `GET /api/projects/:projectId/pages/:pageId/publication-status` - вычисленный статус публикации;
- `POST /api/projects/:projectId/pages/:pageId/publish` - публикация сохраненного draft revision;
- `POST /api/projects/:projectId/pages/:pageId/unpublish` - снятие страницы с публикации;
- `GET /api/projects/:projectId/pages/:pageId/publications` - история публикаций страницы;
- `POST /api/projects/:projectId/pages/:pageId/publications/:snapshotId/rollback` - rollback публичной версии;
- `GET /api/public/sites/:publicHandle` - публичная home page;
- `GET /api/public/sites/:publicHandle/pages/:pageSlug` - публичная опубликованная страница;
- `GET /api/public/sites/:publicHandle/products` - публичный active catalog;
- `GET /api/public/sites/:publicHandle/products/:productSlug` - публичная страница active product;
- `POST /api/public/sites/:publicHandle/orders` - checkout без оплаты: сервер перепроверяет published storefront, active products/variants, stock и создает order snapshots;
- `GET /api/public/sites/:publicHandle/orders/:publicToken` - публичная success lookup по hashed token без internal ids и без полного email;
- `GET /api/projects/:projectId/orders` - dashboard список заказов проекта с фильтром статуса и поиском;
- `GET /api/projects/:projectId/orders/:orderId` - dashboard карточка заказа с customer data и immutable item snapshots;
- `PATCH /api/projects/:projectId/orders/:orderId/status` - смена статуса заказа по разрешенному lifecycle с audit log и stock restore on cancel;
- `GET /api/public/media/:assetId/content` - публичная выдача media asset, если он используется active snapshot или active product.

Для раздельного запуска:

```bash
pnpm --filter @site-platform/api dev
pnpm --filter @site-platform/dashboard dev
pnpm --filter @site-platform/storefront dev
```

Адреса для браузера и API:

- dashboard: `http://localhost:3000`;
- project workspace: `http://localhost:3000/projects/{projectId}`;
- media library: `http://localhost:3000/projects/{projectId}/media`;
- products: `http://localhost:3000/projects/{projectId}/products`;
- product editor: `http://localhost:3000/projects/{projectId}/products/{productId}`;
- page editor: `http://localhost:3000/projects/{projectId}/pages/{pageId}`;
- page preview: `http://localhost:3000/projects/{projectId}/pages/{pageId}/preview`;
- Mercurio marketing homepage: `http://localhost:3001/`;
- storefront: `http://localhost:3001/s/{publicHandle}/{pageSlug}`;
- storefront catalog: `http://localhost:3001/s/{publicHandle}/products`;
- storefront product: `http://localhost:3001/s/{publicHandle}/products/{productSlug}`;
- storefront checkout: `http://localhost:3001/s/{publicHandle}/checkout`;
- storefront order success: `http://localhost:3001/s/{publicHandle}/order/{publicToken}`;
- API: `http://localhost:3002`;
- database health: `http://localhost:3002/health/database`.

Перед открытием dashboard обычно нужен такой порядок:

```bash
pnpm db:up
pnpm db:migrate
pnpm db:seed
pnpm --filter @site-platform/api dev
pnpm --filter @site-platform/dashboard dev
pnpm --filter @site-platform/storefront dev
```

Если session отсутствует или истекла, protected API вернут стабильные auth error codes. Если onboarding не завершён, protected admin routes вернут `AUTH_ONBOARDING_REQUIRED`.

Password reset email provider пока не подключён. В development raw reset token может возвращаться только при `AUTH_EXPOSE_DEV_RESET_TOKEN=true`; production должен подключить реальный email sender. Rate limiting сейчас in-memory и требует distributed store перед production horizontal scaling.

Сейчас в dashboard уже работает:

- просмотр активной организации;
- просмотр и создание проектов;
- открытие рабочей области проекта;
- открытие медиабиблиотеки проекта;
- открытие раздела товаров;
- создание товара с title, slug, SKU, ценой и остатком;
- редактирование описания, primary image, variants и статуса товара;
- просмотр заказов проекта;
- открытие карточки заказа;
- смена статуса заказа без payment/shipping/refund UI.

Сейчас в storefront уже работает:

- client-side cart, scoped by `publicHandle`, с localStorage persistence;
- добавление товара/варианта в корзину, merge duplicate variants, quantity 1..99;
- checkout без оплаты, доставки, адреса, налогов и скидок;
- server-side order creation с перепроверкой цены/доступности/остатков;
- order success page по public token с masked email и без internal ids.
- activation/archive/soft delete товара;
- просмотр страниц проекта;
- создание страниц проекта;
- открытие редактора страницы;
- визуальный рендеринг draft-документа;
- добавление пустых секций, Hero-секции и текстовой секции;
- переключение секции между одной и двумя колонками;
- изменение соотношения колонок;
- добавление блоков `heading`, `text`, `button`, `image`, `spacer`, `product-card` и `product-grid` в выбранную секцию или колонку;
- редактирование свойств секций, колонок, текстовых блоков, кнопок, изображений и отступов;
- загрузка JPEG, PNG и WebP изображений в локальную project media library;
- выбор изображения из медиабиблиотеки для `ImageBlock`;
- обновление alt text media asset;
- удаление неиспользуемых media assets;
- выбор, редактирование, перемещение вверх/вниз и удаление секций и leaf-блоков;
- сохранение документа в PostgreSQL с проверкой `revision`.
- предпросмотр последней сохранённой draft-версии через общий `PageRenderer`;
- переключение ширины preview canvas: Desktop, Tablet, Mobile.
- редактирование title, slug и home flag страницы;
- публикация сохраненного draft в immutable `PublishedPageSnapshot`;
- статус публикации: `Не опубликовано`, `Опубликовано`, `Есть неопубликованные изменения`, `Снято с публикации`;
- открытие публичного storefront URL;
- история публикаций, rollback и unpublish.

## Public Mercurio Homepage

`apps/storefront` serves the public Mercurio marketing homepage at `/`. This page is the pre-registration product entry point for Mercurio itself and is separate from customer storefront routes under `/s/{publicHandle}`.

The homepage uses only approved Mercurio brand assets through the shared `MercurioLogo` component:

- `/assets/mercurio/mercurio-monogram.png`;
- `/assets/mercurio/mercurio-logo-horizontal.png`.

Do not redraw the monogram in CSS or SVG, replace the four-point star mark, or use a text `M` except as the existing image fallback. Desktop header uses the horizontal logo. Narrow headers use the approved monogram.

Landing CTA links use typed public config. Set `NEXT_PUBLIC_DASHBOARD_URL` when the dashboard lives on another origin; locally it defaults to `http://localhost:3000`. The homepage does not create production auth, registration forms, analytics scripts, tracking pixels, sitemap UI or robots UI.

Content honesty rules:

- current capabilities must be visually separated from future work;
- integrations that are not working yet must use `В разработке` or `Скоро`, not `Доступно`;
- analytics must be marked as in development;
- marketplace and multi-vendor messaging must be marked as strategic direction or development direction.

Пока не реализовано:

- autosave;
- undo/redo;
- drag-and-drop;
- S3, CDN и image resize pipeline;
- custom domains, redirects, sitemap, robots UI и custom SEO fields.
- cart, checkout, orders, payments, delivery, taxes, promotions, warehouses and external commerce integrations.

Preview route `/projects/{projectId}/pages/{pageId}/preview` не является публичным storefront URL и не использует published snapshot. Он загружает сохранённый `PageDocument`, валидирует его и рендерит через `packages/renderer` в `mode="preview"` без editor chrome, inspector и block controls. Если в editor есть несохранённые изменения, кнопка `Предпросмотр` предупреждает, что preview показывает последнюю сохранённую версию.

## Local Publication Flow

1. Запустить PostgreSQL: `pnpm db:up`.
2. Применить миграции: `pnpm db:migrate`.
3. Заполнить demo data: `pnpm db:seed`.
4. Запустить API: `pnpm --filter @site-platform/api dev`.
5. Запустить dashboard: `pnpm --filter @site-platform/dashboard dev`.
6. Запустить storefront: `pnpm --filter @site-platform/storefront dev`.
7. Открыть страницу в dashboard, отредактировать draft и нажать `Сохранить`.
8. Нажать `Опубликовать`.
9. Открыть public URL вида `http://localhost:3001/s/demo-store/home`.

Если локальный `.env` был создан до публикации, добавьте вручную:

```bash
STOREFRONT_ORIGIN=http://localhost:3001
NEXT_PUBLIC_STOREFRONT_URL=http://localhost:3001
NEXT_PUBLIC_DASHBOARD_URL=http://localhost:3000
```

Публикация не сохраняет dirty editor state автоматически. Если есть несохраненные изменения, dashboard предлагает сохранить и опубликовать либо опубликовать последнюю сохраненную версию.

Текущая write-схема документа: `schemaVersion: 2`. Старые V1 документы читаются через in-memory миграцию в `packages/editor-core` и не перезаписываются без явного save.

## Команды проверки

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Integration tests с PostgreSQL запускаются только когда настроены безопасные test database переменные. Если Docker или база недоступны, unit/smoke tests остаются рабочими, а database integration test пропускается.

Для запуска database integration tests с реальной PostgreSQL:

```bash
cp .env.example .env
pnpm db:up
pnpm db:migrate:test
pnpm --filter @site-platform/database... test
```

Тесты используют `TEST_DATABASE_URL`, проверяют safety rules перед подключением и очищают только таблицы тестовой базы.

## Tenant Isolation

`Organization` является верхней границей tenant. `User` является глобальной identity-сущностью, а доступ пользователя к организации задается через `Membership`.

`Project` всегда принадлежит одной `Organization`. Репозитории не предоставляют публичный `ProjectRepository.findById(id)`: чтение проекта выполняется только через `organizationId` или `TenantContext`. Если проект принадлежит другой организации, обычный query возвращает `null`, то есть прикладной слой должен отдавать `not found`.

`SitePage` всегда принадлежит одному `Project` и содержит `organizationId` для tenant isolation. Репозиторий страниц не предоставляет lookup только по `pageId`: каждый query включает `TenantContext` и `projectId`. Обычные query скрывают soft-deleted страницы.

`PageDocument` всегда связан с одной `SitePage` и дополнительно хранит `organizationId` и `projectId`. Репозиторий документов не предоставляет lookup только по `id`: чтение и сохранение выполняются через `TenantContext`, `projectId` и `pageId`. Сохранение использует optimistic concurrency через `revision`; stale revision возвращает conflict.

`MediaAsset` всегда связан с одной `Organization` и одним `Project`. Репозиторий media assets не предоставляет project-less lookup: список, чтение, обновление и удаление выполняются через `TenantContext` и `projectId`. API сохранения PageDocument проверяет, что каждый `ImageBlock.props.assetId` принадлежит тому же проекту. Чужие или неизвестные media assets возвращаются как invalid document/not found, без раскрытия существования объекта в другом tenant.

`ProductMedia` связывает `Product` только с `MediaAsset` из той же `Organization` и того же `Project`. Галерея товара читается и меняется только через `TenantContext`, `projectId` и `productId`; чужие assets отклоняются. Обычная выдача товаров возвращает stable order, максимум 10 изображений и одно optional primary image.

`PublishedPageSnapshot` хранит immutable опубликованную копию PageDocument V2 и metadata страницы. `PublishedPageState` хранит активный snapshot для page. Authenticated publication endpoints используют `TenantContext`, а public storefront lookup идет только через `publicHandle` и active published state. Draft-only content and draft-only media assets are not public.

Локальные файлы лежат под `MEDIA_STORAGE_DIR`, но dashboard получает только API URL вида `/api/projects/:projectId/media/:assetId/content`. Удаление media asset блокируется, если asset используется в сохранённых PageDocuments проекта или в `ProductMedia` любого не удалённого товара.

Обычные запросы к `Organization` и `Project` исключают записи с `deletedAt`. `AuditLog` считается append-only: repository предоставляет только create/read методы.

## Структура monorepo

```text
apps/
  dashboard/   минимальное Next.js App Router приложение
  storefront/  минимальное Next.js App Router приложение
  api/         минимальное NestJS приложение с health endpoints
  worker/      минимальное Node.js/TypeScript приложение

packages/
  block-library/ определения первых блоков и inspector metadata
  config/      Zod env validation и typed config
  database/    Prisma/PostgreSQL foundation, repositories и tenant-aware tests
  domain/      tenant context, RBAC permissions, validators и domain errors
  media-storage/ local MediaStorage adapter и image upload validation
  editor-core/ схема PageDocument v1 и immutable document commands
  integrations/
  renderer/    общий React renderer для editor/preview/future storefront
  testing/
  ui/

docs/
  adr/
```

## Типичные ошибки подключения

- `DATABASE_URL is required when NODE_ENV is not test`: создайте `.env` из `.env.example` или экспортируйте `DATABASE_URL`.
- `TEST_DATABASE_URL is required when NODE_ENV is test`: добавьте отдельный URL тестовой базы.
- `TEST_DATABASE_URL_MATCHES_DEVELOPMENT`: test database URL совпадает с development database URL; команда reset/migrate для test базы остановлена защитой.
- `TEST_DATABASE_URL_NOT_RECOGNIZED`: имя базы в `TEST_DATABASE_URL` не содержит `test`.
- `P1001` или connection refused: PostgreSQL не запущен; выполните `pnpm db:up` и дождитесь healthcheck.
- `DEV_USER_EMAIL_REQUIRED`: добавьте `DEV_USER_EMAIL=owner@example.com` в `.env`.
- `DEV_USER_NOT_FOUND` или `DEV_MEMBERSHIP_NOT_FOUND`: выполните `pnpm db:seed` после миграций.

## Продуктовая документация

- `PRODUCT_VISION.md`
- `MVP_SCOPE.md`
- `USER_ROLES.md`
- `USER_JOURNEYS.md`
- `DOMAIN_MODEL.md`
- `INTEGRATIONS.md`
- `ROADMAP.md`
- `AGENTS.md`
- `docs/TECHNICAL_FOUNDATION_PROPOSAL.md`
- `docs/PROJECT_WORKSPACE.md`
- `docs/PAGE_DOCUMENT_SCHEMA_V1.md`
