import * as React from "react";
import { getImageProps } from "next/image";

export function ProductMockup({ variant }: { variant: "dashboard" | "builder" | "store" }) {
  const isBuilder = variant === "builder";
  const image = heroImages[variant];
  const className = isBuilder ? "builder-hero-mockup hero-photo-frame" : "mockup-frame hero-photo-frame";
  const {
    props: { srcSet: desktopSrcSet, ...desktopProps }
  } = getImageProps({
    src: image.desktopSrc,
    alt: image.alt,
    width: 660,
    height: 440,
    sizes: image.sizes,
    loading: "eager",
    fetchPriority: "high"
  });
  const {
    props: { srcSet: mobileSrcSet }
  } = getImageProps({
    src: image.mobileSrc,
    alt: image.alt,
    width: 342,
    height: 300,
    sizes: "(max-width: 767px) calc(100vw - 32px), 342px",
    loading: "eager",
    fetchPriority: "high"
  });

  return (
    <div className={className} aria-label={image.alt}>
      <picture>
        <source media="(max-width: 767px)" srcSet={mobileSrcSet} />
        <img
          {...desktopProps}
          srcSet={desktopSrcSet}
          className={`hero-photo hero-photo-${variant}`}
        />
      </picture>
    </div>
  );
}

const heroImages = {
  dashboard: {
    desktopSrc: "/images/public/heroes/dashboard-desktop.webp",
    mobileSrc: "/images/public/heroes/dashboard-mobile.webp",
    alt: "Главный экран системы управления Mercurio",
    sizes: "(max-width: 767px) calc(100vw - 32px), (max-width: 900px) min(720px, calc(100vw - 32px)), (max-width: 1320px) calc((100vw - 120px) * 0.5), 660px"
  },
  builder: {
    desktopSrc: "/images/public/heroes/builder-desktop.webp",
    mobileSrc: "/images/public/heroes/builder-mobile.webp",
    alt: "Редактор сайтов Mercurio на компьютере и смартфоне",
    sizes: "(max-width: 767px) calc(100vw - 32px), (max-width: 1320px) calc(100vw - 120px), 610px"
  },
  store: {
    desktopSrc: "/images/public/heroes/store-desktop.webp",
    mobileSrc: "/images/public/heroes/store-mobile.webp",
    alt: "Управление интернет-магазином Mercurio",
    sizes: "(max-width: 767px) calc(100vw - 32px), (max-width: 900px) min(720px, calc(100vw - 32px)), (max-width: 1320px) calc((100vw - 120px) * 0.5), 660px"
  }
} as const;
