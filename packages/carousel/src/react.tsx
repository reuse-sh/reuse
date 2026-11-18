"use client";

import {
  type ComponentPropsWithoutRef,
  type Ref,
  useCallback,
  useEffect,
  useRef,
  useState,
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

export function useCarousel(options: CarouselOptions = {}) {
  const [viewport, setViewport] = useState<HTMLElement | null>(null);
  const [carousel, setCarousel] = useState<CarouselController | null>(null);
  const [state, setState] = useState<CarouselState>(emptyState);
  const onChange = useRef(options.onChange);
  onChange.current = options.onChange;
  const latest = useRef(options);
  latest.current = options;
  const {
    slides,
    align,
    loop,
    drag,
    group,
    autoplay,
    releaseMotion,
    releaseDuration,
    moveMotion,
    wheel,
  } = options;
  useEffect(() => {
    if (!viewport) return;
    const initial = latest.current;
    const instance = createCarousel(viewport, {
      slides,
      align: initial.align,
      loop: initial.loop,
      drag: initial.drag,
      group: initial.group,
      autoplay: initial.autoplay,
      releaseMotion,
      releaseDuration,
      moveMotion,
      wheel,
      strings: initial.strings,
      onChange: (next) => {
        setState(next);
        onChange.current?.(next);
      },
    });
    setCarousel(instance);
    setState(instance.getState());
    return () => instance.destroy();
  }, [viewport, slides, releaseMotion, releaseDuration, moveMotion, wheel]);
  useEffect(() => {
    carousel?.setOptions({ autoplay, loop, group, align, drag });
  }, [carousel, autoplay, loop, group, align, drag]);
  return { ref: setViewport, carousel, state };
}

export interface CarouselProps extends ComponentPropsWithoutRef<"div"> {
  options?: CarouselOptions;
  ref?: Ref<HTMLDivElement>;
  onReady?: (carousel: CarouselController) => void;
}

export function Carousel({
  options,
  ref,
  onReady,
  className,
  children,
  ...props
}: CarouselProps) {
  const { ref: setViewport, carousel } = useCarousel(options);
  const ready = useRef(onReady);
  ready.current = onReady;
  useEffect(() => {
    if (carousel) ready.current?.(carousel);
  }, [carousel]);
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
