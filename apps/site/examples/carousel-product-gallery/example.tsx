"use client";
import { connectThumbnails } from "@reuse-sh/carousel";
import { useCarousel } from "@reuse-sh/carousel/react";
import { bindLightboxGallery } from "@reuse-sh/lightbox";
import { connectCarousel } from "@reuse-sh/lightbox/carousel";
import { useLightbox } from "@reuse-sh/lightbox/react";
import { useEffect, useRef, useState } from "react";
import { Picture } from "@/components/picture";
import { Button } from "@/components/ui/button";
import { photo } from "@/lib/photos";
import { cn } from "@/lib/utils";
import "./gallery.css";

const prints = [
  photo("open-sea"),
  photo("sailboat"),
  photo("golden-calm"),
  photo("shoreline"),
  photo("dusk-beach"),
];

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
        "h-10",
        added && "bg-secondary-foreground hover:bg-secondary-foreground",
      )}
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
  const gallery = useRef<HTMLDivElement>(null);
  const viewer = useLightbox({ thumbnails: "bottom" });
  const main = useCarousel({ loop: false });
  const thumbnails = useCarousel({ loop: false });
  useEffect(() => {
    if (main.carousel && thumbnails.carousel)
      return connectThumbnails(main.carousel, thumbnails.carousel);
  }, [main.carousel, thumbnails.carousel]);
  useEffect(() => {
    if (main.carousel) return connectCarousel(viewer, main.carousel);
  }, [viewer, main.carousel]);
  useEffect(() => {
    if (gallery.current) return bindLightboxGallery(gallery.current, viewer);
  }, [viewer]);
  return (
    <div className="re-example re-pg grid min-h-demo w-full min-w-0">
      <div className="flex min-w-0 flex-col">
        <div ref={gallery} className="grid min-h-80 flex-1 max-sm:min-h-0">
          <section
            ref={main.ref}
            className="re-carousel re-pg-main"
            aria-label="Photos"
          >
            {prints.map((print) => (
              <a
                key={print.id}
                href={print.src}
                className="re-carousel__slide relative block bg-media cursor-zoom-in focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring max-sm:aspect-landscape"
                data-carousel-slide
                data-lightbox-caption={print.caption}
              >
                <Picture
                  photo={print}
                  sizes="(max-width: 600px) 100vw, 400px"
                  className="absolute inset-0 size-full object-cover"
                />
              </a>
            ))}
          </section>
        </div>
        <section
          ref={thumbnails.ref}
          className="re-carousel re-pg-thumbs px-4 py-3"
          aria-label="Thumbnails"
        >
          {prints.map((print) => (
            <button
              key={print.id}
              type="button"
              className="re-carousel__slide re-pg-thumb aspect-landscape overflow-hidden rounded-control bg-media p-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              data-carousel-slide
              aria-label={`Show ${print.caption}`}
            >
              <Picture
                photo={print}
                sizes="112px"
                alt=""
                className="size-full object-cover"
              />
            </button>
          ))}
        </section>
      </div>
      <div className="flex flex-col self-center p-8 max-sm:p-6">
        <h2 className="text-2xl leading-8 font-semibold tracking-tight">
          Coast print set
        </h2>
        <p className="mt-3 text-ui leading-6 text-muted-foreground text-pretty">
          Five sea prints, from open water to waves on a beach at dusk.
        </p>
        <div className="mt-6 flex items-center justify-between gap-4">
          <span className="text-lg leading-7 tabular-nums">$240</span>
          <AddToBag />
        </div>
      </div>
    </div>
  );
}
