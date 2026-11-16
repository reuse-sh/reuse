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
    zoom: { scale: 1, x: 0, y: 0 },
    chrome: "shown",
  });
  const handle = useMemo<LightboxController>(() => {
    // The controller reads this object again at every open, so it carries the latest render's options.
    const live: LightboxOptions = {};
    const onChange = (next: LightboxState) => {
      setState(next);
      optionsRef.current.onChange?.(next);
    };
    const ensure = () => {
      for (const key of Object.keys(live))
        delete live[key as keyof LightboxOptions];
      Object.assign(live, optionsRef.current, { onChange });
      controller.current ??= createLightbox(live);
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
      on: (type, listener) => ensure().on(type, listener),
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
