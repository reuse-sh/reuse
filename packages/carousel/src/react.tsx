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
});

export function useCarousel(options: CarouselOptions = {}) {
  const [viewport, setViewport] = useState<HTMLElement | null>(null);
  const [carousel, setCarousel] = useState<CarouselController | null>(null);
  const [state, setState] = useState<CarouselState>(emptyState);
  const onChange = useRef(options.onChange);
  onChange.current = options.onChange;
  const {
    slides,
    align,
    loop,
    drag,
    group,
    autoplay,
    releaseMotion,
    releaseDuration,
  } = options;
  useEffect(() => {
    if (!viewport) return;
    const instance = createCarousel(viewport, {
      slides,
      align,
      loop,
      drag,
      group,
      autoplay,
      releaseMotion,
      releaseDuration,
      onChange: (next) => {
        setState(next);
        onChange.current?.(next);
      },
    });
    setCarousel(instance);
    setState(instance.getState());
    return () => instance.destroy();
  }, [
    viewport,
    slides,
    align,
    loop,
    drag,
    group,
    autoplay,
    releaseMotion,
    releaseDuration,
  ]);
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
