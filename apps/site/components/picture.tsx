import type { ComponentProps } from "react";
import type { Photo } from "@/lib/photos";

export function Picture({
  photo,
  sizes,
  className,
  alt = photo.alt,
  ...props
}: Omit<ComponentProps<"img">, "src" | "srcSet" | "width" | "height"> & {
  photo: Photo;
  sizes: string;
}) {
  return (
    <picture className="contents">
      {photo.avifSrcSet ? (
        <source type="image/avif" srcSet={photo.avifSrcSet} sizes={sizes} />
      ) : null}
      <img
        className={className}
        src={photo.src}
        srcSet={photo.srcSet}
        sizes={sizes}
        alt={alt}
        width={photo.width}
        height={photo.height}
        draggable={false}
        data-lightbox-srcset={photo.srcSet}
        data-lightbox-width={photo.width}
        data-lightbox-height={photo.height}
        {...props}
      />
    </picture>
  );
}
