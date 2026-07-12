CREATE TABLE "product_media" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "media_asset_id" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "is_primary" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "product_media_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_media_product_id_media_asset_id_key" ON "product_media"("product_id", "media_asset_id");
CREATE UNIQUE INDEX "product_media_single_primary_per_product" ON "product_media"("product_id") WHERE "is_primary" = true;
CREATE INDEX "product_media_organization_id_idx" ON "product_media"("organization_id");
CREATE INDEX "product_media_project_id_idx" ON "product_media"("project_id");
CREATE INDEX "product_media_product_id_idx" ON "product_media"("product_id");
CREATE INDEX "product_media_product_id_position_idx" ON "product_media"("product_id", "position");

ALTER TABLE "product_media" ADD CONSTRAINT "product_media_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "product_media" (
  "id",
  "organization_id",
  "project_id",
  "product_id",
  "media_asset_id",
  "position",
  "is_primary",
  "created_at",
  "updated_at"
)
SELECT
  CONCAT('legacy_', p."id", '_', p."primary_media_asset_id"),
  p."organization_id",
  p."project_id",
  p."id",
  p."primary_media_asset_id",
  0,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "products" p
INNER JOIN "media_assets" m
  ON m."id" = p."primary_media_asset_id"
  AND m."organization_id" = p."organization_id"
  AND m."project_id" = p."project_id"
WHERE p."primary_media_asset_id" IS NOT NULL
  AND p."deleted_at" IS NULL
ON CONFLICT ("product_id", "media_asset_id") DO NOTHING;
