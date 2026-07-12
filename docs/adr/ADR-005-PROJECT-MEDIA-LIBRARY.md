# ADR-005: Project Media Library

## Status

Accepted

## Context

PageDocument V2 supports `ImageBlock`, but external URLs alone are not enough for a practical MVP editor. Users need to upload and reuse project images without introducing production object storage, CDN, image resizing or commerce/media workflows.

The platform is still a modular monolith. Tenant isolation must remain explicit for every media query and mutation.

## Decision

Add a first project-scoped media library.

`MediaAsset` is a database record owned by one `Organization` and one `Project`. It stores metadata only:

- storage key;
- original filename;
- MIME type;
- byte size;
- optional width and height;
- optional alt text;
- creating user;
- timestamps.

Binary file content is stored through a `MediaStorage` adapter interface in `packages/media-storage`.

For local development, `LocalMediaStorage` writes files under `MEDIA_STORAGE_DIR`. API responses expose media through project-scoped API URLs, not by leaking local filesystem paths.

Supported upload types are intentionally limited to:

- `image/jpeg`;
- `image/png`;
- `image/webp`.

The maximum upload size is 10 MB. Upload validation checks both the declared MIME type and the actual file bytes. SVG, GIF, data URLs and server-side remote fetching are not supported.

`ImageBlock.props` may include `assetId`. When an image comes from the media library, the block stores:

- `assetId`;
- `src` as the project-scoped media content API URL;
- `alt`, using the asset alt text when available.

External image URLs remain supported. Setting an external URL clears `assetId`.

The API validates that every `assetId` referenced by a saved PageDocument belongs to the same project and organization. Unknown or cross-project media assets make the document invalid.

Deleting a media asset is allowed only when it is unused by saved PageDocuments and products in the same project. Usage is calculated from PageDocument V2 image asset references and `Product.primaryMediaAssetId`.

Public media serving allows an asset when it is used by an active published page snapshot or by an active product in a published project. This keeps product primary images available even when they are not referenced by a page snapshot.

The implementation stays inside the modular monolith. Do not introduce microservices.

## Consequences

- Editors can upload, browse, reuse and delete unused project images.
- The same `MediaAsset` can be referenced by multiple `ImageBlock` nodes.
- The same `MediaAsset` can be used as a product primary image.
- Tenant isolation is enforced through `TenantContext`, `organizationId` and `projectId`.
- Local filesystem storage is suitable for development only.
- S3-compatible storage can be added later by implementing the same adapter interface.
- Deleting files and database rows cannot be made fully atomic across filesystem and PostgreSQL; the service checks usage first and records an audit log for successful deletes.

## Non-Goals

- S3-compatible storage implementation.
- CDN URLs.
- Image resizing or optimization.
- Image transformations.
- Folders, tags or advanced search.
- Public storefront publishing.
- Commerce media.
- User avatars.
- Virus scanning.
- Microservices.
