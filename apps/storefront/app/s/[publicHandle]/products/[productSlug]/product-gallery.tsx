"use client";

import { useState } from "react";

export type StorefrontProductGalleryImage = {
  readonly id: string;
  readonly url: string;
  readonly altText: string | null;
  readonly width: number | null;
  readonly height: number | null;
  readonly position: number;
  readonly isPrimary: boolean;
};

export function ProductGallery({
  title,
  images
}: {
  readonly title: string;
  readonly images: readonly StorefrontProductGalleryImage[];
}) {
  const sortedImages = [...images].sort((left, right) => {
    if (left.isPrimary !== right.isPrimary) {
      return left.isPrimary ? -1 : 1;
    }

    return left.position - right.position;
  });
  const [activeImageId, setActiveImageId] = useState(sortedImages[0]?.id ?? null);
  const activeImage =
    sortedImages.find((image) => image.id === activeImageId) ??
    sortedImages[0] ??
    null;

  if (activeImage === null) {
    return <div style={imagePlaceholderStyle}>Изображение товара</div>;
  }

  return (
    <section style={galleryStyle} aria-label="Галерея товара">
      <img
        src={activeImage.url}
        alt={activeImage.altText ?? title}
        width={activeImage.width ?? undefined}
        height={activeImage.height ?? undefined}
        style={imageStyle}
      />
      {sortedImages.length <= 1 ? null : (
        <div style={thumbnailRailStyle}>
          {sortedImages.map((image) => (
            <button
              key={image.id}
              type="button"
              aria-label={`Показать изображение ${image.position + 1}`}
              aria-pressed={image.id === activeImage.id}
              style={
                image.id === activeImage.id
                  ? thumbnailButtonActiveStyle
                  : thumbnailButtonStyle
              }
              onClick={() => setActiveImageId(image.id)}
            >
              <img
                src={image.url}
                alt={image.altText ?? title}
                width={image.width ?? undefined}
                height={image.height ?? undefined}
                style={thumbnailImageStyle}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

const galleryStyle = {
  display: "grid",
  gap: 12
} as const;

const imageStyle = {
  width: "100%",
  aspectRatio: "4 / 3",
  objectFit: "cover",
  borderRadius: 8,
  background: "#f3f6fa"
} as const;

const imagePlaceholderStyle = {
  display: "grid",
  width: "100%",
  aspectRatio: "4 / 3",
  placeItems: "center",
  borderRadius: 8,
  background: "#f3f6fa",
  color: "#667085"
} as const;

const thumbnailRailStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))",
  gap: 8
} as const;

const thumbnailButtonStyle = {
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#d6dee9",
  borderRadius: 6,
  background: "#ffffff",
  padding: 4
} as const;

const thumbnailButtonActiveStyle = {
  ...thumbnailButtonStyle,
  borderColor: "#2563eb"
} as const;

const thumbnailImageStyle = {
  width: "100%",
  aspectRatio: "1 / 1",
  objectFit: "cover",
  borderRadius: 4
} as const;
