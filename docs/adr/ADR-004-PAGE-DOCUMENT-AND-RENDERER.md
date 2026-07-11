# ADR-004: Page Document and Renderer

## Status

Accepted

## Context

The project workspace now has page metadata and a placeholder editor route. The next MVP step needs a first editable page document while keeping the platform inside the modular monolith and avoiding premature publication, storefront rendering or complex editor features.

## Decision

Pages store editable content as a versioned JSON document.

`SitePage` remains the metadata record for a page: title, slug, status, home-page flag and tenant ownership fields.

Page content is stored in a separate `PageDocument` model. `PageDocument` contains the current draft document for one `SitePage`.

`PageNode` is not a separate database table. Nodes and blocks are embedded inside the JSON document.

`schemaVersion` is required and is currently fixed to `1`.

The current document is the draft document. A published snapshot is intentionally not implemented in this step.

Editor, preview and the future storefront will use one shared renderer from `packages/renderer`.

The editor saves the whole JSON document on explicit save. Autosave, partial document patches and collaborative editing are deferred.

JSON schema migrations will be added later when a new schema version is introduced.

The implementation remains part of the modular monolith. Do not introduce microservices.

Zustand is not introduced in this step. Editor state is kept in a small local reducer/model for the dashboard editor, while document operations live in `packages/editor-core`.

## Consequences

- Page content can evolve independently from page metadata.
- Tenant isolation remains explicit through `organizationId`, `projectId` and `pageId`.
- Optimistic concurrency can be implemented with `revision` on `PageDocument`.
- The renderer can be reused by editor preview and future storefront paths without depending on database or API code.
- Future schema migrations need explicit migration helpers for JSON documents.

## Non-Goals

- Published page snapshots.
- Storefront rendering.
- Drag-and-drop editing.
- Autosave.
- Undo/redo.
- Collaborative editing.
- Microservices.
