CREATE TABLE "project_publication_settings" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "public_handle" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_publication_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "published_page_snapshots" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "page_title" TEXT NOT NULL,
    "page_slug" TEXT NOT NULL,
    "document_json" JSONB NOT NULL,
    "source_revision" INTEGER NOT NULL,
    "rollback_source_snapshot_id" TEXT,
    "published_by_user_id" TEXT NOT NULL,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "published_page_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "published_page_states" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "active_snapshot_id" TEXT,
    "published_at" TIMESTAMP(3),
    "unpublished_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "published_page_states_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "project_publication_settings_project_id_key" ON "project_publication_settings"("project_id");
CREATE UNIQUE INDEX "project_publication_settings_public_handle_key" ON "project_publication_settings"("public_handle");
CREATE INDEX "project_publication_settings_organization_id_idx" ON "project_publication_settings"("organization_id");

CREATE UNIQUE INDEX "published_page_snapshots_page_id_version_key" ON "published_page_snapshots"("page_id", "version");
CREATE INDEX "published_page_snapshots_organization_id_idx" ON "published_page_snapshots"("organization_id");
CREATE INDEX "published_page_snapshots_project_id_idx" ON "published_page_snapshots"("project_id");
CREATE INDEX "published_page_snapshots_page_id_idx" ON "published_page_snapshots"("page_id");
CREATE INDEX "published_page_snapshots_project_id_page_slug_idx" ON "published_page_snapshots"("project_id", "page_slug");
CREATE INDEX "published_page_snapshots_published_at_idx" ON "published_page_snapshots"("published_at");

CREATE UNIQUE INDEX "published_page_states_page_id_key" ON "published_page_states"("page_id");
CREATE INDEX "published_page_states_organization_id_idx" ON "published_page_states"("organization_id");
CREATE INDEX "published_page_states_project_id_idx" ON "published_page_states"("project_id");
CREATE INDEX "published_page_states_active_snapshot_id_idx" ON "published_page_states"("active_snapshot_id");

ALTER TABLE "project_publication_settings" ADD CONSTRAINT "project_publication_settings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "project_publication_settings" ADD CONSTRAINT "project_publication_settings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "published_page_snapshots" ADD CONSTRAINT "published_page_snapshots_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "published_page_snapshots" ADD CONSTRAINT "published_page_snapshots_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "published_page_snapshots" ADD CONSTRAINT "published_page_snapshots_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "site_pages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "published_page_snapshots" ADD CONSTRAINT "published_page_snapshots_published_by_user_id_fkey" FOREIGN KEY ("published_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "published_page_states" ADD CONSTRAINT "published_page_states_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "published_page_states" ADD CONSTRAINT "published_page_states_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "published_page_states" ADD CONSTRAINT "published_page_states_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "site_pages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "published_page_states" ADD CONSTRAINT "published_page_states_active_snapshot_id_fkey" FOREIGN KEY ("active_snapshot_id") REFERENCES "published_page_snapshots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
