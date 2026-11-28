"use client";
import { useCarousel, useCarouselState } from "@reuse-sh/carousel/react";
import { useCallback, useEffect, useRef } from "react";
import { Picture } from "@/components/picture";
import { type PhotoId, photo } from "@/lib/photos";
import "./coverflow.css";

const covers = (
  [
    "concrete-blocks",
    "white-grid",
    "shadow-wall",
    "monstera",
    "cube-and-squash",
    "yellow-bloom",
    "green-sprig",
    "quiet-stair",
  ] as const satisfies readonly PhotoId[]
).map((id) => photo(id));

export function Example() {
  const { ref, carousel } = useCarousel({ loop: true, align: "center" });
  const index = useCarouselState(carousel, (state) => state.index);
  const strip = useRef<HTMLElement | null>(null);
  const setStrip = useCallback(
    (element: HTMLElement | null) => {
      strip.current = element;
      ref(element);
    },
    [ref],
  );
  useEffect(() => {
    const element = strip.current;
    if (!carousel || !element) return;
    const center = (event: MouseEvent) => {
      const slide = (event.target as Element).closest("[data-carousel-slide]");
      const at = [...element.querySelectorAll("[data-carousel-slide]")].indexOf(
        slide as Element,
      );
      if (at >= 0) carousel.goTo(at);
    };
    element.addEventListener("click", center);
    return () => element.removeEventListener("click", center);
  }, [carousel]);
  return (
    <div className="w-full min-w-0 grid content-center gap-4 py-8">
      <section
        ref={setStrip}
        className="re-carousel re-cf-strip"
        aria-label="Covers"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: the scrolling region must support keyboard scrolling.
        tabIndex={0}
      >
        {covers.map((cover) => (
          <div
            key={cover.id}
            className="re-carousel__slide re-cf-slide"
            data-carousel-slide
          >
            <div className="re-cf-cover">
              <Picture photo={cover} sizes="14rem" loading="lazy" />
            </div>
          </div>
        ))}
      </section>
      <p className="px-6 text-center text-ui font-medium" aria-hidden="true">
        {covers[index]?.caption}
      </p>
    </div>
  );
}
