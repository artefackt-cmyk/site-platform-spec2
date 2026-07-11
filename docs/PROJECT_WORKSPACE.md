# Project Workspace

## Purpose

This document describes the first internal project workspace, page editor, page preview and publication flow.

The current implementation is intentionally limited to project navigation, page metadata, editing the current draft page document, previewing the saved draft and publishing immutable snapshots to the system storefront URL. It does not add custom domains, production authentication, commerce or integrations.

## Workspace Structure

The dashboard project workspace opens from a project card.

The workspace has:

- a top panel with project name and status;
- project-level placeholder actions;
- a link back to the projects list;
- a link to project media;
- a left navigation for `Обзор`, `Страницы`, `Дизайн`, `Настройки` and `Домен`;
- a default `Страницы` section;
- placeholder sections for `Обзор`, `Дизайн`, `Настройки` and `Домен`.

The `Страницы` section shows:

- page title;
- page slug;
- page status;
- `Главная` badge for the home page;
- a link to open the page editor.

## Page Editor

The editor route is `/projects/[projectId]/pages/[pageId]`.

The editor has:

- a sticky top bar with breadcrumb, page title, page status, save state, publication state, `Сохранить`, `Предпросмотр`, `Опубликовать`, `История`, `Снять` and `Назад к страницам`;
- a left panel with the current section tree, section presets and add-block buttons;
- a central canvas rendered through `packages/renderer`;
- a right inspector for page settings or the selected section, column or block;
- explicit save to PostgreSQL.

Supported document structure:

- sections;
- single-column sections;
- two-column sections;
- columns inside two-column sections;
- leaf blocks.

Supported leaf blocks:

- `heading`;
- `text`;
- `button`;
- `image`;
- `spacer`.

The user can:

- add an empty section;
- add a Hero preset section;
- add a text section preset;
- select a section, column or leaf block;
- switch a section between single and two-column layouts;
- change column ratio for two-column sections;
- add text, button, image and spacer blocks to the selected section or column;
- update selected node props in the inspector;
- move sections and leaf blocks up or down inside their parent;
- delete sections and leaf blocks;
- save the whole draft document.
- update page title, slug and home flag;
- open the media picker for image blocks;
- upload JPEG, PNG and WebP images through the project media library;
- select a media asset for an image block.

Inspector changes update the canvas immediately in local editor state. They are persisted only after clicking `Сохранить`.

Page settings changes are persisted through `PATCH /api/projects/:projectId/pages/:pageId`. Slug changes do not affect the current public URL until the next publication creates a new snapshot.

The editor preview button opens `/projects/[projectId]/pages/[pageId]/preview`.

If the editor document is saved, preview opens immediately. If the editor has unsaved changes, the user sees a warning:

`Предпросмотр показывает последнюю сохранённую версию`

The warning offers:

- `Сохранить и открыть`;
- `Открыть сохранённую версию`;
- `Отмена`.

`Сохранить и открыть` waits for a successful document save and opens preview only after the API returns a new revision. Failed saves keep the user in the editor.

## Page Preview

The preview route is `/projects/[projectId]/pages/[pageId]/preview`.

Preview:

- loads project metadata;
- loads page metadata;
- loads the saved draft `PageDocument`;
- validates the document through `packages/editor-core`;
- renders the page through `packages/renderer` with `mode="preview"`;
- does not show editor borders, selected state, inspector or block controls.

Preview mode and editor mode use the same renderer. Editor mode adds editor chrome and selection behavior. Preview mode renders the page as a clean saved draft without editor controls.

Preview has viewport modes:

- `Desktop`: width `100%`, max width `1440px`;
- `Tablet`: width `768px`;
- `Mobile`: width `390px`.

Narrow screens can horizontally scroll the preview canvas instead of breaking layout.

Preview is not publication. It does not create a public URL, storefront route, custom domain or published snapshot. It shows the latest saved draft document.

## Publication

The editor can publish the latest saved draft revision.

Publication:

- validates the saved PageDocument V2;
- validates page slug rules;
- validates that referenced media assets exist in the same project;
- verifies local media files exist;
- creates an immutable `PublishedPageSnapshot`;
- updates `PublishedPageState.activeSnapshotId`;
- writes an audit log entry;
- returns a public URL.

Publication status is computed from draft revision, page metadata, active snapshot and snapshot history:

- `Не опубликовано` for pages with no active snapshot and no history;
- `Опубликовано` when the active snapshot matches the saved draft revision, title and slug;
- `Есть неопубликованные изменения` when the draft revision, title or slug differs from the active snapshot;
- `Снято с публикации` when history exists but the page has no active snapshot.

If the editor has unsaved changes, publishing offers two paths:

- save and publish the new revision;
- publish the last saved revision while keeping local dirty changes in the editor.

Publication history shows snapshot version, publish time, source revision, page title, slug and active state. Rollback creates a new snapshot version copied from a selected historical snapshot and makes it active. Rollback does not change the draft.

Unpublish sets the active snapshot to null. History remains available and the public URL returns 404.

## Storefront

The storefront app serves system public URLs:

| Route | Purpose |
| --- | --- |
| `/s/[publicHandle]` | Render the active published home page. |
| `/s/[publicHandle]/[pageSlug]` | Render an active published page. |

Storefront pages:

- fetch data through public API endpoints without dashboard identity;
- render PageDocument through `packages/renderer` with `mode="storefront"`;
- do not show editor chrome;
- show project name, navigation with active published pages, main content and a basic footer;
- return noindex metadata for 404/API error states;
- use title, first text block fallback description, canonical URL and Open Graph title for published pages.

Published media URLs are materialized by the public API response. The immutable snapshot keeps the original PageDocument V2; the public DTO rewrites media-library image `src` values to `/api/public/media/:assetId/content`.

## Media Library

The media library route is `/projects/[projectId]/media`.

It supports project-scoped image uploads for local development:

- JPEG, PNG and WebP;
- maximum 10 MB per file;
- optional asset alt text;
- grid listing with image metadata;
- alt text updates;
- deleting unused assets.

Media files are served through project-scoped API content URLs. The dashboard does not expose local filesystem paths. A single media asset can be used by multiple ImageBlocks. Deletion is blocked while a saved PageDocument references the asset.

## Routes

Dashboard routes:

| Route | Purpose |
| --- | --- |
| `/` | Projects list. |
| `/projects/[projectId]` | Project workspace. |
| `/projects/[projectId]/media` | Project media library. |
| `/projects/[projectId]/pages/[pageId]` | Page editor. |
| `/projects/[projectId]/pages/[pageId]/preview` | Preview of the saved draft page document. |
| `http://localhost:3001/s/[publicHandle]` | Public published home page. |
| `http://localhost:3001/s/[publicHandle]/[pageSlug]` | Public published page. |

API routes:

| Route | Purpose |
| --- | --- |
| `GET /api/projects/:projectId` | Return a project inside the active organization. |
| `GET /api/projects/:projectId/pages` | Return active pages for a project. |
| `POST /api/projects/:projectId/pages` | Create a draft page for a project. |
| `GET /api/projects/:projectId/pages/:pageId` | Return one active project page. |
| `PATCH /api/projects/:projectId/pages/:pageId` | Update title, slug and home flag. |
| `GET /api/projects/:projectId/pages/:pageId/document` | Return the current draft page document, creating an empty document when missing. |
| `PUT /api/projects/:projectId/pages/:pageId/document` | Save the current draft page document with optimistic concurrency. |
| `GET /api/projects/:projectId/media` | List media assets for the project. |
| `POST /api/projects/:projectId/media` | Upload a project image asset. |
| `PATCH /api/projects/:projectId/media/:assetId` | Update media metadata. |
| `DELETE /api/projects/:projectId/media/:assetId` | Delete an unused media asset. |
| `GET /api/projects/:projectId/media/:assetId/content` | Serve project-scoped media content. |
| `GET /api/projects/:projectId/publication-settings` | Return public handle and system public URLs. |
| `PATCH /api/projects/:projectId/publication-settings` | Update public handle. |
| `GET /api/projects/:projectId/pages/:pageId/publication-status` | Return computed publication status. |
| `POST /api/projects/:projectId/pages/:pageId/publish` | Publish the saved draft revision. |
| `POST /api/projects/:projectId/pages/:pageId/unpublish` | Unpublish a page without deleting history. |
| `GET /api/projects/:projectId/pages/:pageId/publications` | Return publication history. |
| `POST /api/projects/:projectId/pages/:pageId/publications/:snapshotId/rollback` | Roll back public page to a historical snapshot by creating a new snapshot version. |
| `GET /api/public/sites/:publicHandle` | Return active published home page. |
| `GET /api/public/sites/:publicHandle/pages/:pageSlug` | Return active published page. |
| `GET /api/public/media/:assetId/content` | Serve media only when used by an active published snapshot. |

All project, page and document queries are tenant-aware. Cross-tenant access returns `not found`.

## Data Model

`SitePage` is the page metadata model.

It includes:

- `organizationId`;
- `projectId`;
- `title`;
- `slug`;
- `status`;
- `isHome`;
- timestamps;
- `deletedAt` for soft delete.

`PageDocument` stores the current draft content for one `SitePage`.

It includes:

- `organizationId`;
- `projectId`;
- `pageId`;
- `schemaVersion`;
- `document`;
- `revision`;
- timestamps.

`pageId` is unique, so there is one current draft document per page. `organizationId` and `projectId` are stored directly on `PageDocument` for tenant isolation and repository query constraints.

`MediaAsset` stores project image metadata and points to binary content through a storage key. The storage key is internal and is not used directly by the dashboard.

`ProjectPublicationSettings` stores one public handle per project.

`PublishedPageSnapshot` stores immutable PageDocument V2 publication events.

`PublishedPageState` stores the active snapshot for a page. A null active snapshot means unpublished.

## Editor State

Editor state is kept outside React component rendering details in `apps/dashboard/app/page-editor-state.ts`.

It stores:

- current document;
- last saved document;
- selected node id;
- current revision;
- save status;
- error message.

Document operations come from `packages/editor-core` and are immutable. Zustand, Redux and server-state stores are not introduced.

## Current Limitations

- No production authentication.
- No sessions.
- No drag-and-drop.
- No autosave.
- No undo/redo.
- No custom domains.
- No redirects for old published slugs.
- No sitemap, robots editor, custom SEO fields or OG image generator.
- No responsive block settings beyond renderer column stacking.
- No S3 or CDN-backed media storage.
- No image resize, optimization or transformations.
- No form, product or custom code blocks.
- No collaborative editing.

## Next Steps

1. Add redirects/custom domains as a separate ADR after system URLs are stable.
2. Extend the block library inside the MVP boundaries.
3. Add future JSON schema migration helpers when `schemaVersion` changes again.
