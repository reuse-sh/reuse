import type { Carousel } from "@reuse-sh/carousel";
import type { CarouselInternals } from "@reuse-sh/carousel/internal";
import type { Lightbox } from "./index.js";

const carouselInternals = Symbol.for("@reuse-sh/carousel internals");

export interface ConnectCarouselOptions {
  slideOf?: (index: number) => number;
}

export function connectCarousel(
  lightbox: Lightbox,
  carousel: Carousel,
  { slideOf = (index) => index }: ConnectCarouselOptions = {},
): () => void {
  const strip = (
    carousel as unknown as Record<symbol, CarouselInternals | undefined>
  )[carouselInternals];
  const hold = (isHeld: boolean) => carousel.hold("lightbox", isHeld);
  const follow = ({ index }: { index: number }) => {
    const slide = slideOf(index);
    const visible =
      strip?.willKeepVisible?.(slide) ??
      carousel.getState().visible.includes(slide);
    if (!visible) carousel.goTo(slide, "instant");
  };
  const stops = [
    lightbox.on("open", () => hold(true)),
    lightbox.on("settle", follow),
    lightbox.on("beforeclose", follow),
    lightbox.on("closed", () => hold(false)),
  ];
  if (lightbox.getState().isOpen) hold(true);
  return () => {
    for (const stop of stops) stop();
    hold(false);
  };
}
