"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  DashboardApiError,
  DashboardNetworkError,
  createDashboardApiClient
} from "./dashboard-api-client";
import {
  ProductImagesField,
  toProductGalleryImageFromAsset,
  type ProductImagesFieldLibraryState
} from "./product-images-field";
import type {
  ProductGalleryImage,
  ProductStatus,
  ProductSummary,
  ProjectSummary
} from "./dashboard-types";

type LoadState =
  | { readonly status: "loading" }
  | { readonly status: "error"; readonly message: string }
  | {
      readonly status: "ready";
      readonly project: ProjectSummary;
      readonly products: readonly ProductSummary[];
    };

export type ProductCreateFormDraft = {
  readonly title: string;
  readonly slug: string;
  readonly priceRub: string;
  readonly sku: string;
  readonly stockQuantity: string;
  readonly shortDescription: string;
};

const initialForm: ProductCreateFormDraft = {
  title: "",
  slug: "",
  priceRub: "",
  sku: "",
  stockQuantity: "0",
  shortDescription: ""
};

export function ProductCatalogApp({
  apiUrl,
  projectId
}: {
  readonly apiUrl: string;
  readonly projectId: string;
}) {
  const apiClient = useMemo(() => createDashboardApiClient(apiUrl), [apiUrl]);
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [mediaLibrary, setMediaLibrary] =
    useState<ProductImagesFieldLibraryState>({ status: "loading" });
  const [status, setStatus] = useState<ProductStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [selectedImages, setSelectedImages] = useState<readonly ProductGalleryImage[]>(
    []
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    setErrorMessage(null);

    try {
      const [project, productsResponse] = await Promise.all([
        apiClient.getProject(projectId),
        apiClient.listProducts(projectId, {
          ...(status === "ALL" ? {} : { status }),
          ...(search.trim() === "" ? {} : { search })
        })
      ]);

      setState({
        status: "ready",
        project,
        products: productsResponse.products
      });
    } catch (error) {
      setState({
        status: "error",
        message: toUserFacingError(error)
      });
    }
  }, [apiClient, projectId, search, status]);

  const loadMediaLibrary = useCallback(async () => {
    setMediaLibrary({ status: "loading" });

    try {
      const response = await apiClient.listProjectMedia(projectId);

      setMediaLibrary({
        status: "ready",
        assets: response.assets
      });
    } catch (error) {
      setMediaLibrary({
        status: "error",
        message: toMediaLibraryError(error)
      });
    }
  }, [apiClient, projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadMediaLibrary();
  }, [loadMediaLibrary]);

  const submitCreate = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSubmitting(true);
      setErrorMessage(null);

      try {
        const response = await apiClient.createProduct(projectId, {
          title: form.title,
          slug: form.slug,
          priceMinor: rubToMinor(form.priceRub),
          sku: form.sku,
          stockQuantity: parseInteger(form.stockQuantity),
          shortDescription:
            form.shortDescription.trim() === "" ? null : form.shortDescription,
          mediaAssetIds: selectedImages.map((image) => image.assetId),
          primaryMediaAssetId:
            selectedImages.find((image) => image.isPrimary)?.assetId ??
            selectedImages[0]?.assetId ??
            null
        });

        window.location.assign(
          `/projects/${projectId}/products/${response.product.id}`
        );
      } catch (error) {
        setErrorMessage(toUserFacingError(error));
      } finally {
        setSubmitting(false);
      }
    },
    [apiClient, form, projectId, selectedImages]
  );

  const deleteProduct = useCallback(
    async (product: ProductSummary) => {
      if (!window.confirm(`Удалить товар «${product.title}»?`)) {
        return;
      }

      await apiClient.deleteProduct(projectId, product.id);
      await load();
    },
    [apiClient, load, projectId]
  );

  if (state.status === "loading") {
    return <CenterState title="Загрузка товаров" text="Получаем каталог проекта." />;
  }

  if (state.status === "error") {
    return <CenterState title="Каталог не открыт" text={state.message} tone="error" />;
  }

  return (
    <main className="dashboard-shell">
      <section className="dashboard-panel">
        <header className="topbar workspace-topbar">
          <div>
            <a className="back-link" href={`/projects/${projectId}`}>
              Назад в проект
            </a>
            <p className="eyebrow">Каталог</p>
            <h1>Товары</h1>
          </div>
          <button
            className="primary-button"
            type="button"
            onClick={() => setFormOpen(true)}
          >
            Добавить товар
          </button>
        </header>

        <section className="workspace-main">
          <div className="workspace-section-heading">
            <div>
              <p className="eyebrow">{state.project.name}</p>
              <h2>Список товаров</h2>
            </div>
            <div className="workspace-actions">
              <input
                aria-label="Поиск товаров"
                value={search}
                onChange={(event) => setSearch(event.currentTarget.value)}
                placeholder="Поиск"
              />
              <select
                aria-label="Фильтр статуса"
                value={status}
                onChange={(event) =>
                  setStatus(toProductStatusFilter(event.currentTarget.value))
                }
              >
                <option value="ALL">Все</option>
                <option value="DRAFT">Черновики</option>
                <option value="ACTIVE">Активные</option>
                <option value="ARCHIVED">Архив</option>
              </select>
            </div>
          </div>

          {formOpen ? (
            <form className="create-form" onSubmit={submitCreate}>
              <div className="form-header">
                <div>
                  <p className="eyebrow">Новый товар</p>
                  <h3>Создать товар</h3>
                </div>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => setFormOpen(false)}
                >
                  Закрыть
                </button>
              </div>
              <ProductInput
                label="Название"
                value={form.title}
                onChange={(title) => setForm((current) => ({ ...current, title }))}
              />
              <ProductInput
                label="Slug"
                value={form.slug}
                onChange={(slug) => setForm((current) => ({ ...current, slug }))}
              />
              <ProductInput
                label="Цена, ₽"
                value={form.priceRub}
                onChange={(priceRub) =>
                  setForm((current) => ({ ...current, priceRub }))
                }
              />
              <ProductInput
                label="SKU"
                value={form.sku}
                onChange={(sku) => setForm((current) => ({ ...current, sku }))}
              />
              <ProductInput
                label="Остаток"
                value={form.stockQuantity}
                onChange={(stockQuantity) =>
                  setForm((current) => ({ ...current, stockQuantity }))
                }
              />
              <label>
                Краткое описание
                <textarea
                  value={form.shortDescription}
                  onChange={(event) => {
                    const value = event.currentTarget.value;

                    setForm((current) => ({
                      ...current,
                      ...updateProductCreateFormDraft("shortDescription", value)
                    }));
                  }}
                />
              </label>
              <ProductImagesField
                images={selectedImages}
                library={mediaLibrary}
                busy={submitting}
                statusText={null}
                onRetryLibrary={() => void loadMediaLibrary()}
                onUploadAsset={async (input) => {
                  const response = await apiClient.uploadProjectMedia(projectId, input);

                  setSelectedImages((current) => {
                    if (current.some((image) => image.assetId === response.asset.id)) {
                      return current;
                    }

                    return [
                      ...current,
                      toProductGalleryImageFromAsset(
                        response.asset,
                        current.length,
                        current.length === 0
                      )
                    ];
                  });
                  await loadMediaLibrary();

                  return response.asset;
                }}
                onAddAssetIds={async (assetIds) => {
                  if (mediaLibrary.status !== "ready") {
                    throw new Error("Медиатека пока недоступна.");
                  }

                  setSelectedImages((current) => {
                    const currentAssetIds = new Set(
                      current.map((image) => image.assetId)
                    );
                    const nextAssets = mediaLibrary.assets.filter(
                      (asset) =>
                        assetIds.includes(asset.id) && !currentAssetIds.has(asset.id)
                    );
                    const nextImages = nextAssets.map((asset, index) =>
                      toProductGalleryImageFromAsset(
                        asset,
                        current.length + index,
                        current.length === 0 && index === 0
                      )
                    );

                    return [...current, ...nextImages].map((image, index) => ({
                      ...image,
                      position: index
                    }));
                  });
                }}
                onRemoveImage={async (imageId) => {
                  setSelectedImages((current) => promotePrimaryIfNeeded(
                    current.filter((image) => image.id !== imageId)
                  ));
                }}
                onSetPrimary={async (imageId) => {
                  setSelectedImages((current) =>
                    current.map((image) => ({
                      ...image,
                      isPrimary: image.id === imageId
                    }))
                  );
                }}
                onMoveImage={async (imageId, direction) => {
                  setSelectedImages((current) => {
                    const currentIndex = current.findIndex(
                      (image) => image.id === imageId
                    );
                    const nextIndex = currentIndex + direction;

                    if (
                      currentIndex < 0 ||
                      nextIndex < 0 ||
                      nextIndex >= current.length
                    ) {
                      return current;
                    }

                    const ordered = [...current];
                    const [moved] = ordered.splice(currentIndex, 1);

                    if (moved === undefined) {
                      return current;
                    }

                    ordered.splice(nextIndex, 0, moved);

                    return ordered.map((image, index) => ({
                      ...image,
                      position: index
                    }));
                  });
                }}
              />
              {errorMessage === null ? null : (
                <p className="form-error" role="alert">
                  {errorMessage}
                </p>
              )}
              <button className="primary-button" type="submit" disabled={submitting}>
                {submitting ? "Создаём..." : "Создать"}
              </button>
            </form>
          ) : null}

          {state.products.length === 0 ? (
            <section className="empty-state">
              <p className="eyebrow">Пока пусто</p>
              <h3>Товаров пока нет</h3>
              <p>Создайте первый товар для публичного каталога.</p>
            </section>
          ) : (
            <section className="page-list" aria-label="Список товаров">
              {state.products.map((product) => (
                <article className="page-row" key={product.id}>
                  <div>
                    <div className="page-title-line">
                      <h3>{product.title}</h3>
                      <span className="project-status">{product.status}</span>
                    </div>
                    <p className="project-slug">/{product.slug}</p>
                    <p className="editor-muted">
                      {product.defaultPrice?.formatted ?? "Цена не указана"} ·{" "}
                      {toAvailabilityLabel(product.stockSummary)} ·{" "}
                      {product.variantsCount} вариант(ов)
                    </p>
                  </div>
                  <div className="page-row-meta">
                    <span>{formatDate(product.updatedAt)}</span>
                    <a
                      className="ghost-button"
                      href={`/projects/${projectId}/products/${product.id}`}
                    >
                      Открыть
                    </a>
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => void deleteProduct(product)}
                    >
                      Удалить
                    </button>
                  </div>
                </article>
              ))}
            </section>
          )}
        </section>
      </section>
    </main>
  );
}

export function updateProductCreateFormDraft<
  TField extends keyof ProductCreateFormDraft
>(
  field: TField,
  value: ProductCreateFormDraft[TField]
): Pick<ProductCreateFormDraft, TField> {
  return {
    [field]: value
  } as Pick<ProductCreateFormDraft, TField>;
}

function ProductInput({
  label,
  value,
  onChange
}: {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  return (
    <label>
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </label>
  );
}

function CenterState({
  title,
  text,
  tone
}: {
  readonly title: string;
  readonly text: string;
  readonly tone?: "error";
}) {
  return (
    <main className="dashboard-shell">
      <section className="dashboard-panel">
        <div className={tone === "error" ? "center-state error-state" : "center-state"}>
          <p className="eyebrow">Product catalog</p>
          <h1>{title}</h1>
          <p>{text}</p>
        </div>
      </section>
    </main>
  );
}

function rubToMinor(value: string): number {
  const normalized = value.replace(",", ".").trim();
  const amount = Number.parseFloat(normalized);

  if (!Number.isFinite(amount) || amount < 0) {
    return 0;
  }

  return Math.round(amount * 100);
}

function parseInteger(value: string): number {
  const parsed = Number.parseInt(value, 10);

  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

function toProductStatusFilter(value: string): ProductStatus | "ALL" {
  return value === "DRAFT" || value === "ACTIVE" || value === "ARCHIVED"
    ? value
    : "ALL";
}

function toAvailabilityLabel(
  availability: "in-stock" | "out-of-stock" | "preorder"
): string {
  if (availability === "in-stock") {
    return "в наличии";
  }

  if (availability === "preorder") {
    return "предзаказ";
  }

  return "нет в наличии";
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium"
  }).format(new Date(date));
}

function toUserFacingError(error: unknown): string {
  if (error instanceof DashboardApiError) {
    return error.message;
  }

  if (error instanceof DashboardNetworkError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Не удалось выполнить действие.";
}

function toMediaLibraryError(error: unknown): string {
  if (error instanceof DashboardApiError) {
    return error.message;
  }

  if (error instanceof DashboardNetworkError) {
    return "Не удалось загрузить изображения проекта. Проверьте, что API запущен, CORS настроен, а NEXT_PUBLIC_API_URL указывает на backend.";
  }

  return "Не удалось загрузить изображения проекта.";
}

function promotePrimaryIfNeeded(
  images: readonly ProductGalleryImage[]
): readonly ProductGalleryImage[] {
  const normalized = images.map((image, index) => ({
    ...image,
    position: index
  }));

  if (normalized.length === 0 || normalized.some((image) => image.isPrimary)) {
    return normalized;
  }

  return normalized.map((image, index) => ({
    ...image,
    isPrimary: index === 0
  }));
}
