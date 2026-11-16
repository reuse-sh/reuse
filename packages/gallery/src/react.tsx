"use client";

import {
  type ComponentPropsWithoutRef,
  forwardRef,
  type Ref,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  createJustifiedGallery,
  createMasonry,
  type JustifiedGallery as JustifiedGalleryController,
  type JustifiedGalleryOptions,
  type Masonry as MasonryController,
} from "./index.js";

export function useJustifiedGallery(options: JustifiedGalleryOptions = {}) {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [gallery, setGallery] = useState<JustifiedGalleryController | null>(
    null,
  );
  const { tolerance, lastRow, maxRows } = options;
  useEffect(() => {
    if (!element) return;
    const instance = createJustifiedGallery(element, {
      tolerance,
      lastRow,
      maxRows,
    });
    setGallery(instance);
    return () => {
      instance.destroy();
      setGallery(null);
    };
  }, [element, tolerance, lastRow, maxRows]);
  return { ref: setElement, gallery };
}

export function useMasonry() {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [masonry, setMasonry] = useState<MasonryController | null>(null);
  useEffect(() => {
    if (!element) return;
    const instance = createMasonry(element);
    setMasonry(instance);
    return () => {
      instance.destroy();
      setMasonry(null);
    };
  }, [element]);
  return { ref: setElement, masonry };
}

function useMergedRef<T>(
  own: (element: T | null) => void,
  ref: Ref<T> | undefined,
) {
  return useCallback(
    (element: T | null) => {
      own(element);
      if (typeof ref === "function") return ref(element);
      if (ref) ref.current = element;
    },
    [own, ref],
  );
}

function useReady<T>(instance: T | null, onReady?: (instance: T) => void) {
  const ready = useRef(onReady);
  ready.current = onReady;
  useEffect(() => {
    if (instance) ready.current?.(instance);
  }, [instance]);
}

export interface JustifiedGalleryProps extends ComponentPropsWithoutRef<"div"> {
  options?: JustifiedGalleryOptions;
  onReady?: (gallery: JustifiedGalleryController) => void;
}

// forwardRef rather than a ref prop, so the components run on React 18, the
// version WordPress ships, as well as on 19.
export const JustifiedGallery = forwardRef<
  HTMLDivElement,
  JustifiedGalleryProps
>(function JustifiedGallery(
  { options, onReady, className, children, ...props },
  ref,
) {
  const { ref: setElement, gallery } = useJustifiedGallery(options);
  useReady(gallery, onReady);
  const mergedRef = useMergedRef(setElement, ref);
  return (
    <div
      {...props}
      ref={mergedRef}
      className={["re-justified", className].filter(Boolean).join(" ")}
    >
      {children}
    </div>
  );
});

export interface MasonryProps extends ComponentPropsWithoutRef<"div"> {
  onReady?: (masonry: MasonryController) => void;
}

export const Masonry = forwardRef<HTMLDivElement, MasonryProps>(
  function Masonry({ onReady, className, children, ...props }, ref) {
    const { ref: setElement, masonry } = useMasonry();
    useReady(masonry, onReady);
    const mergedRef = useMergedRef(setElement, ref);
    return (
      <div
        {...props}
        ref={mergedRef}
        className={["re-masonry", className].filter(Boolean).join(" ")}
      >
        {children}
      </div>
    );
  },
);
