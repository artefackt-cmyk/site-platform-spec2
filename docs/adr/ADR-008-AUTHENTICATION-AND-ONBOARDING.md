# ADR-008: Authentication And Onboarding Foundation

## Status

Accepted.

## Context

Mercurio previously used `DEV_USER_EMAIL` as a development-only identity for the dashboard. That was useful for early tenant model work, but production needs real user authentication without weakening the existing model:

- `User` is global;
- `Organization` is the tenant boundary;
- `Membership` controls access;
- `Project` belongs to `Organization`.

## Decision

Authentication uses email and password. Passwords are hashed with Argon2id. Password hashes are stored only in `PasswordCredential`, never returned in DTOs and never logged.

Sessions are server-side. The browser receives only an HttpOnly cookie named by `AUTH_SESSION_COOKIE_NAME` (`mercurio_session` by default). The cookie contains only a random opaque session token. It does not contain user identity, organization ids, roles or permissions.

The API hashes the raw session token with SHA-256 and stores only `AuthSession.tokenHash`. Session lookup always goes through the API/database. `logout` revokes the current session. Password reset completion revokes all existing sessions for the user and creates a new session so the user can continue after a successful password change.

Session tokens are rotated on login/register/password reset completion by creating a fresh session token and cookie. Sessions expire after `AUTH_SESSION_TTL_DAYS`; expired sessions are rejected and revoked when seen. `lastSeenAt` is updated with throttling to avoid a write on every request.

Cookies:

- development: `HttpOnly`, `SameSite=Lax`, `Secure=false`, `Path=/`;
- production: `HttpOnly`, `SameSite=Lax`, `Secure=true`, `Path=/`, bounded `Max-Age`.

`SameSite=Lax` is chosen because dashboard/API are same-site in local development and it preserves normal top-level navigation while reducing cross-site request risk. Auth tokens are not stored in `localStorage`, JWTs are not used for browser auth, and `document.cookie` is not used.

CSRF MVP strategy combines SameSite cookies with trusted `Origin` validation for state-changing requests. The API allows configured `DASHBOARD_ORIGIN`, `STOREFRONT_ORIGIN` and `AUTH_APP_ORIGIN`, and rejects invalid origins with `AUTH_CSRF_INVALID`. This is a foundation; a future ADR may add explicit double-submit CSRF tokens if dashboard/API are deployed across more complex origins.

Onboarding state is stored as `User.onboardingCompletedAt`. A separate `UserOnboarding` model is intentionally not added yet because the first onboarding is linear and only needs complete/incomplete state. If Mercurio later needs resumable multi-step onboarding, this field can become the completion marker for a richer model.

Password reset foundation creates hashed reset tokens in `PasswordResetToken`. Public responses are generic and do not reveal whether an email exists. Development may return the raw token only when `AUTH_EXPOSE_DEV_RESET_TOKEN=true`. Production email delivery is intentionally not implemented yet.

`DEV_USER_EMAIL` remains only as an explicit development fallback behind `AUTH_ALLOW_DEV_IDENTITY=true`. It is false by default and forbidden in production.

## Routes

Public:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/password-reset/request`
- `POST /api/auth/password-reset/confirm`
- `GET /health`
- `GET /health/database`
- `GET /api/public/*`

Authenticated:

- `POST /api/auth/logout`
- `GET /api/auth/session`
- `POST /api/auth/onboarding/complete`
- dashboard admin APIs such as `/api/me`, `/api/projects/*`, media, products and publication admin routes.

## Consequences

The tenant model remains unchanged. Existing admin services continue to resolve a `TenantContext`, but identity now comes from an active session. Rate limiting starts with an in-memory adapter for login/register/password-reset request; production must replace it with a distributed store before horizontal scaling.
