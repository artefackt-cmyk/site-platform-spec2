# RBAC Matrix

## Purpose

This document defines the initial organization-level role model and stable permission identifiers for the MVP foundation.

It is a product and architecture contract only. It does not add authentication, authorization middleware, API routes, UI, Prisma models or commerce entities.

## Roles

| Role | Meaning |
| --- | --- |
| `OWNER` | Organization owner with all current permissions. |
| `ADMIN` | Operational administrator without ownership transfer or billing ownership powers. |
| `EDITOR` | Content and project editor without membership management or project deletion. |
| `STORE_MANAGER` | Store operations role for future commerce workflows; minimal current access. |
| `VIEWER` | Read-only role. |

## Stable Permission Identifiers

| Permission | Meaning |
| --- | --- |
| `organization.read` | Read organization profile and settings visible to members. |
| `organization.update` | Update organization settings. |
| `membership.read` | View organization members and their roles. |
| `membership.manage` | Invite, update or remove organization members within role limits. |
| `project.read` | View projects in the organization. |
| `project.create` | Create projects in the organization. |
| `project.update` | Update project settings only. |
| `project.delete` | Soft-delete projects. |
| `content.read` | View project content, including pages, blocks, text and images. |
| `content.update` | Change project content, including pages, blocks, text and images. |
| `design.update` | Change project visual design and structural layout. |
| `audit.read` | View organization audit log. |
| `integration.manage` | Connect, configure or disconnect organization/project integrations. |

## Permission Matrix

| Permission | OWNER | ADMIN | EDITOR | STORE_MANAGER | VIEWER |
| --- | --- | --- | --- | --- | --- |
| `organization.read` | Yes | Yes | Yes | Yes | Yes |
| `organization.update` | Yes | Yes | No | No | No |
| `membership.read` | Yes | Yes | No | No | No |
| `membership.manage` | Yes | Yes* | No | No | No |
| `project.read` | Yes | Yes | Yes | Yes | Yes |
| `project.create` | Yes | Yes | No | No | No |
| `project.update` | Yes | Yes | No | No | No |
| `project.delete` | Yes | Yes | No | No | No |
| `content.read` | Yes | Yes | Yes | Yes | Yes |
| `content.update` | Yes | Yes | Yes | No | No |
| `design.update` | Yes | Yes | Yes | No | No |
| `audit.read` | Yes | Yes | No | No | No |
| `integration.manage` | Yes | Yes | No | No | No |

`Yes*`: `ADMIN` may manage members except removing or demoting the last `OWNER`, transferring ownership, or granting powers beyond the admin's own authority.

## Role Notes

### OWNER

`OWNER` has all current permissions.

Ownership transfer is intentionally not represented by a permission in this matrix. It requires a later explicit product decision.

### ADMIN

`ADMIN` has all listed current permissions: organization updates, member management within role limits, project management, content and design updates, integrations and audit log access.

`ADMIN` cannot remove an `OWNER`, demote the last `OWNER`, transfer ownership, or take billing ownership actions unless a later ADR adds those permissions.

### EDITOR

`EDITOR` can read the organization and projects, view content, update content and change project design through `organization.read`, `project.read`, `content.read`, `content.update` and `design.update`.

`EDITOR` cannot update project settings, delete projects, manage members, manage integrations, read audit logs or update organization settings.

### STORE_MANAGER

`STORE_MANAGER` currently has `organization.read`, `project.read` and `content.read` only.

Future commerce permissions should be added separately, for example:

- `commerce.product.read`;
- `commerce.inventory.read`;
- `commerce.order.read`;
- `commerce.order.update`;
- `commerce.customer.read`;
- `commerce.sync.run`.

Those commerce permissions are intentionally not part of the current stable permission set because commerce models and workflows are not implemented yet.

`STORE_MANAGER` must not update project settings, edit project content, edit project design, update organization settings, manage memberships or manage integrations through the current permissions.

### VIEWER

`VIEWER` is read-only.

In the current permission set, `VIEWER` may read organization-level information, projects and project content, but cannot perform mutations, manage members, manage integrations or read audit log.

## Enforcement Rules

Permissions are evaluated through `Membership` inside one `Organization`.

Project access must also satisfy the tenancy rules from `ADR-003`: the project must belong to the active organization, and project-scoped reads or writes must include `organizationId` or `TenantContext`.

Cross-tenant access must return `not found`.

Role checks must never bypass tenant isolation.

## Open Decisions

- Billing ownership permissions are not defined yet.
- Ownership transfer is not defined yet.
- Future commerce permissions are named as candidates only, not accepted stable permissions.
- Whether `STORE_MANAGER` should later receive limited integration sync permissions is deferred until commerce and МойСклад workflows are specified.
