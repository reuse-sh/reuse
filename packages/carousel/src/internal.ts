import type { Carousel, CarouselStrings } from "./index.js";

export interface Page {
  readonly index: number;
  readonly at: number;
}

// The controls entry and connectThumbnails reach the strip through this map, so the public controller stays the contract's.
export interface CarouselInternals {
  readonly viewport: HTMLElement;
  slides(): readonly HTMLElement[];
  pages(): readonly Page[];
  requested(): boolean;
  align(): "start" | "center" | undefined;
  goTo(index: number, behavior?: ScrollBehavior, announce?: boolean): void;
}

export const internals = new WeakMap<Carousel, CarouselInternals>();

export const defaultStrings: CarouselStrings = {
  previous: "Previous slide",
  next: "Next slide",
  goTo: (index, count) => `Go to slide ${index + 1} of ${count}`,
  counter: (index, count) => `${index + 1} / ${count}`,
  slide: (index, count) => `${index + 1} of ${count}`,
  play: "Play slideshow",
  pause: "Pause slideshow",
  progress: "Slide position",
};
