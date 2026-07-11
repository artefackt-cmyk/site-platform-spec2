# Project Workspace

## Purpose

This document describes the first internal project workspace and page editor flow.

The current implementation is intentionally limited to project navigation, page metadata and editing the current draft page document. It does not add publication, storefront rendering, production authentication, commerce or integrations.

## Workspace Structure

The dashboard project workspace opens from a project card.

The workspace has:

- a top panel with project name and status;
- disabled `Предпросмотр` and `Опубликовать` actions;
- a link back to the projects list;
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

- a sticky top bar with breadcrumb, page title, page status, save state, `Сохранить`, disabled `Предпросмотр` and `Назад к страницам`;
- a left panel with the current block list and add-block buttons;
- a central canvas rendered through `packages/renderer`;
- a right inspector for the selected block;
- explicit save to PostgreSQL.

Supported blocks in the first version:

- `heading`;
- `text`;
- `button`;
- `spacer`.

The user can:

- add a block to the end of the page;
- select a block;
- update block props in the inspector;
- move a block up or down;
- delete a block;
- save the whole draft document.

Inspector changes update the canvas immediately in local editor state. They are persisted only after clicking `Сохранить`.

## Routes

Dashboard routes:

| Route | Purpose |
| --- | --- |
| `/` | Projects list. |
| `/projects/[projectId]` | Project workspace. |
| `/projects/[projectId]/pages/[pageId]` | Page editor. |

API routes:

| Route | Purpose |
| --- | --- |
| `GET /api/projects/:projectId` | Return a project inside the active organization. |
| `GET /api/projects/:projectId/pages` | Return active pages for a project. |
| `POST /api/projects/:projectId/pages` | Create a draft page for a project. |
| `GET /api/projects/:projectId/pages/:pageId` | Return one active project page. |
| `GET /api/projects/:projectId/pages/:pageId/document` | Return the current draft page document, creating an empty document when missing. |
| `PUT /api/projects/:projectId/pages/:pageId/document` | Save the current draft page document with optimistic concurrency. |

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

## Editor State

Editor state is kept outside React component rendering details in `apps/dashboard/app/page-editor-state.ts`.

It stores:

- current document;
- last saved document;
- selected block id;
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
- No preview route.
- No publication flow.
- No published snapshot.
- No storefront rendering.
- No custom domains.
- No image, form, product, section, column or nested container blocks.
- No collaborative editing.

## Next Steps

1. Add preview rendering after draft editing is stable.
2. Add publication and published snapshots.
3. Extend the block library inside the MVP boundaries.
4. Add JSON schema migration helpers when `schemaVersion` changes.
