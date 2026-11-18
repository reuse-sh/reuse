"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  createLightbox,
  type Lightbox,
  type LightboxItem,
  type LightboxOptions,
  type LightboxState,
} from "./index.js";

const lightboxInternals = Symbol.for("@reuse-sh/lightbox internals");
const destroyed = new WeakSet<object>();

/**
 * A lightbox for the component's lifetime. It is the same object on every render and holds no
 * React state, so the component does not re-render on lightbox changes; it is destroyed on
 * unmount. Changed options reach it through setOptions after the render; container is read once.
 */
export function useLightbox<Item extends LightboxItem = LightboxItem>(
  options: LightboxOptions<Item> = {},
): Lightbox<Item> {
  const [lightbox, setLightbox] = useState(() => createLightbox(options));
  const latest = useRef(options);
  const applied = useRef(options);
  useEffect(() => {
    latest.current = options;
    const changed: Partial<LightboxOptions<Item>> = {};
    const keys = new Set([
      ...Object.keys(options),
      ...Object.keys(applied.current),
    ]) as Set<keyof LightboxOptions<Item>>;
    for (const key of keys)
      if (key !== "container" && !Object.is(options[key], applied.current[key]))
        Object.assign(changed, { [key]: options[key] });
    applied.current = options;
    if (Object.keys(changed).length) lightbox.setOptions(changed);
  });
  useEffect(() => {
    // StrictMode runs the cleanup once before the real mount; that run replaces the lightbox.
    if (destroyed.has(lightbox)) {
      applied.current = latest.current;
      setLightbox(createLightbox(latest.current));
      return;
    }
    return () => {
      destroyed.add(lightbox);
      lightbox.destroy();
    };
  }, [lightbox]);
  return lightbox;
}

type Selection<Item extends LightboxItem, Selected> = {
  state: LightboxState<Item>;
  selector: (state: LightboxState<Item>) => Selected;
  value: Selected;
} | null;

/**
 * The part of a lightbox's state that selector picks, read with useSyncExternalStore. The
 * component re-renders when the selected value changes by Object.is, so a selector that builds
 * an object re-renders on each state change but never loops. The server and the hydrating render
 * read the lightbox's state at creation, also when the lightbox opened before a boundary
 * hydrates.
 */
export function useLightboxState<Item extends LightboxItem, Selected>(
  lightbox: Lightbox<Item>,
  selector: (state: LightboxState<Item>) => Selected,
): Selected {
  // A cached value depends only on its state and selector, so an entry a discarded render
  // wrote is still right for both.
  const client = useRef<Selection<Item, Selected>>(null);
  const server = useRef<Selection<Item, Selected>>(null);
  const pick = (
    cache: { current: Selection<Item, Selected> },
    state: LightboxState<Item>,
  ) => {
    const last = cache.current;
    if (last && last.state === state && last.selector === selector)
      return last.value;
    const value = selector(state);
    cache.current = { state, selector, value };
    return value;
  };
  const initial =
    (
      lightbox as {
        [lightboxInternals]?: { initial: LightboxState<Item> };
      }
    )[lightboxInternals]?.initial ?? lightbox.getState();
  return useSyncExternalStore(
    lightbox.subscribe,
    () => pick(client, lightbox.getState()),
    () => pick(server, initial),
  );
}
