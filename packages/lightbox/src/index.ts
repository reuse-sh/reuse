import { type Carousel, createCarousel } from "@reuse-sh/carousel";
import {
  type ChromeInput,
  type ChromeModel,
  initialChrome,
  stepChrome,
} from "./chrome.js";
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

export interface LightboxStrings {
  dialog: string;
  slide: (index: number, count: number) => string;
  counter: (index: number, count: number) => string;
  close: string;
  previous: string;
  next: string;
  zoomIn: string;
  zoomOut: string;
  fullscreenEnter: string;
  fullscreenExit: string;
  download: string;
  thumbnails: string;
  thumbnail: (index: number, count: number) => string;
  slideshowStart: string;
  slideshowStop: string;
  loading: string;
  error: string;
  retry: string;
}

const defaultStrings: LightboxStrings = {
  dialog: "Image gallery",
  slide: (index, count) => `Image ${index + 1} of ${count}`,
  counter: (index, count) => `${index + 1} / ${count}`,
  close: "Close gallery",
  previous: "Previous image",
  next: "Next image",
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  fullscreenEnter: "Enter full screen",
  fullscreenExit: "Exit full screen",
  download: "Download",
  thumbnails: "Choose image",
  thumbnail: (index) => `Show image ${index + 1}`,
  slideshowStart: "Start slideshow",
  slideshowStop: "Stop slideshow",
  loading: "Loading",
  error: "Image could not be loaded.",
  retry: "Try again",
};

export type LightboxSlotName =
  | "toolbarStart"
  | "toolbarEnd"
  | "footer"
  | "aside";

export type LightboxSlot = (context: {
  lightbox: Lightbox;
  document: Document;
}) => {
  node: Node;
  update?: (state: LightboxState) => void;
  destroy?: () => void;
};

export type LightboxEventName =
  | "open"
  | "opened"
  | "change"
  | "settle"
  | "beforeclose"
  | "closed";

export interface LightboxEvent {
  readonly type: LightboxEventName;
  readonly index: number;
  readonly slide: HTMLElement | null;
  readonly defaultPrevented: boolean;
  /** Keeps the viewer open when called during beforeclose; other events ignore it. */
  preventDefault(): void;
}

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
  isAnimating: boolean;
  index: number;
  count: number;
  zoom: Zoom;
  chrome: "shown" | "hidden";
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
  autoHide?: number | false;
  className?: string;
  icons?: Partial<Record<"close" | "prev" | "next" | "zoom", () => Node>>;
  renderContent?: (context: LightboxContentContext) => undefined | (() => void);
  loop?: boolean;
  history?: boolean;
  strings?: Partial<LightboxStrings>;
  slots?: Partial<Record<LightboxSlotName, LightboxSlot>>;
  getOrigin?: (index: number) => HTMLElement | null;
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
  on(
    type: LightboxEventName,
    listener: (event: LightboxEvent) => void,
  ): () => void;
  append(items: readonly LightboxItem[]): void;
  /** Keeps the current image when the new list still has it, otherwise shows index or the nearest image left. */
  setItems(items: readonly LightboxItem[], index?: number): void;
  setOptions(options: Pick<LightboxOptions, "loop">): void;
  getSlide(index: number): HTMLElement | null;
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
  carouselLoops: boolean;
  strings: LightboxStrings;
  slots: ReturnType<LightboxSlot>[];
  motion?: { frame: number; left: number; still: number };
  phase: "entering" | "opening" | "open" | "dragging" | "returning" | "closing";
  timing: { open: number; close: number; ease: string };
  chrome: ChromeModel;
  chromeRoots: HTMLElement[];
  chromeTimer?: ReturnType<typeof setTimeout>;
  tapTimer?: ReturnType<typeof setTimeout>;
  openingFocus: HTMLElement | null;
  zoomed: boolean;
  thumbStrip?: HTMLDivElement;
  centeredThumb: number;
  abort: AbortController;
  animations: Set<Animation>;
  finishAnimations: Set<() => void>;
  previousFocus: HTMLElement | null;
  restoreScroll: () => void;
  hiddenOrigin?: { element: HTMLElement; visibility: string };
  counter: HTMLSpanElement;
  counterText: string;
  status: HTMLDivElement;
  caption: HTMLParagraphElement;
  prev: HTMLButtonElement;
  next: HTMLButtonElement;
  zoomButton: HTMLButtonElement;
  thumbs: HTMLButtonElement[];
  makeSlide: () => HTMLDivElement;
  makeThumbs: () => void;
  pointers: Map<number, Point>;
  gesture?: {
    start: Point;
    zoom: Zoom;
    distance: number;
    midpoint: Point;
    moved: boolean;
    touch: boolean;
    axis?: "x" | "y";
    half: number;
    samples: { time: number; y: number }[];
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
      gapProperty:
        doc.documentElement.style.getPropertyValue("--re-scrollbar-gap"),
      x: win.scrollX,
      y: win.scrollY,
    };
    locks.set(doc, lock);
    const gap = Math.max(0, win.innerWidth - doc.documentElement.clientWidth);
    if (gap)
      doc.body.style.paddingRight = `${Number.parseFloat(win.getComputedStyle(doc.body).paddingRight || "0") + gap}px`;
    // Fixed elements ignore body padding; they can add this gap themselves.
    doc.documentElement.style.setProperty("--re-scrollbar-gap", `${gap}px`);
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
        "--re-scrollbar-gap",
        lock.gapProperty,
      );
    else doc.documentElement.style.removeProperty("--re-scrollbar-gap");
    if (win.scrollX !== lock.x || win.scrollY !== lock.y)
      win.scrollTo(lock.x, lock.y);
    locks.delete(doc);
  };
}

// history.back() lands asynchronously, so a lightbox that opens or closes before it lands must
// not push or go back again; the pending back is shared by every lightbox of the window.
const historyBacks = new WeakMap<
  Window,
  { drain: (event: Event) => void; land: () => void; landing: Promise<void> }
>();
const landings = new WeakSet<Event>();

function landed(win: Window, event: Event) {
  if (landings.has(event)) return true;
  const back = historyBacks.get(win);
  if (!back) return false;
  landings.add(event);
  win.removeEventListener("popstate", back.drain);
  historyBacks.delete(win);
  back.land();
  return true;
}

function goBack(win: Window) {
  const pending = historyBacks.get(win);
  if (pending) return pending.landing;
  let land = () => {};
  const landing = new Promise<void>((resolve) => {
    land = resolve;
  });
  const drain = (event: Event) => {
    landed(win, event);
  };
  historyBacks.set(win, { drain, land, landing });
  win.addEventListener("popstate", drain);
  win.history.back();
  return landing;
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

const OPEN_DURATION = 400;
const CLOSE_DURATION = 300;
const REDUCED_DURATION = 150;
const FLIGHT_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const ZOOM_EASE = "cubic-bezier(.16,1,.3,1)";
const DOUBLE_TAP_TIME = 300;
const DOUBLE_TAP_DISTANCE = 30;
const DISMISS_DISTANCE = 120;
const DISMISS_SPEED = 0.5;
const SPEED_WINDOW = 80;

function milliseconds(value: string, fallback: number) {
  const number = Number.parseFloat(value);
  if (!Number.isFinite(number)) return fallback;
  return value.trim().endsWith("ms") || !value.trim().endsWith("s")
    ? number
    : number * 1000;
}

function releaseSpeed(
  samples: { time: number; y: number }[],
  time: number,
  y: number,
) {
  const first = samples.find((sample) => sample.time >= time - SPEED_WINDOW);
  if (!first || time - first.time <= 0) return 0;
  return (y - first.y) / (time - first.time);
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
  let settings: LightboxOptions = { ...options };
  let maxZoom = 4;
  let tapZoom = 2.5;
  let preload = 1;
  let padding = 32;
  let autoHide: number | false = 2500;
  let loop = Boolean(options.loop);
  let items: LightboxItem[] = [];
  let sources: readonly LightboxItem[] = [];
  let session: Session | undefined;
  let destroyed = false;
  let syncingCarousel = false;
  let closePromise: Promise<void> | undefined;
  let pendingClosed: (() => void) | undefined;
  let state: LightboxState = {
    isOpen: false,
    isClosing: false,
    isAnimating: false,
    index: 0,
    count: 0,
    zoom: { ...identity },
    chrome: "shown",
  };
  const listeners = new Set<(state: LightboxState) => void>();
  const handlers = new Map<
    LightboxEventName,
    Set<(event: LightboxEvent) => void>
  >();
  const historyKey = "reuseLightbox";
  const historyId = Math.random().toString(36).slice(2);
  let historyWindow: Window | undefined;
  let vetting = false;

  let notifiedState = state;

  function configure() {
    settings = { ...options };
    maxZoom = Math.max(1, settings.maxZoom ?? 4);
    tapZoom = clamp(settings.tapZoom ?? 2.5, 1, maxZoom);
    preload = clamp(Math.floor(settings.preload ?? 1), 0, 2);
    padding = Math.max(0, settings.padding ?? 32);
    autoHide =
      settings.autoHide === false
        ? false
        : Number.isFinite(settings.autoHide)
          ? Math.max(0, settings.autoHide as number)
          : 2500;
  }
  configure();

  function updateState(update: Partial<LightboxState>) {
    state = { ...state, ...update };
  }

  function publish(update: Partial<LightboxState>) {
    updateState(update);
    if (
      state.isOpen === notifiedState.isOpen &&
      state.isClosing === notifiedState.isClosing &&
      state.isAnimating === notifiedState.isAnimating &&
      state.index === notifiedState.index &&
      state.count === notifiedState.count &&
      state.chrome === notifiedState.chrome &&
      state.zoom.scale === notifiedState.zoom.scale &&
      state.zoom.x === notifiedState.zoom.x &&
      state.zoom.y === notifiedState.zoom.y
    )
      return;
    notifiedState = state;
    settings.onChange?.(state);
    for (const listener of listeners) listener(state);
    for (const slot of session?.slots ?? []) slot.update?.(state);
  }

  function emit(type: LightboxEventName, s: Session | null) {
    let prevented = false;
    const event: LightboxEvent = {
      type,
      index: state.index,
      slide: s?.slides[state.index] ?? null,
      get defaultPrevented() {
        return prevented;
      },
      preventDefault() {
        if (type === "beforeclose") prevented = true;
      },
    };
    for (const listener of [...(handlers.get(type) ?? [])]) listener(event);
    return prevented;
  }

  function syncAnimating(s: Session) {
    if (session !== s) return;
    const busy = s.animations.size > 0 || Boolean(s.fade) || Boolean(s.motion);
    if (busy !== state.isAnimating) publish({ isAnimating: busy });
  }

  function prefersReducedMotion(s: Session) {
    return Boolean(
      s.dialog.ownerDocument.defaultView?.matchMedia?.(
        "(prefers-reduced-motion: reduce)",
      ).matches,
    );
  }

  function setPhase(s: Session, phase: Session["phase"]) {
    s.phase = phase;
    s.dialog.dataset.phase = phase;
  }

  function readTiming(s: Session) {
    const style = s.dialog.ownerDocument.defaultView?.getComputedStyle(
      s.dialog,
    );
    const read = (name: string) => style?.getPropertyValue(name) ?? "";
    const fixed =
      settings.duration === undefined
        ? undefined
        : Math.max(0, settings.duration);
    s.timing = {
      open:
        fixed ??
        milliseconds(read("--re-lightbox-open-duration"), OPEN_DURATION),
      close:
        fixed ??
        milliseconds(read("--re-lightbox-close-duration"), CLOSE_DURATION),
      ease: read("--re-lightbox-ease").trim() || FLIGHT_EASE,
    };
  }

  function controlInUse(s: Session) {
    const active = s.dialog.ownerDocument.activeElement;
    return s.chromeRoots.some((root) => {
      if (root.matches(":hover")) return true;
      if (!(active instanceof Element) || active === s.openingFocus)
        return false;
      if (!root.contains(active)) return false;
      try {
        return active.matches(":focus-visible");
      } catch {
        return true;
      }
    });
  }

  function applyChrome(s: Session, model: ChromeModel, notify = true) {
    s.chrome = model;
    clearTimeout(s.chromeTimer);
    s.chromeTimer =
      model.timer && autoHide !== false
        ? setTimeout(() => chromeInput(s, { type: "idle" }), autoHide)
        : undefined;
    if (s.dialog.dataset.chrome !== model.chrome)
      s.dialog.dataset.chrome = model.chrome;
    if (state.chrome === model.chrome) return;
    if (notify) publish({ chrome: model.chrome });
    else updateState({ chrome: model.chrome });
  }

  function chromeInput(s: Session, input: ChromeInput, notify = true) {
    if (session !== s) return;
    const hides =
      input.type === "idle" ||
      input.type === "tap" ||
      input.type === "zoom" ||
      input.type === "pinch";
    applyChrome(
      s,
      stepChrome(s.chrome, input, hides && controlInUse(s)),
      notify,
    );
  }

  function looping() {
    return loop && items.length > 1;
  }

  function wrap(index: number) {
    return ((index % items.length) + items.length) % items.length;
  }

  function originOf(index: number) {
    return settings.getOrigin?.(index) ?? items[index]?.origin ?? null;
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

  function applyZoom(s: Session, notify = true) {
    const frame = s.loaded.get(state.index)?.frame;
    if (frame)
      frame.style.transform = `translate(${state.zoom.x}px, ${state.zoom.y}px) scale(${state.zoom.scale})`;
    syncingCarousel = true;
    s.carousel.setEnabled(state.zoom.scale <= 1 && items.length > 1);
    syncingCarousel = false;
    s.viewport.style.touchAction = state.zoom.scale > 1 ? "none" : "pan-x";
    s.zoomButton.setAttribute(
      "aria-label",
      state.zoom.scale > 1 ? s.strings.zoomOut : s.strings.zoomIn,
    );
    s.zoomButton.setAttribute("aria-pressed", String(state.zoom.scale > 1));
    if (!settings.icons?.zoom)
      s.zoomButton.textContent = state.zoom.scale > 1 ? "−" : "+";
    s.dialog.dataset.zoomed = String(state.zoom.scale > 1);
    if (s.zoomed !== state.zoom.scale > 1) {
      s.zoomed = state.zoom.scale > 1;
      chromeInput(s, { type: s.zoomed ? "zoom" : "unzoom" }, notify);
    }
  }

  function restoreOrigin(s: Session) {
    if (!s.hiddenOrigin) return;
    s.hiddenOrigin.element.style.visibility = s.hiddenOrigin.visibility;
    s.hiddenOrigin = undefined;
  }

  function hideOrigin(s: Session) {
    restoreOrigin(s);
    const origin = originOf(state.index);
    if (!origin?.isConnected) return;
    s.hiddenOrigin = { element: origin, visibility: origin.style.visibility };
    origin.style.visibility = "hidden";
  }

  function animate(
    s: Session,
    node: HTMLElement,
    frames: Keyframe[],
    duration: number,
    easing = ZOOM_EASE,
  ) {
    if (duration <= 0 || typeof node.animate !== "function")
      return Promise.resolve();
    return new Promise<void>((resolve) => {
      const animation = node.animate(frames, {
        duration,
        easing,
        fill: "both",
      });
      s.animations.add(animation);
      syncAnimating(s);
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        s.animations.delete(animation);
        s.finishAnimations.delete(finish);
        syncAnimating(s);
        // commitStyles throws on an element that is no longer rendered, such
        // as one inside a dialog the browser already closed.
        try {
          if (node.isConnected) animation.commitStyles?.();
        } catch {}
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

  function flightDuration(s: Session, closing: boolean) {
    const duration = closing ? s.timing.close : s.timing.open;
    return prefersReducedMotion(s)
      ? Math.min(duration, REDUCED_DURATION)
      : duration;
  }

  function flight(s: Session, closing: boolean) {
    const from = closing
      ? s.dialog.ownerDocument.defaultView?.getComputedStyle(s.backdrop)
          .opacity || "1"
      : "0";
    return Promise.all([
      morph(s, closing),
      animate(
        s,
        s.backdrop,
        [{ opacity: from }, { opacity: closing ? 0 : 1 }],
        flightDuration(s, closing),
        s.timing.ease,
      ),
    ]);
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
    const origin = originOf(state.index);
    const rect = origin?.isConnected
      ? origin.getBoundingClientRect()
      : undefined;
    const viewport = view(s);
    const size = fit(state.index, s);
    const duration = flightDuration(s, closing);
    const ease = s.timing.ease;
    if (prefersReducedMotion(s))
      return animate(
        s,
        entry.frame,
        closing
          ? [{ opacity: live.opacity }, { opacity: 0 }]
          : [{ opacity: 0 }, { opacity: 1 }],
        duration,
        "ease",
      );
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
                transform: `${live.transform} scale(.94)`,
                opacity: 0,
              },
            ]
          : [
              { transform: `${resting} scale(.94)`, opacity: 0 },
              { transform: resting, opacity: 1 },
            ],
        duration,
        ease,
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
      ease,
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
    const span =
      s.carouselLoops && s.carousel.getState().isLooping
        ? s.slides.reduce((sum, slide) => sum + slide.offsetWidth, 0)
        : 0;
    return s.slides.flatMap((slide, index) => {
      const base = rtl
        ? s.viewport.scrollWidth - slide.offsetLeft - slide.offsetWidth
        : slide.offsetLeft;
      return (span ? [base - span, base, base + span] : [base]).some(
        (left) =>
          left < start + width - 1 && left + slide.offsetWidth > start + 1,
      )
        ? [index]
        : [];
    });
  }

  function distanceTo(index: number) {
    const gap = Math.abs(index - state.index);
    return looping() ? Math.min(gap, items.length - gap) : gap;
  }

  // Unloads images outside the preload window, except those still on screen
  // while the strip travels.
  function trimSlides(s: Session) {
    if (session !== s) return;
    const visible = visibleRange(s);
    for (const [index, entry] of s.loaded) {
      if (distanceTo(index) <= preload || visible.includes(index)) continue;
      entry.cancel();
      entry.frame.remove();
      s.loaded.delete(index);
    }
  }

  function loadSlides(s: Session) {
    trimSlides(s);
    for (let step = -preload; step <= preload; step++) {
      const index = looping() ? wrap(state.index + step) : state.index + step;
      if (index < 0 || index >= items.length || s.loaded.has(index)) continue;
      const item = items[index];
      const doc = s.dialog.ownerDocument;
      const frame = doc.createElement("div");
      frame.className = "re-lightbox-frame";
      const image = doc.createElement("img");
      image.className = "re-lightbox-image";
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
          error.className = "re-lightbox-error";
          error.setAttribute("role", "status");
          error.textContent = s.strings.error;
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
      cleanup = settings.renderContent?.({
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
    const gap = index - state.index;
    const forward =
      looping() && Math.abs(gap) > items.length / 2 ? gap < 0 : gap > 0;
    publish({ index, zoom: { ...identity } });
    update(s, forward ? 1 : -1);
    s.status.textContent = s.strings.slide(index, items.length);
    emit("change", s);
  }

  function renderCounter(s: Session, direction: 1 | -1 | 0) {
    const text = s.strings.counter(state.index, items.length);
    if (text === s.counterText) return;
    const after = [...text];
    s.counterText = text;
    const doc = s.dialog.ownerDocument;
    const cells = [...s.counter.children] as HTMLElement[];
    while (cells.length > after.length) cells.shift()?.remove();
    while (cells.length < after.length) {
      const cell = doc.createElement("span");
      cell.className = "re-lightbox-counter-cell";
      cell.append(doc.createElement("span"));
      s.counter.prepend(cell);
      cells.unshift(cell);
    }
    const roll =
      direction !== 0 &&
      !prefersReducedMotion(s) &&
      typeof s.counter.animate === "function";
    for (const [index, cell] of cells.entries()) {
      const char = after[index];
      const current = cell.lastElementChild as HTMLElement;
      if (current.textContent === char) continue;
      while (cell.firstElementChild !== current)
        cell.firstElementChild?.remove();
      if (!roll || !current.textContent) {
        current.textContent = char;
        continue;
      }
      const incoming = doc.createElement("span");
      incoming.textContent = char;
      cell.append(incoming);
      const timing = { duration: 200, easing: "ease" };
      incoming.animate(
        [{ translate: `0 ${direction * 100}%` }, { translate: "0 0" }],
        timing,
      );
      const leaving = current.animate(
        [{ translate: "0 0" }, { translate: `0 ${direction * -100}%` }],
        { ...timing, fill: "forwards" },
      );
      leaving.onfinish = () => current.remove();
    }
  }

  function update(s: Session, direction: 1 | -1 | 0 = 0) {
    loadSlides(s);
    hideOrigin(s);
    renderCounter(s, direction);
    s.caption.textContent = items[state.index].caption || "";
    const single = items.length < 2;
    s.prev.hidden = single;
    s.next.hidden = single;
    s.counter.hidden = single;
    s.prev.disabled = !looping() && state.index === 0;
    s.next.disabled = !looping() && state.index === items.length - 1;
    for (const [index, slide] of s.slides.entries()) {
      slide.inert = index !== state.index;
      slide.setAttribute("aria-hidden", String(index !== state.index));
      slide.setAttribute("aria-label", s.strings.slide(index, items.length));
    }
    for (const [index, thumb] of s.thumbs.entries())
      thumb.setAttribute("aria-current", String(index === state.index));
    centerThumb(s);
    applyZoom(s);
  }

  function centerThumb(s: Session) {
    const strip = s.thumbStrip;
    const thumb = s.thumbs[state.index];
    if (
      !strip ||
      !thumb ||
      s.centeredThumb === state.index ||
      strip.scrollWidth <= strip.clientWidth
    )
      return;
    const reduced = prefersReducedMotion(s);
    // An RTL strip scrolls through negative positions, where offsetLeft already lies.
    const max = strip.scrollWidth - strip.clientWidth;
    const rtl =
      s.dialog.ownerDocument.defaultView?.getComputedStyle(strip).direction ===
      "rtl";
    strip.scrollTo({
      left: clamp(
        thumb.offsetLeft - (strip.clientWidth - thumb.offsetWidth) / 2,
        rtl ? -max : 0,
        rtl ? 0 : max,
      ),
      behavior: s.centeredThumb < 0 || reduced ? "instant" : "smooth",
    });
    s.centeredThumb = state.index;
  }

  function teardown(s: Session) {
    if (session === s) session = undefined;
    s.abort.abort();
    clearTimeout(s.wheelTimer);
    clearTimeout(s.chromeTimer);
    clearTimeout(s.tapTimer);
    if (s.motion)
      s.dialog.ownerDocument.defaultView?.cancelAnimationFrame(s.motion.frame);
    s.motion = undefined;
    finishFade(s, false);
    cancelAnimations(s);
    s.carousel.destroy();
    for (const entry of s.loaded.values()) entry.cancel();
    for (const slot of s.slots.splice(0)) slot.destroy?.();
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
    updateState({ zoom });
    if (frame && shouldAnimate) {
      frame.style.clipPath = "";
      frame.style.opacity = "";
    }
    applyZoom(s, false);
    if (notify) publish({});
    if (frame && live && shouldAnimate) {
      void animate(
        s,
        frame,
        [{ transform: live }, { transform: frame.style.transform }],
        prefersReducedMotion(s)
          ? 0
          : Math.min(220, Math.max(0, settings.duration ?? 280)),
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
    syncAnimating(s);
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
    const reduced = prefersReducedMotion(s);
    const duration = Math.min(240, Math.max(0, settings.duration ?? 280));
    if (reduced || duration <= 0 || typeof s.viewport.animate !== "function") {
      fade.jump();
      return;
    }
    s.fade = fade;
    syncAnimating(s);
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
          if (s.fade !== fade) return;
          s.fade = undefined;
          syncAnimating(s);
        };
        fadeIn.finished.then(done, done);
      },
      () => {},
    );
  }

  function goTo(index: number, direction?: 1 | -1) {
    const s = session;
    if (!s || state.isClosing || !Number.isFinite(index)) return;
    finishFade(s, true);
    const target = clamp(Math.floor(index), 0, items.length - 1);
    const gap = Math.abs(target - state.index);
    const far =
      (looping() && s.carousel.getState().isLooping
        ? Math.min(gap, items.length - gap)
        : gap) > 1;
    syncingCarousel = true;
    activeChanged(s, target);
    if (far) fadeTo(s, target);
    else if (direction && looping() && s.carousel.getState().isLooping)
      s.carousel[direction > 0 ? "next" : "prev"]();
    else s.carousel.goTo(target, "smooth");
    syncingCarousel = false;
  }

  function step(direction: 1 | -1) {
    const index = state.index + direction;
    goTo(looping() ? wrap(index) : index, direction);
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
    s.backdrop.style.opacity = "";
    s.dialog.style.removeProperty("--re-lightbox-chrome-opacity");
    if (s.phase !== "entering" && s.phase !== "closing") setPhase(s, "open");
    applyZoom(s);
  }

  function dismissDrag(s: Session, dx: number, dy: number, half: number) {
    const progress = clamp(Math.abs(dy) / half, 0, 1);
    const frame = s.loaded.get(state.index)?.frame;
    if (frame)
      frame.style.transform = `translate(${dx}px, ${dy}px) scale(${1 - progress * 0.25})`;
    s.backdrop.style.opacity = String(1 - progress);
    s.dialog.style.setProperty(
      "--re-lightbox-chrome-opacity",
      String(Math.max(0, 1 - 2 * progress)),
    );
  }

  function returnFromDismiss(s: Session) {
    const frame = s.loaded.get(state.index)?.frame;
    const win = s.dialog.ownerDocument.defaultView;
    const transform = frame && win?.getComputedStyle(frame).transform;
    const opacity = win?.getComputedStyle(s.backdrop).opacity || "1";
    setPhase(s, "returning");
    s.backdrop.style.opacity = "";
    applyZoom(s);
    const duration = prefersReducedMotion(s) ? 0 : s.timing.open;
    void Promise.all([
      frame && transform && transform !== "none"
        ? animate(
            s,
            frame,
            [{ transform }, { transform: frame.style.transform }],
            duration,
            s.timing.ease,
          )
        : undefined,
      animate(
        s,
        s.backdrop,
        [{ opacity }, { opacity: 1 }],
        duration,
        s.timing.ease,
      ),
    ]).then(() => {
      if (session === s && s.phase === "returning") setPhase(s, "open");
    });
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
        half: 1,
        samples: [],
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
        if (s.gesture) {
          s.gesture.touch = event.pointerType !== "mouse";
          s.gesture.samples.push({ time: event.timeStamp, y: event.clientY });
        }
        if (s.pointers.size === 2) {
          clearTimeout(s.tapTimer);
          s.tapTimer = undefined;
          s.lastTap = undefined;
          chromeInput(s, { type: "pinch" });
        }
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
        gesture.samples.push({ time: event.timeStamp, y: event.clientY });
        while (gesture.samples[0].time < event.timeStamp - SPEED_WINDOW * 2)
          gesture.samples.shift();
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
          applyZoom(s, false);
        } else if (gesture.zoom.scale > 1) {
          event.preventDefault();
          if (gesture.moved) s.dialog.dataset.panning = "true";
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
          applyZoom(s, false);
        } else if (gesture.touch && points.length === 1) {
          if (!gesture.axis && Math.hypot(dx, dy) >= 10) {
            gesture.axis = Math.abs(dy) > Math.abs(dx) ? "y" : "x";
            if (gesture.axis === "y") {
              gesture.half = view(s).height / 2;
              s.carousel.setEnabled(false);
              s.viewport.setPointerCapture?.(event.pointerId);
              setPhase(s, "dragging");
            }
          }
          if (gesture.axis === "y") {
            event.preventDefault();
            dismissDrag(s, dx, dy, gesture.half);
          }
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
      delete s.dialog.dataset.panning;
      if (gesture?.axis === "y" && !hadPinch) {
        s.dialog.style.removeProperty("--re-lightbox-chrome-opacity");
        const dy = event.clientY - gesture.start.y;
        const speed = releaseSpeed(
          gesture.samples,
          event.timeStamp,
          event.clientY,
        );
        resetGesture();
        if (
          event.type === "pointerup" &&
          (Math.abs(dy) > DISMISS_DISTANCE || Math.abs(speed) > DISMISS_SPEED)
        ) {
          void close();
          if (state.isClosing || session !== s) return;
        }
        returnFromDismiss(s);
        return;
      }
      if (
        event.type === "pointerup" &&
        gesture?.touch &&
        !gesture.moved &&
        !hadPinch
      ) {
        const now = Date.now();
        s.suppressClickUntil = now + 400;
        const current = point(event);
        const box = s.loaded.get(state.index)?.frame.getBoundingClientRect();
        const onPhoto =
          box !== undefined &&
          current.x >= box.left &&
          current.x <= box.right &&
          current.y >= box.top &&
          current.y <= box.bottom;
        const previous = s.lastTap;
        const pending = s.tapTimer !== undefined;
        clearTimeout(s.tapTimer);
        s.tapTimer = undefined;
        s.lastTap = undefined;
        const doubleTap =
          settings.imageClick !== "close" && settings.doubleTapZoom !== false;
        if (!onPhoto || settings.imageClick === "close") {
          void close();
          if (state.isClosing || session !== s) return;
        } else if (
          doubleTap &&
          previous &&
          now - previous.time < DOUBLE_TAP_TIME &&
          Math.hypot(
            current.x - previous.point.x,
            current.y - previous.point.y,
          ) < DOUBLE_TAP_DISTANCE
        ) {
          toggleZoom(focus(current));
        } else {
          if (pending) chromeInput(s, { type: "tap" });
          if (doubleTap) {
            s.lastTap = { time: now, point: current };
            s.tapTimer = setTimeout(() => {
              s.tapTimer = undefined;
              s.lastTap = undefined;
              chromeInput(s, { type: "tap" });
            }, DOUBLE_TAP_TIME);
          } else chromeInput(s, { type: "tap" });
        }
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
    s.viewport.addEventListener(
      "lostpointercapture",
      (event) => {
        if (event.target === s.viewport) release(event);
      },
      { signal },
    );
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
        if (!target.closest(".re-lightbox-frame")) {
          void close();
          return;
        }
        if (settings.imageClick === "close") void close();
        else if (settings.imageClick !== "none" && isSettled(s))
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
          applyZoom(s, false);
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

  function connect(viewport: HTMLDivElement) {
    return createCarousel(viewport, {
      drag: true,
      loop: looping(),
      onChange: (value) => {
        if (!syncingCarousel && session?.viewport === viewport)
          activeChanged(session, value.index);
      },
    });
  }

  // The carousel reads loop only when created until its setOptions (VPF-255) lands.
  function reconnect(s: Session, index: number) {
    const syncing = syncingCarousel;
    syncingCarousel = true;
    s.carousel.destroy();
    s.carousel = connect(s.viewport);
    s.carouselLoops = looping();
    s.carousel.goTo(index, "instant");
    syncingCarousel = syncing;
  }

  function ownsHistory(win: Window) {
    const current: unknown = win.history.state;
    return (
      typeof current === "object" &&
      current !== null &&
      (current as Record<string, unknown>)[historyKey] === historyId
    );
  }

  function pushHistory(win: Window) {
    const current: unknown = win.history.state;
    win.history.pushState(
      {
        ...(typeof current === "object" && current !== null ? current : {}),
        [historyKey]: historyId,
      },
      "",
      win.location.href,
    );
  }

  // A frame shares the page's session history but sees none of the page's entries, so it opts in.
  function enterHistory(win: Window) {
    if (settings.history === false || (!settings.history && win.top !== win))
      return;
    if (historyWindow !== win) {
      historyWindow?.removeEventListener("popstate", onPopState);
      historyWindow = win;
      win.addEventListener("popstate", onPopState);
    }
    // While a back is still on its way, its popstate restores the entry.
    if (!historyBacks.has(win) && !ownsHistory(win)) pushHistory(win);
  }

  // Resolves once the back has landed, so a navigation after close() is not undone by it.
  function leaveHistory() {
    const win = historyWindow;
    if (!win) return Promise.resolve();
    const landing = ownsHistory(win)
      ? goBack(win)
      : (historyBacks.get(win)?.landing ?? Promise.resolve());
    releaseHistory();
    return landing;
  }

  function releaseHistory() {
    if (session) return;
    historyWindow?.removeEventListener("popstate", onPopState);
    historyWindow = undefined;
  }

  function onPopState(event: Event) {
    const win = historyWindow;
    if (!win) return;
    if (landed(win, event)) {
      if (session && !state.isClosing && !ownsHistory(win)) pushHistory(win);
      return;
    }
    if (session && !state.isClosing && !ownsHistory(win))
      void closeSession(true);
  }

  function mountSlots(
    s: Session,
    places: Record<LightboxSlotName, (node: Node) => void>,
  ) {
    const doc = s.dialog.ownerDocument;
    for (const name of Object.keys(places) as LightboxSlotName[]) {
      const slot = settings.slots?.[name];
      if (!slot) continue;
      const instance = slot({ lightbox: controller, document: doc });
      places[name](instance.node);
      s.slots.push(instance);
      instance.update?.(state);
    }
  }

  function open(input: readonly LightboxItem[], index = 0) {
    if (destroyed) throw new Error("This lightbox has been destroyed.");
    const nextItems = validateItems(input);
    if (!Number.isFinite(index))
      throw new TypeError("Image index must be finite.");
    configure();
    const doc =
      settings.container?.ownerDocument ??
      (typeof document === "undefined" ? undefined : document);
    if (!doc?.body)
      throw new Error("Opening a lightbox needs a browser document.");
    pendingClosed?.();
    if (session) {
      teardown(session);
      emit("closed", null);
    }
    if (destroyed) return;
    items = nextItems;
    sources = [...input];
    closePromise = undefined;
    const strings = { ...defaultStrings, ...settings.strings };
    const dialog = doc.createElement("dialog");
    if (typeof dialog.showModal !== "function")
      throw new Error("Lightbox requires native dialog support.");
    dialog.className = ["re-lightbox", settings.className]
      .filter(Boolean)
      .join(" ");
    dialog.setAttribute("aria-label", settings.label || strings.dialog);
    dialog.dataset.chrome = "shown";
    dialog.dataset.phase = "entering";
    dialog.dataset.zoomable = String(
      (settings.imageClick ?? "zoom") === "zoom" && maxZoom > 1,
    );
    const viewport = doc.createElement("div");
    viewport.className = "re-lightbox-viewport";
    viewport.tabIndex = 0;
    viewport.setAttribute("aria-label", settings.label || strings.dialog);
    const makeSlide = () => {
      const slide = doc.createElement("div");
      slide.className = "re-lightbox-slide";
      slide.dataset.carouselSlide = "";
      slide.setAttribute("role", "group");
      return slide;
    };
    const slides = items.map(() => makeSlide());
    viewport.append(...slides);
    const backdrop = doc.createElement("div");
    backdrop.className = "re-lightbox-backdrop";
    backdrop.setAttribute("aria-hidden", "true");
    const toolbar = doc.createElement("div");
    toolbar.className = "re-lightbox-toolbar";
    const toolbarStart = doc.createElement("div");
    toolbarStart.className = "re-lightbox-toolbar-start";
    const toolbarEnd = doc.createElement("div");
    toolbarEnd.className = "re-lightbox-toolbar-end";
    toolbar.append(toolbarStart, toolbarEnd);
    dialog.append(backdrop, viewport, toolbar);
    const abort = new AbortController();
    const button = (
      name: "close" | "prev" | "next" | "zoom",
      label: string,
      text: string,
      action: () => void,
      parent: HTMLElement,
    ) => {
      const element = doc.createElement("button");
      element.type = "button";
      element.className = `re-lightbox-button re-lightbox-${name}`;
      element.setAttribute("aria-label", label);
      const icon = settings.icons?.[name]?.();
      if (icon) element.append(icon);
      else element.textContent = text;
      element.addEventListener("click", action, { signal: abort.signal });
      parent.append(element);
      return element;
    };
    const zoomButton = button(
      "zoom",
      strings.zoomIn,
      "+",
      () => toggleZoom(),
      toolbarEnd,
    );
    const closeButton = button(
      "close",
      strings.close,
      "×",
      () => {
        void close();
      },
      toolbarEnd,
    );
    closeButton.autofocus = true;
    const prev = button("prev", strings.previous, "‹", () => step(-1), dialog);
    const next = button("next", strings.next, "›", () => step(1), dialog);
    const footer = doc.createElement("div");
    footer.className = "re-lightbox-footer";
    const counter = doc.createElement("span");
    counter.className = "re-lightbox-counter";
    counter.setAttribute("aria-hidden", "true");
    const caption = doc.createElement("p");
    caption.className = "re-lightbox-caption";
    footer.append(caption, counter);
    const status = doc.createElement("div");
    status.className = "re-lightbox-status";
    status.setAttribute("role", "status");
    dialog.append(footer, status);
    const thumbs: HTMLButtonElement[] = [];
    let thumbStrip: HTMLDivElement | undefined;
    if (settings.thumbnails) {
      thumbStrip = doc.createElement("div");
      thumbStrip.className = "re-lightbox-thumbnails";
      thumbStrip.setAttribute("role", "group");
      thumbStrip.setAttribute("aria-label", strings.thumbnails);
      footer.append(thumbStrip);
    }
    const makeThumbs = () => {
      if (!thumbStrip) return;
      thumbs.length = 0;
      thumbStrip.replaceChildren(
        ...items.map((item, i) => {
          const thumb = doc.createElement("button");
          thumb.type = "button";
          thumb.setAttribute("aria-label", strings.thumbnail(i, items.length));
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
          thumbs.push(thumb);
          return thumb;
        }),
      );
    };
    makeThumbs();
    const previousFocus =
      doc.activeElement instanceof HTMLElement ? doc.activeElement : null;
    (settings.container ?? doc.body).append(dialog);
    const restoreScroll = lockScroll(doc);
    try {
      dialog.showModal();
    } catch (error) {
      restoreScroll();
      dialog.remove();
      throw error;
    }
    const s: Session = {
      dialog,
      viewport,
      backdrop,
      slides,
      loaded: new Map(),
      carousel: connect(viewport),
      carouselLoops: looping(),
      strings,
      slots: [],
      thumbStrip,
      centeredThumb: -1,
      abort,
      animations: new Set(),
      finishAnimations: new Set(),
      previousFocus,
      restoreScroll,
      phase: "entering",
      timing: { open: OPEN_DURATION, close: CLOSE_DURATION, ease: FLIGHT_EASE },
      chrome: initialChrome(false),
      chromeRoots: [toolbar, prev, next, footer],
      openingFocus: closeButton,
      zoomed: false,
      counter,
      counterText: "",
      status,
      caption,
      prev,
      next,
      zoomButton,
      thumbs,
      makeSlide,
      makeThumbs,
      pointers: new Map(),
      suppressClickUntil: 0,
    };
    session = s;
    if (doc.defaultView) enterHistory(doc.defaultView);
    publish({
      isOpen: true,
      isClosing: false,
      isAnimating: false,
      index: clamp(Math.floor(index), 0, items.length - 1),
      count: items.length,
      zoom: { ...identity },
      chrome: "shown",
    });
    mountSlots(s, {
      toolbarStart: (node) => toolbarStart.append(node),
      toolbarEnd: (node) => closeButton.before(node),
      footer: (node) => caption.after(node),
      aside: (node) => {
        const aside = doc.createElement("div");
        aside.className = "re-lightbox-aside";
        aside.append(node);
        dialog.append(aside);
        s.chromeRoots.push(aside);
      },
    });
    update(s);
    s.carousel.goTo(state.index, "instant");
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
        if (session !== s) return;
        teardown(s);
        publish({
          isOpen: false,
          isClosing: false,
          isAnimating: false,
          zoom: { ...identity },
        });
        void reportClosed(leaveHistory());
      },
      { signal: abort.signal },
    );
    dialog.addEventListener(
      "keydown",
      (event) => {
        s.openingFocus = null;
        chromeInput(s, { type: "key" });
        if (
          event.defaultPrevented ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey ||
          (event.target instanceof Element &&
            event.target.closest(
              "input,textarea,select,[contenteditable=true],[data-lightbox-interactive]",
            ))
        )
          return;
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          const rtl =
            doc.defaultView?.getComputedStyle(dialog).direction === "rtl";
          step((event.key === "ArrowRight") !== rtl ? 1 : -1);
        }
        if (event.key === "Home" || event.key === "End") {
          event.preventDefault();
          goTo(event.key === "Home" ? 0 : items.length - 1);
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
    const win = doc.defaultView;
    const watch = () => {
      const motion = s.motion;
      if (!motion || session !== s || !win) return;
      const left = viewport.scrollLeft;
      motion.still = left === motion.left ? motion.still + 1 : 0;
      motion.left = left;
      if ((motion.still >= 3 && isSettled(s)) || motion.still >= 30) {
        s.motion = undefined;
        trimSlides(s);
        syncAnimating(s);
        emit("settle", s);
        return;
      }
      motion.frame = win.requestAnimationFrame(watch);
    };
    viewport.addEventListener(
      "scroll",
      () => {
        if (s.motion || session !== s || !win) return;
        s.motion = {
          frame: win.requestAnimationFrame(watch),
          left: Number.NaN,
          still: 0,
        };
        syncAnimating(s);
      },
      { signal: abort.signal, passive: true },
    );
    installGestures(s);
    dialog.addEventListener(
      "pointermove",
      (event) => {
        if (event.pointerType === "mouse" && event.buttons === 0)
          chromeInput(s, {
            type: "move",
            point: { x: event.clientX, y: event.clientY },
            movement: { x: event.movementX, y: event.movementY },
          });
      },
      { signal: abort.signal, passive: true },
    );
    dialog.addEventListener(
      "pointerdown",
      (event) => {
        if (event.pointerType === "touch" || event.pointerType === "pen")
          chromeInput(s, { type: "touch" });
      },
      { signal: abort.signal, passive: true, capture: true },
    );
    dialog.addEventListener(
      "focusin",
      (event) => {
        const target = event.target;
        if (
          target !== s.openingFocus &&
          target instanceof Node &&
          s.chromeRoots.some((root) => root.contains(target))
        )
          chromeInput(s, { type: "focus" });
      },
      { signal: abort.signal },
    );
    closeButton.focus({ preventScroll: true });
    readTiming(s);
    void win?.getComputedStyle(toolbar).opacity;
    setPhase(s, "opening");
    applyChrome(
      s,
      initialChrome(Boolean(win?.matchMedia?.("(hover: hover)").matches)),
    );
    emit("open", s);
    void flight(s, false).then(() => {
      if (session !== s || state.isClosing) return;
      if (s.phase === "opening") setPhase(s, "open");
      emit("opened", s);
    });
  }

  function close(): Promise<void> {
    return closeSession(false);
  }

  // closed waits for the history back, unless open() or destroy() comes first.
  function reportClosed(landing: Promise<void>) {
    let reported = false;
    const report = () => {
      if (reported) return;
      reported = true;
      if (pendingClosed === report) pendingClosed = undefined;
      emit("closed", null);
    };
    pendingClosed = report;
    return landing.then(report);
  }

  function closeSession(fromHistory: boolean): Promise<void> {
    const s = session;
    if (!s) return closePromise ?? Promise.resolve();
    if (closePromise) return closePromise;
    if (vetting) return Promise.resolve();
    vetting = true;
    let prevented: boolean;
    try {
      prevented = emit("beforeclose", s);
    } finally {
      vetting = false;
    }
    if (prevented) {
      if (fromHistory && historyWindow) pushHistory(historyWindow);
      return Promise.resolve();
    }
    if (session !== s || closePromise) return closePromise ?? Promise.resolve();
    cancelAnimations(s);
    clearTimeout(s.tapTimer);
    s.tapTimer = undefined;
    chromeInput(s, { type: "close" });
    publish({ isClosing: true });
    s.dialog.style.removeProperty("--re-lightbox-chrome-opacity");
    setPhase(s, "closing");
    let closing: Promise<void> | undefined;
    closing = (async () => {
      await flight(s, true);
      if (session !== s) return;
      teardown(s);
      publish({
        isOpen: false,
        isClosing: false,
        isAnimating: false,
        zoom: { ...identity },
      });
      if (fromHistory) releaseHistory();
      await reportClosed(fromHistory ? Promise.resolve() : leaveHistory());
      if (closePromise === closing) closePromise = undefined;
    })();
    closePromise = closing;
    return closing;
  }

  function setItems(input: readonly LightboxItem[], index?: number) {
    if (destroyed) throw new Error("This lightbox has been destroyed.");
    const nextItems = validateItems(input);
    if (index !== undefined && !Number.isFinite(index))
      throw new TypeError("Image index must be finite.");
    const s = session;
    if (!s || state.isClosing) {
      items = nextItems;
      sources = [...input];
      return;
    }
    finishFade(s, true);
    const taken = new Set<number>();
    const from = input.map((item) => {
      const old = sources.indexOf(item);
      if (old < 0 || taken.has(old)) return -1;
      taken.add(old);
      return old;
    });
    for (const [j, item] of nextItems.entries()) {
      if (from[j] >= 0) continue;
      const old = items.findIndex(
        (candidate, i) => !taken.has(i) && candidate.src === item.src,
      );
      if (old < 0) continue;
      taken.add(old);
      from[j] = old;
    }
    let target = from.indexOf(state.index);
    const kept = target >= 0;
    if (!kept && index !== undefined)
      target = clamp(Math.floor(index), 0, nextItems.length - 1);
    for (let gap = 1; target < 0 && gap < items.length; gap++) {
      target = from.indexOf(state.index + gap);
      if (target < 0) target = from.indexOf(state.index - gap);
    }
    if (target < 0) target = clamp(state.index, 0, nextItems.length - 1);
    const slides = nextItems.map((item, j) => {
      const old = from[j];
      if (old < 0) return s.makeSlide();
      item.width ??= items[old].width;
      item.height ??= items[old].height;
      return s.slides[old];
    });
    const loaded = new Map<number, LoadedSlide>();
    for (const [old, entry] of s.loaded) {
      const j = from.indexOf(old);
      if (j >= 0) loaded.set(j, entry);
      else entry.cancel();
    }
    for (const [old, slide] of s.slides.entries())
      if (!taken.has(old)) slide.remove();
    if (kept) {
      let anchor = slides[target];
      for (let j = target - 1; j >= 0; j--) {
        if (anchor.previousElementSibling !== slides[j])
          anchor.before(slides[j]);
        anchor = slides[j];
      }
      anchor = slides[target];
      for (let j = target + 1; j < slides.length; j++) {
        if (anchor.nextElementSibling !== slides[j]) anchor.after(slides[j]);
        anchor = slides[j];
      }
    } else {
      cancelAnimations(s);
      s.viewport.append(...slides);
    }
    items = nextItems;
    sources = [...input];
    s.slides = slides;
    s.loaded = loaded;
    s.makeThumbs();
    s.centeredThumb = Number.NaN;
    const changed = target !== state.index;
    if ((changed || !kept || s.carouselLoops) && state.zoom.scale > 1) {
      updateState({ zoom: { ...identity } });
      applyZoom(s);
    }
    syncingCarousel = true;
    if (s.carouselLoops !== looping()) reconnect(s, target);
    else {
      s.carousel.refresh();
      if (!kept) s.carousel.goTo(target, "instant");
    }
    syncingCarousel = false;
    publish({ index: target, count: items.length });
    update(s);
    if (changed) emit("change", s);
  }

  const controller: Lightbox = {
    open,
    close,
    next: () => step(1),
    prev: () => step(-1),
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
    on: (type, listener) => {
      const set = handlers.get(type) ?? new Set();
      handlers.set(type, set);
      set.add(listener);
      return () => {
        set.delete(listener);
      };
    },
    append: (input) => setItems([...sources, ...input]),
    setItems,
    setOptions: (next) => {
      if (!("loop" in next)) return;
      loop = Boolean(next.loop);
      const s = session;
      if (!s || state.isClosing) return;
      if (s.carouselLoops !== looping()) {
        reconnect(s, state.index);
        applyZoom(s);
      }
      update(s);
    },
    getSlide: (index) => session?.slides[index] ?? null,
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      pendingClosed?.();
      const s = session;
      if (s) teardown(s);
      closePromise = undefined;
      publish({
        isOpen: false,
        isClosing: false,
        isAnimating: false,
        zoom: { ...identity },
      });
      if (s) emit("closed", null);
      const win = historyWindow;
      if (win && ownsHistory(win)) goBack(win);
      win?.removeEventListener("popstate", onPopState);
      historyWindow = undefined;
      listeners.clear();
      handlers.clear();
    },
  };
  return controller;
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
    /** Images open only with the images of the same group, data-lightbox-group by default. */
    group?: (image: HTMLImageElement) => string;
    /** Replaces the images in root as the list; a click opens at the item whose origin is the image. */
    items?: (root: HTMLElement) => readonly LightboxItem[];
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
    const image = images.find(
      (candidate) =>
        candidate === target ||
        candidate.closest("a, button")?.contains(target),
    );
    if (!image) return;
    event.preventDefault();
    if (options.items) {
      const list = options.items(root);
      const index = list.findIndex((item) => item.origin === image);
      controller.open(list, index < 0 ? images.indexOf(image) : index);
      return;
    }
    const group =
      options.group ??
      ((element: HTMLImageElement) =>
        element.closest<HTMLElement>("[data-lightbox-group]")?.dataset
          .lightboxGroup ?? "");
    const name = group(image);
    const members = images.filter((candidate) => group(candidate) === name);
    controller.open(
      members.map((member) =>
        (options.getItem || lightboxItemFromImage)(member),
      ),
      members.indexOf(image),
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
