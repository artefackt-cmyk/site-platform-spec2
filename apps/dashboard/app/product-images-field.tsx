"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import type { MediaAssetSummary, ProductGalleryImage } from "./dashboard-types";

export type ProductImagesFieldLibraryState =
  | { readonly status: "loading" }
  | { readonly status: "error"; readonly message: string }
  | { readonly status: "ready"; readonly assets: readonly MediaAssetSummary[] };

export type ProductImagesFieldProps = {
  readonly title?: string;
  readonly images: readonly ProductGalleryImage[];
  readonly library: ProductImagesFieldLibraryState;
  readonly busy: boolean;
  readonly statusText?: string | null;
  readonly onRetryLibrary: () => void;
  readonly onUploadAsset: (input: {
    readonly file: File;
    readonly altText: string;
  }) => Promise<MediaAssetSummary>;
  readonly onAddAssetIds: (assetIds: readonly string[]) => Promise<void>;
  readonly onRemoveImage: (imageId: string) => Promise<void>;
  readonly onSetPrimary: (imageId: string) => Promise<void>;
  readonly onMoveImage: (imageId: string, direction: -1 | 1) => Promise<void>;
};

const PRODUCT_IMAGE_LIMIT = 10;

export function ProductImagesField({
  title = "Изображения товара",
  images,
  library,
  busy,
  statusText,
  onRetryLibrary,
  onUploadAsset,
  onAddAssetIds,
  onRemoveImage,
  onSetPrimary,
  onMoveImage
}: ProductImagesFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedAssetIds, setSelectedAssetIds] = useState<readonly string[]>([]);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const selectedAssetIdSet = useMemo(
    () => new Set(images.map((image) => image.assetId)),
    [images]
  );

  async function addSelectedAssets(): Promise<void> {
    setPickerError(null);

    if (selectedAssetIds.length === 0) {
      return;
    }

    if (images.length + selectedAssetIds.length > PRODUCT_IMAGE_LIMIT) {
      setPickerError("Можно выбрать не больше 10 изображений.");
      return;
    }

    try {
      await onAddAssetIds(selectedAssetIds);
      setSelectedAssetIds([]);
      setPickerOpen(false);
    } catch (error) {
      setPickerError(toImagePickerError(error));
    }
  }

  async function uploadAndAdd(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.currentTarget.files?.[0] ?? null;
    event.currentTarget.value = "";

    if (file === null) {
      return;
    }

    if (images.length >= PRODUCT_IMAGE_LIMIT) {
      setPickerError("Лимит 10 изображений уже достигнут.");
      return;
    }

    setUploading(true);
    setPickerError(null);

    try {
      const asset = await onUploadAsset({
        file,
        altText: file.name
      });
      await onAddAssetIds([asset.id]);
      setPickerOpen(false);
    } catch (error) {
      setPickerError(toImagePickerError(error));
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="product-images-field">
      <div className="form-header">
        <div>
          <p className="eyebrow">Media</p>
          <h3>{title}</h3>
        </div>
        <div className="workspace-actions">
          <span className="editor-muted">{images.length} из 10</span>
          {statusText === null || statusText === undefined ? null : (
            <span className={busy ? "save-indicator save-indicator-saving" : "save-indicator save-indicator-saved"}>
              {statusText}
            </span>
          )}
          <button
            className="secondary-button"
            type="button"
            disabled={busy || images.length >= PRODUCT_IMAGE_LIMIT}
            onClick={() => setPickerOpen(true)}
          >
            Добавить изображения
          </button>
        </div>
      </div>

      {images.length === 0 ? (
        <div className="empty-state product-images-empty">
          <p className="eyebrow">Пока пусто</p>
          <h3>Изображения не выбраны</h3>
          <p>Добавьте изображения из медиатеки проекта.</p>
        </div>
      ) : (
        <div className="media-grid">
          {images.map((image, index) => (
            <article className="media-card product-image-card" key={image.id}>
              <img src={image.url} alt={image.altText ?? "Изображение товара"} />
              <div className="page-title-line">
                <strong>{image.altText ?? image.assetId}</strong>
                {image.isPrimary ? (
                  <span className="home-badge">Основное</span>
                ) : null}
              </div>
              <div className="media-picker-actions">
                <button
                  className="mini-button"
                  type="button"
                  disabled={busy || image.isPrimary}
                  onClick={() => void onSetPrimary(image.id)}
                >
                  Основное
                </button>
                <button
                  className="mini-button"
                  type="button"
                  disabled={busy || index === 0}
                  onClick={() => void onMoveImage(image.id, -1)}
                >
                  Влево
                </button>
                <button
                  className="mini-button"
                  type="button"
                  disabled={busy || index === images.length - 1}
                  onClick={() => void onMoveImage(image.id, 1)}
                >
                  Вправо
                </button>
                <button
                  className="mini-button danger-mini-button"
                  type="button"
                  disabled={busy}
                  onClick={() => void onRemoveImage(image.id)}
                >
                  Удалить
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {pickerOpen ? (
        <div className="media-picker-backdrop" role="presentation">
          <section
            className="media-picker-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Выбор изображений товара"
          >
            <div className="form-header">
              <div>
                <p className="eyebrow">Медиатека</p>
                <h2>Выбрать изображения</h2>
              </div>
              <button
                className="ghost-button"
                type="button"
                onClick={() => setPickerOpen(false)}
              >
                Закрыть
              </button>
            </div>

            <label className="secondary-button product-upload-button">
              {uploading ? "Загружаем..." : "Загрузить новое изображение"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                disabled={uploading || busy}
                onChange={(event) => void uploadAndAdd(event)}
              />
            </label>

            {library.status === "loading" ? (
              <p className="editor-muted">Загружаем изображения проекта...</p>
            ) : null}

            {library.status === "error" ? (
              <div className="form-error" role="alert">
                <p>{library.message}</p>
                <button className="secondary-button" type="button" onClick={onRetryLibrary}>
                  Повторить
                </button>
              </div>
            ) : null}

            {library.status === "ready" && library.assets.length === 0 ? (
              <section className="empty-state">
                <p className="eyebrow">Медиатека пуста</p>
                <h3>Загрузите первое изображение</h3>
              </section>
            ) : null}

            {library.status === "ready" && library.assets.length > 0 ? (
              <div className="media-picker-grid">
                {library.assets.map((asset) => {
                  const alreadySelected = selectedAssetIdSet.has(asset.id);
                  const checked = selectedAssetIds.includes(asset.id);

                  return (
                    <label className="media-picker-card" key={asset.id}>
                      <img
                        src={asset.url}
                        alt={asset.altText ?? asset.originalFilename}
                      />
                      <strong>{asset.originalFilename}</strong>
                      <span>{alreadySelected ? "Уже в товаре" : "Можно выбрать"}</span>
                      <input
                        type="checkbox"
                        checked={checked || alreadySelected}
                        disabled={alreadySelected || busy}
                        onChange={(event) => {
                          const isChecked = event.currentTarget.checked;

                          setSelectedAssetIds((current) =>
                            isChecked
                              ? [...current, asset.id]
                              : current.filter((id) => id !== asset.id)
                          );
                        }}
                      />
                    </label>
                  );
                })}
              </div>
            ) : null}

            {pickerError === null ? null : (
              <p className="form-error" role="alert">
                {pickerError}
              </p>
            )}

            <div className="media-picker-actions">
              <button
                className="primary-button"
                type="button"
                disabled={busy || selectedAssetIds.length === 0}
                onClick={() => void addSelectedAssets()}
              >
                Добавить выбранные
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

export function toProductGalleryImageFromAsset(
  asset: MediaAssetSummary,
  position: number,
  isPrimary: boolean
): ProductGalleryImage {
  return {
    id: asset.id,
    assetId: asset.id,
    url: asset.url,
    altText: asset.altText,
    width: asset.width,
    height: asset.height,
    position,
    isPrimary
  };
}

function toImagePickerError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Не удалось обновить изображения товара.";
}
