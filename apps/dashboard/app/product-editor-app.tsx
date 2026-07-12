"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  DashboardApiError,
  DashboardNetworkError,
  createDashboardApiClient
} from "./dashboard-api-client";
import {
  ProductImagesField,
  type ProductImagesFieldLibraryState
} from "./product-images-field";
import type {
  ProductDetail,
  ProductDetailResponse,
  ProductVariant,
  ProjectSummary
} from "./dashboard-types";

type LoadState =
  | { readonly status: "loading" }
  | { readonly status: "error"; readonly message: string }
  | {
      readonly status: "ready";
      readonly project: ProjectSummary;
      readonly product: ProductDetail;
      readonly variants: readonly ProductVariant[];
    };

export type ProductVariantFormDraft = {
  readonly title: string;
  readonly sku: string;
  readonly priceRub: string;
  readonly compareAtPriceRub: string;
  readonly stockQuantity: string;
  readonly trackInventory: boolean;
  readonly allowBackorder: boolean;
};

const initialVariantForm: ProductVariantFormDraft = {
  title: "",
  sku: "",
  priceRub: "",
  compareAtPriceRub: "",
  stockQuantity: "0",
  trackInventory: true,
  allowBackorder: false
};

export function ProductEditorApp({
  apiUrl,
  projectId,
  productId
}: {
  readonly apiUrl: string;
  readonly projectId: string;
  readonly productId: string;
}) {
  const apiClient = useMemo(() => createDashboardApiClient(apiUrl), [apiUrl]);
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [mediaLibrary, setMediaLibrary] =
    useState<ProductImagesFieldLibraryState>({ status: "loading" });
  const [saving, setSaving] = useState(false);
  const [galleryStatus, setGalleryStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [variantForm, setVariantForm] = useState(initialVariantForm);

  const load = useCallback(async () => {
    setState({ status: "loading" });

    try {
      const [project, productResponse] = await Promise.all([
        apiClient.getProject(projectId),
        apiClient.getProduct(projectId, productId)
      ]);

      setState({
        status: "ready",
        project,
        product: productResponse.product,
        variants: productResponse.variants
      });
    } catch (error) {
      setState({
        status: "error",
        message: toUserFacingError(error)
      });
    }
  }, [apiClient, productId, projectId]);

  const loadMediaLibrary = useCallback(async () => {
    setMediaLibrary({ status: "loading" });

    try {
      const mediaResponse = await apiClient.listProjectMedia(projectId);

      setMediaLibrary({
        status: "ready",
        assets: mediaResponse.assets
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

  const applyProductResponse = useCallback((response: ProductDetailResponse) => {
    setState((current) =>
      current.status !== "ready"
        ? current
        : {
            ...current,
            product: response.product,
            variants: response.variants
          }
    );
  }, []);

  const applyProductImages = useCallback(
    (images: ProductDetail["images"]) => {
      setState((current) =>
        current.status !== "ready"
          ? current
          : {
              ...current,
              product: {
                ...current.product,
                images,
                primaryImage:
                  images.find((image) => image.isPrimary) ?? images[0] ?? null
              }
            }
      );
    },
    []
  );

  const updateProduct = useCallback(
    async (input: {
      readonly title?: string;
      readonly slug?: string;
      readonly shortDescription?: string | null;
      readonly description?: string | null;
    }) => {
      setSaving(true);
      setErrorMessage(null);

      try {
        applyProductResponse(
          await apiClient.updateProduct(projectId, productId, input)
        );
      } catch (error) {
        setErrorMessage(toUserFacingError(error));
      } finally {
        setSaving(false);
      }
    },
    [apiClient, applyProductResponse, productId, projectId]
  );

  const runGalleryAction = useCallback(
    async (operation: () => Promise<{ readonly images: ProductDetail["images"] }>) => {
      setSaving(true);
      setGalleryStatus("Сохраняем...");
      setErrorMessage(null);

      try {
        const response = await operation();

        applyProductImages(response.images);
        setGalleryStatus("Сохранено");
      } catch (error) {
        setErrorMessage(toUserFacingError(error));
        setGalleryStatus("Ошибка сохранения");
      } finally {
        setSaving(false);
      }
    },
    [applyProductImages]
  );

  const activate = useCallback(async () => {
    try {
      applyProductResponse(await apiClient.activateProduct(projectId, productId));
    } catch (error) {
      setErrorMessage(toUserFacingError(error));
    }
  }, [apiClient, applyProductResponse, productId, projectId]);

  const archive = useCallback(async () => {
    try {
      applyProductResponse(await apiClient.archiveProduct(projectId, productId));
    } catch (error) {
      setErrorMessage(toUserFacingError(error));
    }
  }, [apiClient, applyProductResponse, productId, projectId]);

  const deleteProduct = useCallback(async () => {
    if (!window.confirm("Удалить товар?")) {
      return;
    }

    await apiClient.deleteProduct(projectId, productId);
    window.location.assign(`/projects/${projectId}/products`);
  }, [apiClient, productId, projectId]);

  const submitVariant = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setErrorMessage(null);

      try {
        const response = await apiClient.createProductVariant(projectId, productId, {
          title: variantForm.title,
          sku: variantForm.sku,
          priceMinor: rubToMinor(variantForm.priceRub),
          compareAtPriceMinor:
            variantForm.compareAtPriceRub.trim() === ""
              ? null
              : rubToMinor(variantForm.compareAtPriceRub),
          stockQuantity: parseInteger(variantForm.stockQuantity),
          trackInventory: variantForm.trackInventory,
          allowBackorder: variantForm.allowBackorder
        });

        applyProductResponse(response);
        setVariantForm(initialVariantForm);
      } catch (error) {
        setErrorMessage(toUserFacingError(error));
      }
    },
    [apiClient, applyProductResponse, productId, projectId, variantForm]
  );

  const setDefaultVariant = useCallback(
    async (variantId: string) => {
      applyProductResponse(
        await apiClient.setDefaultProductVariant(projectId, productId, variantId)
      );
    },
    [apiClient, applyProductResponse, productId, projectId]
  );

  const editVariant = useCallback(
    async (variant: ProductVariant) => {
      const title = window.prompt("Название варианта", variant.title);

      if (title === null) {
        return;
      }

      const sku = window.prompt("SKU", variant.sku);

      if (sku === null) {
        return;
      }

      const priceRub = window.prompt(
        "Цена, ₽",
        String(variant.price.amountMinor / 100)
      );

      if (priceRub === null) {
        return;
      }

      const stockQuantity = window.prompt(
        "Остаток",
        String(variant.stockQuantity)
      );

      if (stockQuantity === null) {
        return;
      }

      applyProductResponse(
        await apiClient.updateProductVariant(projectId, productId, variant.id, {
          title,
          sku,
          priceMinor: rubToMinor(priceRub),
          stockQuantity: parseInteger(stockQuantity)
        })
      );
    },
    [apiClient, applyProductResponse, productId, projectId]
  );

  const deleteVariant = useCallback(
    async (variantId: string) => {
      if (!window.confirm("Удалить вариант товара?")) {
        return;
      }

      applyProductResponse(
        await apiClient.deleteProductVariant(projectId, productId, variantId)
      );
    },
    [apiClient, applyProductResponse, productId, projectId]
  );

  if (state.status === "loading") {
    return <CenterState title="Загрузка товара" text="Получаем данные товара." />;
  }

  if (state.status === "error") {
    return <CenterState title="Товар не открыт" text={state.message} tone="error" />;
  }

  return (
    <main className="dashboard-shell">
      <section className="dashboard-panel">
        <header className="topbar workspace-topbar">
          <div>
            <a className="back-link" href={`/projects/${projectId}/products`}>
              Назад к товарам
            </a>
            <p className="eyebrow">{state.project.name}</p>
            <h1>{state.product.title}</h1>
            <p className="project-slug">/{state.product.slug}</p>
          </div>
          <div className="workspace-actions">
            <span className="project-status">{state.product.status}</span>
            <button className="secondary-button" type="button" onClick={activate}>
              Активировать
            </button>
            <button className="ghost-button" type="button" onClick={archive}>
              Архивировать
            </button>
            <button className="ghost-button" type="button" onClick={deleteProduct}>
              Удалить
            </button>
          </div>
        </header>

        <section className="workspace-layout">
          <div className="workspace-main">
            <section className="create-form">
              <div className="form-header">
                <div>
                  <p className="eyebrow">Основное</p>
                  <h2>Данные товара</h2>
                </div>
                <span className="save-indicator save-indicator-saved">
                  {saving ? "Сохраняем..." : "Автосохранение"}
                </span>
              </div>
              <ProductCommitInput
                label="Название"
                value={state.product.title}
                onCommit={(title) => void updateProduct({ title })}
              />
              <ProductCommitInput
                label="Slug"
                value={state.product.slug}
                onCommit={(slug) => void updateProduct({ slug })}
              />
              <label>
                Краткое описание
                <textarea
                  value={state.product.shortDescription ?? ""}
                  onBlur={(event) =>
                    void updateProduct({
                      shortDescription: normalizeOptionalText(
                        event.currentTarget.value
                      )
                    })
                  }
                  onChange={(event) => {
                    const value = event.currentTarget.value;

                    setState((current) =>
                      current.status !== "ready"
                        ? current
                        : {
                            ...current,
                            product: {
                              ...current.product,
                              shortDescription: value
                            }
                          }
                    );
                  }}
                />
              </label>
              <label>
                Описание
                <textarea
                  value={state.product.description ?? ""}
                  onBlur={(event) =>
                    void updateProduct({
                      description: normalizeOptionalText(event.currentTarget.value)
                    })
                  }
                  onChange={(event) => {
                    const value = event.currentTarget.value;

                    setState((current) =>
                      current.status !== "ready"
                        ? current
                        : {
                            ...current,
                            product: {
                              ...current.product,
                              description: value
                            }
                          }
                    );
                  }}
                />
              </label>

              <ProductImagesField
                images={state.product.images}
                library={mediaLibrary}
                busy={saving}
                statusText={galleryStatus}
                onRetryLibrary={() => void loadMediaLibrary()}
                onUploadAsset={async (input) => {
                  const response = await apiClient.uploadProjectMedia(projectId, input);

                  await loadMediaLibrary();

                  return response.asset;
                }}
                onAddAssetIds={(assetIds) =>
                  runGalleryAction(async () => {
                    let response = await apiClient.listProductMedia(
                      projectId,
                      productId
                    );

                    for (const mediaAssetId of assetIds) {
                      response = await apiClient.addProductMedia(projectId, productId, {
                        mediaAssetId
                      });
                    }

                    return response;
                  })
                }
                onRemoveImage={(imageId) =>
                  runGalleryAction(() =>
                    apiClient.removeProductMedia(projectId, productId, imageId)
                  )
                }
                onSetPrimary={(imageId) =>
                  runGalleryAction(() =>
                    apiClient.setPrimaryProductMedia(projectId, productId, imageId)
                  )
                }
                onMoveImage={(imageId, direction) =>
                  runGalleryAction(() => {
                    const currentIndex = state.product.images.findIndex(
                      (image) => image.id === imageId
                    );
                    const nextIndex = currentIndex + direction;

                    if (
                      currentIndex < 0 ||
                      nextIndex < 0 ||
                      nextIndex >= state.product.images.length
                    ) {
                      return Promise.resolve({
                        images: state.product.images
                      });
                    }

                    const ordered = [...state.product.images];
                    const [moved] = ordered.splice(currentIndex, 1);

                    if (moved === undefined) {
                      return Promise.resolve({
                        images: state.product.images
                      });
                    }

                    ordered.splice(nextIndex, 0, moved);

                    return apiClient.reorderProductMedia(projectId, productId, {
                      orderedIds: ordered.map((image) => image.id)
                    });
                  })
                }
              />

              {errorMessage === null ? null : (
                <p className="form-error" role="alert">
                  {errorMessage}
                </p>
              )}
            </section>

            <section className="create-form">
              <div className="form-header">
                <div>
                  <p className="eyebrow">Variants</p>
                  <h2>Варианты товара</h2>
                </div>
              </div>
              <div className="page-list">
                {state.variants.map((variant) => (
                  <article className="page-row" key={variant.id}>
                    <div>
                      <div className="page-title-line">
                        <h3>{variant.title}</h3>
                        {variant.isDefault ? (
                          <span className="home-badge">Default</span>
                        ) : null}
                      </div>
                      <p className="project-slug">
                        {variant.sku} · {variant.price.formatted} · остаток{" "}
                        {variant.stockQuantity}
                      </p>
                    </div>
                    <div className="page-row-meta">
                      <button
                        className="ghost-button"
                        type="button"
                        disabled={variant.isDefault}
                        onClick={() => void setDefaultVariant(variant.id)}
                      >
                        Default
                      </button>
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={() => void editVariant(variant)}
                      >
                        Изменить
                      </button>
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={() => void deleteVariant(variant.id)}
                      >
                        Удалить
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              <form className="create-form" onSubmit={submitVariant}>
                <div className="form-header">
                  <div>
                    <p className="eyebrow">Новый вариант</p>
                    <h3>Добавить variant</h3>
                  </div>
                </div>
                <ProductInput
                  label="Название"
                  value={variantForm.title}
                  onChange={(title) =>
                    setVariantForm((current) => ({ ...current, title }))
                  }
                />
                <ProductInput
                  label="SKU"
                  value={variantForm.sku}
                  onChange={(sku) =>
                    setVariantForm((current) => ({ ...current, sku }))
                  }
                />
                <ProductInput
                  label="Цена, ₽"
                  value={variantForm.priceRub}
                  onChange={(priceRub) =>
                    setVariantForm((current) => ({ ...current, priceRub }))
                  }
                />
                <ProductInput
                  label="Старая цена, ₽"
                  value={variantForm.compareAtPriceRub}
                  onChange={(compareAtPriceRub) =>
                    setVariantForm((current) => ({
                      ...current,
                      compareAtPriceRub
                    }))
                  }
                />
                <ProductInput
                  label="Остаток"
                  value={variantForm.stockQuantity}
                  onChange={(stockQuantity) =>
                    setVariantForm((current) => ({ ...current, stockQuantity }))
                  }
                />
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={variantForm.trackInventory}
                    onChange={(event) => {
                      const checked = event.currentTarget.checked;

                      setVariantForm((current) => ({
                        ...current,
                        ...updateProductVariantFormDraft("trackInventory", checked)
                      }));
                    }}
                  />
                  Учитывать остаток
                </label>
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={variantForm.allowBackorder}
                    onChange={(event) => {
                      const checked = event.currentTarget.checked;

                      setVariantForm((current) => ({
                        ...current,
                        ...updateProductVariantFormDraft("allowBackorder", checked)
                      }));
                    }}
                  />
                  Разрешить предзаказ
                </label>
                <button className="primary-button" type="submit">
                  Добавить вариант
                </button>
              </form>
            </section>
          </div>
        </section>
      </section>
    </main>
  );
}

export function updateProductVariantFormDraft<
  TField extends keyof ProductVariantFormDraft
>(
  field: TField,
  value: ProductVariantFormDraft[TField]
): Pick<ProductVariantFormDraft, TField> {
  return {
    [field]: value
  } as Pick<ProductVariantFormDraft, TField>;
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

function ProductCommitInput({
  label,
  value,
  onCommit
}: {
  readonly label: string;
  readonly value: string;
  readonly onCommit: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <label>
      {label}
      <input
        value={draft}
        onChange={(event) => setDraft(event.currentTarget.value)}
        onBlur={() => {
          if (draft !== value) {
            onCommit(draft);
          }
        }}
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

function normalizeOptionalText(value: string): string | null {
  const normalized = value.trim();

  return normalized === "" ? null : normalized;
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

export function toMediaLibraryError(error: unknown): string {
  if (error instanceof DashboardApiError) {
    return error.message;
  }

  if (error instanceof DashboardNetworkError) {
    return "Не удалось загрузить изображения проекта. Проверьте, что API запущен, CORS настроен, а NEXT_PUBLIC_API_URL указывает на backend.";
  }

  return "Не удалось загрузить изображения проекта.";
}
