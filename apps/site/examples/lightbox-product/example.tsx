"use client";
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

function AddToBag() {
  const [added, setAdded] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <Button
      type="button"
      disabled={!ready}
      className={cn(
        "re-buy h-10",
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
      <div className="flex flex-col self-center p-8 max-sm:p-6">
        <h2 className="text-2xl leading-8 font-semibold tracking-tight">
          {cover.caption} print
        </h2>
        <p className="mt-3 text-ui leading-6 text-muted-foreground text-pretty">
          A quiet summit in pink haze, above a sea of cloud.
        </p>
        <div className="mt-6 flex items-center justify-between gap-4">
          <span className="text-lg leading-7 tabular-nums">$84</span>
          <AddToBag />
        </div>
      </div>
    </div>
  );
}
