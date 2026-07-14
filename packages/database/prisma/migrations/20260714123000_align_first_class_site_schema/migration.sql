-- Align manual Site kernel SQL with the Prisma datamodel after backfill.

DROP INDEX IF EXISTS "page_documents_organization_id_project_id_page_id_idx";
DROP INDEX IF EXISTS "site_pages_organization_id_project_id_idx";

ALTER TABLE "sites" ALTER COLUMN "updated_at" DROP DEFAULT;

CREATE INDEX IF NOT EXISTS "page_documents_organization_id_project_id_site_id_page_id_idx"
ON "page_documents"("organization_id", "project_id", "site_id", "page_id");
