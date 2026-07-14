# ADR-014: Site Management Dashboard and Site Context Routing

Date: 2026-07-14

## Status

Accepted

## Context

ADR-013 introduced `Site` as a first-class domain object under `Project`. The dashboard still
needed a user-facing way to select and manage Sites, and the editor/pages/settings/publication
screens needed explicit Site context so data from one Site could not bleed into another.

The dashboard also had existing project-level URLs for pages and publication flows. Those URLs are
still useful as compatibility entry points, but they should no longer be the canonical routes.

## Decision

Dashboard Site context is explicit in canonical URLs:

- `/projects/:projectId/sites`
- `/projects/:projectId/sites/:siteId`
- `/projects/:projectId/sites/:siteId/pages`
- `/projects/:projectId/sites/:siteId/pages/:pageId`
- `/projects/:projectId/sites/:siteId/pages/:pageId/preview`
- `/projects/:projectId/sites/:siteId/settings`
- `/projects/:projectId/sites/:siteId/publication`

The project entry route now opens the Site Management Dashboard. Legacy project-level pages,
settings, publication, editor, and preview routes redirect through the active default Site.

The dashboard API client exposes site-aware methods for sites, pages, documents, site settings, and
publication settings/status. Page editor and preview keep compatibility support for project-level
routes, but prefer site-scoped calls when a `siteId` is present.

## UI Model

The Site Management Dashboard is composed from the existing Merkurio UI system and the Figma
account/editor patterns:

- project context bar;
- site switcher;
- project site list;
- site overview;
- site-local tabs;
- site pages list;
- site settings form;
- site publication form/status;
- confirmation dialogs for default/archive actions.

RBAC is reflected in the UI:

- `OWNER` and `ADMIN` can create, rename, change slug, set default, and archive Sites;
- `EDITOR` can work with Site pages but cannot manage Sites;
- `VIEWER` and read-only roles see disabled/read-only management surfaces.

## Consequences

- Site pages, settings, and publication settings are isolated by the selected `siteId`.
- The user can keep several Sites inside one Project and switch between them without moving page
  state across Sites.
- Compatibility project-level routes remain as redirects instead of a second ownership model.
- Editor unpublish/history/rollback remain on compatibility publish APIs until explicit
  site-scoped command routes are introduced.

## Follow-Up

MERCURIO-004 should add template selection and starter Site/Page instantiation.

MERCURIO-005 should add explicit site-scoped publish command routes for unpublish, history, and
rollback, and decide whether publication is page-level only or also has a whole-site deployment
state.
