import type { CarouselStrings } from "./index.js";

// Each entry spells the key itself: a shared runtime module would become a third file in the browser build.
/**
 * Not public API. The hooks the controls binder and the lightbox use to drive a carousel.
 * It may change in any release, including a patch.
 */
export interface CarouselInternals {
  readonly viewport: HTMLElement;
  readonly strings: CarouselStrings;
  slides(): readonly HTMLElement[];
  pagePositions(): readonly number[];
  settling(): boolean;
  willKeepVisible(index: number): boolean;
  autoplays(): boolean;
  onOptions(listener: () => void): () => void;
  align(): "start" | "center" | undefined;
  goTo(index: number, behavior?: ScrollBehavior, announce?: boolean): void;
  silence(): void;
  passClicks(): () => void;
  keepLaps(slides: readonly HTMLElement[]): void;
}
