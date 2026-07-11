# Page Document Schema V1

## Purpose

`PageDocument` stores the editable draft content for one `SitePage`.

Version 1 is legacy. It is still accepted by read-side migration helpers so existing draft documents can be opened safely, but new saves use PageDocument Schema V2.

`SitePage` remains page metadata. It owns title, slug, status, home-page flag and tenant fields. `PageDocument` owns only the structured page content.

## Database Record

`PageDocument` has:

- `id`;
- `organizationId`;
- `projectId`;
- `pageId`;
- `schemaVersion`;
- `document`;
- `revision`;
- `createdAt`;
- `updatedAt`.

There is one current draft document per page through unique `pageId`.

`organizationId`, `projectId` and `pageId` are always used together for tenant-aware access. The repository must not fetch a page document only by `id`.

## JSON Structure

The legacy document schema is:

```ts
type PageDocumentV1 = {
  schemaVersion: 1;
  root: {
    id: string;
    type: "page";
    children: BlockNode[];
  };
};
```

`root.children` can contain zero or more block nodes.

All node ids must be unique inside the document, including the root id.

## Block Types

### Heading

```ts
type HeadingBlock = {
  id: string;
  type: "heading";
  props: {
    text: string;
    level: 1 | 2 | 3;
    align: "left" | "center" | "right";
  };
};
```

### Text

```ts
type TextBlock = {
  id: string;
  type: "text";
  props: {
    text: string;
    align: "left" | "center" | "right";
  };
};
```

### Button

```ts
type ButtonBlock = {
  id: string;
  type: "button";
  props: {
    label: string;
    href: string;
    align: "left" | "center" | "right";
    variant: "primary" | "secondary";
  };
};
```

### Spacer

```ts
type SpacerBlock = {
  id: string;
  type: "spacer";
  props: {
    size: "small" | "medium" | "large";
  };
};
```

## Schema Version

`schemaVersion` is required and must be exactly `1`.

API writes no longer accept V1. Repository reads migrate V1 to V2 in memory and do not rewrite the database row until an explicit save.

Unknown block types, unknown props and wrong prop values are rejected by `packages/editor-core`.

Future schema changes must introduce a new schema version and explicit migration helpers. In-place silent mutation of stored JSON is not part of this version.

The V1 to V2 migration wraps all flat `root.children` blocks in one deterministic single-column section and preserves existing block ids.

## Revision

`revision` is stored on the `PageDocument` database row, not inside the JSON document.

Every successful save increments `revision`. The API requires clients to send the revision they edited. A stale revision returns HTTP 409 with a stable conflict error code.

## Validation

Validation is centralized in `packages/editor-core`.

It checks:

- `schemaVersion` is `1`;
- `root.type` is `page`;
- every block matches the discriminated union;
- required props exist;
- unsupported props are rejected;
- ids are non-empty strings;
- ids are unique inside the document.

The API validates the document before saving. The repository also validates before writing to PostgreSQL.

## Draft And Future Published Snapshot

The current `PageDocument` is the draft document. It is what the dashboard editor reads and saves.

A published snapshot is intentionally not implemented in this version. Future publication work should add a separate persisted snapshot or equivalent versioned publication model without changing the meaning of the current draft document.

## Limitations

Version 1 intentionally excludes:

- nested sections;
- columns;
- absolute positioning;
- responsive block settings;
- image blocks;
- form blocks;
- product blocks;
- custom block code;
- autosave;
- undo/redo;
- collaborative editing;
- storefront rendering;
- publication.
