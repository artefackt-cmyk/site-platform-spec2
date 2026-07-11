# AGENTS.md

## Project Goal

Build a SaaS platform for Russian small brands and service companies that combines a professional block-based website builder with commerce, payments, delivery, order management, and strong МойСклад integration.

## Primary User

The primary user is a business owner, assistant, project manager, or store manager without design or programming experience.

## Architecture

- Use a modular monolith for the MVP.
- Do not introduce microservices unless an ADR explicitly approves it.
- Use one shared renderer for editor preview and published storefronts.
- Store pages as versioned JSON documents.
- Keep business logic outside React components.
- Use adapter interfaces for all external integrations.
- All tenant-owned records must include organizationId and/or projectId.
- Every query and mutation must enforce tenant isolation.

## Preferred Stack

- TypeScript
- pnpm
- Turborepo
- Next.js
- React
- NestJS
- PostgreSQL
- Prisma
- Redis
- S3-compatible object storage
- Zod
- TanStack Query
- Zustand
- dnd-kit
- Vitest
- Testing Library
- Playwright
- Docker Compose
- GitHub Actions

Do not change the stack without explicit approval.

## Repository Structure

- apps/dashboard — admin UI and editor
- apps/storefront — public storefront
- apps/api — modular monolith backend
- apps/worker — background jobs
- packages/ui — design system
- packages/editor-core — page schema and editor logic
- packages/renderer — shared page renderer
- packages/block-library — block definitions
- packages/domain — shared domain types
- packages/database — Prisma and repositories
- packages/integrations — provider contracts and adapters
- packages/config — shared configuration
- packages/testing — test helpers
- docs — architecture and product documentation

## Coding Rules

- TypeScript strict mode is mandatory.
- Avoid `any`.
- Validate all external input.
- Keep domain logic in services or domain modules.
- Database access must go through repositories.
- Public APIs must be documented.
- Breaking API changes require an ADR and migration plan.
- New dependencies require justification.
- Do not perform unrelated refactors in feature tasks.
- Never commit secrets.
- Use structured errors with stable error codes.
- Use idempotency for payments, webhooks, and order creation.

## Testing Rules

Every new feature must include relevant tests:

- unit tests for domain logic;
- integration tests for API and database behavior;
- tenant isolation tests;
- end-to-end tests for critical user journeys;
- webhook and retry tests for integrations.

## Required Checks

Before completing a task, run:

- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm build

Run Playwright tests when the task affects a critical user journey.

## Security Rules

- Encrypt integration credentials at rest.
- Verify webhook signatures.
- Enforce authorization on every operation.
- Do not expose internal IDs where public tokens are more appropriate.
- Use expiring signed URLs for digital downloads.
- Maintain audit logs for sensitive operations.

## Task Completion Format

At the end of each task, report:

1. What was implemented.
2. Files changed.
3. Database migrations created.
4. Tests added and run.
5. Commands executed.
6. Known limitations.
7. Suggested next task.
