# Current State

Last audited: 2026-07-14

## Repository baseline

- Branch for this audit/update: `codex/mercurio-003-site-management-dashboard`.
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
- Prisma schema and migrations exist for tenancy, auth, projects, first-class sites, site pages,
  page documents, media, publication snapshots, product catalog, cart/checkout/orders, and
  site-owned settings/publication settings.
- Auth foundation exists: registration, login, logout, session, password reset, onboarding.
- Tenant identity is resolved from the session cookie, with optional development identity when enabled.
- RBAC exists in `packages/domain` and is used by project/page/content paths.
- API routes exist for:
  - `/health` and `/health/database`;
  - `/api/auth/*`;
  - `/api/me`;
  - `/api/projects`;
  - first-class project sites and site-scoped pages/page document mutations;
  - compatibility project page routes that resolve through the active default Site;
  - page sections stored inside the page document JSON;
  - site settings, media, publication, products, orders;
  - public site/product/order endpoints.
- Dashboard has routes for auth, projects, site management, site-scoped pages/settings/publication,
  page editor/preview, media, products, orders, and design system.
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

- Page sections are not first-class database rows; they live inside `PageDocument.document` JSON.
- Template Center is not implemented as a domain model or UI workflow.
- Products, media, orders, and catalog workflows remain project-level shared resources.
- Worker has no real background job pipeline yet.
- Storefront public pages depend on API data; full end-to-end publish flow requires PostgreSQL.

## Known issues

- Local baseline depends on Docker Desktop/daemon being started before DB commands.
- Site-aware dashboard routes are implemented, while old project-level page URLs remain
  compatibility redirects through the active default Site.
- Site-scoped publish/status/settings flows exist in the dashboard, but unpublish/history/rollback
  editor actions still use the project-level compatibility API until explicit site-scoped publish
  command routes are added.
- `Organization` has `deletedAt`, but most child models use restrictive foreign keys and mixed
  archive/delete semantics.
- Next build warns that the Next.js ESLint plugin is not detected in the flat ESLint config.
