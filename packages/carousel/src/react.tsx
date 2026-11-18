"use client";

import {
  type ComponentPropsWithoutRef,
  type Ref,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  type Carousel as CarouselController,
  type CarouselOptions,
  type CarouselState,
  createCarousel,
} from "./index.js";

const emptyState: CarouselState = Object.freeze({
  index: 0,
  count: 0,
  progress: 0,
  canPrev: false,
  canNext: false,
  isPlaying: false,
  isDragging: false,
  isLooping: false,
  isPaused: false,
  pageCount: 0,
  pageIndex: 0,
  pages: Object.freeze([]),
  visible: Object.freeze([]),
  autoplayProgress: 0,
  seamSlides: Object.freeze([]),
});

function shallowEqual(a: unknown, b: unknown) {
  if (Object.is(a, b)) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length &&
    keys.every(
      (key) =>
        Object.hasOwn(b, key) &&
        Object.is(
          (a as Record<string, unknown>)[key],
          (b as Record<string, unknown>)[key],
        ),
    )
  );
}

export function useCarousel(options: CarouselOptions = {}) {
  const [viewport, setViewport] = useState<HTMLElement | null>(null);
  const [carousel, setCarousel] = useState<CarouselController | null>(null);
  const latest = useRef(options);
  latest.current = options;
  const applied = useRef<CarouselOptions>({});
  const { slides } = options;
  useEffect(() => {
    if (!viewport) return;
    applied.current = latest.current;
    const instance = createCarousel(viewport, { ...latest.current, slides });
    setCarousel(instance);
    return () => instance.destroy();
  }, [viewport, slides]);
  useEffect(() => {
    if (!carousel) return;
    const previous = applied.current as Record<string, unknown>;
    const next = options as Record<string, unknown>;
    const changed: Record<string, unknown> = {};
    for (const key of new Set([...Object.keys(previous), ...Object.keys(next)]))
      if (key !== "slides" && !shallowEqual(previous[key], next[key]))
        changed[key] = next[key];
    applied.current = options;
    if (Object.keys(changed).length) carousel.setOptions(changed);
  });
  return { ref: setViewport, carousel };
}

export function useCarouselState<Selected>(
  carousel: CarouselController | null,
  selector: (state: CarouselState) => Selected,
): Selected {
  const cache = useRef<{
    state: CarouselState;
    selector: (state: CarouselState) => Selected;
    value: Selected;
  }>(null);
  const select = (state: CarouselState) => {
    const cached = cache.current;
    if (cached?.state === state && cached.selector === selector)
      return cached.value;
    const value = selector(state);
    const kept =
      cached && shallowEqual(cached.value, value) ? cached.value : value;
    cache.current = { state, selector, value: kept };
    return kept;
  };
  const subscribe = useCallback(
    (update: () => void) => carousel?.subscribe(update) ?? (() => {}),
    [carousel],
  );
  return useSyncExternalStore(
    subscribe,
    () => select(carousel?.getState() ?? emptyState),
    () => select(emptyState),
  );
}

export interface CarouselProps extends ComponentPropsWithoutRef<"div"> {
  options?: CarouselOptions;
  ref?: Ref<HTMLDivElement>;
}

export function Carousel({
  options,
  ref,
  className,
  children,
  ...props
}: CarouselProps) {
  const { ref: setViewport } = useCarousel(options);
  const mergedRef = useCallback(
    (element: HTMLDivElement | null) => {
      setViewport(element);
      if (typeof ref === "function") return ref(element);
      if (ref) ref.current = element;
    },
    [ref, setViewport],
  );
  return (
    <div
      {...props}
      ref={mergedRef}
      className={["re-carousel", className].filter(Boolean).join(" ")}
    >
      {children}
    </div>
  );
}
