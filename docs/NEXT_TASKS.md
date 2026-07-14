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

### MERCURIO-003 Site Management Dashboard

Goal: expose the implemented Site Domain Kernel in dashboard workflows:

`Organization -> Project -> Site -> SitePage -> PageDocument.sections JSON`

Small, verifiable steps:

1. Load `/api/projects/:projectId/sites` in the project workspace.
2. Add a Site selector with default/archived states.
3. Create/update/archive Site from dashboard UI.
4. Add set-default action with confirmation.
5. Route pages list/editor/site-settings/publication settings through explicit `siteId`.
6. Preserve old default-site project routes only as compatibility.
7. Show public handle per Site.
8. Add dashboard tests for selecting a second Site and keeping its pages/settings isolated.

### MERCURIO-004 Template selection foundation

- Add template metadata model or static registry.
- Allow project/site creation from a selected template.
- Instantiate initial pages/sections from template data.

### MERCURIO-005 Site-aware publish commands

- Add explicit site-scoped publish/unpublish/history/rollback API routes.
- Add whole-site publish status if product wants site-level deployment semantics.
- Keep page-level publish, but make `siteId` explicit in dashboard calls.

### MERCURIO-006 Editor Shell v1

- Build on `packages/ui` Design System Foundation.
- Replace remaining app-local editor shell surfaces with shared UI primitives.
- Keep editor UI theme independent from created Site Theme.

### MERCURIO-007 Publishing and domain management

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
