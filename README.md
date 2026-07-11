# Site Platform Spec 2

Минимальный технический каркас monorepo для будущей SaaS-платформы. В репозитории есть первые foundation-модели для организаций, участников, проектов и audit log, а также development-only dashboard для просмотра и создания проектов. Production-авторизации, редактора, commerce, очередей и реальных интеграций пока нет.

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
NEXT_PUBLIC_API_URL=http://localhost:3002
```

`DEV_USER_EMAIL` используется только в `NODE_ENV=development`. Это не production-auth, не session, не cookie и не token.

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

Миграции находятся в `packages/database/prisma/migrations`. Текущая миграция добавляет только foundation-модели:

- `User`;
- `Organization`;
- `Membership`;
- `Project`;
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

Editor, commerce и integration-модели пока намеренно не добавлены.

## Development Seed

После применения миграций заполнить development database начальными данными:

```bash
pnpm db:seed
```

Seed работает только вне production и идемпотентно создает:

- пользователя `owner@example.com`;
- организацию `Demo Brand`;
- `OWNER` membership;
- проект `Demo Store` со slug `demo-store`;
- audit log записи для создания организации и проекта.

Повторный запуск не создает дубликаты и не удаляет существующие данные.

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
- `GET /api/me` - development-only текущий пользователь и активная организация;
- `GET /api/projects` - проекты активной организации;
- `POST /api/projects` - создание проекта в активной организации.

Для раздельного запуска:

```bash
pnpm --filter @site-platform/api dev
pnpm --filter @site-platform/dashboard dev
```

Адреса для браузера и API:

- dashboard: `http://localhost:3000`;
- API: `http://localhost:3002`;
- database health: `http://localhost:3002/health/database`.

Перед открытием dashboard обычно нужен такой порядок:

```bash
pnpm db:up
pnpm db:migrate
pnpm db:seed
pnpm --filter @site-platform/api dev
pnpm --filter @site-platform/dashboard dev
```

Если `DEV_USER_EMAIL` отсутствует или пользователь не найден в таблицах `User`/`Membership`, API вернет понятную JSON-ошибку, а dashboard покажет сообщение конфигурации.

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

Обычные запросы к `Organization` и `Project` исключают записи с `deletedAt`. `AuditLog` считается append-only: repository предоставляет только create/read методы.

## Структура monorepo

```text
apps/
  dashboard/   минимальное Next.js App Router приложение
  storefront/  минимальное Next.js App Router приложение
  api/         минимальное NestJS приложение с health endpoints
  worker/      минимальное Node.js/TypeScript приложение

packages/
  block-library/
  config/      Zod env validation и typed config
  database/    Prisma/PostgreSQL foundation, repositories и tenant-aware tests
  domain/      tenant context, RBAC permissions, validators и domain errors
  editor-core/
  integrations/
  renderer/
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
