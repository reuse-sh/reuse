import type { CarouselStrings } from "./index.js";

export interface Page {
  readonly index: number;
  readonly at: number;
}

// Each entry spells the key itself: a shared runtime module would become a third file in the browser build.
export interface CarouselInternals {
  readonly viewport: HTMLElement;
  readonly strings: CarouselStrings;
  slides(): readonly HTMLElement[];
  pages(): readonly Page[];
  requested(): boolean;
  onRequest(listener: () => void): () => void;
  align(): "start" | "center" | undefined;
  goTo(index: number, behavior?: ScrollBehavior, announce?: boolean): void;
  silence(): void;
  passClicks(): () => void;
  keepLaps(slides: readonly HTMLElement[]): void;
}
