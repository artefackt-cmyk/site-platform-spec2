# Current Architecture

Last audited: 2026-07-14

## Monorepo

Mercurio is a pnpm workspace managed with Turborepo.

Apps:

- `apps/api`: NestJS HTTP API.
- `apps/dashboard`: Next.js dashboard/editor application.
- `apps/storefront`: Next.js public storefront application.
- `apps/worker`: minimal worker process entrypoint.

Packages:

- `packages/config`: environment loading and validation.
- `packages/database`: Prisma schema, migrations, repositories, seed/migration scripts.
- `packages/domain`: roles, permissions, validation helpers, domain error codes.
- `packages/editor-core`: page document schema, section/block operations, renderer contracts.
- `packages/block-library`: initial block definitions.
- `packages/renderer`: React renderer for page documents.
- `packages/ui`: shared UI/design system primitives.
- `packages/media-storage`: local media storage abstraction.
- `packages/integrations`: placeholder package for external integrations.
- `packages/testing`: shared testing placeholder package.

## Runtime services

- PostgreSQL is expected from `docker-compose.yml`.
- API listens on `API_PORT` (default `3002`).
- Dashboard listens on `DASHBOARD_PORT` (default `3000`).
- Storefront listens on `STOREFRONT_PORT` (default `3001`).
- `scripts/next-dev-safe.mjs` starts Next dev servers with an isolated `NEXT_DIST_DIR` and
  refuses to start when the port is already occupied.

## Configuration

`packages/config` loads `.env` from the workspace root and validates:

- node environment;
- public and internal URLs;
- dev identity flags;
- auth cookie and TTL values;
- development and test database URLs;
- media storage path and public base URL;
- app ports.

Direct Prisma CLI commands from `packages/database` do not automatically load the workspace
`.env`; root scripts such as `pnpm db:migrate` do.

## Database

Prisma datasource: PostgreSQL.

Main models:

- `User`
- `AuthSession`
- `PasswordCredential`
- `PasswordResetToken`
- `Organization`
- `Membership`
- `Project`
- `Site`
- `SitePage`
- `PageDocument`
- `ProjectPublicationSettings`
- `ProjectSiteSettings`
- `PublishedPageSnapshot`
- `PublishedPageState`
- `MediaAsset`
- `Product`
- `ProductVariant`
- `ProductMedia`
- `ProjectOrderCounter`
- `Order`
- `OrderItem`
- `AuditLog`

Core ownership hierarchy:

`Organization -> Project -> Site -> SitePage -> PageDocument`

`Project` can contain multiple `Site` rows. Each existing Project is backfilled with one active
default Site. Pages, page documents, site settings, publication settings, published snapshots, and
published states now carry required `siteId`. `projectId` remains on those rows as a transitional
compatibility field while project-level dashboard routes are migrated.

Repository methods accept a `TenantContext` for tenant-scoped access and validate Site access
through `Organization -> Project -> Site`.

Delete/archive strategy:

- `Organization`, `Project`, `SitePage`, `Product`, and `ProductVariant` have soft delete or
  archive fields/statuses.
- `Site` has `SiteStatus` (`ACTIVE`, `ARCHIVED`) and cannot archive the only active site or the
  default active site without selecting another default.
- Most foreign keys use `onDelete: Restrict`; auth sessions/credentials cascade from user;
  order items cascade from order.
- Sections are JSON nodes inside `PageDocument`, so section deletion is document mutation, not
  relational deletion.

## Auth and tenancy

- API auth uses session cookies named by `AUTH_SESSION_COOKIE_NAME`.
- Passwords are hashed with Argon2.
- Sessions are stored as token hashes in `AuthSession`.
- `RequestIdentityService` reads the session cookie from request context and resolves:
  user, first active membership, organization, role, and `TenantContext`.
- Development identity can be enabled only in development with `AUTH_ALLOW_DEV_IDENTITY=true`.
- Dashboard middleware checks for the session cookie and redirects protected routes to `/login`.

## Authorization

- Roles and permissions live in `packages/domain`.
- `OWNER` and `ADMIN` get all permissions.
- `EDITOR` can read org/project/page/content and mutate project pages/content/design.
- `STORE_MANAGER` and `VIEWER` have read-only project/content capabilities in the current map.
- API services call `hasPermission` before protected mutations and reads.

## API shape

- Error responses use `{ code, message, details? }` wrapped by Nest HTTP exceptions.
- Validation is hand-written in domain/service helpers rather than a global DTO pipe.
- List endpoints currently return arrays in envelope objects such as `{ projects }`, `{ pages }`.
- Product/order list endpoints accept simple query filters (`status`, `search`).
- No explicit API version prefix exists.

## Dashboard

- Next app-router application with client components for authenticated workflows.
- Middleware guards `/`, `/onboarding`, `/design-system`, and `/projects/:path*`.
- `dashboard-api-client.ts` is the central fetch client and maps API errors into
  `DashboardApiError`.
- Main dashboard loads session and projects from the real API.
- The project workspace opens the Site Management Dashboard and loads project, sites, current Site,
  site pages, site settings, and publication settings from the real API.
- Site-aware dashboard routes use `/projects/:projectId/sites/:siteId/...` for overview, pages,
  settings, publication, editor, and preview.
- Legacy dashboard routes under `/projects/:projectId/pages...`, `/settings`, and `/publication`
  redirect to the active default Site.
- Several UI states are implemented: loading, error, empty projects/sites/pages, submitting forms,
  archived/default/read-only site states, confirmation dialogs, and success/error messages.
- `packages/ui` is consumed by the design-system route and editor primitives; older dashboard
  surfaces still use app-local CSS classes.

## Storefront

- Public landing page is static.
- Dynamic public routes under `/s/[publicHandle]` fetch public API data for pages, products,
  checkout, and orders.
- Storefront public page lookup resolves active snapshots through
  `Site -> ProjectPublicationSettings.publicHandle`.
- Existing `/s/[publicHandle]` routes continue to work for default Sites. Additional Sites can be
  exposed with their own deterministic `publicHandle`.
- Product/catalog/order data remains project-level and shared across Sites for this milestone.

## Background jobs

`apps/worker` currently only starts a minimal process. There is no queue, scheduler, retry,
or job persistence layer yet.
