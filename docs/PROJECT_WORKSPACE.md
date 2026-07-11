# Project Workspace

## Purpose

This document describes the first internal project workspace and page placeholder flow.

The current implementation is intentionally limited to project navigation, page metadata and a placeholder editor shell. It does not add page JSON documents, blocks, renderer, visual editor logic, preview rendering or publication.

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
- a link to open the page editor placeholder.

## Routes

Dashboard routes:

| Route | Purpose |
| --- | --- |
| `/` | Projects list. |
| `/projects/[projectId]` | Project workspace. |
| `/projects/[projectId]/pages/[pageId]` | Page editor placeholder. |

API routes:

| Route | Purpose |
| --- | --- |
| `GET /api/projects/:projectId` | Return a project inside the active organization. |
| `GET /api/projects/:projectId/pages` | Return active pages for a project. |
| `POST /api/projects/:projectId/pages` | Create a draft page for a project. |
| `GET /api/projects/:projectId/pages/:pageId` | Return one active project page. |

All project and page queries are tenant-aware. Cross-tenant access returns `not found`.

## Data Model

`SitePage` is the first page metadata model.

It includes:

- `organizationId`;
- `projectId`;
- `title`;
- `slug`;
- `status`;
- `isHome`;
- timestamps;
- `deletedAt` for soft delete.

The page document, block tree and content schema are deferred.

## Current Limitations

- No production authentication.
- No sessions.
- No page JSON document.
- No block tree.
- No visual editor behavior.
- No drag-and-drop.
- No renderer.
- No preview rendering.
- No publication flow.
- No custom domains.

## Next Steps

1. Add a versioned page document model.
2. Define the first block schema and block library contracts.
3. Implement shared renderer foundations.
4. Connect editor state to page document persistence.
5. Add preview and publication workflows after renderer foundations exist.
