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

type Internals<Item extends LightboxItem> = {
  initial: LightboxState<Item>;
  release(): void;
};

function internalsOf<Item extends LightboxItem>(lightbox: Lightbox<Item>) {
  return (lightbox as { [lightboxInternals]?: Internals<Item> })[
    lightboxInternals
  ];
}

function isPlain(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

// Plain objects and arrays compare by value, everything else, functions included, by identity.
function same(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a))
    return (
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((value, index) => same(value, b[index]))
    );
  if (!isPlain(a) || !isPlain(b)) return false;
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length &&
    keys.every((key) => Object.hasOwn(b, key) && same(a[key], b[key]))
  );
}

/**
 * A lightbox for the component's lifetime. It is the same object on every render and holds no
 * React state, so the component does not re-render on lightbox changes. Effect cleanup, on
 * unmount, under StrictMode or when Activity hides the component, closes it at once and frees
 * its DOM and listeners; it is never destroyed, so an effect that runs again opens it again. An
 * option that changes reaches it through setOptions after the render; plain objects and arrays
 * compare by value and functions by identity. container is read once.
 */
export function useLightbox<Item extends LightboxItem = LightboxItem>(
  options: LightboxOptions<Item> = {},
): Lightbox<Item> {
  const [lightbox] = useState(() => createLightbox(options));
  const applied = useRef(options);
  useEffect(() => {
    const changed: Partial<LightboxOptions<Item>> = {};
    const keys = new Set([
      ...Object.keys(options),
      ...Object.keys(applied.current),
    ]) as Set<keyof LightboxOptions<Item>>;
    for (const key of keys)
      if (key !== "container" && !same(options[key], applied.current[key]))
        Object.assign(changed, { [key]: options[key] });
    applied.current = options;
    if (Object.keys(changed).length) lightbox.setOptions(changed);
  });
  useEffect(() => () => internalsOf(lightbox)?.release(), [lightbox]);
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
  const initial = internalsOf(lightbox)?.initial ?? lightbox.getState();
  return useSyncExternalStore(
    lightbox.subscribe,
    () => pick(client, lightbox.getState()),
    () => pick(server, initial),
  );
}
