# ADR-003: Tenancy and Entity Ownership

## Status

Accepted

## Context

The platform is a SaaS product for multiple organizations. The domain model already includes `User`, `Organization`, `Membership`, `Role`, `Project` and `AuditLog`, while the technical foundation requires strict tenant isolation for every query and mutation.

This ADR defines ownership boundaries before product entities, API handlers, repositories, UI flows or Prisma models are added.

## Decision

`Organization` is the top-level tenant boundary.

`User` is a global identity entity. A user is not owned by one organization.

A user may belong to multiple organizations.

Access to an organization is determined through `Membership`. A membership connects one global user to one organization and assigns an organization-level role.

`Project` always belongs to exactly one `Organization`.

Any access to project-scoped data must include either:

- an explicit `organizationId`; or
- a `TenantContext` that contains the active organization and authorization scope.

Tenant-scoped entities must not be fetched, updated or deleted by `id` alone. Repository and service methods must include tenant scope in their lookup contract.

When a tenant-scoped entity belongs to another organization, the platform must return `not found`, not `forbidden`. This avoids leaking that another tenant's entity exists.

`AuditLog` is append-only. Audit records must not be updated or deleted by normal application flows. Corrections must be represented by additional audit records.

`Organization` uses soft delete.

`Project` uses soft delete.

The MVP remains a modular monolith. This decision does not introduce microservices.

## Entity Ownership Rules

| Entity | Ownership | Notes |
| --- | --- | --- |
| `User` | Global | Identity record shared across organizations. |
| `Organization` | Tenant root | Top-level ownership boundary. |
| `Membership` | Organization-scoped | Grants a user access to one organization. |
| `Role` | Organization-scoped or system-defined | Role assignment is evaluated through membership. |
| `Project` | Organization-scoped | Must always reference exactly one organization. |
| `AuditLog` | Organization-scoped | Append-only; may optionally reference project or actor. |
| Project-owned site/editor/content records | Project-scoped | Access must include organization scope or `TenantContext`. |
| Commerce records | Project-scoped unless later ADR says otherwise | Not implemented in this ADR. |
| Integration records | Organization-scoped or project-scoped by provider setup | Must never be accessed without tenant scope. |

## Access Rules

All tenant-scoped reads and writes must include tenant scope.

Allowed lookup shape:

```text
findProject({ organizationId, projectId })
findPage({ tenantContext, projectId, pageId })
```

Disallowed lookup shape:

```text
findProject(projectId)
findPage(pageId)
```

The same rule applies to updates, deletes, publication actions, integration configuration, audit access and future commerce operations.

## Deletion Rules

`Organization` and `Project` use soft delete to protect historical references, audit trails, publications, integration logs and future billing/support workflows.

Soft-deleted organizations and projects must be excluded from normal user-facing queries.

Hard delete is reserved for explicit maintenance or compliance workflows and requires a separate ADR or operational procedure.

## Consequences

- Repository APIs must be tenant-aware from the first product model onward.
- API handlers must derive or receive an active `TenantContext` before accessing organization-scoped or project-scoped data.
- Tests for future product features must include tenant isolation cases.
- Returning `not found` for cross-tenant access becomes part of the security contract.
- Global user identity can support multi-organization access without duplicating users.
- Soft deletion is required for organization and project lifecycle behavior.

## Non-Goals

- This ADR does not add Prisma models.
- This ADR does not implement authentication or authorization.
- This ADR does not define commerce, editor or integration schemas.
- This ADR does not introduce microservices.

