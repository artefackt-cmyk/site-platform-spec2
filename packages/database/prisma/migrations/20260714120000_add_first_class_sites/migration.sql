-- First-class Site domain kernel.
-- Existing project-owned rows are backfilled to one deterministic default Site
-- per Project; sections remain inside page_documents.document JSON.

CREATE TYPE "SiteStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

CREATE TABLE "sites" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "SiteStatus" NOT NULL DEFAULT 'ACTIVE',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- Deterministic ids keep the migration readable and avoid random backfill data.
INSERT INTO "sites" (
    "id",
    "organization_id",
    "project_id",
    "name",
    "slug",
    "status",
    "is_default",
    "created_at",
    "updated_at"
)
SELECT
    'site_' || "projects"."id",
    "projects"."organization_id",
    "projects"."id",
    COALESCE(NULLIF("projects"."name", ''), 'Основной сайт'),
    "projects"."slug",
    'ACTIVE'::"SiteStatus",
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "projects";

ALTER TABLE "site_pages" ADD COLUMN "site_id" TEXT;
ALTER TABLE "page_documents" ADD COLUMN "site_id" TEXT;
ALTER TABLE "project_publication_settings" ADD COLUMN "site_id" TEXT;
ALTER TABLE "project_site_settings" ADD COLUMN "site_id" TEXT;
ALTER TABLE "published_page_snapshots" ADD COLUMN "site_id" TEXT;
ALTER TABLE "published_page_states" ADD COLUMN "site_id" TEXT;

UPDATE "site_pages"
SET "site_id" = "sites"."id"
FROM "sites"
WHERE "site_pages"."project_id" = "sites"."project_id"
  AND "sites"."is_default" = true
  AND "site_pages"."site_id" IS NULL;

UPDATE "page_documents"
SET "site_id" = "site_pages"."site_id"
FROM "site_pages"
WHERE "page_documents"."page_id" = "site_pages"."id"
  AND "page_documents"."site_id" IS NULL;

UPDATE "project_publication_settings"
SET "site_id" = "sites"."id"
FROM "sites"
WHERE "project_publication_settings"."project_id" = "sites"."project_id"
  AND "sites"."is_default" = true
  AND "project_publication_settings"."site_id" IS NULL;

UPDATE "project_site_settings"
SET "site_id" = "sites"."id"
FROM "sites"
WHERE "project_site_settings"."project_id" = "sites"."project_id"
  AND "sites"."is_default" = true
  AND "project_site_settings"."site_id" IS NULL;

UPDATE "published_page_snapshots"
SET "site_id" = "site_pages"."site_id"
FROM "site_pages"
WHERE "published_page_snapshots"."page_id" = "site_pages"."id"
  AND "published_page_snapshots"."site_id" IS NULL;

UPDATE "published_page_states"
SET "site_id" = "site_pages"."site_id"
FROM "site_pages"
WHERE "published_page_states"."page_id" = "site_pages"."id"
  AND "published_page_states"."site_id" IS NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "site_pages" WHERE "site_id" IS NULL) THEN
    RAISE EXCEPTION 'site_pages.site_id backfill failed';
  END IF;
  IF EXISTS (SELECT 1 FROM "page_documents" WHERE "site_id" IS NULL) THEN
    RAISE EXCEPTION 'page_documents.site_id backfill failed';
  END IF;
  IF EXISTS (SELECT 1 FROM "project_publication_settings" WHERE "site_id" IS NULL) THEN
    RAISE EXCEPTION 'project_publication_settings.site_id backfill failed';
  END IF;
  IF EXISTS (SELECT 1 FROM "project_site_settings" WHERE "site_id" IS NULL) THEN
    RAISE EXCEPTION 'project_site_settings.site_id backfill failed';
  END IF;
  IF EXISTS (SELECT 1 FROM "published_page_snapshots" WHERE "site_id" IS NULL) THEN
    RAISE EXCEPTION 'published_page_snapshots.site_id backfill failed';
  END IF;
  IF EXISTS (SELECT 1 FROM "published_page_states" WHERE "site_id" IS NULL) THEN
    RAISE EXCEPTION 'published_page_states.site_id backfill failed';
  END IF;
END $$;

ALTER TABLE "site_pages" ALTER COLUMN "site_id" SET NOT NULL;
ALTER TABLE "page_documents" ALTER COLUMN "site_id" SET NOT NULL;
ALTER TABLE "project_publication_settings" ALTER COLUMN "site_id" SET NOT NULL;
ALTER TABLE "project_site_settings" ALTER COLUMN "site_id" SET NOT NULL;
ALTER TABLE "published_page_snapshots" ALTER COLUMN "site_id" SET NOT NULL;
ALTER TABLE "published_page_states" ALTER COLUMN "site_id" SET NOT NULL;

DROP INDEX IF EXISTS "site_pages_project_id_slug_key";
DROP INDEX IF EXISTS "site_pages_project_id_active_home_key";
DROP INDEX IF EXISTS "project_publication_settings_project_id_key";
DROP INDEX IF EXISTS "project_site_settings_project_id_key";
DROP INDEX IF EXISTS "published_page_snapshots_project_id_page_slug_idx";

CREATE UNIQUE INDEX "sites_project_id_slug_key" ON "sites"("project_id", "slug");
CREATE UNIQUE INDEX "sites_project_id_active_default_key"
ON "sites"("project_id")
WHERE "is_default" = true AND "status" = 'ACTIVE';
CREATE INDEX "sites_organization_id_idx" ON "sites"("organization_id");
CREATE INDEX "sites_project_id_idx" ON "sites"("project_id");
CREATE INDEX "sites_project_id_status_idx" ON "sites"("project_id", "status");

CREATE UNIQUE INDEX "site_pages_site_id_slug_key" ON "site_pages"("site_id", "slug");
CREATE UNIQUE INDEX "site_pages_site_id_active_home_key"
ON "site_pages"("site_id")
WHERE "is_home" = true AND "deleted_at" IS NULL;
CREATE INDEX "site_pages_organization_id_project_id_site_id_idx"
ON "site_pages"("organization_id", "project_id", "site_id");
CREATE INDEX "site_pages_site_id_idx" ON "site_pages"("site_id");

CREATE UNIQUE INDEX "project_publication_settings_site_id_key"
ON "project_publication_settings"("site_id");
CREATE INDEX "project_publication_settings_project_id_idx"
ON "project_publication_settings"("project_id");

CREATE UNIQUE INDEX "project_site_settings_site_id_key"
ON "project_site_settings"("site_id");
CREATE INDEX "project_site_settings_project_id_idx"
ON "project_site_settings"("project_id");

CREATE INDEX "published_page_snapshots_site_id_idx"
ON "published_page_snapshots"("site_id");
CREATE INDEX "published_page_snapshots_site_id_page_slug_idx"
ON "published_page_snapshots"("site_id", "page_slug");
CREATE INDEX "published_page_states_site_id_idx"
ON "published_page_states"("site_id");

ALTER TABLE "sites"
ADD CONSTRAINT "sites_organization_id_fkey"
FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "sites"
ADD CONSTRAINT "sites_project_id_fkey"
FOREIGN KEY ("project_id") REFERENCES "projects"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "site_pages"
ADD CONSTRAINT "site_pages_site_id_fkey"
FOREIGN KEY ("site_id") REFERENCES "sites"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "page_documents"
ADD CONSTRAINT "page_documents_site_id_fkey"
FOREIGN KEY ("site_id") REFERENCES "sites"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "project_publication_settings"
ADD CONSTRAINT "project_publication_settings_site_id_fkey"
FOREIGN KEY ("site_id") REFERENCES "sites"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "project_site_settings"
ADD CONSTRAINT "project_site_settings_site_id_fkey"
FOREIGN KEY ("site_id") REFERENCES "sites"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "published_page_snapshots"
ADD CONSTRAINT "published_page_snapshots_site_id_fkey"
FOREIGN KEY ("site_id") REFERENCES "sites"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "published_page_states"
ADD CONSTRAINT "published_page_states_site_id_fkey"
FOREIGN KEY ("site_id") REFERENCES "sites"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
