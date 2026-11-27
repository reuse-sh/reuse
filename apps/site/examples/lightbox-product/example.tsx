"use client";
import { createMovingHighlight } from "@reuse-sh/interactions";
import { bindLightboxGallery } from "@reuse-sh/lightbox";
import { useLightbox } from "@reuse-sh/lightbox/react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Picture } from "@/components/picture";
import { Button } from "@/components/ui/button";
import { type Photo, photo } from "@/lib/photos";
import { cn } from "@/lib/utils";
import "./mechanics.css";

const cover = photo("pink-summit");
const views = [photo("open-sea"), photo("cloud-peak"), photo("dunes")];

function PhotoLink({
  photo,
  sizes,
  className,
}: {
  photo: Photo;
  sizes: string;
  className?: string;
}) {
  return (
    <a
      href={photo.src}
      className={cn(
        "block overflow-hidden bg-media cursor-zoom-in focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
        className,
      )}
      aria-label={`Open ${photo.caption}`}
      data-lightbox-caption={photo.caption}
    >
      <Picture photo={photo} sizes={sizes} className="size-full object-cover" />
    </a>
  );
}

function Gallery({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const lightbox = useLightbox({ thumbnails: "bottom" });
  useEffect(() => {
    if (root.current) return bindLightboxGallery(root.current, lightbox);
  }, [lightbox]);
  return (
    <div ref={root} className={className}>
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
        A quiet summit in pink haze, above a sea of cloud. Printed to order on
        matte cotton paper with a 2 cm border.
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
    <div className="re-example re-product grid min-h-demo w-full min-w-0">
      <Gallery className="relative min-h-80">
        <PhotoLink
          photo={cover}
          sizes="(max-width: 600px) 100vw, 400px"
          className="absolute inset-0"
        />
        <div className="absolute bottom-4 left-4 flex gap-2">
          {views.map((view) => (
            <PhotoLink
              key={view.id}
              photo={view}
              sizes="96px"
              className="size-12 rounded-control shadow-control ring-2 ring-card"
            />
          ))}
        </div>
      </Gallery>
      <div className="re-info flex flex-col self-center p-8 max-sm:p-6">
        <p className="re-crumb text-caption text-subtle-foreground">
          Prints <span>/</span> Landscape
        </p>
        <h2 className="re-title mt-2 text-2xl leading-8 font-semibold tracking-tight">
          {cover.caption} print
        </h2>
        <ProductOptions />
        <p className="re-note mt-2.5 text-caption text-subtle-foreground text-center">
          Ships flat between two boards in 3 to 5 days.
        </p>
      </div>
    </div>
  );
}
