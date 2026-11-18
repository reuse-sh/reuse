"use client";

import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  createLightbox,
  type Lightbox as LightboxController,
  type LightboxOptions,
  type LightboxState,
} from "./index.js";

export interface LightboxHandle extends LightboxController {
  state: LightboxState;
}

export function useLightbox(options: LightboxOptions = {}): LightboxHandle {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const controller = useRef<LightboxController | null>(null);
  const [state, setState] = useState<LightboxState>({
    isOpen: false,
    isClosing: false,
    isAnimating: false,
    index: 0,
    count: 0,
    item: undefined,
    canPrev: false,
    canNext: false,
    isPlaying: false,
    zoom: { scale: 1, x: 0, y: 0 },
    chrome: "shown",
  });
  const handle = useMemo<LightboxController>(() => {
    const ensure = () => {
      if (!controller.current) {
        controller.current = createLightbox(optionsRef.current);
        controller.current.subscribe(setState);
      }
      return controller.current;
    };
    return {
      open: (items, index) => {
        const lightbox = ensure();
        lightbox.setOptions(optionsRef.current);
        lightbox.open(items, index);
      },
      close: () => controller.current?.close() ?? Promise.resolve(),
      next: () => controller.current?.next(),
      prev: () => controller.current?.prev(),
      goTo: (index) => controller.current?.goTo(index),
      zoomTo: (scale, focus) => controller.current?.zoomTo(scale, focus),
      toggleZoom: (focus) => controller.current?.toggleZoom(focus),
      play: () => controller.current?.play(),
      pause: () => controller.current?.pause(),
      getState: () => ensure().getState(),
      subscribe: (listener, options) => ensure().subscribe(listener, options),
      on: (type, listener, options) => ensure().on(type, listener, options),
      append: (items) => controller.current?.append(items),
      setItems: (items, index) => controller.current?.setItems(items, index),
      setOptions: (next) => ensure().setOptions(next),
      getSlide: (index) => controller.current?.getSlide(index) ?? null,
      destroy: () => {
        controller.current?.destroy();
        controller.current = null;
      },
    };
  }, []);
  const { loop } = options;
  useEffect(() => {
    controller.current?.setOptions({ loop });
  }, [loop]);
  useEffect(
    () => () => {
      controller.current?.destroy();
      controller.current = null;
    },
    [],
  );
  return { ...handle, state };
}

export function Lightbox({
  children,
  ...options
}: LightboxOptions & { children: (lightbox: LightboxHandle) => ReactNode }) {
  return children(useLightbox(options));
}
