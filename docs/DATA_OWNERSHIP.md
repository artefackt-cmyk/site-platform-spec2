# Data Ownership

## Purpose

This document records the first data ownership rules implemented by the database and domain foundation. It covers only `User`, `Organization`, `Membership`, `Project` and `AuditLog`.

It does not add authentication, sessions, HTTP CRUD endpoints, dashboard UI, editor, commerce, integrations, Redis, S3, queues or billing.

## Tenant Boundary

`Organization` is the top-level tenant boundary.

`User` is a global identity entity. A user can belong to multiple organizations through `Membership`.

`Membership` assigns one organization-level role to one user inside one organization. The pair `userId + organizationId` is unique.

`Project` always belongs to one organization. Project slugs are unique only inside their organization, so two organizations may use the same project slug.

## Tenant-Aware Access

Tenant-scoped data must not be queried by `id` alone.

Project access must include either:

- explicit `organizationId`;
- `TenantContext`.

`ProjectRepository` must not expose a public `findById(id)` method. Cross-tenant project access returns `null` so the application can respond with `not found` without leaking another tenant's data.

## Soft Delete

`Organization` and `Project` use `deletedAt` for soft delete.

Normal repository queries exclude soft-deleted organizations and projects.

Hard delete is not part of normal application behavior and requires a future explicit operational decision.

## Audit Log

`AuditLog` belongs to one organization.

`actorUserId` is nullable so system actions and future maintenance workflows can still be recorded.

Audit log records are append-only. The repository layer exposes only create/read methods and must not provide normal update/delete methods for audit records.

## Current Foundation Scope

Implemented foundation models:

- `User`;
- `Organization`;
- `Membership`;
- `Project`;
- `AuditLog`.

Deferred models remain out of scope:

- site and page models;
- editor documents;
- commerce records;
- integration credentials and sync state;
- billing records;
- authentication and session records.
