-- CreateEnum
CREATE TYPE "SitePageStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "site_pages" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "SitePageStatus" NOT NULL DEFAULT 'DRAFT',
    "is_home" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "site_pages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "site_pages_organization_id_project_id_idx" ON "site_pages"("organization_id", "project_id");

-- CreateIndex
CREATE INDEX "site_pages_project_id_idx" ON "site_pages"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "site_pages_project_id_slug_key" ON "site_pages"("project_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "site_pages_project_id_active_home_key" ON "site_pages"("project_id") WHERE "is_home" = true AND "deleted_at" IS NULL;

-- AddForeignKey
ALTER TABLE "site_pages" ADD CONSTRAINT "site_pages_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_pages" ADD CONSTRAINT "site_pages_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
