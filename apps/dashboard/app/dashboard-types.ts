import type { OrganizationRole } from "@site-platform/domain";
import type { PageDocumentV2 } from "@site-platform/editor-core";

export type ProjectStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type SitePageStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type OrderStatus =
  | "NEW"
  | "CONFIRMED"
  | "PROCESSING"
  | "COMPLETED"
  | "CANCELLED";

export type CurrentUserResponse = {
  readonly user?: {
    readonly id: string;
    readonly email: string;
    readonly displayName: string | null;
  };
  readonly id?: string;
  readonly email?: string;
  readonly displayName?: string | null;
  readonly activeOrganization: {
    readonly id: string;
    readonly name: string;
    readonly slug: string;
  };
  readonly role: OrganizationRole;
  readonly onboarding?: {
    readonly completed: boolean;
    readonly completedAt: string | null;
  };
};

export type AuthSessionResponse = Required<
  Pick<CurrentUserResponse, "user" | "activeOrganization" | "role" | "onboarding">
>;

export type ProjectSummary = {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly status: ProjectStatus;
  readonly createdAt: string;
};

export type SitePageSummary = {
  readonly id: string;
  readonly projectId: string;
  readonly title: string;
  readonly slug: string;
  readonly status: SitePageStatus;
  readonly isHome: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type ProjectsListResponse = {
  readonly projects: readonly ProjectSummary[];
};

export type CreateProjectResponse = {
  readonly project: ProjectSummary;
};

export type ProjectPagesListResponse = {
  readonly pages: readonly SitePageSummary[];
};

export type CreateProjectPageResponse = {
  readonly page: SitePageSummary;
};

export type UpdateProjectPageResponse = {
  readonly page: SitePageSummary;
};

export type PageDocumentResponse = {
  readonly pageId: string;
  readonly schemaVersion: 2;
  readonly revision: number;
  readonly document: PageDocumentV2;
};

export type MediaAssetSummary = {
  readonly id: string;
  readonly originalFilename: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly width: number | null;
  readonly height: number | null;
  readonly altText: string | null;
  readonly url: string;
  readonly createdAt: string;
  readonly usageCount: number;
};

export type MediaAssetsListResponse = {
  readonly assets: readonly MediaAssetSummary[];
};

export type ProductMoneyResponse = {
  readonly amountMinor: number;
  readonly currency: "RUB";
  readonly formatted: string;
};

export type ProductAvailabilityResponse =
  | "in-stock"
  | "out-of-stock"
  | "preorder";

export type ProductImageResponse = {
  readonly assetId: string;
  readonly url: string;
  readonly altText: string | null;
  readonly width: number | null;
  readonly height: number | null;
};

export type ProductGalleryImage = ProductImageResponse & {
  readonly id: string;
  readonly position: number;
  readonly isPrimary: boolean;
};

export type ProductSummary = {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly status: ProductStatus;
  readonly primaryImage: ProductImageResponse | null;
  readonly defaultPrice: ProductMoneyResponse | null;
  readonly variantsCount: number;
  readonly stockSummary: ProductAvailabilityResponse;
  readonly updatedAt: string;
};

export type ProductVariant = {
  readonly id: string;
  readonly title: string;
  readonly sku: string;
  readonly price: ProductMoneyResponse;
  readonly compareAtPrice: ProductMoneyResponse | null;
  readonly stockQuantity: number;
  readonly trackInventory: boolean;
  readonly allowBackorder: boolean;
  readonly availability: ProductAvailabilityResponse;
  readonly isDefault: boolean;
  readonly position: number;
};

export type ProductDetail = {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly shortDescription: string | null;
  readonly description: string | null;
  readonly status: ProductStatus;
  readonly primaryImage: ProductImageResponse | null;
  readonly images: readonly ProductGalleryImage[];
  readonly updatedAt: string;
};

export type ProductsListResponse = {
  readonly products: readonly ProductSummary[];
};

export type ProductDetailResponse = {
  readonly product: ProductDetail;
  readonly variants: readonly ProductVariant[];
};

export type ProductMediaListResponse = {
  readonly images: readonly ProductGalleryImage[];
};

export type OrderSummary = {
  readonly id: string;
  readonly orderNumber: number;
  readonly status: OrderStatus;
  readonly customerName: string;
  readonly customerEmail: string;
  readonly totalMinor: number;
  readonly currency: "RUB";
  readonly itemsCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type OrderItem = {
  readonly productName: string;
  readonly variantName: string;
  readonly sku: string;
  readonly unitPriceMinor: number;
  readonly quantity: number;
  readonly lineTotalMinor: number;
  readonly currency: "RUB";
  readonly productId: string | null;
  readonly variantId: string | null;
  readonly mediaUrl: string | null;
};

export type OrderDetail = OrderSummary & {
  readonly customerPhone: string | null;
  readonly customerComment: string | null;
  readonly subtotalMinor: number;
  readonly cancelledAt: string | null;
  readonly completedAt: string | null;
  readonly items: readonly OrderItem[];
};

export type OrdersListResponse = {
  readonly orders: readonly OrderSummary[];
  readonly pagination: {
    readonly page: number;
    readonly pageSize: number;
  };
};

export type UploadMediaAssetResponse = {
  readonly asset: MediaAssetSummary;
};

export type UpdateMediaAssetResponse = {
  readonly asset: MediaAssetSummary;
};

export type DeleteMediaAssetResponse = {
  readonly deleted: true;
};

export type PublicationStatus =
  | "never-published"
  | "published-current"
  | "published-with-changes"
  | "unpublished";

export type PublicationStatusResponse = {
  readonly status: PublicationStatus;
  readonly publicUrl: string | null;
  readonly activeSnapshotId: string | null;
  readonly activeVersion: number | null;
  readonly publishedAt: string | null;
};

export type PublicationSettingsResponse = {
  readonly publicHandle: string;
  readonly basePublicUrl: string;
  readonly projectPublicUrl: string;
  readonly constraints: {
    readonly minLength: number;
    readonly maxLength: number;
    readonly pattern: string;
    readonly reserved: readonly string[];
  };
};

export type PublishPageResponse = {
  readonly snapshotId: string;
  readonly version: number;
  readonly publicationStatus: PublicationStatusResponse;
  readonly publicUrl: string;
  readonly publishedAt: string;
};

export type PublicationHistoryItem = {
  readonly snapshotId: string;
  readonly version: number;
  readonly pageTitle: string;
  readonly pageSlug: string;
  readonly sourceRevision: number;
  readonly publishedAt: string;
  readonly publishedBy: string | null;
  readonly active: boolean;
  readonly rollbackSourceSnapshotId: string | null;
};

export type PublicationHistoryResponse = {
  readonly publications: readonly PublicationHistoryItem[];
};

export type SavePageDocumentRequest = {
  readonly schemaVersion: 2;
  readonly revision: number;
  readonly document: PageDocumentV2;
};

export type CreateProjectFormValues = {
  readonly name: string;
  readonly slug: string;
};

export type CreatePageFormValues = {
  readonly title: string;
  readonly slug: string;
  readonly isHome: boolean;
};

export type UpdatePageSettingsFormValues = {
  readonly title: string;
  readonly slug: string;
  readonly isHome: boolean;
};

export type ApiErrorResponse = {
  readonly code: string;
  readonly message: string;
  readonly details?: readonly {
    readonly field: string;
    readonly code: string;
    readonly message: string;
  }[];
};
