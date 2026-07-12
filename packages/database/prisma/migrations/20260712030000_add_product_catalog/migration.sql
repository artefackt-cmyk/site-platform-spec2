CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

CREATE TYPE "ProductCurrency" AS ENUM ('RUB');

CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "short_description" TEXT,
    "description" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "primary_media_asset_id" TEXT,
    "created_by_user_id" TEXT NOT NULL,
    "updated_by_user_id" TEXT NOT NULL,
    "external_id" TEXT,
    "external_source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "price_minor" INTEGER NOT NULL,
    "compare_at_price_minor" INTEGER,
    "currency" "ProductCurrency" NOT NULL DEFAULT 'RUB',
    "stock_quantity" INTEGER NOT NULL DEFAULT 0,
    "track_inventory" BOOLEAN NOT NULL DEFAULT true,
    "allow_backorder" BOOLEAN NOT NULL DEFAULT false,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "external_id" TEXT,
    "external_source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "product_variants_price_minor_check" CHECK ("price_minor" >= 0),
    CONSTRAINT "product_variants_compare_at_price_minor_check" CHECK ("compare_at_price_minor" IS NULL OR "compare_at_price_minor" > "price_minor"),
    CONSTRAINT "product_variants_stock_quantity_check" CHECK ("stock_quantity" >= 0)
);

CREATE UNIQUE INDEX "products_project_id_slug_key" ON "products"("project_id", "slug");
CREATE INDEX "products_organization_id_idx" ON "products"("organization_id");
CREATE INDEX "products_project_id_idx" ON "products"("project_id");
CREATE INDEX "products_project_id_status_idx" ON "products"("project_id", "status");
CREATE INDEX "products_project_id_created_at_idx" ON "products"("project_id", "created_at");
CREATE INDEX "products_primary_media_asset_id_idx" ON "products"("primary_media_asset_id");

CREATE UNIQUE INDEX "product_variants_project_id_sku_key" ON "product_variants"("project_id", "sku");
CREATE INDEX "product_variants_organization_id_idx" ON "product_variants"("organization_id");
CREATE INDEX "product_variants_project_id_idx" ON "product_variants"("project_id");
CREATE INDEX "product_variants_product_id_idx" ON "product_variants"("product_id");
CREATE INDEX "product_variants_product_id_is_default_idx" ON "product_variants"("product_id", "is_default");
CREATE INDEX "product_variants_product_id_position_idx" ON "product_variants"("product_id", "position");
CREATE UNIQUE INDEX "product_variants_single_default_per_product" ON "product_variants"("product_id") WHERE "is_default" = true AND "deleted_at" IS NULL;

ALTER TABLE "products" ADD CONSTRAINT "products_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_primary_media_asset_id_fkey" FOREIGN KEY ("primary_media_asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
