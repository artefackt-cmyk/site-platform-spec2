# Page Document Schema V2

## Purpose

`PageDocument` stores the editable draft content for one `SitePage`.

Version 2 is the current write schema. It adds real page structure while keeping the MVP bounded to sections, columns, leaf blocks and externally referenced images.

## JSON Structure

```ts
type PageDocumentV2 = {
  schemaVersion: 2;
  root: {
    id: string;
    type: "page";
    children: SectionNode[];
  };
};
```

`root.children` can contain only `SectionNode` objects.

All node ids must be non-empty and unique across the whole document, including the root id.

## Node Types

### SectionNode

```ts
type SectionNode = {
  id: string;
  type: "section";
  props: {
    background: "white" | "muted" | "dark" | "accent";
    paddingY: "small" | "medium" | "large";
    contentWidth: "narrow" | "standard" | "wide";
    layout: "single" | "two-columns";
    columnRatio: "50-50" | "40-60" | "60-40";
    verticalAlign: "start" | "center" | "end";
  };
  children: BlockNode[] | [ColumnNode, ColumnNode];
};
```

For `layout="single"`, `children` contains only leaf blocks.

For `layout="two-columns"`, `children` must contain exactly two `ColumnNode` objects.

### ColumnNode

```ts
type ColumnNode = {
  id: string;
  type: "column";
  props: {
    align: "left" | "center" | "right";
  };
  children: BlockNode[];
};
```

Columns can contain only leaf blocks. A column cannot contain another column or section.

### Leaf Blocks

V2 keeps the V1 leaf blocks:

- `heading`;
- `text`;
- `button`;
- `spacer`.

V2 adds:

```ts
type ImageBlock = {
  id: string;
  type: "image";
  props: {
    src: string;
    alt: string;
    caption?: string;
    aspectRatio: "auto" | "square" | "portrait" | "landscape" | "wide";
    objectFit: "cover" | "contain";
    borderRadius: "none" | "small" | "medium" | "large";
    align: "left" | "center" | "right";
    width: "small" | "medium" | "full";
  };
};
```

`src` can be empty while a draft image is not configured. A non-empty `src` must be an `http` or `https` URL, and `alt` is required. `data:`, `javascript:` and other protocols are rejected. The renderer shows a placeholder for empty or failed image URLs and never fetches images on the server.

## Nesting Rules

- The root can contain only sections.
- A section cannot contain another section.
- A single-column section can contain only leaf blocks.
- A two-column section must contain exactly two columns.
- A column can contain only leaf blocks.
- Unknown node types and unknown props are rejected.
- The maximum tree depth is fixed in `packages/editor-core`.

## Migration From V1

V1 documents are migrated in memory when read.

The migration wraps the flat V1 `root.children` list in one deterministic section:

```ts
{
  id: `${root.id}-section-v2`,
  type: "section",
  props: {
    background: "white",
    paddingY: "medium",
    contentWidth: "standard",
    layout: "single",
    columnRatio: "50-50",
    verticalAlign: "start"
  },
  children: oldRootChildren
}
```

The migration preserves existing block ids and content. It is immutable and deterministic. Running the latest migration on an already V2 document returns the same document.

Invalid V1 documents and unknown future schema versions are rejected with explicit validation errors.

## Database Migration vs JSON Schema Migration

The Prisma `PageDocument` table already stores:

- `schemaVersion`;
- `document` JSON;
- `revision`.

V1 to V2 is a JSON schema migration, not a database table migration. No Prisma migration is needed while the database columns remain unchanged.

Repository reads may return a migrated V2 document without mutating the stored row. The next explicit save writes the V2 JSON and `schemaVersion=2`.
