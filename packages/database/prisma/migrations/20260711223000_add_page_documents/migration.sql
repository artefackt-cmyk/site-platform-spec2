-- CreateTable
CREATE TABLE "page_documents" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "schema_version" INTEGER NOT NULL,
    "document" JSONB NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "page_documents_page_id_key" ON "page_documents"("page_id");

-- CreateIndex
CREATE INDEX "page_documents_organization_id_project_id_page_id_idx" ON "page_documents"("organization_id", "project_id", "page_id");

-- AddForeignKey
ALTER TABLE "page_documents" ADD CONSTRAINT "page_documents_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_documents" ADD CONSTRAINT "page_documents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_documents" ADD CONSTRAINT "page_documents_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "site_pages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
