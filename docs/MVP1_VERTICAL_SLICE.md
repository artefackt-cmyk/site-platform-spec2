# MVP1 Vertical Slice

Last audited: 2026-07-14

Target path:

`registration -> workspace -> project -> site -> template -> pages/sections -> editor -> preview -> publish`

## 1. Registration

Existing:

- API: `POST /api/auth/register`.
- Creates user, organization membership, session cookie, and onboarding state.
- Dashboard route: `/register`.
- Password security and auth tests exist.

Missing or incomplete:

- Production email verification is not implemented.
- Signup funnel copy and analytics are not formalized.

## 2. Workspace / organization

Existing:

- `Organization`, `Membership`, and `OrganizationRole`.
- `TenantContext` resolves the active organization from the authenticated user's first active
  membership.
- `/api/me` returns active organization and role.

Missing or incomplete:

- No explicit workspace switcher.
- No multi-organization selection flow.
- Membership management UI is not present.

## 3. Project

Existing:

- `Project` model scoped by `organizationId`.
- API: list, create, get project.
- Dashboard project list, create-project form, empty/loading/error states.
- Project workspace route: `/projects/[projectId]`.

Missing or incomplete:

- Project archive/delete UI is not central.
- Project settings/domain/design tabs are placeholders.

## 4. Site

Existing:

- `Site` is a first-class Prisma model under `Project`.
- Every new Project gets a default active Site through `ProjectRepository.create`.
- Existing Projects are backfilled with a default Site by migration.
- `SitePage`, `PageDocument`, `ProjectPublicationSettings`, `ProjectSiteSettings`,
  `PublishedPageSnapshot`, and `PublishedPageState` carry required `siteId`.
- API exposes Site CRUD under `/api/projects/:projectId/sites`.
- API exposes site-scoped pages under `/api/projects/:projectId/sites/:siteId/pages`.
- Site settings and publication settings have site-scoped routes.
- Storefront public page lookup resolves through Site-owned publication settings.

Missing or incomplete:

- No dashboard UI for selecting/managing Sites yet.
- Historical Prisma model/table names `ProjectPublicationSettings` and `ProjectSiteSettings`
  remain for compatibility, despite site-level ownership.
- Products/media/orders are still project-level shared resources.

## 5. Template

Existing:

- `packages/block-library` contains initial block definitions.
- `packages/editor-core` can create default blocks/sections.

Missing or incomplete:

- No `Template` Prisma model.
- No Template Center.
- No template selection in onboarding/project creation.
- No template-to-site/page instantiation workflow.

## 6. Pages and sections

Existing:

- `SitePage` model scoped by site, project, and organization.
- `PageDocument` stores the page document JSON and revision.
- API supports page list/create/get/update.
- API supports page document get/save.
- API supports section add/reorder/duplicate/update/delete through document JSON operations.
- Dashboard project workspace can list/create pages.
- Page editor route and tests exist.

Missing or incomplete:

- There is no relational `Section` model.
- Sections have no independent ownership, timestamps, or indexes outside document JSON.
- Project-level page routes are compatibility routes that resolve through the default Site.

## 7. Editor

Existing:

- Page editor view/state tests exist.
- `editor-core` validates documents and section operations.
- `renderer` renders page documents.
- Design System Foundation v1 provides editor primitives.

Missing or incomplete:

- Full production editor shell is still foundation/prototype level.
- Rich inspector workflows, template insertion, drag/drop, undo/redo persistence, and collaboration
  are not complete.

## 8. Preview

Existing:

- Dashboard page preview route exists.
- Storefront public render path exists.
- Design System includes `DualViewportPreview` foundation.

Missing or incomplete:

- No dashboard site selector/preview switcher for multiple Sites per project.

## 9. Publish

Existing:

- `PublishedPageSnapshot` and `PublishedPageState`.
- Publication API routes for settings, status, publish, unpublish, history, rollback.
- Public site endpoints and storefront dynamic routes.
- Published snapshots/states carry `siteId`.
- Publication settings are site-owned through required `siteId`.

Missing or incomplete:

- Publish commands are still primarily exposed through compatibility project-level page routes.
- No first-class site deployment entity.
- Domain management UI is placeholder-level.

## Recommended next vertical step

Next, expose the new Site kernel in dashboard workflows:

`MERCURIO-003 Site Management Dashboard`

Focus: list/select Sites in the project workspace, create/update/archive Sites, switch default
Site, and route page/settings/publication screens through explicit `siteId`.
