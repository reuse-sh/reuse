import type { CarouselStrings } from "./index.js";

export interface Page {
  readonly index: number;
  readonly at: number;
}

// The controls entry and connectThumbnails reach the strip through a Symbol.for key on the controller, so the public controller stays the contract's.
// Each entry spells the key itself: a shared runtime module would become a third file in the browser build.
export interface CarouselInternals {
  readonly viewport: HTMLElement;
  readonly strings: CarouselStrings;
  slides(): readonly HTMLElement[];
  pages(): readonly Page[];
  requested(): boolean;
  align(): "start" | "center" | undefined;
  goTo(index: number, behavior?: ScrollBehavior, announce?: boolean): void;
}
