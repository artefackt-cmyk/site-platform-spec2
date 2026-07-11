# ADR-006: Publication and Published Snapshots

## Status

Accepted

## Context

The page editor stores a mutable `PageDocument` draft. A public storefront must not render that mutable draft directly, because users need to continue editing without changing the already published site.

The MVP needs a system public URL, publication history, rollback and unpublish without adding custom domains, redirects, production authentication redesign, queues, CDN or commerce rendering.

## Decision

Keep `PageDocument` as the mutable draft. Publishing creates an immutable `PublishedPageSnapshot` containing a fully validated PageDocument V2 plus render metadata:

- organization, project and page ownership;
- page title;
- page slug;
- source draft revision;
- publisher;
- publication timestamp;
- monotonically increasing version within the page.

The public storefront reads only the active published snapshot through public read endpoints. Draft changes after publication do not affect the public site until another publish action creates a new snapshot.

`PublishedPageState` is a separate model with one row per `SitePage`. It stores the current `activeSnapshotId`, `publishedAt` and `unpublishedAt`. A null `activeSnapshotId` means the page is unpublished. This keeps publication state explicit without mutating snapshot rows and avoids overloading mutable `SitePage` fields with derived publication status.

Rollback creates a new snapshot version by copying the selected historical snapshot document and metadata, then makes that new snapshot active. History remains linear and the active snapshot always represents the latest publication event. The draft is not changed by rollback.

Repeated publish with no draft revision or page metadata changes returns the existing active snapshot instead of creating a duplicate version.

Public URLs use system-generated project handles and page slugs:

- project: `/s/:publicHandle`;
- page: `/s/:publicHandle/:pageSlug`.

Custom domains can be added later by resolving domains to the same project publication settings without changing snapshot storage.

## Access Rules

Authenticated publication endpoints are tenant-aware and available only to organization members with the required content/page permissions. All authenticated publication reads and writes include `TenantContext` plus `projectId`.

Public storefront endpoints do not require dashboard identity. They look up content only by `publicHandle` plus active page state and return 404 for unknown, unpublished or cross-project pages. They do not expose organization ids, user ids, storage keys or draft revisions.

## Media Strategy

Snapshots keep PageDocument V2 as published. They are not modified after creation.

The public API materializes public media URLs when reading a snapshot. `ImageBlock.props.assetId` is converted to `/api/public/media/:assetId/content` in the response DTO. This preserves snapshot immutability while allowing public media serving rules to evolve.

The public media endpoint returns an asset only when it is referenced by at least one active published snapshot. Draft-only assets are not public. Media deletion is blocked when an asset is referenced by a saved draft or an active published snapshot.

Local files are not copied during publication. Missing physical media files fail publication validation.

## Publication Status

Publication status is computed, not stored:

- `never-published`: no active snapshot and no history;
- `published-current`: active snapshot exists and draft revision, title and slug match it;
- `published-with-changes`: active snapshot exists but draft revision, title or slug differs;
- `unpublished`: history exists but active snapshot is null.

## Homepage

`SitePage.isHome` remains the explicit homepage marker. The public project route `/s/:publicHandle` renders the active published home page. If the home page is not published, the public route returns 404. Only one active page can be home for a project at application level.

## Consequences

- Public pages are stable and independent from ongoing draft edits.
- Rollback is auditable and does not rewrite history.
- Unpublish removes public access without deleting history.
- Changing a page slug changes the public URL only after the next publication.
- Old URLs return 404; automatic redirects are not part of the MVP.
- Navigation lists only active published pages and uses stable home/creation ordering.
- The storefront can share `packages/renderer` with editor and preview while using `mode="storefront"` without editor chrome.

## Non-Goals

- Custom domains.
- DNS verification.
- SSL or CDN integration.
- Edge rendering.
- Production authentication or session redesign.
- Scheduled publishing.
- Approval workflows.
- Draft preview tokens.
- Redirect management.
- Sitemap or robots management UI.
- Custom SEO fields.
- OG image generation.
- Commerce, cart, checkout or product pages.
- Queues, Redis or microservices.
