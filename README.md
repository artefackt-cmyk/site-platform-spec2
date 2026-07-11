# Site Platform Spec 2

Минимальный технический каркас monorepo для будущей SaaS-платформы. В репозитории пока нет продуктовых сущностей, авторизации, редактора, commerce, очередей и реальных интеграций.

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

Открыть Prisma Studio:

```bash
pnpm db:studio
```

Безопасно сбросить test database:

```bash
pnpm db:reset:test
```

`db:reset:test` откажется выполняться, если активное окружение не `test`, если `TEST_DATABASE_URL` совпадает с `DATABASE_URL`, или если URL не распознан как тестовая база.

Текущая Prisma schema намеренно не содержит продуктовых моделей. `User`, `Organization`, `Project`, `AuditLog`, editor, commerce и integration-модели добавляются только отдельными задачами и миграциями.

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

## Команды проверки

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Integration tests с PostgreSQL запускаются только когда настроены безопасные test database переменные. Если Docker или база недоступны, unit/smoke tests остаются рабочими, а database integration test пропускается.

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
  database/    Prisma/PostgreSQL foundation без продуктовых моделей
  domain/
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
