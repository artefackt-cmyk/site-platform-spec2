# ADR-002: Configuration and Database Foundation

## Status

Accepted

## Context

The monorepo needs a minimal local development foundation for typed environment configuration and PostgreSQL access. This step must not introduce product entities, authentication, tenant context, Redis, object storage, queues or real integrations.

## Decision

Use `packages/config` as the single source of environment validation. It owns:

- Zod schema validation;
- fail-fast config loading;
- typed config output;
- safe validation errors that do not expose secret values;
- selection of `TEST_DATABASE_URL` in `NODE_ENV=test`.

Use PostgreSQL as the primary database for the platform.

Use Prisma as the ORM and database client foundation.

Keep development and test databases separate:

- `DATABASE_URL` for development and production-like runtime;
- `TEST_DATABASE_URL` for test runtime.

Business modules must not read `process.env` directly. Environment access is allowed only inside `packages/config` and application/script entrypoints.

Add Docker Compose only for local PostgreSQL. Redis, object storage, queues and other infrastructure are intentionally not part of this step.

The Prisma schema intentionally contains no product models. User, Organization, Membership, Role, Project, AuditLog and all editor, commerce and integration entities remain out of scope.

## Consequences

- Configuration failures happen at startup with typed, safe errors.
- Database access can be tested locally without adding product schema.
- Integration tests can target a dedicated test database.
- Test database reset commands include safety checks before running destructive Prisma commands.
- Future tasks can add product entities through explicit migrations without changing the configuration foundation.

