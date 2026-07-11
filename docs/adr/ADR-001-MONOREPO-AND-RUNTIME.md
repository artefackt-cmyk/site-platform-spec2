# ADR-001: Monorepo and Runtime Foundation

## Status

Accepted

## Context

The MVP must start as a modular monolith with a single TypeScript stack. The current task requires a minimal runnable technical skeleton without product logic, database, authentication, editor, commerce, queues or real integrations.

## Decision

Use pnpm workspaces for package management and Turborepo for workspace task orchestration.

Use one TypeScript stack with strict mode enabled through the shared `tsconfig.base.json`.

Use Next.js App Router for both frontend applications:

- `apps/dashboard`
- `apps/storefront`

Use NestJS for the backend API application:

- `apps/api`

Keep a separate Node.js/TypeScript worker application:

- `apps/worker`

The worker remains part of the same monorepo and runtime foundation. It is not a separate service boundary for the MVP architecture decision.

Do not introduce microservices. The API and worker are separate applications in the same modular monolith codebase, not independently owned or independently deployed bounded systems.

## Consequences

- A small team can develop the platform with one language, one package manager and consistent checks.
- Codex can operate over a predictable workspace structure.
- Product modules can later be added inside the same monorepo without changing the runtime foundation.
- Infrastructure such as PostgreSQL, Redis, S3-compatible storage, queues and real integrations is intentionally deferred.

