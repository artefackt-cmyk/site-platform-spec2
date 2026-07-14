# Domain Model Draft

Last audited: 2026-07-14

## Product decision

The intended hierarchy is:

`Organization / Workspace -> Projects -> Sites -> Pages -> PageDocument.sections JSON`

One project can contain multiple sites.

## Current implemented model

Current relational hierarchy:

`Organization -> Project -> Site -> SitePage -> PageDocument`

Site-owned publication/settings models retain their historical table/model names for a
compatibility milestone, but now carry required `siteId`:

- `ProjectPublicationSettings`
- `ProjectSiteSettings`
- `PublishedPageSnapshot`
- `PublishedPageState`

Sections and blocks are currently nested JSON nodes in `PageDocument.document`.

## Existing ownership fields

- `Organization`: root tenant container.
- `Membership`: joins `User` to `Organization` with `OrganizationRole`.
- `Project`: has `organizationId`.
- `Site`: has `organizationId`, `projectId`, unique `(projectId, slug)`, status, and
  `isDefault`.
- `SitePage`: has `organizationId`, `projectId`, and required `siteId`.
- `PageDocument`: has `organizationId`, `projectId`, required `siteId`, and `pageId`.
- Publication settings, site settings, published snapshots, and published states have required
  `siteId`.
- Media, products, and orders remain project-level shared resources in this milestone.

`projectId` remains on page/document/publication rows as a transitional denormalized field for
compatibility routes and existing project-scoped services. Repositories validate consistency via
`Organization -> Project -> Site`.

## Implemented hierarchy

```text
Organization
  -> Project
      -> Site
          -> SitePage
              -> PageDocument
                  -> sections / blocks in JSON
```

Suggested model responsibilities:

- `Organization`: account/workspace boundary.
- `Project`: commercial/customer workspace containing one or more sites and shared commerce/media.
- `Site`: website instance inside a project; owns active/default state and site-level
  publication/settings rows.
- `SitePage`: page inside a site; owns route slug, status, and home flag.
- `PageDocument`: versioned editable page document. Sections and blocks remain nested JSON nodes
  for MERCURIO-002.

## MERCURIO-002 Prisma changes

Added `Site`:

- `id`
- `organizationId`
- `projectId`
- `name`
- `slug`
- `status`
- `createdAt`, `updatedAt`

Updated page/document/publication models:

- `SitePage.siteId` is required.
- Page slug uniqueness moved from `(projectId, slug)` to `(siteId, slug)`.
- Home-page uniqueness moved from one active home page per project to one active home page per
  site through a PostgreSQL partial unique index.
- `PageDocument.siteId`, `ProjectPublicationSettings.siteId`, `ProjectSiteSettings.siteId`,
  `PublishedPageSnapshot.siteId`, and `PublishedPageState.siteId` are required.
- `ProjectPublicationSettings.projectId` and `ProjectSiteSettings.projectId` are no longer unique;
  `siteId` is unique.
- Published page public lookup resolves through `Site -> ProjectPublicationSettings.publicHandle`.

Not added:

- Relational `Section`.
- Custom domains/locales/billing/template marketplace fields.
- Final rename from `ProjectPublicationSettings` / `ProjectSiteSettings` to site-named tables.

## Migration strategy

1. Migration `20260714120000_add_first_class_sites` creates `sites`, creates one deterministic
   default Site per existing Project, adds nullable `siteId` to dependent rows, backfills through
   the default Site, validates no nulls remain, then makes `siteId` required.
2. Migration `20260714123000_align_first_class_site_schema` aligns indexes/defaults with Prisma's
   datamodel.
3. Existing project-level page routes are preserved and resolve through the default active Site.
4. New target routes are available under `/api/projects/:projectId/sites/:siteId/pages`.
5. Section data remains in `PageDocument.document` JSON until a later milestone.

## Questions requiring product decisions

- Does a Project share products/media/orders across all Sites, or can a Site have its own catalog?
- Can one Site have multiple domains and one primary domain?
- Is `publicHandle` globally unique across all sites, or scoped by organization?
- Should templates instantiate a Site, a Page, or both?
- Are sections first-class versioned records immediately, or does v1 keep document JSON and add
  relational sections later?
- How should publish work for multi-site projects: page-by-page, whole-site, or both?
- What happens to orders when a project has several sites sharing one catalog?
