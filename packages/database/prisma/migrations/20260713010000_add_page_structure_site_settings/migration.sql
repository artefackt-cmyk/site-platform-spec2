CREATE TABLE "project_site_settings" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "header_draft" JSONB NOT NULL,
  "footer_draft" JSONB NOT NULL,
  "header_enabled" BOOLEAN NOT NULL DEFAULT true,
  "footer_enabled" BOOLEAN NOT NULL DEFAULT true,
  "revision" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "project_site_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "project_site_settings_project_id_key" ON "project_site_settings"("project_id");
CREATE INDEX "project_site_settings_organization_id_idx" ON "project_site_settings"("organization_id");

ALTER TABLE "project_site_settings"
  ADD CONSTRAINT "project_site_settings_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "project_site_settings"
  ADD CONSTRAINT "project_site_settings_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "projects"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "published_page_snapshots"
  ADD COLUMN "site_settings_json" JSONB;
