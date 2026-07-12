# ADR-011: Page Structure and Global Regions

## Status

Accepted

## Context

The editor must support long pages built from an arbitrary ordered list of sections while keeping draft editing separate from published storefront snapshots. The platform also needs a foundation for one global header and footer per project without adding the Theme Engine, typography controls, animations, component builder or advanced responsive overrides.

## Decision

A page is an ordered array of sections inside `PageDocument.root.children`. Page length is derived from the number and content of sections; there is no separate fixed `pageLength` property.

Sections keep stable identifiers and are ordered by array position. A section has:

- `id`;
- structural `type="section"`;
- user-facing `name`;
- `isHidden`;
- `props` for layout;
- `children` for content;
- `metadata`.

The MVP limit is 64 sections per page. Section names are trimmed and limited to 80 characters. Empty sections are valid. Deleting the final section is allowed because an empty page document is already valid.

Legacy V1 documents still migrate into one deterministic V2 section. Legacy V2 sections that do not contain `name`, `isHidden` or `metadata` normalize with defaults on read/validation.

Supported draft section operations are add at end, insert before/after, duplicate, delete, hide/show, rename, move up/down and reorder by the complete ordered section id list. Reorder must include every section exactly once. Duplicate performs a deep copy and creates new ids for the section and nested columns/blocks.

Hidden sections remain in draft and snapshots but are omitted by non-editor rendering. Editor rendering keeps them visible and visually muted so they can be selected and restored.

Header and footer are global project-level regions stored in `ProjectSiteSettings`. Page content must not duplicate header/footer. Page-level overrides are deferred.

Publishing stores current global regions in `PublishedPageSnapshot.siteSettingsJson`. Storefront rendering uses snapshot settings, then visible ordered sections, then snapshot footer. Older snapshots without `siteSettingsJson` use a deterministic fallback based on project name.

## Access Rules

Authenticated section and site-settings mutations are tenant-scoped. OWNER, ADMIN and EDITOR can edit through existing page/project update permissions. VIEWER and STORE_MANAGER can read but cannot mutate these resources. Cross-tenant access returns not found.

Audit log actions are stable and do not store full section content:

- `PAGE_SECTION_ADDED`;
- `PAGE_SECTION_DUPLICATED`;
- `PAGE_SECTION_RENAMED`;
- `PAGE_SECTION_HIDDEN`;
- `PAGE_SECTION_SHOWN`;
- `PAGE_SECTION_DELETED`;
- `PAGE_SECTION_REORDERED`;
- `SITE_HEADER_UPDATED`;
- `SITE_FOOTER_UPDATED`;
- `SITE_HEADER_TOGGLED`;
- `SITE_FOOTER_TOGGLED`.

Stable section/global-region errors are:

- `PAGE_SECTION_NOT_FOUND`;
- `PAGE_SECTION_LIMIT_REACHED`;
- `PAGE_SECTION_NAME_INVALID`;
- `PAGE_SECTION_ORDER_INVALID`;
- `PAGE_SECTION_DUPLICATION_FAILED`;
- `PAGE_GLOBAL_REGION_INVALID`.

## Consequences

Long pages do not need artificial canvas height limits. The dashboard editor can offer a independently scrollable section navigator and keep normal document flow in the canvas.

Header/footer changes are draft settings until a page is published. A changed site-settings revision makes publication status deterministic and avoids draft changes leaking into the storefront.

## Non-Goals

- Theme Engine v1.
- Light/dark themes.
- Font selection or Google Fonts.
- Custom button styles.
- Component builder.
- Horizontal page flow.
- Animations.
- Mega menu, nested menu or multilingual navigation.
- Header/footer visual builder.
- Template marketplace or AI generation.

## Next Milestones

- Theme Engine v1.
- Design controls.
- Guided workflow.
- Section templates.
