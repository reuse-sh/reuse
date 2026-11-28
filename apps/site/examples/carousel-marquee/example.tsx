"use client";
import { useCarousel } from "@reuse-sh/carousel/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { runMarquee } from "./marquee";
import "./marquee.css";

const studios = [
  { name: "Sorrelhaw", className: "font-display text-xl italic" },
  { name: "KITTLEMOOR", className: "text-sm font-semibold tracking-widest" },
  { name: "Drevenhal", className: "text-lg font-medium tracking-tight" },
  { name: "fennodrift", className: "font-display text-xl" },
  { name: "TESKARD", className: "text-base font-bold tracking-wide" },
  { name: "Oorvik", className: "text-lg font-light tracking-wide" },
  { name: "Quellmarsh", className: "font-display text-lg font-semibold" },
  { name: "TAMBERLODE", className: "text-sm font-medium tracking-widest" },
  { name: "Brindlefield", className: "text-lg font-semibold tracking-tight" },
  { name: "Wexmorrow", className: "font-display text-xl italic font-light" },
];

export function Example() {
  const { ref, carousel } = useCarousel({ loop: true });
  const [paused, setPaused] = useState(false);
  const strip = useRef<HTMLElement | null>(null);
  const setStrip = useCallback(
    (element: HTMLElement | null) => {
      strip.current = element;
      ref(element);
    },
    [ref],
  );
  useEffect(() => {
    if (!carousel || !strip.current || paused) return;
    return runMarquee(carousel, strip.current, { speed: 40 });
  }, [carousel, paused]);
  return (
    <div className="w-full min-w-0 grid content-center gap-4 py-8">
      <div className="flex items-center justify-between gap-4 px-6">
        <h2 className="text-label text-subtle-foreground">Sample wordmarks</h2>
        <Button
          variant="ghost"
          size="sm"
          className="-my-1 -me-2 motion-reduce:hidden"
          disabled={!carousel}
          onClick={() => setPaused((value) => !value)}
        >
          {paused ? "Play" : "Pause"}
        </Button>
      </div>
      <section
        ref={setStrip}
        className="re-carousel re-mq-strip"
        aria-label="Wordmarks"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: the scrolling region must support keyboard scrolling.
        tabIndex={0}
      >
        {studios.map((studio) => (
          <span
            key={studio.name}
            className={`re-carousel__slide re-mq-logo ${studio.className}`}
            data-carousel-slide
          >
            {studio.name}
          </span>
        ))}
      </section>
    </div>
  );
}
