# Domain Model Draft

Last audited: 2026-07-14

## Product decision

The intended hierarchy is:

`Organization / Workspace -> Projects -> Sites -> Pages -> Sections / Blocks`

One project can contain multiple sites.

## Current implemented model

Current relational hierarchy:

`Organization -> Project -> SitePage -> PageDocument`

Related project-level site/publication models:

- `ProjectPublicationSettings`
- `ProjectSiteSettings`
- `PublishedPageSnapshot`
- `PublishedPageState`

Sections and blocks are currently nested JSON nodes in `PageDocument.document`.

## Existing ownership fields

- `Organization`: root tenant container.
- `Membership`: joins `User` to `Organization` with `OrganizationRole`.
- `Project`: has `organizationId`.
- `SitePage`: has `organizationId` and `projectId`.
- `PageDocument`: has `organizationId`, `projectId`, `pageId`.
- Media, products, orders, publication snapshots and states carry `organizationId` and mostly
  `projectId`.

This is good for tenant enforcement, but the missing `siteId` prevents a true multi-site project.

## Proposed target hierarchy

```text
Organization
  -> Project
      -> Site
          -> Page
              -> Section
```

Suggested model responsibilities:

- `Organization`: account/workspace boundary.
- `Project`: commercial/customer workspace containing one or more sites and shared commerce/media.
- `Site`: website instance inside a project; owns public handle/domain/theme/header/footer.
- `Page`: page inside a site; owns route slug, status, SEO, ordering/home flag.
- `Section`: ordered editable page region/block with type, data JSON, visibility, and responsive
  override metadata.

## Candidate Prisma changes for MERCURIO-002

Add `Site`:

- `id`
- `organizationId`
- `projectId`
- `name`
- `slug`
- `status`
- `publicHandle`
- `primaryDomainId?`
- `themeDraft Json?`
- `headerDraft Json`
- `footerDraft Json`
- `headerEnabled Boolean`
- `footerEnabled Boolean`
- `createdAt`, `updatedAt`, `deletedAt?`

Add or rename `Page`:

- Either migrate `SitePage` to `Page`, or keep table name initially and add `siteId`.
- Add `siteId` and unique constraints such as `[siteId, slug]`.
- Home uniqueness should become one active home page per site, not per project.

Add `Section`:

- `id`
- `organizationId`
- `projectId`
- `siteId`
- `pageId`
- `type`
- `name`
- `position`
- `data Json`
- `visible Boolean`
- `responsiveOverrides Json?`
- `createdAt`, `updatedAt`, `deletedAt?`

Move or duplicate project-level settings:

- `ProjectPublicationSettings` likely becomes `SitePublicationSettings` or fields on `Site`.
- `ProjectSiteSettings` likely becomes `SiteSettings`.
- Publication snapshots need `siteId`.
- Public storefront lookups should use `Site.publicHandle`.

## Migration strategy

1. Add `Site` with a default site per existing project.
2. Backfill each `SitePage` with `siteId` for the default site.
3. Add `siteId` to publication/settings/media relations where needed.
4. Keep compatibility APIs temporarily while dashboard migrates from project-level site settings.
5. Move section data from `PageDocument.document` into `Section` only when editor behavior is ready,
   or introduce `Section` as metadata while preserving document JSON initially.

## Questions requiring product decisions

- Does a Project share products/media/orders across all Sites, or can a Site have its own catalog?
- Can one Site have multiple domains and one primary domain?
- Is `publicHandle` globally unique across all sites, or scoped by organization?
- Should templates instantiate a Site, a Page, or both?
- Are sections first-class versioned records immediately, or does v1 keep document JSON and add
  relational sections later?
- How should publish work for multi-site projects: page-by-page, whole-site, or both?
- What happens to orders when a project has several sites sharing one catalog?
