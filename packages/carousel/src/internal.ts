import type { CarouselStrings } from "./index.js";

// Each entry spells the key itself: a shared runtime module would become a third file in the browser build.
export interface CarouselInternals {
  readonly viewport: HTMLElement;
  readonly strings: CarouselStrings;
  slides(): readonly HTMLElement[];
  pagePositions(): readonly number[];
  align(): "start" | "center" | undefined;
  goTo(index: number, behavior?: ScrollBehavior, announce?: boolean): void;
  silence(): void;
  passClicks(): () => void;
  keepLaps(slides: readonly HTMLElement[]): void;
}
