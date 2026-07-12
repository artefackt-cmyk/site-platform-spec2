ALTER TABLE "users" ADD COLUMN "onboarding_completed_at" TIMESTAMP(3);

CREATE TABLE "auth_sessions" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "last_seen_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revoked_at" TIMESTAMP(3),
  "user_agent" TEXT,
  "ip_address" TEXT,
  CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "password_credentials" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "password_changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "password_credentials_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "password_reset_tokens" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "used_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "auth_sessions_token_hash_key" ON "auth_sessions"("token_hash");
CREATE INDEX "auth_sessions_user_id_idx" ON "auth_sessions"("user_id");
CREATE INDEX "auth_sessions_expires_at_idx" ON "auth_sessions"("expires_at");
CREATE INDEX "auth_sessions_revoked_at_idx" ON "auth_sessions"("revoked_at");

CREATE UNIQUE INDEX "password_credentials_user_id_key" ON "password_credentials"("user_id");

CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");
CREATE INDEX "password_reset_tokens_expires_at_idx" ON "password_reset_tokens"("expires_at");

ALTER TABLE "auth_sessions"
  ADD CONSTRAINT "auth_sessions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "password_credentials"
  ADD CONSTRAINT "password_credentials_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "password_reset_tokens"
  ADD CONSTRAINT "password_reset_tokens_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
