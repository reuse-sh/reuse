"use client";
import { createMovingHighlight } from "@reuse-sh/interactions";
import { createLightbox, type LightboxItem } from "@reuse-sh/lightbox";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import "./mechanics.css";

const photos = [
  {
    id: "lake",
    src: "/images/marble-lake.webp",
    caption: "Coral sky",
    alt: "A soft marble texture in coral, sand and blue",
    width: 2400,
    height: 1800,
  },
  {
    id: "mountains",
    src: "/images/marble-mountains.webp",
    caption: "Mint and ember",
    alt: "A soft marble texture in mint, blue and orange",
    width: 2400,
    height: 1800,
  },
  {
    id: "coast",
    src: "/images/marble-coast.webp",
    caption: "Lilac bloom",
    alt: "A soft marble texture in lilac, rose and sea green",
    width: 2400,
    height: 1800,
  },
  {
    id: "forest",
    src: "/images/marble-forest.webp",
    caption: "Sand and fern",
    alt: "A soft marble texture in sand, green and violet",
    width: 2400,
    height: 1800,
  },
  {
    id: "night",
    src: "/images/marble-night.webp",
    caption: "Blue hour",
    alt: "A soft marble texture in blue, lilac and gold",
    width: 2400,
    height: 1800,
  },
  {
    id: "woods",
    src: "/images/marble-woods.webp",
    caption: "Amber",
    alt: "A soft marble texture in orange, yellow and blue",
    width: 2400,
    height: 1800,
  },
];
const [lake, mountains, coast, , , woods] = photos;
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
      {/* biome-ignore lint/performance/noImgElement: marble photos are served as is; the lightbox reads the rendered image as its origin. */}
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
      thumbnails: "bottom",
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
function createSegmentHighlights(root: HTMLElement) {
  const selected = createMovingHighlight(root, {
    selectedSelector: "[data-current]",
    mode: "selected",
    className: "re-seg-fill",
  });
  const hover = createMovingHighlight(root, {
    selectedSelector: "[data-re-none]",
    mode: "hover",
    className: "re-seg-hover",
  });
  return () => {
    hover.destroy();
    selected.destroy();
  };
}

const sizes = [
  ["30 × 20", "$62"],
  ["40 × 30", "$84"],
  ["60 × 45", "$126"],
] as const;

function ProductOptions() {
  const [size, setSize] = useState(1);
  const [added, setAdded] = useState(false);
  const group = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!group.current) return;
    return createSegmentHighlights(group.current);
  }, []);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const [label, cost] = sizes[size];
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <>
      <p className="re-price flex flex-wrap items-baseline gap-x-2.5 gap-y-1 mt-2 text-lg leading-7 tabular-nums">
        <span>{cost}</span>
        <span className="re-meta text-label text-subtle-foreground">
          Archival paper · {label} cm
        </span>
      </p>
      <p className="re-desc mt-4 text-ui leading-6 text-muted-foreground">
        Coral, sand and blue drift across the sheet like ink on water. Printed
        to order on matte cotton paper with a 2 cm border.
      </p>
      <fieldset className="re-field min-w-0 mt-6 p-0 border-0">
        <legend className="re-label mb-2 p-0 text-caption font-medium text-secondary-foreground">
          Size
        </legend>
        <div
          ref={group}
          className="re-sizes flex gap-0.5 p-1 rounded-control bg-accent"
        >
          {sizes.map(([name], index) => (
            <label
              key={name}
              data-re-row
              data-current={index === size ? "" : undefined}
            >
              <input
                type="radio"
                name="x-size"
                className="sr-only"
                checked={index === size}
                onChange={() => setSize(index)}
              />
              {name}
            </label>
          ))}
        </div>
      </fieldset>
      <Button
        type="button"
        disabled={!ready}
        className={cn(
          "re-buy mt-6 h-10",
          added && "bg-secondary-foreground hover:bg-secondary-foreground",
        )}
        data-done={added ? "" : undefined}
        onClick={() => {
          setAdded(true);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => setAdded(false), 1600);
        }}
      >
        {added ? "Added to bag" : "Add to bag"}
      </Button>
    </>
  );
}

export function Example() {
  return (
    <div className="re-example w-full min-w-0">
      <div className="re-product grid gap-9 max-sm:gap-6">
        <PhotoLightbox className="re-shots">
          <div data-photo-group>
            <PhotoButton
              photo={lake}
              className="re-shot-main w-full aspect-portrait"
            />
            <div className="re-thumbs grid grid-cols-3 gap-1.5 mt-1.5">
              {[mountains, woods, coast].map((photo) => (
                <PhotoButton key={photo.id} photo={photo} />
              ))}
            </div>
          </div>
        </PhotoLightbox>
        <div className="re-info flex flex-col pt-1.5">
          <p className="re-crumb text-caption text-subtle-foreground">
            Prints <span>/</span> Marble
          </p>
          <h2 className="re-title mt-2 text-2xl leading-8 font-semibold tracking-tight">
            {lake.caption} print
          </h2>
          <ProductOptions />
          <p className="re-note mt-2.5 text-caption text-subtle-foreground text-center">
            Ships flat between two boards in 3 to 5 days.
          </p>
        </div>
      </div>
    </div>
  );
}
