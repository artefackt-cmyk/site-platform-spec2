# ADR-004: Page Document and Renderer

## Status

Accepted

## Context

The project workspace now has page metadata, a saved draft page document, a dashboard editor and preview route. The first flat document schema was enough for a smoke editor, but it cannot represent real site structure such as sections, columns or images.

The next MVP step needs nested page content while keeping the platform inside the modular monolith and avoiding uploads, drag-and-drop, publication, storefront rendering or complex editor features.

## Decision

Pages store editable content as a versioned JSON document.

`SitePage` remains the metadata record for a page: title, slug, status, home-page flag and tenant ownership fields.

Page content is stored in a separate `PageDocument` model. `PageDocument` contains the current draft document for one `SitePage`.

`PageNode` is not a separate database table. Nodes and blocks are embedded inside the JSON document.

`schemaVersion` is required. The current write schema is `2`.

PageDocument V2 supports nested nodes:

- `root` contains only `SectionNode`;
- `SectionNode` can contain leaf `BlockNode` children for `layout="single"`;
- `SectionNode` can contain exactly two `ColumnNode` children for `layout="two-columns"`;
- `ColumnNode` can contain only leaf blocks;
- leaf blocks are `heading`, `text`, `button`, `spacer` and `image`;
- maximum tree depth is fixed and validated by `packages/editor-core`;
- duplicate ids are rejected across the whole tree.

`ImageBlock` stores either an external `http` or `https` URL, or a project media-library reference. Empty `src` is valid for a draft placeholder. Non-empty `src` must not use `data:` or `javascript:` and must have non-empty `alt`. When `assetId` is present, the API validates that the media asset belongs to the same project. S3 and server-side remote fetching are deferred.

The current document is the draft document. A published snapshot is intentionally not implemented in this step.

Editor, preview and the future storefront will use one shared renderer from `packages/renderer`.

The editor saves the whole JSON document on explicit save. Autosave, partial document patches and collaborative editing are deferred.

Existing V1 documents remain readable. Reads migrate V1 to V2 in memory through explicit JSON schema migration helpers. The migration wraps the flat V1 blocks in one deterministic single-column section and preserves existing block ids. Repository reads do not rewrite old rows automatically; the next explicit save stores the document as V2.

Database migrations and JSON schema migrations are separate concerns. No Prisma migration is required for V1 to V2 because the `PageDocument.document` JSON column and `schemaVersion` integer already exist.

The implementation remains part of the modular monolith. Do not introduce microservices.

Zustand is not introduced in this step. Editor state is kept in a small local reducer/model for the dashboard editor, while document operations live in `packages/editor-core`.

## Consequences

- Page content can evolve independently from page metadata.
- Tenant isolation remains explicit through `organizationId`, `projectId` and `pageId`.
- Optimistic concurrency can be implemented with `revision` on `PageDocument`.
- The renderer can be reused by editor preview and future storefront paths without depending on database or API code.
- Old V1 draft documents can still be opened safely and then saved as V2.
- Future schema migrations need explicit migration helpers for JSON documents.

## Non-Goals

- Published page snapshots.
- Storefront rendering.
- Drag-and-drop editing.
- S3-backed uploads.
- Image resizing and optimization.
- Absolute positioning.
- Autosave.
- Undo/redo.
- Collaborative editing.
- Microservices.
