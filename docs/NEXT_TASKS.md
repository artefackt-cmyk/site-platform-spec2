# Next Tasks

Last audited: 2026-07-14

## Immediate baseline tasks

1. Start Docker Desktop/daemon and rerun:
   - `pnpm db:up`
   - `pnpm db:migrate`
   - `pnpm db:migrate:test`
   - `pnpm db:seed`
   - `pnpm --filter @site-platform/database test`
2. Decide whether database integration tests should fail when the test database is unavailable,
   or remain skipped by default.
3. Consider adding a documented `db:status` root script that loads `.env` before running Prisma
   migrate status.
4. Consider adding the Next.js ESLint plugin to the flat ESLint config, or document why the warning
   is accepted.

## Feature backlog

### MERCURIO-002 Domain Kernel: Project, Site, Page and Section

Goal: make the product hierarchy explicit and executable:

`Organization -> Project -> Site -> Page -> Section`

Small, verifiable steps:

1. Add a `Site` Prisma model scoped by `organizationId` and `projectId`.
2. Backfill one default site per existing project in a migration.
3. Add `siteId` to `SitePage` and update unique indexes from project-level page slugs/home page
   to site-level constraints.
4. Add repository methods for site list/create/get/update under tenant context.
5. Add API endpoints under `/api/projects/:projectId/sites`.
6. Update project workspace data loading to show/select sites.
7. Move or bridge project site settings to site-level settings.
8. Decide whether `Section` becomes a relational model now or remains in `PageDocument` for one
   more milestone.
9. Add tests for tenant isolation, unique constraints, and default-site backfill.
10. Run dev/test migrations against clean databases.

### MERCURIO-003 Template selection foundation

- Add template metadata model or static registry.
- Allow project/site creation from a selected template.
- Instantiate initial pages/sections from template data.

### MERCURIO-004 Site-aware storefront/public API

- Resolve public pages by `Site.publicHandle`.
- Ensure product/catalog behavior is correct for multi-site projects.
- Add site-level publication status.

### MERCURIO-005 Editor Shell v1

- Build on `packages/ui` Design System Foundation.
- Replace remaining app-local editor shell surfaces with shared UI primitives.
- Keep editor UI theme independent from created Site Theme.

### MERCURIO-006 Publishing and domain management

- Introduce site-level publish/deploy semantics.
- Add domain verification model and dashboard flow.
- Clarify page-level vs whole-site publish behavior.

## Architectural risks to monitor

- Retrofitting `Site` after project-level publication/settings have already grown may require
  compatibility bridges.
- Sections inside JSON are flexible but limit relational querying, auditing, and independent
  lifecycle management.
- First active membership as active workspace is simple but will not support workspace switching.
- Storefront/public API behavior must be revisited when a project can contain multiple sites.
