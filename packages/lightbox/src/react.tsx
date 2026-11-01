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
    index: 0,
    count: 0,
    zoom: { scale: 1, x: 0, y: 0 },
  });
  const handle = useMemo<LightboxController>(() => {
    const ensure = () => {
      if (!controller.current) {
        controller.current = createLightbox({
          ...optionsRef.current,
          onChange: (next) => {
            setState(next);
            optionsRef.current.onChange?.(next);
          },
        });
      }
      return controller.current;
    };
    return {
      open: (items, index) => ensure().open(items, index),
      close: () => controller.current?.close() ?? Promise.resolve(),
      next: () => controller.current?.next(),
      prev: () => controller.current?.prev(),
      goTo: (index) => controller.current?.goTo(index),
      zoomTo: (scale, focus) => controller.current?.zoomTo(scale, focus),
      toggleZoom: (focus) => controller.current?.toggleZoom(focus),
      getState: () => ensure().getState(),
      subscribe: (listener) => ensure().subscribe(listener),
      destroy: () => {
        controller.current?.destroy();
        controller.current = null;
      },
    };
  }, []);
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
