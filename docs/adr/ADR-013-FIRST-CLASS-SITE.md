# ADR-013: First-Class Site Domain Kernel

Date: 2026-07-14

## Status

Accepted

## Context

Mercurio's product hierarchy requires:

`Organization -> Project -> Site -> Page -> PageDocument -> sections JSON`

Before MERCURIO-002, pages, publication settings, site settings, and published state belonged
directly to `Project`. That prevented one Project from containing multiple Sites with independent
pages/settings/public handles.

## Decision

Add `Site` as a first-class domain model under `Project`.

Implemented ownership:

- `Project.sites`
- `Site.pages`
- `SitePage.siteId`
- `PageDocument.siteId`
- `ProjectPublicationSettings.siteId`
- `ProjectSiteSettings.siteId`
- `PublishedPageSnapshot.siteId`
- `PublishedPageState.siteId`

`ProjectPublicationSettings` and `ProjectSiteSettings` keep their historical names for this
milestone, but they are now site-owned through required unique `siteId`.

Sections remain nested in `PageDocument.document` JSON. MERCURIO-002 deliberately avoids a
relational `Section` table to keep the migration focused on Site ownership and preserve editor
document behavior.

## Constraints

- `Site.slug` is unique inside a Project.
- `SitePage.slug` is unique inside a Site.
- PostgreSQL partial unique indexes enforce:
  - one active default Site per Project;
  - one active home Page per Site.
- Archived Sites cannot be used by repository methods for new page/publication workflows.
- A Project cannot archive its only active Site.
- The default active Site cannot be archived before selecting another default.

## Migration

Migration `20260714120000_add_first_class_sites`:

1. Creates `sites`.
2. Creates one deterministic active default Site for every existing Project.
3. Adds nullable `site_id` to page/document/settings/publication tables.
4. Backfills `site_id` through each Project's default Site.
5. Validates no dependent rows remain without `site_id`.
6. Makes `site_id` required.
7. Replaces project-level page slug/home constraints with site-level constraints.

Migration `20260714123000_align_first_class_site_schema` aligns manual SQL indexes/defaults with
the Prisma datamodel.

## Compatibility

Existing project-level page routes remain temporarily:

- `/api/projects/:projectId/pages`
- `/api/projects/:projectId/pages/:pageId`
- `/api/projects/:projectId/pages/:pageId/document`
- existing section mutation routes

These resolve through the active default Site. New Site-aware routes use:

- `/api/projects/:projectId/sites`
- `/api/projects/:projectId/sites/:siteId/pages`
- `/api/projects/:projectId/sites/:siteId/site-settings`
- `/api/projects/:projectId/sites/:siteId/publication-settings`

This avoids two independent page ownership models while preserving dashboard/storefront
compatibility.

## Consequences

- Multi-site Project data is now representable and enforceable at the database/repository layer.
- Dashboard still needs a Site selector and Site management UI.
- Publish commands are still primarily exposed through default-site compatibility routes; explicit
  site-scoped publish commands are the next publish milestone.
- `projectId` remains on several Site-owned rows as transitional denormalized data for existing
  project-scoped services. It must remain consistent with `site.projectId`.

## Follow-Up

MERCURIO-003 should implement Site Management Dashboard:

- list/select Sites in the project workspace;
- create/update/archive Sites;
- set default Site;
- route page/settings/publication screens through explicit `siteId`;
- keep compatibility routes only as fallback during migration.
