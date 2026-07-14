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

- Site behavior exists indirectly through project-level:
  - `ProjectPublicationSettings`;
  - `ProjectSiteSettings`;
  - public handle;
  - header/footer draft JSON.
- Storefront routes use `publicHandle`.

Missing or incomplete:

- No first-class `Site` model.
- Current schema cannot represent multiple sites per project without overloading `Project`.
- Domain and publication settings are project-level, not site-level.

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

- `SitePage` model scoped by project and organization.
- `PageDocument` stores the page document JSON and revision.
- API supports page list/create/get/update.
- API supports page document get/save.
- API supports section add/reorder/duplicate/update/delete through document JSON operations.
- Dashboard project workspace can list/create pages.
- Page editor route and tests exist.

Missing or incomplete:

- There is no relational `Section` model.
- Sections have no independent ownership, timestamps, or indexes outside document JSON.
- Page model is tied directly to Project, not Site.

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

- Preview depends on project-level public settings and page publication state.
- No first-class site preview mode for multiple sites per project.

## 9. Publish

Existing:

- `PublishedPageSnapshot` and `PublishedPageState`.
- Publication API routes for settings, status, publish, unpublish, history, rollback.
- Public site endpoints and storefront dynamic routes.

Missing or incomplete:

- Publish is page-centric and project/public-handle-centric.
- No first-class site deployment entity.
- Domain management UI is placeholder-level.

## Recommended next vertical step

Before extending editor/storefront/template work, implement the domain kernel that makes the
product hierarchy explicit:

`Organization -> Project -> Site -> Page -> Section`

This should be `MERCURIO-002 Domain Kernel: Project, Site, Page and Section`.
