import * as React from "react";
import type { MediaAssetSummary } from "./dashboard-types";
import type { MediaLibraryState } from "./media-library-app";

export function MediaLibraryView({
  state,
  onUpload,
  onUpdateAlt,
  onDelete
}: {
  readonly state: MediaLibraryState;
  readonly onUpload: (file: File) => void;
  readonly onUpdateAlt: (assetId: string, altText: string) => void;
  readonly onDelete: (assetId: string) => void;
}) {
  if (state.status === "loading") {
    return (
      <main className="dashboard-shell">
        <section className="dashboard-panel">
          <div className="center-state">
            <p className="eyebrow">Медиа</p>
            <h1>Загрузка медиабиблиотеки</h1>
          </div>
        </section>
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="dashboard-shell">
        <section className="dashboard-panel">
          <div className="center-state error-state" role="alert">
            <p className="eyebrow">Медиа</p>
            <h1>Медиабиблиотека недоступна</h1>
            <p>{state.message}</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard-shell">
      <section className="dashboard-panel">
        <header className="topbar workspace-topbar">
          <div>
            <a className="back-link" href={`/projects/${state.project.id}`}>
              Назад к проекту
            </a>
            <p className="eyebrow">Медиа</p>
            <h1>Медиабиблиотека</h1>
          </div>
          <label className="primary-button">
            Загрузить изображение
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={state.uploading}
              hidden
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];

                if (file !== undefined) {
                  onUpload(file);
                }
              }}
            />
          </label>
        </header>

        {state.errorMessage === null ? null : (
          <p className="editor-save-error" role="alert">
            {state.errorMessage}
          </p>
        )}
        {state.successMessage === null ? null : (
          <p className="save-indicator save-indicator-saved">{state.successMessage}</p>
        )}

        {state.assets.length === 0 ? (
          <section className="empty-state">
            <p className="eyebrow">Пока пусто</p>
            <h2>Загрузите первое изображение</h2>
            <p>Поддерживаются JPEG, PNG и WebP до 10 MB.</p>
          </section>
        ) : (
          <div className="media-grid">
            {state.assets.map((asset) => (
              <MediaAssetCard
                key={asset.id}
                asset={asset}
                onUpdateAlt={onUpdateAlt}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function MediaAssetCard({
  asset,
  onUpdateAlt,
  onDelete
}: {
  readonly asset: MediaAssetSummary;
  readonly onUpdateAlt: (assetId: string, altText: string) => void;
  readonly onDelete: (assetId: string) => void;
}) {
  const [altText, setAltText] = React.useState(asset.altText ?? "");

  return (
    <article className="media-card">
      <img src={asset.url} alt={asset.altText ?? asset.originalFilename} />
      <strong>{asset.originalFilename}</strong>
      <span>{formatDimensions(asset)}</span>
      <span>{formatBytes(asset.sizeBytes)}</span>
      <span>Использований: {asset.usageCount}</span>
      <span>{new Date(asset.createdAt).toLocaleDateString("ru-RU")}</span>
      <label className="inspector-field">
        Alt
        <input value={altText} onChange={(event) => setAltText(event.currentTarget.value)} />
      </label>
      <div className="editor-block-actions">
        <button
          className="mini-button"
          type="button"
          onClick={() => onUpdateAlt(asset.id, altText)}
        >
          Сохранить alt
        </button>
        <button
          className="mini-button danger-mini-button"
          type="button"
          onClick={() => onDelete(asset.id)}
          disabled={asset.usageCount > 0}
        >
          Удалить
        </button>
      </div>
    </article>
  );
}

function formatDimensions(asset: MediaAssetSummary): string {
  return asset.width === null || asset.height === null
    ? "Размеры неизвестны"
    : `${asset.width} x ${asset.height}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
