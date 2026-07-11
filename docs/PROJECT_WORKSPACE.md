# Project Workspace

## Purpose

This document describes the first internal project workspace, page editor and page preview flow.

The current implementation is intentionally limited to project navigation, page metadata, editing the current draft page document and previewing the saved draft. It does not add publication, storefront rendering, production authentication, commerce or integrations.

## Workspace Structure

The dashboard project workspace opens from a project card.

The workspace has:

- a top panel with project name and status;
- disabled project-level `Предпросмотр` and `Опубликовать` actions;
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

- a sticky top bar with breadcrumb, page title, page status, save state, `Сохранить`, `Предпросмотр` and `Назад к страницам`;
- a left panel with the current section tree, section presets and add-block buttons;
- a central canvas rendered through `packages/renderer`;
- a right inspector for the selected section, column or block;
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
- open the media picker for image blocks;
- upload JPEG, PNG and WebP images through the project media library;
- select a media asset for an image block.

Inspector changes update the canvas immediately in local editor state. They are persisted only after clicking `Сохранить`.

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

API routes:

| Route | Purpose |
| --- | --- |
| `GET /api/projects/:projectId` | Return a project inside the active organization. |
| `GET /api/projects/:projectId/pages` | Return active pages for a project. |
| `POST /api/projects/:projectId/pages` | Create a draft page for a project. |
| `GET /api/projects/:projectId/pages/:pageId` | Return one active project page. |
| `GET /api/projects/:projectId/pages/:pageId/document` | Return the current draft page document, creating an empty document when missing. |
| `PUT /api/projects/:projectId/pages/:pageId/document` | Save the current draft page document with optimistic concurrency. |
| `GET /api/projects/:projectId/media` | List media assets for the project. |
| `POST /api/projects/:projectId/media` | Upload a project image asset. |
| `PATCH /api/projects/:projectId/media/:assetId` | Update media metadata. |
| `DELETE /api/projects/:projectId/media/:assetId` | Delete an unused media asset. |
| `GET /api/projects/:projectId/media/:assetId/content` | Serve project-scoped media content. |

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
- No publication flow.
- No published snapshot.
- No storefront rendering.
- No public preview URL.
- No custom domains.
- No responsive block settings beyond renderer column stacking.
- No S3 or CDN-backed media storage.
- No image resize, optimization or transformations.
- No form, product or custom code blocks.
- No collaborative editing.

## Next Steps

1. Add publication and published snapshots after draft preview is stable.
2. Extend the block library inside the MVP boundaries.
3. Add future JSON schema migration helpers when `schemaVersion` changes again.
