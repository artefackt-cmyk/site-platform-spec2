# Current State

Last audited: 2026-07-14

## Repository baseline

- Branch for this audit: `codex/mercurio-resume-audit`.
- Package manager: `pnpm` (`packageManager: pnpm@11.7.0`, lockfile: `pnpm-lock.yaml`).
- Monorepo tool: Turborepo (`turbo run ...`, local CLI reported `2.10.4`).
- Node used during audit: `v24.18.0`.
- Docker CLI is installed, but Docker daemon was not running during the audit.
- Prisma is installed in `@site-platform/database`; Prisma CLI/client reported `6.19.3`.

## What is implemented

- Monorepo apps: `api`, `dashboard`, `storefront`, `worker`.
- Monorepo packages: `config`, `database`, `domain`, `editor-core`, `block-library`,
  `renderer`, `ui`, `media-storage`, `integrations`, `testing`.
- Docker Compose defines a PostgreSQL 16 service and init scripts create dev/test databases.
- Prisma schema and migrations exist for tenancy, auth, projects, site pages, page documents,
  media, publication snapshots, product catalog, cart/checkout/orders, and project site settings.
- Auth foundation exists: registration, login, logout, session, password reset, onboarding.
- Tenant identity is resolved from the session cookie, with optional development identity when enabled.
- RBAC exists in `packages/domain` and is used by project/page/content paths.
- API routes exist for:
  - `/health` and `/health/database`;
  - `/api/auth/*`;
  - `/api/me`;
  - `/api/projects`;
  - project pages and page document mutations;
  - page sections stored inside the page document JSON;
  - site settings, media, publication, products, orders;
  - public site/product/order endpoints.
- Dashboard has routes for auth, projects, project workspace, page editor/preview, media,
  products, orders, and design system.
- Storefront has the public landing page and dynamic public site/product/checkout/order routes.
- Worker currently has a minimal dev entrypoint.
- `packages/ui` contains Design System Foundation v1 and dashboard consumes it in the
  `/design-system` route and editor component specimens.

## What works in this environment

- `pnpm install --frozen-lockfile`: passed.
- `pnpm db:generate`: passed.
- `pnpm lint`: passed for all 14 packages.
- `pnpm typecheck`: passed for all packages/tasks.
- `pnpm test`: passed; database integration suites were skipped by their own test guards.
- `pnpm build`: passed for all packages/apps, including `dashboard`, `api`, `worker`, and `storefront`.
- `pnpm dev:dashboard`: starts on `http://localhost:3000`.
  - `GET /design-system` returns a protected-route redirect to `/login?next=%2Fdesign-system`.
- `pnpm --filter @site-platform/api dev`: starts on `http://localhost:3002`.
  - `GET /health` returns `200`.
  - `GET /health/database` returns `503` when PostgreSQL is unavailable.
- `pnpm --filter @site-platform/worker dev`: starts and prints `Worker is running`.
- `pnpm dev:storefront`: starts on `http://localhost:3001`; `GET /` returns `200`.

## Blocked or not verified

- `docker compose up -d postgres` failed because the Docker daemon was not running:
  `Cannot connect to the Docker daemon at unix:///Users/artem/.docker/run/docker.sock`.
- `pg_isready` is not installed in the shell environment.
- Dev migrations and test migrations reached Prisma schema engine with the expected dev/test
  database names, but failed because PostgreSQL was not available.
- `prisma migrate status` must be run with `DATABASE_URL` loaded; root database scripts already
  load `.env`, while direct package-level Prisma CLI execution does not automatically read the
  workspace `.env`.
- Database integration tests are present but skipped unless their test database safety conditions
  are satisfied.

## Stubs and placeholders

- There is no first-class `Site` Prisma model yet; `SitePage`, `ProjectPublicationSettings`,
  and `ProjectSiteSettings` currently represent site-facing behavior at project level.
- Page sections are not first-class database rows; they live inside `PageDocument.document` JSON.
- Template Center is not implemented as a domain model or UI workflow.
- Several project workspace tabs are placeholders (`overview`, `design`, `settings`, `domain`).
- Worker has no real background job pipeline yet.
- Storefront public pages depend on API data; full end-to-end publish flow requires PostgreSQL.

## Known issues

- Local baseline depends on Docker Desktop/daemon being started before DB commands.
- The product decision says one Project can have multiple Sites, but the current schema has no
  `Site` entity; this must be resolved before the next domain expansion.
- `SitePage` is scoped directly to Project; future migration to `Site -> Page` needs a careful
  compatibility plan.
- `Organization` has `deletedAt`, but most child models use restrictive foreign keys and mixed
  archive/delete semantics.
- Next build warns that the Next.js ESLint plugin is not detected in the flat ESLint config.
