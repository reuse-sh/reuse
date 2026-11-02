"use client";
import { createLightbox, type LightboxItem } from "@reuse-sh/lightbox";
import { type ReactNode, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import "./mechanics.css";

const photos = [
  {
    id: "lake",
    src: "https://reuse.sh/images/marble-lake.svg",
    caption: "Coral sky",
    alt: "A soft marble texture in coral, sand and blue",
    width: 1600,
    height: 1200,
  },
  {
    id: "mountains",
    src: "https://reuse.sh/images/marble-mountains.svg",
    caption: "Mint and ember",
    alt: "A soft marble texture in mint, blue and orange",
    width: 1600,
    height: 1200,
  },
  {
    id: "coast",
    src: "https://reuse.sh/images/marble-coast.svg",
    caption: "Lilac bloom",
    alt: "A soft marble texture in lilac, rose and sea green",
    width: 1600,
    height: 1200,
  },
  {
    id: "forest",
    src: "https://reuse.sh/images/marble-forest.svg",
    caption: "Sand and fern",
    alt: "A soft marble texture in sand, green and violet",
    width: 1600,
    height: 1200,
  },
  {
    id: "night",
    src: "https://reuse.sh/images/marble-night.svg",
    caption: "Blue hour",
    alt: "A soft marble texture in blue, lilac and gold",
    width: 1600,
    height: 1200,
  },
  {
    id: "woods",
    src: "https://reuse.sh/images/marble-woods.svg",
    caption: "Amber",
    alt: "A soft marble texture in orange, yellow and blue",
    width: 1600,
    height: 1200,
  },
];
const [lake, mountains, , forest, night, woods] = photos;
const paths = {
  close: ["M18 6L6.00081 17.9992M17.9992 18L6 6.00085"],
  prev: ["m15 18-6-6 6-6"],
  next: ["m9 18 6-6-6-6"],
  zoom: [
    "M18.5016 19.1217L21 21.6217M20 15.1217C20 12.0842 17.5376 9.62173 14.5 9.62173C11.4624 9.62173 9 12.0842 9 15.1217C9 18.1593 11.4624 20.6217 14.5 20.6217C17.5376 20.6217 20 18.1593 20 15.1217Z",
    "M14.5 13.1217V17.1217M16.5 15.1217H12.5",
    "M10 3.62173H14M3 10.6217V14.6217M6.5 21.6217C4.567 21.6217 3 20.0547 3 18.1217M17.5 3.62173C19.433 3.62173 21 5.18873 21 7.12173M3 7.12173C3 5.18873 4.567 3.62173 6.5 3.62173",
  ],
};
function icon(name: keyof typeof paths) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  for (const [key, value] of Object.entries({
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": "true",
  }))
    svg.setAttribute(key, value);
  for (const d of paths[name]) {
    const path = document.createElementNS(svg.namespaceURI, "path");
    for (const [key, value] of Object.entries({
      d,
      stroke: "currentColor",
      "stroke-width": name === "prev" || name === "next" ? "1.8" : "1.5",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    }))
      path.setAttribute(key, value);
    svg.append(path);
  }
  return svg;
}
const lightboxIcons = {
  close: () => icon("close"),
  prev: () => icon("prev"),
  next: () => icon("next"),
  zoom: () => icon("zoom"),
};
type Photo = (typeof photos)[number];

function PhotoButton({
  photo,
  className,
  hidden,
  children,
}: {
  photo: Photo;
  className?: string;
  hidden?: boolean;
  children?: ReactNode;
}) {
  return (
    <a
      href={photo.src}
      className={cn("re-photo", className)}
      data-photo={photo.id}
      aria-label={`Open ${photo.caption}`}
      hidden={hidden}
      tabIndex={hidden ? -1 : undefined}
    >
      {/* biome-ignore lint/performance/noImgElement: marble SVGs are served as is; the lightbox reads the rendered image as its origin. */}
      <img
        src={photo.src}
        alt={photo.alt}
        width={photo.width}
        height={photo.height}
        loading="lazy"
        draggable={false}
      />
      {children}
    </a>
  );
}

function PhotoLightbox({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const lightbox = createLightbox({
      thumbnails: true,
      icons: lightboxIcons,
      className: "re-lightbox-demo",
    });
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const trigger = target.closest<HTMLElement>("[data-photo]");
      if (!trigger || !node.contains(trigger)) return;
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      event.preventDefault();
      const group = trigger.closest("[data-photo-group]") ?? node;
      const triggers = [...group.querySelectorAll<HTMLElement>("[data-photo]")];
      const items = triggers.map((button): LightboxItem => {
        const photo =
          photos.find((entry) => entry.id === button.dataset.photo) ??
          photos[0];
        const image = button.querySelector("img");
        return {
          src: photo.src,
          alt: photo.alt,
          caption: photo.caption,
          width: photo.width,
          height: photo.height,
          thumbnailSrc: photo.src,
          previewSrc: image?.currentSrc || photo.src,
          origin: button.hidden ? null : image,
        };
      });
      lightbox.open(items, triggers.indexOf(trigger));
    };
    node.addEventListener("click", onClick);
    return () => {
      node.removeEventListener("click", onClick);
      lightbox.destroy();
    };
  }, []);
  return (
    <div ref={root} data-gallery="" className={className}>
      {children}
    </div>
  );
}
export function Example() {
  const [hero, a, b, c, d] = [mountains, forest, night, woods, lake];
  return (
    <div className="re-example w-full min-w-0">
      <PhotoLightbox className="re-example">
        <article className="re-journal mt-11" data-photo-group>
          <p className="re-date text-label text-subtle-foreground">
            October 2026 · 5 prints
          </p>
          <h2 className="re-j-title mt-1.5 text-2xl leading-8 font-semibold tracking-tight text-balance">
            Six colors in one tray of water
          </h2>
          <p className="re-j-text max-w-xl mt-4 text-body leading-7 text-muted-foreground text-pretty">
            Every print in this series starts as a tray of water and a few drops
            of ink. A comb pulls the colors into bands, and a sheet of paper
            lifts them off in one pass.
          </p>
          <figure className="re-j-fig mt-7">
            <PhotoButton
              photo={hero}
              className="re-j-hero w-full aspect-video"
            />
            <figcaption>{hero.caption}</figcaption>
          </figure>
          <div className="re-j-pair grid grid-cols-2 gap-2 mt-7">
            <PhotoButton photo={a} />
            <PhotoButton photo={b} />
          </div>
          <p className="re-j-text max-w-xl mt-4 text-body leading-7 text-muted-foreground text-pretty">
            No two sheets come out alike. We kept the five where the colors
            stayed apart, and printed them on matte cotton paper at the size
            they were made.
          </p>
          <div className="re-j-wide grid gap-2 h-64 max-sm:h-40 mt-7">
            <PhotoButton photo={c} />
            <PhotoButton photo={d} />
          </div>
        </article>
      </PhotoLightbox>
    </div>
  );
}
