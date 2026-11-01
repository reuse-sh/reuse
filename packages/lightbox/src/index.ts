import { type Carousel, createCarousel } from "@reuse-sh/carousel";
import {
  boundZoom,
  clamp,
  contain,
  cover,
  identity,
  type Point,
  type Size,
  type Zoom,
  zoomAround,
} from "./geometry.js";

export type { Point, Rect, Size, Zoom } from "./geometry.js";

export interface LightboxItem {
  src: string;
  previewSrc?: string;
  width?: number;
  height?: number;
  alt?: string;
  caption?: string;
  thumbnailSrc?: string;
  origin?: HTMLElement | null;
}

export interface LightboxState {
  isOpen: boolean;
  isClosing: boolean;
  index: number;
  count: number;
  zoom: Zoom;
}

export interface LightboxContentContext {
  item: LightboxItem;
  index: number;
  container: HTMLElement;
  image: HTMLImageElement;
}

export interface LightboxOptions {
  container?: HTMLElement;
  label?: string;
  imageClick?: "zoom" | "close" | "none";
  doubleTapZoom?: boolean;
  maxZoom?: number;
  tapZoom?: number;
  preload?: number;
  thumbnails?: boolean;
  padding?: number;
  duration?: number;
  className?: string;
  icons?: Partial<Record<"close" | "prev" | "next" | "zoom", () => Node>>;
  renderContent?: (context: LightboxContentContext) => undefined | (() => void);
  /** Reports discrete actions, completed pointer gestures, and wheel input after 150ms idle. */
  onChange?: (state: LightboxState) => void;
}

export interface Lightbox {
  open(items: readonly LightboxItem[], index?: number): void;
  close(): Promise<void>;
  next(): void;
  prev(): void;
  goTo(index: number): void;
  zoomTo(scale: number, focus?: Point): void;
  toggleZoom(focus?: Point): void;
  /** Returns live geometry, including pointer and wheel samples before notification. */
  getState(): LightboxState;
  /** Subscribes to the settled changes reported by onChange. */
  subscribe(listener: (state: LightboxState) => void): () => void;
  destroy(): void;
}

type LoadedSlide = {
  frame: HTMLDivElement;
  image: HTMLImageElement;
  loader: HTMLImageElement;
  cancel: () => void;
};

type Session = {
  dialog: HTMLDialogElement;
  viewport: HTMLDivElement;
  backdrop: HTMLDivElement;
  slides: HTMLDivElement[];
  loaded: Map<number, LoadedSlide>;
  carousel: Carousel;
  abort: AbortController;
  animations: Set<Animation>;
  finishAnimations: Set<() => void>;
  previousFocus: HTMLElement | null;
  restoreScroll: () => void;
  hiddenOrigin?: { element: HTMLElement; visibility: string };
  counter: HTMLOutputElement;
  caption: HTMLParagraphElement;
  prev: HTMLButtonElement;
  next: HTMLButtonElement;
  zoomButton: HTMLButtonElement;
  thumbs: HTMLButtonElement[];
  pointers: Map<number, Point>;
  gesture?: {
    start: Point;
    zoom: Zoom;
    distance: number;
    midpoint: Point;
    moved: boolean;
    touch: boolean;
  };
  lastTap?: { time: number; point: Point };
  suppressClickUntil: number;
  wheelTimer?: ReturnType<typeof setTimeout>;
  fade?: {
    animation?: Animation;
    jumped: boolean;
    jump: () => void;
  };
};

const locks = new WeakMap<
  Document,
  {
    count: number;
    overflow: string;
    paddingRight: string;
    gapProperty: string;
    x: number;
    y: number;
  }
>();

function lockScroll(doc: Document) {
  const win = doc.defaultView;
  if (!win) return () => {};
  let lock = locks.get(doc);
  if (!lock) {
    lock = {
      count: 0,
      overflow: doc.body.style.overflow,
      paddingRight: doc.body.style.paddingRight,
      gapProperty: doc.documentElement.style.getPropertyValue(
        "--reuse-scrollbar-gap",
      ),
      x: win.scrollX,
      y: win.scrollY,
    };
    locks.set(doc, lock);
    const gap = Math.max(0, win.innerWidth - doc.documentElement.clientWidth);
    if (gap)
      doc.body.style.paddingRight = `${Number.parseFloat(win.getComputedStyle(doc.body).paddingRight || "0") + gap}px`;
    // Fixed elements ignore body padding; they can add this gap themselves.
    doc.documentElement.style.setProperty("--reuse-scrollbar-gap", `${gap}px`);
    doc.body.style.overflow = "hidden";
  }
  lock.count++;
  let restored = false;
  return () => {
    if (restored || !lock) return;
    restored = true;
    lock.count--;
    if (lock.count) return;
    doc.body.style.overflow = lock.overflow;
    doc.body.style.paddingRight = lock.paddingRight;
    if (lock.gapProperty)
      doc.documentElement.style.setProperty(
        "--reuse-scrollbar-gap",
        lock.gapProperty,
      );
    else doc.documentElement.style.removeProperty("--reuse-scrollbar-gap");
    if (win.scrollX !== lock.x || win.scrollY !== lock.y)
      win.scrollTo(lock.x, lock.y);
    locks.delete(doc);
  };
}

function validateItems(items: readonly LightboxItem[]) {
  if (!items.length) throw new TypeError("Lightbox needs at least one image.");
  return items.map((item) => {
    if (!item || typeof item.src !== "string" || !item.src.trim())
      throw new TypeError("Lightbox images need a source.");
    if (
      (item.width !== undefined &&
        (!Number.isFinite(item.width) || item.width <= 0)) ||
      (item.height !== undefined &&
        (!Number.isFinite(item.height) || item.height <= 0))
    )
      throw new TypeError("Image dimensions must be positive finite numbers.");
    return { ...item };
  });
}

function distance(points: Point[]) {
  return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
}

function midpoint(points: Point[]): Point {
  return {
    x: (points[0].x + points[1].x) / 2,
    y: (points[0].y + points[1].y) / 2,
  };
}

export function createLightbox(options: LightboxOptions = {}): Lightbox {
  const maxZoom = Math.max(1, options.maxZoom ?? 4);
  const tapZoom = clamp(options.tapZoom ?? 2.5, 1, maxZoom);
  const preload = clamp(Math.floor(options.preload ?? 1), 0, 2);
  const padding = Math.max(0, options.padding ?? 32);
  let items: LightboxItem[] = [];
  let session: Session | undefined;
  let destroyed = false;
  let syncingCarousel = false;
  let closePromise: Promise<void> | undefined;
  let state: LightboxState = {
    isOpen: false,
    isClosing: false,
    index: 0,
    count: 0,
    zoom: { ...identity },
  };
  const listeners = new Set<(state: LightboxState) => void>();

  let notifiedState = state;

  function updateState(update: Partial<LightboxState>) {
    state = { ...state, ...update };
  }

  function publish(update: Partial<LightboxState>) {
    updateState(update);
    if (
      state.isOpen === notifiedState.isOpen &&
      state.isClosing === notifiedState.isClosing &&
      state.index === notifiedState.index &&
      state.count === notifiedState.count &&
      state.zoom.scale === notifiedState.zoom.scale &&
      state.zoom.x === notifiedState.zoom.x &&
      state.zoom.y === notifiedState.zoom.y
    )
      return;
    notifiedState = state;
    options.onChange?.(state);
    for (const listener of listeners) listener(state);
  }

  function view(s: Session): Size {
    const rect = s.viewport.getBoundingClientRect();
    const win = s.dialog.ownerDocument.defaultView;
    return {
      width: rect.width || win?.innerWidth || 1,
      height: rect.height || win?.innerHeight || 1,
    };
  }

  function imageSize(index: number, s: Session): Size {
    const item = items[index];
    const image = s.loaded.get(index)?.image;
    return {
      width: item.width || image?.naturalWidth || view(s).width,
      height: item.height || image?.naturalHeight || view(s).height,
    };
  }

  function fit(index: number, s: Session): Size {
    return contain(imageSize(index, s), view(s), padding);
  }

  function applyZoom(s: Session) {
    const frame = s.loaded.get(state.index)?.frame;
    if (frame)
      frame.style.transform = `translate(${state.zoom.x}px, ${state.zoom.y}px) scale(${state.zoom.scale})`;
    syncingCarousel = true;
    s.carousel.setEnabled(state.zoom.scale <= 1);
    syncingCarousel = false;
    s.viewport.style.touchAction = state.zoom.scale > 1 ? "none" : "pan-x";
    s.zoomButton.setAttribute(
      "aria-label",
      state.zoom.scale > 1 ? "Zoom out" : "Zoom in",
    );
    s.zoomButton.setAttribute("aria-pressed", String(state.zoom.scale > 1));
    if (!options.icons?.zoom)
      s.zoomButton.textContent = state.zoom.scale > 1 ? "−" : "+";
    s.dialog.dataset.zoomed = String(state.zoom.scale > 1);
  }

  function restoreOrigin(s: Session) {
    if (!s.hiddenOrigin) return;
    s.hiddenOrigin.element.style.visibility = s.hiddenOrigin.visibility;
    s.hiddenOrigin = undefined;
  }

  function hideOrigin(s: Session) {
    restoreOrigin(s);
    const origin = items[state.index]?.origin;
    if (!origin?.isConnected) return;
    s.hiddenOrigin = { element: origin, visibility: origin.style.visibility };
    origin.style.visibility = "hidden";
  }

  function animate(
    s: Session,
    node: HTMLElement,
    frames: Keyframe[],
    duration: number,
  ) {
    const reduced = s.dialog.ownerDocument.defaultView?.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced || duration <= 0 || typeof node.animate !== "function")
      return Promise.resolve();
    return new Promise<void>((resolve) => {
      const animation = node.animate(frames, {
        duration,
        easing: "cubic-bezier(.16,1,.3,1)",
        fill: "both",
      });
      s.animations.add(animation);
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        s.animations.delete(animation);
        s.finishAnimations.delete(finish);
        if (node.isConnected) animation.commitStyles?.();
        animation.cancel();
        resolve();
      };
      const timer = setTimeout(finish, duration + 80);
      s.finishAnimations.add(finish);
      void animation.finished.then(finish, finish);
    });
  }

  function cancelAnimations(s: Session) {
    for (const finish of [...s.finishAnimations]) finish();
  }

  function morph(s: Session, closing: boolean) {
    const entry = s.loaded.get(state.index);
    const item = items[state.index];
    if (!entry || !item) return Promise.resolve();
    const win = s.dialog.ownerDocument.defaultView;
    if (!win) return Promise.resolve();
    const current = win.getComputedStyle(entry.frame);
    const resting =
      entry.frame.style.transform || "translate(0px, 0px) scale(1)";
    const live = {
      transform:
        current.transform === "none" ? resting : current.transform || resting,
      clipPath: current.clipPath || "inset(0px round 0px)",
      opacity: current.opacity || "1",
    };
    const origin = item.origin;
    const rect = origin?.isConnected
      ? origin.getBoundingClientRect()
      : undefined;
    const viewport = view(s);
    const size = fit(state.index, s);
    const duration = Math.max(0, options.duration ?? 280);
    const visible =
      rect &&
      rect.width > 0 &&
      rect.height > 0 &&
      rect.bottom > 0 &&
      rect.right > 0 &&
      rect.top < viewport.height &&
      rect.left < viewport.width;
    if (!visible || !origin) {
      return animate(
        s,
        entry.frame,
        closing
          ? [
              live,
              {
                transform: `${live.transform} scale(.96)`,
                opacity: 0,
              },
            ]
          : [
              { transform: "scale(.96)", opacity: 0 },
              { transform: resting, opacity: 1 },
            ],
        duration,
      );
    }
    const style = win.getComputedStyle(origin);
    const positions = style.objectPosition
      .split(" ")
      .map((value) => Number.parseFloat(value) / 100);
    const crop =
      style.objectFit === "contain"
        ? contain(imageSize(state.index, s), rect, 0)
        : cover(imageSize(state.index, s), rect, {
            x: Number.isFinite(positions[0]) ? positions[0] : 0.5,
            y: Number.isFinite(positions[1]) ? positions[1] : 0.5,
          });
    const left =
      "left" in crop && typeof crop.left === "number"
        ? crop.left
        : (rect.width - crop.width) / 2;
    const top =
      "top" in crop && typeof crop.top === "number"
        ? crop.top
        : (rect.height - crop.height) / 2;
    const scale = crop.width / size.width;
    const x = rect.left + left + crop.width / 2 - viewport.width / 2;
    const y = rect.top + top + crop.height / 2 - viewport.height / 2;
    const radius = (Number.parseFloat(style.borderRadius) || 0) / scale;
    const clipped = {
      transform: `translate(${x}px, ${y}px) scale(${scale})`,
      clipPath: `inset(${Math.max(0, -top / scale)}px ${Math.max(0, (crop.width + left - rect.width) / scale)}px ${Math.max(0, (crop.height + top - rect.height) / scale)}px ${Math.max(0, -left / scale)}px round ${radius}px)`,
      opacity: 1,
    };
    const expanded = {
      transform: resting,
      clipPath: "inset(0px round 0px)",
      opacity: 1,
    };
    return animate(
      s,
      entry.frame,
      closing ? [live, clipped] : [clipped, expanded],
      duration,
    );
  }

  function layout(s: Session) {
    for (const [index, entry] of s.loaded) {
      const size = fit(index, s);
      entry.frame.style.width = `${size.width}px`;
      entry.frame.style.height = `${size.height}px`;
    }
    if (state.zoom.scale > 1)
      publish({ zoom: boundZoom(state.zoom, fit(state.index, s), view(s)) });
    applyZoom(s);
  }

  function visibleRange(s: Session) {
    const width = s.viewport.clientWidth;
    const rtl =
      s.dialog.ownerDocument.defaultView?.getComputedStyle(s.viewport)
        .direction === "rtl";
    const start = Math.abs(s.viewport.scrollLeft);
    return s.slides.flatMap((slide, index) => {
      const left = rtl
        ? s.viewport.scrollWidth - slide.offsetLeft - slide.offsetWidth
        : slide.offsetLeft;
      return left < start + width - 1 && left + slide.offsetWidth > start + 1
        ? [index]
        : [];
    });
  }

  // Unloads images outside the preload window, except those still on screen
  // while the strip travels.
  function trimSlides(s: Session) {
    if (session !== s) return;
    const visible = visibleRange(s);
    for (const [index, entry] of s.loaded) {
      if (Math.abs(index - state.index) <= preload || visible.includes(index))
        continue;
      entry.cancel();
      entry.frame.remove();
      s.loaded.delete(index);
    }
  }

  function loadSlides(s: Session) {
    trimSlides(s);
    for (
      let index = Math.max(0, state.index - preload);
      index <= Math.min(items.length - 1, state.index + preload);
      index++
    ) {
      if (s.loaded.has(index)) continue;
      const item = items[index];
      const doc = s.dialog.ownerDocument;
      const frame = doc.createElement("div");
      frame.className = "reuse-lightbox-frame";
      const image = doc.createElement("img");
      image.className = "reuse-lightbox-image";
      image.alt = item.alt || "";
      image.draggable = false;
      image.decoding = "async";
      const loader = doc.createElement("img");
      loader.decoding = "async";
      let alive = true;
      let cleanup: undefined | (() => void);
      frame.append(image);
      s.slides[index].append(frame);
      const swap = () => {
        if (!alive || session !== s) return;
        if (!item.width && loader.naturalWidth)
          item.width = loader.naturalWidth;
        if (!item.height && loader.naturalHeight)
          item.height = loader.naturalHeight;
        image.src = item.src;
        frame.removeAttribute("data-loading");
        layout(s);
      };
      const failed = () => {
        if (!alive) return;
        frame.removeAttribute("data-loading");
        frame.dataset.error = "true";
        if (!item.previewSrc) {
          const error = doc.createElement("span");
          error.className = "reuse-lightbox-error";
          error.setAttribute("role", "status");
          error.textContent = "Image could not be loaded.";
          frame.append(error);
        }
      };
      loader.onload = () => {
        if (typeof loader.decode === "function")
          void loader.decode().then(swap, failed);
        else swap();
      };
      loader.onerror = failed;
      if (item.previewSrc) image.src = item.previewSrc;
      frame.dataset.loading = "true";
      s.loaded.set(index, {
        frame,
        image,
        loader,
        cancel: () => {
          alive = false;
          loader.onload = null;
          loader.onerror = null;
          loader.removeAttribute("src");
          image.removeAttribute("src");
          cleanup?.();
        },
      });
      loader.src = item.src;
      if (loader.complete && loader.naturalWidth)
        loader.onload(new Event("load"));
      cleanup = options.renderContent?.({
        item,
        index,
        container: frame,
        image,
      });
    }
    layout(s);
  }

  function activeChanged(s: Session, index: number) {
    if (session !== s || state.index === index || state.isClosing) return;
    cancelAnimations(s);
    const old = s.loaded.get(state.index);
    if (old) {
      old.frame.style.transform = "";
      old.frame.style.clipPath = "";
      old.frame.style.opacity = "";
    }
    publish({ index, zoom: { ...identity } });
    update(s);
  }

  function update(s: Session) {
    loadSlides(s);
    hideOrigin(s);
    s.counter.value = `${state.index + 1} / ${items.length}`;
    s.caption.textContent = items[state.index].caption || "";
    s.prev.disabled = state.index === 0;
    s.next.disabled = state.index === items.length - 1;
    for (const [index, slide] of s.slides.entries()) {
      slide.inert = index !== state.index;
      slide.setAttribute("aria-hidden", String(index !== state.index));
    }
    for (const [index, thumb] of s.thumbs.entries())
      thumb.setAttribute("aria-current", String(index === state.index));
    applyZoom(s);
  }

  function teardown(s: Session) {
    if (session === s) session = undefined;
    s.abort.abort();
    clearTimeout(s.wheelTimer);
    finishFade(s, false);
    cancelAnimations(s);
    s.carousel.destroy();
    for (const entry of s.loaded.values()) entry.cancel();
    restoreOrigin(s);
    if (s.dialog.open) s.dialog.close();
    s.dialog.remove();
    s.restoreScroll();
    if (s.previousFocus?.isConnected)
      s.previousFocus.focus({ preventScroll: true });
  }

  function setZoom(scale: number, focus: Point, notify: boolean) {
    const s = session;
    if (!s || state.isClosing || !Number.isFinite(scale)) return;
    const nextScale = clamp(scale, 1, maxZoom);
    if (nextScale > 1 && state.zoom.scale <= 1) {
      syncingCarousel = true;
      s.carousel.goTo(state.index, "instant");
      syncingCarousel = false;
    }
    const shouldAnimate =
      notify && Math.abs(nextScale - state.zoom.scale) > 0.001;
    const frame = s.loaded.get(state.index)?.frame;
    const live =
      frame && shouldAnimate
        ? s.dialog.ownerDocument.defaultView?.getComputedStyle(frame)
            .transform || frame.style.transform
        : undefined;
    if (shouldAnimate) cancelAnimations(s);
    const zoom =
      nextScale === 1
        ? { ...identity }
        : boundZoom(
            zoomAround(state.zoom, nextScale, focus),
            fit(state.index, s),
            view(s),
          );
    if (notify) publish({ zoom });
    else updateState({ zoom });
    if (frame && shouldAnimate) {
      frame.style.clipPath = "";
      frame.style.opacity = "";
    }
    applyZoom(s);
    if (frame && live && shouldAnimate) {
      void animate(
        s,
        frame,
        [{ transform: live }, { transform: frame.style.transform }],
        Math.min(220, Math.max(0, options.duration ?? 280)),
      );
    }
  }

  function zoomTo(scale: number, focus: Point = { x: 0, y: 0 }) {
    setZoom(scale, focus, true);
  }

  function toggleZoom(focus?: Point) {
    zoomTo(state.zoom.scale > 1 ? 1 : tapZoom, focus);
  }

  function finishFade(s: Session, jump: boolean) {
    const fade = s.fade;
    if (!fade) return;
    s.fade = undefined;
    fade.animation?.cancel();
    if (jump && !fade.jumped) fade.jump();
  }

  // Distant images fade through the backdrop instead of scrolling past
  // unloaded pages. The jump waits for the fade-out to really finish, because
  // a busy main thread delays when an animation starts.
  function fadeTo(s: Session, target: number) {
    const fade: NonNullable<Session["fade"]> = {
      jumped: false,
      jump: () => {
        fade.jumped = true;
        if (session !== s) return;
        syncingCarousel = true;
        s.carousel.goTo(target, "instant");
        syncingCarousel = false;
        trimSlides(s);
      },
    };
    const reduced = s.dialog.ownerDocument.defaultView?.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const duration = Math.min(240, Math.max(0, options.duration ?? 280));
    if (reduced || duration <= 0 || typeof s.viewport.animate !== "function") {
      fade.jump();
      return;
    }
    s.fade = fade;
    const fadeOut = s.viewport.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: duration * 0.45,
      easing: "ease-in",
      fill: "forwards",
    });
    fade.animation = fadeOut;
    fadeOut.finished.then(
      () => {
        if (s.fade !== fade) return;
        fade.jump();
        const fadeIn = s.viewport.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: duration * 0.55,
          easing: "ease-out",
        });
        fade.animation = fadeIn;
        fadeOut.cancel();
        const done = () => {
          if (s.fade === fade) s.fade = undefined;
        };
        fadeIn.finished.then(done, done);
      },
      () => {},
    );
  }

  function goTo(index: number) {
    const s = session;
    if (!s || state.isClosing || !Number.isFinite(index)) return;
    finishFade(s, true);
    const target = clamp(Math.floor(index), 0, items.length - 1);
    const far = Math.abs(target - state.index) > 1;
    syncingCarousel = true;
    activeChanged(s, target);
    if (!far) s.carousel.goTo(target, "smooth");
    syncingCarousel = false;
    if (far) fadeTo(s, target);
  }

  function isSettled(s: Session) {
    return visibleRange(s).length <= 1;
  }

  function interruptImageMotion(s: Session) {
    const frame = s.loaded.get(state.index)?.frame;
    const win = s.dialog.ownerDocument.defaultView;
    const transform = frame && win?.getComputedStyle(frame).transform;
    cancelAnimations(s);
    if (transform && transform !== "none" && win?.DOMMatrixReadOnly) {
      const matrix = new win.DOMMatrixReadOnly(transform);
      const scale = Math.hypot(matrix.a, matrix.b);
      if (scale > 1 || state.zoom.scale > 1) {
        updateState({
          zoom: boundZoom(
            { scale: Math.max(1, scale), x: matrix.e, y: matrix.f },
            fit(state.index, s),
            view(s),
          ),
        });
      }
    }
    if (frame) {
      frame.style.clipPath = "";
      frame.style.opacity = "";
    }
    applyZoom(s);
  }

  function installGestures(s: Session) {
    const signal = s.abort.signal;
    const point = (event: PointerEvent): Point => ({
      x: event.clientX,
      y: event.clientY,
    });
    const focus = (p: Point): Point => {
      const rect = s.viewport.getBoundingClientRect();
      const size = view(s);
      return {
        x: p.x - rect.left - size.width / 2,
        y: p.y - rect.top - size.height / 2,
      };
    };
    const resetGesture = () => {
      const points = [...s.pointers.values()];
      if (!points.length) {
        s.gesture = undefined;
        return;
      }
      s.gesture = {
        start: points[0],
        zoom: { ...state.zoom },
        distance: points.length > 1 ? distance(points) : 0,
        midpoint: points.length > 1 ? midpoint(points) : points[0],
        moved: false,
        touch: s.gesture?.touch ?? true,
      };
    };
    s.viewport.addEventListener(
      "pointerdown",
      (event) => {
        if (
          event.button !== 0 ||
          state.isClosing ||
          (event.target instanceof Element &&
            event.target.closest(
              "button, a, input, textarea, select, [data-lightbox-interactive]",
            ))
        )
          return;
        if (s.wheelTimer !== undefined) {
          clearTimeout(s.wheelTimer);
          s.wheelTimer = undefined;
          publish({});
        }
        interruptImageMotion(s);
        s.pointers.set(event.pointerId, point(event));
        resetGesture();
        if (s.gesture) s.gesture.touch = event.pointerType !== "mouse";
        if (state.zoom.scale > 1 || s.pointers.size > 1) {
          s.viewport.setPointerCapture?.(event.pointerId);
          event.preventDefault();
        }
      },
      { signal },
    );
    s.viewport.addEventListener(
      "pointermove",
      (event) => {
        if (!s.pointers.has(event.pointerId) || !s.gesture) return;
        s.pointers.set(event.pointerId, point(event));
        const points = [...s.pointers.values()];
        const gesture = s.gesture;
        const dx = event.clientX - gesture.start.x;
        const dy = event.clientY - gesture.start.y;
        if (Math.hypot(dx, dy) > 8 || points.length > 1) gesture.moved = true;
        if (points.length > 1 && gesture.distance > 0) {
          event.preventDefault();
          const middle = midpoint(points);
          const scale = clamp(
            (gesture.zoom.scale * distance(points)) / gesture.distance,
            0.8,
            maxZoom * 1.15,
          );
          const zoom = zoomAround(gesture.zoom, scale, focus(gesture.midpoint));
          zoom.x += middle.x - gesture.midpoint.x;
          zoom.y += middle.y - gesture.midpoint.y;
          updateState({ zoom });
          applyZoom(s);
        } else if (gesture.zoom.scale > 1) {
          event.preventDefault();
          updateState({
            zoom: boundZoom(
              {
                scale: gesture.zoom.scale,
                x: gesture.zoom.x + dx,
                y: gesture.zoom.y + dy,
              },
              fit(state.index, s),
              view(s),
            ),
          });
          applyZoom(s);
        } else if (
          gesture.touch &&
          Math.abs(dy) > Math.abs(dx) * 1.3 &&
          Math.abs(dy) > 8
        ) {
          event.preventDefault();
          s.carousel.setEnabled(false);
          s.viewport.setPointerCapture?.(event.pointerId);
          updateState({
            zoom: {
              scale: Math.max(0.8, 1 - Math.abs(dy) / view(s).height / 2),
              x: 0,
              y: dy,
            },
          });
          const frame = s.loaded.get(state.index)?.frame;
          if (frame)
            frame.style.transform = `translateY(${dy}px) scale(${state.zoom.scale})`;
        }
      },
      { signal, passive: false },
    );
    const release = (event: PointerEvent) => {
      if (!s.pointers.has(event.pointerId)) return;
      const gesture = s.gesture;
      const hadPinch = s.pointers.size > 1;
      s.pointers.delete(event.pointerId);
      if (gesture?.moved) s.suppressClickUntil = Date.now() + 400;
      if (
        event.type === "pointerup" &&
        !hadPinch &&
        gesture?.touch &&
        gesture.zoom.scale <= 1 &&
        Math.abs(state.zoom.y) > 120
      ) {
        void close();
        return;
      }
      if (
        event.type === "pointerup" &&
        gesture?.touch &&
        !gesture.moved &&
        !hadPinch
      ) {
        const now = Date.now();
        const previous = s.lastTap;
        const current = point(event);
        if (
          options.doubleTapZoom !== false &&
          previous &&
          now - previous.time < 300 &&
          Math.hypot(
            current.x - previous.point.x,
            current.y - previous.point.y,
          ) < 30
        ) {
          toggleZoom(focus(current));
          s.lastTap = undefined;
        } else {
          s.lastTap = { time: now, point: current };
          if (options.imageClick === "close") void close();
        }
        s.suppressClickUntil = now + 400;
      }
      if (
        state.zoom.scale < 1 ||
        (gesture?.zoom.scale === 1 && !hadPinch && state.zoom.scale <= 1)
      )
        setZoom(1, { x: 0, y: 0 }, s.pointers.size === 0);
      else setZoom(state.zoom.scale, { x: 0, y: 0 }, s.pointers.size === 0);
      resetGesture();
      if (hadPinch && s.gesture) s.gesture.moved = true;
      if (hadPinch) s.lastTap = undefined;
    };
    s.dialog.ownerDocument.defaultView?.addEventListener("pointerup", release, {
      signal,
    });
    s.dialog.ownerDocument.defaultView?.addEventListener(
      "pointercancel",
      release,
      { signal },
    );
    s.viewport.addEventListener("lostpointercapture", release, { signal });
    s.viewport.addEventListener(
      "click",
      (event) => {
        if (Date.now() < s.suppressClickUntil || state.isClosing) return;
        const target = event.target;
        if (
          !(target instanceof Element) ||
          target.closest(
            "[data-lightbox-interactive],button,a,input,textarea,select",
          )
        )
          return;
        if (!target.closest(".reuse-lightbox-frame")) {
          void close();
          return;
        }
        if (options.imageClick === "close") void close();
        else if (options.imageClick !== "none" && isSettled(s))
          toggleZoom(focus({ x: event.clientX, y: event.clientY }));
      },
      { signal },
    );
    s.viewport.addEventListener(
      "wheel",
      (event) => {
        if (state.isClosing || (!event.ctrlKey && state.zoom.scale <= 1))
          return;
        event.preventDefault();
        if (s.animations.size) interruptImageMotion(s);
        if (event.ctrlKey) {
          const rect = s.viewport.getBoundingClientRect();
          const size = view(s);
          setZoom(
            state.zoom.scale * Math.exp(-event.deltaY * 0.01),
            {
              x: event.clientX - rect.left - size.width / 2,
              y: event.clientY - rect.top - size.height / 2,
            },
            false,
          );
        } else {
          const unit =
            event.deltaMode === 1
              ? 16
              : event.deltaMode === 2
                ? view(s).height
                : 1;
          updateState({
            zoom: boundZoom(
              {
                ...state.zoom,
                x: state.zoom.x - event.deltaX * unit,
                y: state.zoom.y - event.deltaY * unit,
              },
              fit(state.index, s),
              view(s),
            ),
          });
          applyZoom(s);
        }
        clearTimeout(s.wheelTimer);
        s.wheelTimer = setTimeout(() => {
          s.wheelTimer = undefined;
          if (session === s && !state.isClosing) publish({});
        }, 150);
      },
      { signal, passive: false },
    );
  }

  function open(input: readonly LightboxItem[], index = 0) {
    if (destroyed) throw new Error("This lightbox has been destroyed.");
    const nextItems = validateItems(input);
    if (!Number.isFinite(index))
      throw new TypeError("Image index must be finite.");
    const doc =
      options.container?.ownerDocument ??
      (typeof document === "undefined" ? undefined : document);
    if (!doc?.body)
      throw new Error("Opening a lightbox needs a browser document.");
    if (session) teardown(session);
    items = nextItems;
    closePromise = undefined;
    const dialog = doc.createElement("dialog");
    if (typeof dialog.showModal !== "function")
      throw new Error("Lightbox requires native dialog support.");
    dialog.className = ["reuse-lightbox", options.className]
      .filter(Boolean)
      .join(" ");
    dialog.setAttribute("aria-label", options.label || "Image gallery");
    const viewport = doc.createElement("div");
    viewport.className = "reuse-lightbox-viewport";
    viewport.tabIndex = 0;
    viewport.setAttribute("aria-label", "Images");
    const slides = items.map((_item, imageIndex) => {
      const slide = doc.createElement("div");
      slide.className = "reuse-lightbox-slide";
      slide.dataset.carouselSlide = "";
      slide.setAttribute("role", "group");
      slide.setAttribute("aria-label", `${imageIndex + 1} of ${items.length}`);
      viewport.append(slide);
      return slide;
    });
    const backdrop = doc.createElement("div");
    backdrop.className = "reuse-lightbox-backdrop";
    backdrop.setAttribute("aria-hidden", "true");
    dialog.append(backdrop, viewport);
    const abort = new AbortController();
    const button = (
      name: "close" | "prev" | "next" | "zoom",
      label: string,
      text: string,
      action: () => void,
    ) => {
      const element = doc.createElement("button");
      element.type = "button";
      element.className = `reuse-lightbox-button reuse-lightbox-${name}`;
      element.setAttribute("aria-label", label);
      const icon = options.icons?.[name]?.();
      if (icon) element.append(icon);
      else element.textContent = text;
      element.addEventListener("click", action, { signal: abort.signal });
      dialog.append(element);
      return element;
    };
    const closeButton = button("close", "Close gallery", "×", () => {
      void close();
    });
    closeButton.autofocus = true;
    const prev = button("prev", "Previous image", "‹", () =>
      goTo(state.index - 1),
    );
    const next = button("next", "Next image", "›", () => goTo(state.index + 1));
    const zoomButton = button("zoom", "Zoom in", "+", () => toggleZoom());
    const footer = doc.createElement("div");
    footer.className = "reuse-lightbox-footer";
    const counter = doc.createElement("output");
    counter.className = "reuse-lightbox-counter";
    counter.setAttribute("aria-live", "polite");
    const caption = doc.createElement("p");
    caption.className = "reuse-lightbox-caption";
    footer.append(caption, counter);
    dialog.append(footer);
    const thumbs: HTMLButtonElement[] = [];
    if (options.thumbnails) {
      const strip = doc.createElement("div");
      strip.className = "reuse-lightbox-thumbnails";
      strip.setAttribute("role", "group");
      strip.setAttribute("aria-label", "Choose image");
      items.forEach((item, i) => {
        const thumb = doc.createElement("button");
        thumb.type = "button";
        thumb.setAttribute("aria-label", `Show image ${i + 1}`);
        const thumbnailSrc = item.thumbnailSrc || item.previewSrc;
        if (thumbnailSrc) {
          const image = doc.createElement("img");
          image.src = thumbnailSrc;
          image.alt = "";
          image.loading = "lazy";
          thumb.append(image);
        } else thumb.textContent = String(i + 1);
        thumb.addEventListener("click", () => goTo(i), {
          signal: abort.signal,
        });
        strip.append(thumb);
        thumbs.push(thumb);
      });
      footer.append(strip);
    }
    const previousFocus =
      doc.activeElement instanceof HTMLElement ? doc.activeElement : null;
    (options.container ?? doc.body).append(dialog);
    const restoreScroll = lockScroll(doc);
    try {
      dialog.showModal();
    } catch (error) {
      restoreScroll();
      dialog.remove();
      throw error;
    }
    const carousel = createCarousel(viewport, {
      drag: true,
      onChange: (value) => {
        if (!syncingCarousel && session?.dialog === dialog)
          activeChanged(session, value.index);
      },
    });
    const s: Session = {
      dialog,
      viewport,
      backdrop,
      slides,
      loaded: new Map(),
      carousel,
      abort,
      animations: new Set(),
      finishAnimations: new Set(),
      previousFocus,
      restoreScroll,
      counter,
      caption,
      prev,
      next,
      zoomButton,
      thumbs,
      pointers: new Map(),
      suppressClickUntil: 0,
    };
    session = s;
    publish({
      isOpen: true,
      isClosing: false,
      index: clamp(Math.floor(index), 0, items.length - 1),
      count: items.length,
      zoom: { ...identity },
    });
    update(s);
    carousel.goTo(state.index, "instant");
    dialog.addEventListener(
      "cancel",
      (event) => {
        event.preventDefault();
        void close();
      },
      { signal: abort.signal },
    );
    dialog.addEventListener(
      "close",
      () => {
        if (session === s) {
          teardown(s);
          publish({ isOpen: false, isClosing: false, zoom: { ...identity } });
        }
      },
      { signal: abort.signal },
    );
    dialog.addEventListener(
      "keydown",
      (event) => {
        if (
          event.defaultPrevented ||
          (event.target instanceof Element &&
            event.target.closest(
              "input,textarea,select,[contenteditable=true],[data-lightbox-interactive]",
            ))
        )
          return;
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          goTo(state.index - 1);
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          goTo(state.index + 1);
        }
        if (event.key === "+" || event.key === "=") {
          event.preventDefault();
          zoomTo(state.zoom.scale * 1.5);
        }
        if (event.key === "-") {
          event.preventDefault();
          zoomTo(state.zoom.scale / 1.5);
        }
        if (event.key === "0") {
          event.preventDefault();
          zoomTo(1);
        }
      },
      { signal: abort.signal },
    );
    doc.defaultView?.addEventListener(
      "resize",
      () => {
        cancelAnimations(s);
        layout(s);
      },
      { signal: abort.signal },
    );
    viewport.addEventListener("scrollend", () => trimSlides(s), {
      signal: abort.signal,
    });
    installGestures(s);
    closeButton.focus({ preventScroll: true });
    void Promise.all([
      morph(s, false),
      animate(
        s,
        s.backdrop,
        [{ opacity: 0 }, { opacity: 1 }],
        Math.max(0, options.duration ?? 280),
      ),
    ]);
  }

  function close(): Promise<void> {
    const s = session;
    if (!s) return Promise.resolve();
    if (closePromise) return closePromise;
    cancelAnimations(s);
    publish({ isClosing: true });
    closePromise = (async () => {
      await Promise.all([
        morph(s, true),
        animate(
          s,
          s.backdrop,
          [{ opacity: 1 }, { opacity: 0 }],
          Math.max(0, options.duration ?? 280),
        ),
      ]);
      if (session !== s) return;
      teardown(s);
      closePromise = undefined;
      publish({ isOpen: false, isClosing: false, zoom: { ...identity } });
    })();
    return closePromise;
  }

  return {
    open,
    close,
    next: () => goTo(state.index + 1),
    prev: () => goTo(state.index - 1),
    goTo,
    zoomTo,
    toggleZoom,
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      if (session) teardown(session);
      closePromise = undefined;
      publish({ isOpen: false, isClosing: false, zoom: { ...identity } });
      listeners.clear();
    },
  };
}

export function lightboxItemFromImage(
  image: HTMLImageElement,
  source = image.dataset.lightboxSrc || image.currentSrc || image.src,
): LightboxItem {
  return {
    src: source,
    previewSrc: image.currentSrc || image.src,
    width: image.naturalWidth || undefined,
    height: image.naturalHeight || undefined,
    alt: image.alt,
    origin: image,
  };
}

export function bindLightboxGallery(
  root: HTMLElement,
  options: LightboxOptions & {
    selector?: string;
    getItem?: (image: HTMLImageElement) => LightboxItem;
  } = {},
) {
  const controller = createLightbox(options);
  const click = (event: MouseEvent) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const images = [
      ...root.querySelectorAll<HTMLImageElement>(options.selector || "img"),
    ];
    const index = images.findIndex(
      (image) =>
        image === target || image.closest("a, button")?.contains(target),
    );
    if (index < 0) return;
    event.preventDefault();
    controller.open(
      images.map((image) => (options.getItem || lightboxItemFromImage)(image)),
      index,
    );
  };
  root.addEventListener("click", click);
  return {
    ...controller,
    destroy: () => {
      root.removeEventListener("click", click);
      controller.destroy();
    },
  };
}
