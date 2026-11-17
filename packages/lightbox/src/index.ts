import { type Carousel, createCarousel } from "@reuse-sh/carousel";
import { createThinkingDots } from "@reuse-sh/loaders";
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
  elasticZoom,
  identity,
  type Point,
  panLimits,
  type Rect,
  type Size,
  shapeOf,
  unrubber,
  widthFit,
  type Zoom,
  zoomAround,
  zoomLimits,
} from "./geometry.js";
import {
  fileWidth,
  formatOf,
  isImageFile,
  largestSource,
  largestWidth,
  lookupFormat,
  type MediaFormat,
  svgSize,
} from "./sources.js";

const carouselInternals = Symbol.for("@reuse-sh/carousel internals");

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

export type LightboxControl =
  | "close"
  | "arrows"
  | "counter"
  | "zoom"
  | "fullscreen"
  | "download"
  | "slideshow";

const defaultControls: Record<LightboxControl, boolean> = {
  close: true,
  arrows: true,
  counter: true,
  zoom: true,
  fullscreen: false,
  download: false,
  slideshow: false,
};

export type LightboxIcon =
  | "close"
  | "prev"
  | "next"
  | "zoom"
  | "fullscreen"
  | "download"
  | "slideshow";

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
  /** The image file; an item with a type uses it as its media source where its module says so. */
  src?: string;
  /** Picks the content module whose type matches; without one the item is an image. */
  type?: string;
  video?: { src: string; poster?: string };
  embed?: string;
  /** Builds an HTML slide's content; HTML strings are never parsed. */
  html?: () => Node;
  srcset?: string;
  sizes?: string;
  previewSrc?: string;
  width?: number;
  height?: number;
  alt?: string;
  caption?: string;
  thumbnailSrc?: string;
  origin?: HTMLElement | null | (() => HTMLElement | null);
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

export interface LightboxMountContext {
  item: LightboxItem;
  index: number;
  /** Aborts when the slide unmounts. */
  signal: AbortSignal;
  /** True when the player should start once it is current: the autoplay option and an open by a user action. */
  autoplay: boolean;
}

export interface LightboxMounted {
  unmount(): void;
  /** Without pause the slide unmounts when another photo becomes current. */
  pause?(): void;
  /** Called when the slide becomes current; plays unless the person paused it. */
  resume?(): void;
  /** Width over height, 16 / 9 when missing. */
  aspect?: number;
  /** The slide takes pointer events, and the viewer's gestures leave it alone. */
  interactive?: boolean;
  /** Settles once the player can show itself; the poster and the spinner stay until then. */
  ready?: Promise<unknown>;
}

export interface LightboxContent {
  type: string;
  mount(container: HTMLElement, context: LightboxMountContext): LightboxMounted;
}

export interface LightboxOptions {
  container?: HTMLElement;
  label?: string;
  imageClick?: "zoom" | "close" | "none";
  doubleTapZoom?: boolean;
  maxZoom?: number;
  tapZoom?: number;
  preload?: number;
  controls?: Partial<Record<LightboxControl, boolean>>;
  thumbnails?: false | "bottom" | "side";
  caption?: "bottom" | "side";
  slideshow?: { interval?: number };
  padding?: number;
  duration?: number;
  autoHide?: number | false;
  className?: string;
  icons?: Partial<Record<LightboxIcon, () => Node>>;
  renderContent?: (context: LightboxContentContext) => undefined | (() => void);
  /** Content modules for items with a type, such as video() from @reuse-sh/lightbox/video. */
  content?: readonly LightboxContent[];
  /** Starts the current player once it shows, when the viewer opened from a user action; default true. */
  autoplay?: boolean;
  loop?: boolean;
  history?: boolean;
  strings?: Partial<LightboxStrings>;
  slots?: Partial<Record<LightboxSlotName, LightboxSlot>>;
  getOrigin?: (index: number) => HTMLElement | null;
  protect?: boolean;
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

type MediaSlide = {
  content: LightboxContent;
  mounted?: LightboxMounted;
  abort?: AbortController;
};

type LoadedSlide = {
  frame: HTMLDivElement;
  media?: MediaSlide;
  image: HTMLImageElement;
  loader?: HTMLImageElement;
  /** The pixel width of the file on screen, once the full file shows. */
  natural?: number;
  status: "idle" | "loading" | "settled" | "failed";
  load: (priority: "high" | "low") => void;
  /** The full file's swap, held until the open flight with the preview has landed. */
  commit?: () => void;
  cancel: () => void;
};

type Sample = { time: number; x: number; y: number };

type Slideshow = {
  interval: number;
  waited: number;
  since?: number;
  timer?: ReturnType<typeof setTimeout>;
  frame?: number;
};

type Session = {
  dialog: HTMLDialogElement;
  stage: HTMLDivElement;
  viewport: HTMLDivElement;
  backdrop: HTMLDivElement;
  slides: HTMLDivElement[];
  loaded: Map<number, LoadedSlide>;
  carousel: Carousel;
  carouselLoops: boolean;
  heading: 1 | -1;
  marked?: number;
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
  footer: HTMLDivElement;
  thumbStrip?: HTMLDivElement;
  thumbCarousel?: Carousel;
  roving: number;
  centeredThumb: number;
  aside?: HTMLDivElement;
  slideshow?: Slideshow;
  /** Reasons the slideshow waits, kept while it is off so a start honors them. */
  pauses: Set<string>;
  abort: AbortController;
  animations: Set<Animation>;
  finishAnimations: Set<(landed?: boolean) => void>;
  previousFocus: HTMLElement | null;
  input?: "keyboard" | "pointer";
  restoreScroll: () => void;
  hiddenOrigin?: { element: HTMLElement; visibility: string };
  landing?: HTMLImageElement;
  counter?: HTMLSpanElement;
  counterText: string;
  status: HTMLDivElement;
  caption: HTMLParagraphElement;
  prev?: HTMLButtonElement;
  next?: HTMLButtonElement;
  zoomButton?: HTMLButtonElement;
  fullscreenButton?: HTMLButtonElement;
  download?: HTMLAnchorElement;
  slideshowButton?: HTMLButtonElement;
  thumbs: HTMLButtonElement[];
  makeSlide: () => HTMLDivElement;
  makeThumbs: () => void;
  pointers: Map<number, Point>;
  box: Rect;
  gesture?: {
    start: Point;
    zoom: Zoom;
    raw: Point;
    distance: number;
    midpoint: Point;
    focus: Point;
    moved: boolean;
    touch: boolean;
    pinched: boolean;
    pinned?: Pinned;
    axis?: "x" | "y" | "pan";
    half: number;
    buzzed?: boolean;
    samples: Sample[];
  };
  pinned?: Pinned;
  zoomMotion?: { from: Zoom; to: Zoom; animation: Animation };
  safariScale?: number;
  lastTap?: { time: number; point: Point };
  suppressClickUntil: number;
  wheelTimer?: ReturnType<typeof setTimeout>;
  flying: boolean;
  watchedScale: number;
  sharpScale: number;
  autoplay: boolean;
  rest?: Zoom;
  resizeFrame?: number;
  sharpTimer?: ReturnType<typeof setTimeout>;
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

function validateItems(
  items: readonly LightboxItem[],
  content: readonly LightboxContent[] = [],
) {
  if (!items.length) throw new TypeError("Lightbox needs at least one image.");
  return items.map((item) => {
    if (item?.type !== undefined) {
      if (!content.some((module) => module.type === item.type))
        throw new TypeError(
          `Lightbox items of type ${item.type} need their module in the content option.`,
        );
    } else if (!item || typeof item.src !== "string" || !item.src.trim())
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
const GLIDE_TIME = 180;
const GLIDE_DURATION = 400;
const PINCH_MIN = 0.6;
const PINCH_OVER = 1.25;
const PINCH_CLOSE = 0.75;
const EDGE_PAGE = 0.3;
const KEY_PAN = 0.1;
const LOADING_DELAY = 300;
const ZOOM_IDLE = 150;
const SPINNER_SIZE = 32;

type Pinned = { index: number; zoom: Zoom; left: boolean; right: boolean };

// A node from another document's window fails instanceof against this window's classes.
function isNode(value: unknown): value is Node {
  return typeof (value as Node | null)?.nodeType === "number";
}

function isElement(value: unknown): value is Element {
  return isNode(value) && value.nodeType === 1;
}

function isHTMLElement(value: unknown): value is HTMLElement {
  return (
    isElement(value) && value.namespaceURI === "http://www.w3.org/1999/xhtml"
  );
}

function sameZoom(a: Zoom, b: Zoom) {
  return a.scale === b.scale && a.x === b.x && a.y === b.y;
}

function zoomTransform(zoom: Zoom) {
  return `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})`;
}

function milliseconds(value: string, fallback: number) {
  const number = Number.parseFloat(value);
  if (!Number.isFinite(number)) return fallback;
  return value.trim().endsWith("ms") || !value.trim().endsWith("s")
    ? number
    : number * 1000;
}

function releaseVelocity(samples: Sample[], time: number, at: Point): Point {
  const first = samples.find((sample) => sample.time >= time - SPEED_WINDOW);
  if (!first || time - first.time <= 0) return { x: 0, y: 0 };
  return {
    x: (at.x - first.x) / (time - first.time),
    y: (at.y - first.y) / (time - first.time),
  };
}

function matches(element: Element, selector: string) {
  try {
    return element.matches(selector);
  } catch {
    return false;
  }
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
    holdSlideshow(s, "phase", phase !== "open");
  }

  function slideshowRuns(s: Session) {
    return (
      session === s &&
      !state.isClosing &&
      !s.pauses.size &&
      items.length > 1 &&
      !s.dialog.ownerDocument.hidden
    );
  }

  // The wait keeps what it ran before a pause, so a pause only delays the next photo.
  function scheduleSlideshow(s: Session) {
    const show = s.slideshow;
    if (!show) return;
    const win = s.dialog.ownerDocument.defaultView;
    const now = win?.performance.now() ?? 0;
    if (show.since !== undefined) show.waited += now - show.since;
    clearTimeout(show.timer);
    if (show.frame !== undefined) win?.cancelAnimationFrame(show.frame);
    show.timer = show.frame = undefined;
    const runs = slideshowRuns(s);
    show.since = runs ? now : undefined;
    if (!runs || !win) return;
    show.timer = setTimeout(
      () => advanceSlideshow(s),
      Math.max(0, show.interval - show.waited),
    );
    if (prefersReducedMotion(s)) return;
    const tick = () => {
      const since = show.since;
      if (since === undefined) return;
      s.slideshowButton?.style.setProperty(
        "--re-lightbox-slideshow-progress",
        String(
          Math.min(
            1,
            (show.waited + win.performance.now() - since) / show.interval,
          ),
        ),
      );
      show.frame = win.requestAnimationFrame(tick);
    };
    tick();
  }

  function holdSlideshow(s: Session, reason: string, isHeld: boolean) {
    if (s.pauses.has(reason) === isHeld) return;
    if (isHeld) s.pauses.add(reason);
    else s.pauses.delete(reason);
    scheduleSlideshow(s);
  }

  function restartSlideshow(s: Session) {
    const show = s.slideshow;
    if (!show) return;
    show.waited = 0;
    show.since = undefined;
    s.slideshowButton?.style.setProperty(
      "--re-lightbox-slideshow-progress",
      "0",
    );
    scheduleSlideshow(s);
  }

  function advanceSlideshow(s: Session) {
    if (session !== s || !s.slideshow) return;
    if (s.pointers.size) {
      restartSlideshow(s);
      return;
    }
    if (looping() || state.index < items.length - 1) step(1);
    else {
      // The last photo springs back to the first, as the carousel's autoplay does.
      finishFade(s, true);
      syncingCarousel = true;
      activeChanged(s, 0);
      s.carousel.goTo(0, "smooth");
      syncingCarousel = false;
    }
    restartSlideshow(s);
  }

  function toggleSlideshow(s: Session, on = !s.slideshow) {
    const button = s.slideshowButton;
    if (on === Boolean(s.slideshow)) return;
    const show = s.slideshow;
    if (show) {
      clearTimeout(show.timer);
      if (show.frame !== undefined)
        s.dialog.ownerDocument.defaultView?.cancelAnimationFrame(show.frame);
      s.slideshow = undefined;
      s.slideshowButton?.style.removeProperty(
        "--re-lightbox-slideshow-progress",
      );
    } else {
      const interval = settings.slideshow?.interval;
      s.slideshow = {
        interval:
          interval !== undefined && Number.isFinite(interval) && interval > 0
            ? interval
            : 4000,
        waited: 0,
      };
      restartSlideshow(s);
    }
    if (on) s.dialog.dataset.slideshow = "playing";
    else delete s.dialog.dataset.slideshow;
    if (!button) return;
    button.setAttribute(
      "aria-label",
      on ? s.strings.slideshowStop : s.strings.slideshowStart,
    );
    if (!settings.icons?.slideshow) button.textContent = on ? "❚❚" : "▶";
  }

  function easing(value: string) {
    try {
      return value && CSS.supports("transition-timing-function", value)
        ? value
        : FLIGHT_EASE;
    } catch {
      return FLIGHT_EASE;
    }
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
      ease: easing(read("--re-lightbox-ease").trim()),
    };
  }

  function controlInUse(s: Session) {
    const active = s.dialog.ownerDocument.activeElement;
    return s.chromeRoots.some((root) => {
      if (s.chrome.lastPointerIsMouse && root.matches(":hover")) return true;
      if (!isElement(active) || active === s.openingFocus) return false;
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
    const origin = settings.getOrigin?.(index) ?? items[index]?.origin;
    return (typeof origin === "function" ? origin() : origin) ?? null;
  }

  function rendered(element: HTMLElement) {
    if (!element.isConnected || element.checkVisibility?.() === false)
      return undefined;
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 ? rect : undefined;
  }

  function measure(viewport: HTMLElement): Rect {
    const rect = viewport.getBoundingClientRect();
    const win = viewport.ownerDocument.defaultView;
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width || win?.innerWidth || 1,
      height: rect.height || win?.innerHeight || 1,
    };
  }

  function view(s: Session): Size {
    return s.box;
  }

  function tileImage(index: number) {
    const origin = originOf(index);
    return origin?.localName === "img"
      ? (origin as HTMLImageElement)
      : origin?.querySelector("img");
  }

  function previewOf(index: number) {
    const tile = tileImage(index);
    return tile?.complete && tile.naturalWidth
      ? tile.currentSrc || tile.src
      : items[index].previewSrc;
  }

  // Before the file arrives, the shown preview or the tile gives the proportions.
  function imageSize(index: number, s: Session): Size {
    const item = items[index];
    if (item.width && item.height)
      return { width: item.width, height: item.height };
    // A player has no pixels to stop at, so it fills the screen at its aspect.
    if (item.type) {
      const aspect = s.loaded.get(index)?.media?.mounted?.aspect || 16 / 9;
      const { width, height } = view(s);
      return {
        width: Math.max(width, height * aspect),
        height: Math.max(height, width / aspect),
      };
    }
    for (const image of [s.loaded.get(index)?.image, tileImage(index)])
      if (image?.naturalWidth && image.naturalHeight)
        return { width: image.naturalWidth, height: image.naturalHeight };
    return view(s);
  }

  function tall(index: number, s: Session) {
    if (items[index].type) return false;
    return shapeOf(imageSize(index, s), view(s), padding) === "tall";
  }

  function fit(index: number, s: Session): Size {
    // A player leaves 24px at each side for a swipe that pages past it.
    return (tall(index, s) ? widthFit : contain)(
      imageSize(index, s),
      view(s),
      items[index].type ? Math.max(padding, 24) : padding,
    );
  }

  function restZoom(s: Session, index: number): Zoom {
    const zoom = tall(index, s)
      ? { scale: 1, x: 0, y: panLimits(1, fit(index, s), view(s)).y }
      : { ...identity };
    s.rest = zoom;
    return zoom;
  }

  function limits(s: Session, index = state.index) {
    const item = items[index];
    const entry = s.loaded.get(index);
    if (entry?.status === "failed" || item?.type)
      return { min: 1, max: 1, tap: 1 };
    return zoomLimits({
      fileWidth: largestWidth(item?.srcset) ?? entry?.natural ?? item?.width,
      image: imageSize(index, s),
      viewport: view(s),
      padding,
      svg: Boolean(
        item?.src &&
          formatOf(item.src, s.dialog.ownerDocument.baseURI) === "svg",
      ),
      maxZoom: settings.maxZoom,
      tapZoom: settings.tapZoom ?? 2.5,
    });
  }

  function applyZoom(s: Session, notify = true) {
    const frame = s.loaded.get(state.index)?.frame;
    const range = limits(s);
    if (s.phase !== "dragging") {
      if (frame) frame.style.transform = zoomTransform(state.zoom);
      syncingCarousel = true;
      s.carousel.setEnabled(
        state.zoom.scale <= 1 &&
          state.zoom.scale >= range.min - 1e-3 &&
          s.gesture?.axis !== "pan" &&
          s.pointers.size < 2 &&
          items.length > 1,
      );
      syncingCarousel = false;
    }
    const zoomable = range.max > 1 || range.min < 1;
    const clickable = String(
      zoomable && (settings.imageClick ?? "zoom") === "zoom",
    );
    if (s.dialog.dataset.zoomable !== clickable)
      s.dialog.dataset.zoomable = clickable;
    const hidden = !zoomable && state.zoom.scale <= 1;
    const zoomButton = s.zoomButton;
    if (zoomButton && zoomButton.hidden !== hidden) {
      if (hidden && s.dialog.ownerDocument.activeElement === zoomButton)
        s.viewport.focus({ preventScroll: true });
      zoomButton.hidden = hidden;
    }
    s.viewport.style.touchAction = state.zoom.scale > 1 ? "none" : "pan-x";
    const out = range.tap < 1 ? state.zoom.scale >= 1 : state.zoom.scale > 1;
    zoomButton?.setAttribute(
      "aria-label",
      out ? s.strings.zoomOut : s.strings.zoomIn,
    );
    zoomButton?.setAttribute("aria-pressed", String(state.zoom.scale > 1));
    if (zoomButton && !settings.icons?.zoom)
      zoomButton.textContent = out ? "−" : "+";
    s.dialog.dataset.zoomed = String(state.zoom.scale > 1);
    s.dialog.dataset.zoom = out ? "out" : "in";
    if (s.watchedScale !== state.zoom.scale) {
      s.watchedScale = state.zoom.scale;
      clearTimeout(s.sharpTimer);
      s.sharpTimer = setTimeout(() => sharpen(s), ZOOM_IDLE);
    }
    if (s.zoomed !== state.zoom.scale > 1) {
      s.zoomed = state.zoom.scale > 1;
      chromeInput(s, { type: s.zoomed ? "zoom" : "unzoom" }, notify);
      holdSlideshow(s, "zoom", s.zoomed);
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
    let animation: Animation;
    try {
      animation = node.animate(frames, { duration, easing, fill: "both" });
    } catch {
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      s.animations.add(animation);
      syncAnimating(s);
      let settled = false;
      const finish = (landed = false) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        s.animations.delete(animation);
        s.finishAnimations.delete(finish);
        syncAnimating(s);
        // commitStyles throws on an element that is no longer rendered, such
        // as one inside a dialog the browser already closed.
        try {
          if (landed) Object.assign(node.style, frames.at(-1));
          else if (node.isConnected) animation.commitStyles?.();
        } catch {}
        animation.cancel();
        resolve();
      };
      // A timeline that has not advanced by the deadline still lands the last keyframe. It is
      // written directly, since WebKit commits the first keyframe of an animation that never got a frame.
      const timer = setTimeout(() => finish(true), duration + 80);
      s.finishAnimations.add(finish);
      void animation.finished.then(
        () => finish(),
        () => finish(),
      );
    });
  }

  function cancelAnimations(s: Session, landed = false) {
    freezeZoom(s);
    for (const finish of [...s.finishAnimations]) finish(landed);
  }

  function liveZoom(s: Session): Zoom {
    const motion = s.zoomMotion;
    if (!motion) return state.zoom;
    const progress = motion.animation.effect?.getComputedTiming().progress;
    const t = typeof progress === "number" ? progress : 1;
    const { from, to } = motion;
    return {
      scale: from.scale + (to.scale - from.scale) * t,
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
    };
  }

  function freezeZoom(s: Session) {
    const motion = s.zoomMotion;
    if (!motion) return;
    const zoom = liveZoom(s);
    s.zoomMotion = undefined;
    s.animations.delete(motion.animation);
    motion.animation.cancel();
    updateState({ zoom });
    applyZoom(s, false);
  }

  function moveZoom(s: Session, to: Zoom, duration: number, ease: string) {
    const from = liveZoom(s);
    const previous = s.zoomMotion;
    s.zoomMotion = undefined;
    if (previous) {
      s.animations.delete(previous.animation);
      previous.animation.cancel();
    }
    updateState({ zoom: to });
    applyZoom(s, false);
    const frame = s.loaded.get(state.index)?.frame;
    if (
      !frame ||
      duration <= 0 ||
      sameZoom(from, to) ||
      typeof frame.animate !== "function"
    )
      return;
    let animation: Animation;
    try {
      animation = frame.animate(
        [{ transform: zoomTransform(from) }, { transform: zoomTransform(to) }],
        { duration, easing: ease },
      );
    } catch {
      return;
    }
    const motion = { from, to, animation };
    s.zoomMotion = motion;
    s.animations.add(animation);
    syncAnimating(s);
    const done = () => {
      if (s.zoomMotion === motion) s.zoomMotion = undefined;
      s.animations.delete(animation);
      syncAnimating(s);
    };
    void animation.finished.then(done, done);
  }

  function zoomDuration(s: Session) {
    return prefersReducedMotion(s)
      ? 0
      : Math.min(220, Math.max(0, settings.duration ?? 280));
  }

  function flightDuration(s: Session, closing: boolean) {
    const duration = closing ? s.timing.close : s.timing.open;
    return prefersReducedMotion(s)
      ? Math.min(duration, REDUCED_DURATION)
      : duration;
  }

  function flight(s: Session, closing: boolean, landing = false) {
    const from = closing
      ? s.dialog.ownerDocument.defaultView?.getComputedStyle(s.backdrop)
          .opacity || "1"
      : "0";
    const flying = Promise.all([
      morph(s, closing, landing),
      animate(
        s,
        s.backdrop,
        [{ opacity: from }, { opacity: closing ? 0 : 1 }],
        flightDuration(s, closing),
        s.timing.ease,
      ),
    ]);
    // The timeline's time stands still within a task, so a start taken from it would skip the
    // work this close already did; the time origin is the document timeline's zero.
    const now = s.dialog.ownerDocument.defaultView?.performance.now();
    if (closing && now !== undefined)
      for (const animation of s.animations) animation.startTime = now;
    return flying;
  }

  function landingCopy(
    s: Session,
    image: HTMLImageElement,
    origin: HTMLElement,
    size: Size,
    box: DOMRect,
  ) {
    const doc = s.dialog.ownerDocument;
    const src = image.currentSrc || image.src;
    if (
      origin.ownerDocument !== doc ||
      !origin.parentNode ||
      !src ||
      !image.complete ||
      !image.naturalWidth
    )
      return undefined;
    const copy = doc.createElement("img");
    copy.className = "re-lightbox-landing";
    copy.alt = "";
    copy.setAttribute("aria-hidden", "true");
    copy.draggable = false;
    copy.src = src;
    copy.style.cssText = `position:absolute;left:0;top:0;right:auto;bottom:auto;display:block;box-sizing:content-box;width:${size.width}px;height:${size.height}px;min-width:0;min-height:0;max-width:none;max-height:none;margin:0;padding:0;border:0;border-radius:0;box-shadow:none;outline:0;object-fit:fill;opacity:1;visibility:visible;filter:none;transition:none;animation:none;translate:none;rotate:none;scale:none;transform-origin:center;pointer-events:none`;
    origin.after(copy);
    const at = copy.getBoundingClientRect();
    copy.style.left = `${box.left + (box.width - size.width) / 2 - at.left}px`;
    copy.style.top = `${box.top + (box.height - size.height) / 2 - at.top}px`;
    return copy;
  }

  function morph(s: Session, closing: boolean, landing: boolean) {
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
      clipPath:
        current.clipPath && current.clipPath !== "none"
          ? current.clipPath
          : "inset(0px round 0px)",
      opacity: current.opacity || "1",
    };
    const origin = originOf(state.index);
    const rect = origin ? rendered(origin) : undefined;
    const box = s.viewport.getBoundingClientRect();
    const slide = s.slides[state.index]?.getBoundingClientRect();
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
      slide &&
      Math.abs(slide.left - box.left) <= 1 &&
      Math.abs(slide.right - box.right) <= 1 &&
      rect.bottom > 0 &&
      rect.right > 0 &&
      rect.top < viewport.height &&
      rect.left < viewport.width;
    if (
      !visible ||
      !origin ||
      (item.type && !entry.image.getAttribute("src"))
    ) {
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
    if (!closing)
      return animate(s, entry.frame, [clipped, expanded], duration, ease);
    const copy =
      landing && duration > 0
        ? landingCopy(s, entry.image, origin, size, box)
        : undefined;
    if (!copy) return animate(s, entry.frame, [live, clipped], duration, ease);
    s.landing = copy;
    return Promise.all([
      animate(
        s,
        entry.frame,
        [live, { ...clipped, opacity: 0 }],
        duration,
        ease,
      ),
      animate(s, copy, [{ ...live, opacity: 1 }, clipped], duration, ease),
    ]);
  }

  // A zoom asks for a larger file only once its scale has rested, through sizes.
  function requestSizes(s: Session) {
    for (const [index, entry] of s.loaded) {
      const item = items[index];
      if (!item.srcset || !entry.loader || entry.status === "failed") continue;
      const width = fit(index, s).width;
      const scale =
        index === state.index ? Math.min(s.sharpScale, state.zoom.scale) : 1;
      const sizes =
        scale > 1
          ? `${Math.ceil(width * scale)}px`
          : item.sizes || `${Math.ceil(width)}px`;
      if (entry.loader.getAttribute("sizes") !== sizes)
        entry.loader.setAttribute("sizes", sizes);
    }
  }

  function sharpen(s: Session) {
    s.sharpTimer = undefined;
    if (session !== s) return;
    const apply = () => {
      if (session !== s) return;
      s.sharpScale = state.zoom.scale;
      requestSizes(s);
    };
    const win = s.dialog.ownerDocument.defaultView;
    if (state.zoom.scale > 1 || !win?.requestIdleCallback) apply();
    else win.requestIdleCallback(apply);
  }

  function layout(s: Session) {
    const resting = s.rest !== undefined && sameZoom(state.zoom, s.rest);
    for (const [index, entry] of s.loaded) {
      const size = fit(index, s);
      entry.frame.style.width = `${size.width}px`;
      entry.frame.style.height = `${size.height}px`;
    }
    requestSizes(s);
    if (resting) publish({ zoom: restZoom(s, state.index) });
    else if (state.zoom.scale > 1) {
      const scale = Math.min(state.zoom.scale, limits(s).max);
      publish({
        zoom:
          scale > 1
            ? boundZoom({ ...state.zoom, scale }, fit(state.index, s), view(s))
            : { ...identity },
      });
    }
    applyZoom(s);
  }

  function resized(s: Session) {
    s.resizeFrame = undefined;
    if (session !== s) return;
    cancelAnimations(s, true);
    const before = state.zoom;
    const from = fit(state.index, s);
    const resting = s.rest !== undefined && sameZoom(before, s.rest);
    s.box = measure(s.viewport);
    s.pinned = undefined;
    if (resting) updateState({ zoom: restZoom(s, state.index) });
    else {
      const to = fit(state.index, s);
      const range = limits(s);
      const scale = clamp(before.scale, range.min, range.max);
      const ratio = scale / before.scale;
      updateState({
        zoom: boundZoom(
          {
            scale,
            x: ((before.x * to.width) / from.width) * ratio,
            y: ((before.y * to.height) / from.height) * ratio,
          },
          to,
          view(s),
        ),
      });
    }
    layout(s);
    syncingCarousel = true;
    s.carousel.setEnabled(true);
    s.carousel.refresh();
    s.carousel.goTo(state.index, "instant");
    syncingCarousel = false;
    applyZoom(s, false);
    if (!sameZoom(before, state.zoom)) publish({});
  }

  function visibleRange(s: Session) {
    const count = s.slides.length;
    const size = count ? s.slides[0].getBoundingClientRect().width : 0;
    if (!size) return [];
    const width = s.viewport.clientWidth;
    const start = Math.abs(s.viewport.scrollLeft);
    const looped = s.carouselLoops && s.carousel.getState().isLooping;
    const visible = new Set<number>();
    for (
      let k = Math.floor((start + 1) / size) - 1;
      k * size < start + width - 1;
      k++
    ) {
      if (k * size + size <= start + 1) continue;
      if (looped && k >= 0 && k < 3 * count) visible.add(wrap(k));
      else if (k >= 0 && k < count) visible.add(k);
    }
    return [...visible].sort((a, b) => a - b);
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

  // The current image loads first; the neighbors wait until it has decoded or failed, and
  // Save-Data keeps them at their previews.
  function startLoads(s: Session) {
    const current = s.loaded.get(state.index);
    if (current?.status === "idle") current.load("high");
    if (current?.status === "loading") return;
    const connection = (
      s.dialog.ownerDocument.defaultView?.navigator as
        | (Navigator & { connection?: { saveData?: boolean } })
        | undefined
    )?.connection;
    if (connection?.saveData) return;
    const order: number[] = [];
    for (let step = 1; step <= preload; step++)
      for (const side of [s.heading, -s.heading]) {
        const index = state.index + side * step;
        order.push(looping() ? wrap(index) : index);
      }
    for (const index of [...order, ...s.loaded.keys()]) {
      const entry = s.loaded.get(index);
      if (entry?.status === "idle") entry.load("low");
    }
  }

  function spin(s: Session, frame: HTMLElement) {
    const doc = s.dialog.ownerDocument;
    const status = doc.createElement("span");
    status.className = "re-lightbox-loading";
    status.setAttribute("role", "status");
    status.setAttribute("aria-label", s.strings.loading);
    const canvas = doc.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    status.append(canvas);
    frame.append(status);
    let dots: ReturnType<typeof createThinkingDots> | undefined;
    try {
      dots = createThinkingDots(canvas, { size: SPINNER_SIZE });
    } catch {}
    return () => {
      dots?.destroy();
      status.remove();
    };
  }

  // A player mounts in its own layer above the poster, which stays under it.
  function mountMedia(s: Session, index: number, entry: LoadedSlide) {
    const media = entry.media;
    if (!media || media.mounted || session !== s) return;
    const doc = s.dialog.ownerDocument;
    const holder = doc.createElement("div");
    holder.className = "re-lightbox-media";
    entry.frame.append(holder);
    const abort = new AbortController();
    const mounted = media.content.mount(holder, {
      item: items[index],
      index,
      signal: abort.signal,
      autoplay: s.autoplay,
    });
    media.abort = abort;
    media.mounted = mounted;
    if (mounted.interactive) {
      holder.dataset.lightboxInteractive = "";
      holder.dataset.carouselNoDrag = "";
    }
    if (mounted.ready) {
      entry.frame.dataset.loading = "true";
      const wait = setTimeout(() => {
        stop = spin(s, entry.frame);
      }, LOADING_DELAY);
      let stop = () => clearTimeout(wait);
      const settle = () => {
        if (media.abort !== abort) return;
        stop();
        entry.frame.removeAttribute("data-loading");
      };
      abort.signal.addEventListener("abort", () => stop());
      void mounted.ready.then(settle, settle);
    }
    layout(s);
    if (index === state.index && !s.flying && !state.isClosing)
      mounted.resume?.();
  }

  function unmountMedia(entry: LoadedSlide) {
    const media = entry.media;
    if (!media?.mounted) return;
    const { mounted, abort } = media;
    media.mounted = media.abort = undefined;
    abort?.abort();
    mounted.unmount();
    entry.frame.querySelector(":scope > .re-lightbox-media")?.remove();
    entry.frame.removeAttribute("data-loading");
  }

  function pauseMedia(entry: LoadedSlide | undefined) {
    const mounted = entry?.media?.mounted;
    if (!entry || !mounted) return;
    if (mounted.pause) mounted.pause();
    else unmountMedia(entry);
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
      if (settings.protect) image.draggable = false;
      image.decoding = "async";
      const content =
        item.type === undefined
          ? undefined
          : settings.content?.find((module) => module.type === item.type);
      if (content) {
        frame.dataset.media = content.type;
        const poster = item.video?.poster || previewOf(index);
        if (poster) image.src = poster;
        frame.append(image);
        s.slides[index].append(frame);
        const entry: LoadedSlide = {
          frame,
          image,
          media: { content },
          status: "settled",
          load: () => {},
          cancel: () => {
            unmountMedia(entry);
            image.removeAttribute("src");
          },
        };
        s.loaded.set(index, entry);
        // A poster flies open like a photo, and its player mounts once the flight lands.
        if (!(s.flying && index === state.index && poster))
          mountMedia(s, index, entry);
        continue;
      }
      let alive = true;
      let cleanup: undefined | (() => void);
      let wait: ReturnType<typeof setTimeout> | undefined;
      let spinner: undefined | (() => void);
      frame.append(image);
      s.slides[index].append(frame);
      const stopWaiting = () => {
        clearTimeout(wait);
        wait = undefined;
        spinner?.();
        spinner = undefined;
      };
      const showSpinner = () => {
        if (alive && session === s) spinner = spin(s, frame);
      };
      const fetcher = (url: string) =>
        (doc.defaultView ?? globalThis).fetch(url);
      let shown = "";
      const display = (url: string) => {
        shown = url;
        image.src = url;
        const mark = (format: MediaFormat | undefined) => {
          if (format && format !== "opaque") frame.dataset.transparent = "true";
          else delete frame.dataset.transparent;
        };
        const format = formatOf(url, doc.baseURI);
        mark(format);
        if (!format)
          void lookupFormat(url, doc.baseURI, fetcher).then((found) => {
            if (alive && shown === url) mark(found);
          });
      };
      const show = (source: HTMLImageElement, width: number, size?: Size) => {
        if (!alive || session !== s) return;
        if (entry.natural !== undefined && width <= entry.natural) return;
        entry.natural = width;
        const shape =
          size ??
          (source.naturalWidth && source.naturalHeight
            ? { width: source.naturalWidth, height: source.naturalHeight }
            : undefined);
        if (shape) {
          const ratio = shape.height / shape.width;
          if (!item.width)
            item.width = item.height
              ? Math.round(item.height / ratio)
              : size
                ? Math.round(size.width)
                : width;
          if (!item.height) item.height = Math.round(item.width * ratio);
        }
        display(source.currentSrc || source.src);
        frame.removeAttribute("data-loading");
        layout(s);
      };
      const failed = () => {
        frame.removeAttribute("data-loading");
        frame.dataset.error = "true";
        const error = doc.createElement("div");
        error.className = "re-lightbox-error";
        error.setAttribute("role", "status");
        const message = doc.createElement("p");
        message.textContent = s.strings.error;
        const retry = doc.createElement("button");
        retry.type = "button";
        retry.className = "re-lightbox-retry";
        retry.textContent = s.strings.retry;
        retry.addEventListener(
          "click",
          () => {
            if (doc.activeElement === retry)
              s.viewport.focus({ preventScroll: true });
            error.remove();
            delete frame.dataset.error;
            frame.dataset.loading = "true";
            entry.load(index === state.index ? "high" : "low");
          },
          { signal: s.abort.signal },
        );
        error.append(message, retry);
        frame.append(error);
      };
      const load = (priority: "high" | "low") => {
        const loader = doc.createElement("img");
        loader.decoding = "async";
        loader.setAttribute("fetchpriority", priority);
        entry.loader = loader;
        entry.status = "loading";
        wait = setTimeout(showSpinner, LOADING_DELAY);
        const settle = (status: "settled" | "failed") => {
          if (entry.status !== "loading") return;
          entry.status = status;
          stopWaiting();
          startLoads(s);
        };
        loader.onload = () => {
          const source = loader.currentSrc || loader.src;
          const width = fileWidth(loader, item.srcset, doc.baseURI);
          const current = () =>
            alive &&
            session === s &&
            entry.loader === loader &&
            entry.status !== "failed" &&
            (loader.currentSrc || loader.src) === source;
          const ready = (size?: Size) => {
            if (!current()) return;
            if (s.flying && image.hasAttribute("src"))
              entry.commit = () => show(loader, width, size);
            else show(loader, width, size);
            settle("settled");
          };
          // An SVG shows once its own size is read, since browsers decode a viewBox-only file at most 300px wide.
          const decoded = () => {
            if (!current()) return;
            const sized = Boolean(item.width && item.height);
            const format = formatOf(source, doc.baseURI);
            if (format && (format !== "svg" || sized)) return ready();
            void lookupFormat(source, doc.baseURI, fetcher)
              .then((found) =>
                found === "svg" && !sized
                  ? svgSize(
                      source,
                      fetcher,
                      new (doc.defaultView ?? globalThis).DOMParser(),
                    )
                  : undefined,
              )
              .then(ready, () => ready());
          };
          if (typeof loader.decode !== "function") decoded();
          else
            void loader.decode().then(decoded, () => {
              if (loader.complete && loader.naturalWidth) decoded();
            });
        };
        loader.onerror = () => {
          if (!alive || session !== s || entry.loader !== loader) return;
          if (entry.status !== "loading") return;
          failed();
          settle("failed");
          if (!state.isClosing) layout(s);
        };
        if (item.srcset) {
          loader.srcset = item.srcset;
          requestSizes(s);
        }
        loader.src = item.src ?? "";
      };
      const preview = previewOf(index);
      if (preview) display(preview);
      frame.dataset.loading = "true";
      const entry: LoadedSlide = {
        frame,
        image,
        status: "idle",
        load,
        cancel: () => {
          alive = false;
          stopWaiting();
          entry.commit = undefined;
          if (entry.loader) {
            entry.loader.onload = null;
            entry.loader.onerror = null;
            entry.loader.removeAttribute("srcset");
            entry.loader.removeAttribute("src");
          }
          image.removeAttribute("src");
          cleanup?.();
        },
      };
      s.loaded.set(index, entry);
      cleanup = settings.renderContent?.({
        item,
        index,
        container: frame,
        image,
      });
    }
    layout(s);
    startLoads(s);
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
    pauseMedia(old);
    const gap = index - state.index;
    const forward =
      looping() && Math.abs(gap) > items.length / 2 ? gap < 0 : gap > 0;
    s.pinned = undefined;
    s.heading = forward ? 1 : -1;
    publish({ index, zoom: restZoom(s, index) });
    update(s, forward ? 1 : -1);
    const entry = s.loaded.get(index);
    if (entry?.media?.mounted) entry.media.mounted.resume?.();
    else if (entry) mountMedia(s, index, entry);
    s.status.textContent = s.strings.slide(index, items.length);
    restartSlideshow(s);
    emit("change", s);
  }

  function renderCounter(s: Session, direction: 1 | -1 | 0) {
    const counter = s.counter;
    const text = s.strings.counter(state.index, items.length);
    if (!counter || text === s.counterText) return;
    s.counterText = text;
    const doc = s.dialog.ownerDocument;
    const parts = text.match(/\p{Nd}+(?:[^\p{Nd}\s]\p{Nd}+)*|\P{Nd}+/gu) ?? [];
    const kind = (part: string) =>
      /\p{Nd}/u.test(part)
        ? "re-lightbox-counter-number"
        : "re-lightbox-counter-text";
    let nodes = [...counter.children] as HTMLElement[];
    if (
      nodes.length !== parts.length ||
      nodes.some((node, index) => node.className !== kind(parts[index]))
    ) {
      nodes = parts.map((part) => {
        const node = doc.createElement("span");
        node.className = kind(part);
        return node;
      });
      counter.replaceChildren(...nodes);
    }
    const roll =
      direction !== 0 &&
      !prefersReducedMotion(s) &&
      typeof counter.animate === "function";
    for (const [index, node] of nodes.entries()) {
      const part = parts[index];
      if (node.className === "re-lightbox-counter-text") {
        if (node.textContent !== part) node.textContent = part;
        continue;
      }
      const digits = [...part];
      const cells = [...node.children] as HTMLElement[];
      while (cells.length > digits.length) cells.shift()?.remove();
      while (cells.length < digits.length) {
        const cell = doc.createElement("span");
        cell.className = "re-lightbox-counter-cell";
        cell.append(doc.createElement("span"));
        node.prepend(cell);
        cells.unshift(cell);
      }
      for (const [at, cell] of cells.entries()) {
        const digit = digits[at];
        const current = cell.lastElementChild as HTMLElement;
        if (current.textContent === digit) continue;
        while (cell.firstElementChild !== current)
          cell.firstElementChild?.remove();
        const previous = current.textContent;
        if (!roll || !previous) {
          current.textContent = digit;
          continue;
        }
        const incoming = doc.createElement("span");
        incoming.textContent = digit;
        cell.append(incoming);
        current.dataset.char = previous;
        current.textContent = "";
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
  }

  function update(s: Session, direction: 1 | -1 | 0 = 0) {
    loadSlides(s);
    hideOrigin(s);
    renderCounter(s, direction);
    const item = items[state.index];
    s.caption.textContent = item.caption || "";
    const single = items.length < 2;
    for (const control of [s.prev, s.next, s.counter, s.slideshowButton])
      if (control) control.hidden = single;
    if (s.prev) s.prev.disabled = !looping() && state.index === 0;
    if (s.next)
      s.next.disabled = !looping() && state.index === items.length - 1;
    if (single) toggleSlideshow(s, false);
    if (s.download) {
      s.download.hidden = Boolean(item.type);
      const href = largestSource(item.srcset, item.src ?? "");
      let scheme = "";
      try {
        scheme = new URL(href, s.dialog.ownerDocument.baseURI).protocol;
      } catch {}
      if (scheme === "javascript:") s.download.removeAttribute("href");
      else s.download.setAttribute("href", href);
    }
    const mark = (index: number, current: boolean) => {
      const slide = s.slides[index];
      if (slide) {
        slide.inert = !current;
        slide.setAttribute("aria-hidden", String(!current));
      }
      s.thumbs[index]?.setAttribute("aria-current", String(current));
    };
    if (s.marked === undefined) {
      for (const [index, slide] of s.slides.entries()) {
        mark(index, index === state.index);
        slide.setAttribute("aria-label", s.strings.slide(index, items.length));
      }
    } else if (s.marked !== state.index) {
      mark(s.marked, false);
      mark(state.index, true);
    }
    s.marked = state.index;
    if (!s.thumbStrip?.contains(s.dialog.ownerDocument.activeElement))
      rove(s, state.index);
    centerThumb(s);
    applyZoom(s);
  }

  function rove(s: Session, index: number) {
    if (s.roving === index) return;
    if (s.thumbs[s.roving]) s.thumbs[s.roving].tabIndex = -1;
    if (s.thumbs[index]) s.thumbs[index].tabIndex = 0;
    s.roving = index;
  }

  // The bottom strip is a carousel that centers the thumbnail; the side column has no carousel
  // axis, so it scrolls the same way natively.
  function centerThumb(s: Session) {
    const strip = s.thumbStrip;
    const thumb = s.thumbs[state.index];
    if (!strip || !thumb || s.centeredThumb === state.index) return;
    const behavior =
      s.centeredThumb < 0 || prefersReducedMotion(s) ? "instant" : "smooth";
    s.centeredThumb = state.index;
    if (s.thumbCarousel) {
      s.thumbCarousel.goTo(state.index, behavior);
      return;
    }
    strip.scrollTo({
      top: thumb.offsetTop - (strip.clientHeight - thumb.offsetHeight) / 2,
      behavior,
    });
  }

  function teardown(s: Session) {
    if (session === s) session = undefined;
    s.abort.abort();
    clearTimeout(s.wheelTimer);
    clearTimeout(s.sharpTimer);
    clearTimeout(s.chromeTimer);
    clearTimeout(s.tapTimer);
    const win = s.dialog.ownerDocument.defaultView;
    if (s.motion) win?.cancelAnimationFrame(s.motion.frame);
    s.motion = undefined;
    if (s.resizeFrame !== undefined) win?.cancelAnimationFrame(s.resizeFrame);
    s.resizeFrame = undefined;
    finishFade(s, false);
    cancelAnimations(s);
    toggleSlideshow(s, false);
    leaveFullscreen(s);
    s.carousel.destroy();
    s.thumbCarousel?.destroy();
    for (const entry of s.loaded.values()) entry.cancel();
    for (const slot of s.slots.splice(0)) slot.destroy?.();
    restoreOrigin(s);
    s.landing?.remove();
    s.landing = undefined;
    if (s.dialog.open) s.dialog.close();
    s.dialog.remove();
    s.restoreScroll();
    returnFocus(s);
  }

  function leaveFullscreen(s: Session) {
    const doc = s.dialog.ownerDocument;
    if (doc.fullscreenElement === s.stage)
      void doc.exitFullscreen().catch(() => {});
  }

  function returnFocus(s: Session) {
    const origin = originOf(state.index);
    const tile = origin && rendered(origin) ? origin : null;
    const quiet = s.input === "pointer";
    const options: FocusOptions = { preventScroll: true };
    if (s.input) options.focusVisible = !quiet;
    for (const target of [
      tile,
      tile?.closest<HTMLElement>("a[href], button"),
      s.previousFocus,
    ]) {
      if (!target?.isConnected) continue;
      // Firefox's dialog close already restored focus here without a ring, and focus() on the
      // focused element changes nothing.
      if (
        s.input === "keyboard" &&
        target.ownerDocument.activeElement === target &&
        !matches(target, ":focus-visible")
      )
        target.blur();
      target.focus(options);
      if (target.ownerDocument.activeElement !== target) continue;
      if (quiet && matches(target, ":focus-visible")) quietFocus(target);
      return;
    }
  }

  // Focus that still shows a ring after a pointer close, from an engine without focusVisible or
  // the dialog's own focus restore, gets an attribute the theme hides the ring by.
  function quietFocus(target: HTMLElement) {
    const stop = new AbortController();
    const clear = () => {
      target.removeAttribute("data-re-focus-quiet");
      stop.abort();
    };
    target.setAttribute("data-re-focus-quiet", "");
    target.ownerDocument.defaultView?.addEventListener("keydown", clear, {
      capture: true,
      signal: stop.signal,
    });
    target.addEventListener("blur", clear, { signal: stop.signal });
  }

  function setZoom(scale: number, focus: Point, notify: boolean) {
    const s = session;
    if (!s || state.isClosing || !Number.isFinite(scale)) return;
    const range = limits(s);
    const nextScale = clamp(scale, range.min, range.max);
    if (nextScale > 1 && state.zoom.scale <= 1) {
      syncingCarousel = true;
      s.carousel.goTo(state.index, "instant");
      syncingCarousel = false;
    }
    const animated = notify && Math.abs(nextScale - state.zoom.scale) > 0.001;
    if (animated && s.animations.size > 0 && !s.zoomMotion)
      interruptImageMotion(s);
    if (!animated) freezeZoom(s);
    const zoom = boundZoom(
      zoomAround(state.zoom, nextScale, focus),
      fit(state.index, s),
      view(s),
    );
    const frame = s.loaded.get(state.index)?.frame;
    if (frame && animated) {
      frame.style.clipPath = "";
      frame.style.opacity = "";
    }
    moveZoom(s, zoom, animated ? zoomDuration(s) : 0, ZOOM_EASE);
    if (notify) publish({});
  }

  function zoomTo(scale: number, focus: Point = { x: 0, y: 0 }) {
    setZoom(scale, focus, true);
  }

  function toggleZoom(focus?: Point) {
    const s = session;
    if (!s) return;
    zoomTo(Math.abs(state.zoom.scale - 1) > 1e-3 ? 1 : limits(s).tap, focus);
  }

  function panBy(s: Session, dx: number, dy: number) {
    moveZoom(
      s,
      boundZoom(
        { ...state.zoom, x: state.zoom.x + dx, y: state.zoom.y + dy },
        fit(state.index, s),
        view(s),
      ),
      zoomDuration(s),
      ZOOM_EASE,
    );
    publish({});
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
    const transform =
      frame && !s.zoomMotion && s.animations.size > 0
        ? win?.getComputedStyle(frame).transform
        : undefined;
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
    const { scale, x, y } = state.zoom;
    const shrink = 1 - progress * 0.25;
    if (frame)
      frame.style.transform = `translate(${x * shrink + dx}px, ${y * shrink + dy}px) scale(${scale * shrink})`;
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

  function settle(
    s: Session,
    gesture: NonNullable<Session["gesture"]>,
    event: PointerEvent,
    pinch: boolean,
    pinched: boolean,
  ) {
    const scale = state.zoom.scale;
    const { min, max } = limits(s);
    if (pinched && scale < PINCH_CLOSE * min && event.type === "pointerup") {
      void close();
      if (state.isClosing || session !== s) return;
    }
    const content = fit(state.index, s);
    const viewport = view(s);
    const reduced = prefersReducedMotion(s);
    let target: Zoom;
    if (scale < min)
      target = boundZoom(
        zoomAround(state.zoom, min, gesture.focus),
        content,
        viewport,
      );
    else if (scale > max)
      target = boundZoom(
        zoomAround(state.zoom, max, gesture.focus),
        content,
        viewport,
      );
    else {
      const speed =
        pinch || reduced || event.type !== "pointerup" || gesture.axis === "x"
          ? { x: 0, y: 0 }
          : releaseVelocity(gesture.samples, event.timeStamp, {
              x: event.clientX,
              y: event.clientY,
            });
      target = boundZoom(
        {
          scale,
          x: state.zoom.x + speed.x * GLIDE_TIME,
          y: state.zoom.y + speed.y * GLIDE_TIME,
        },
        content,
        viewport,
      );
      const dx = event.clientX - gesture.start.x;
      const dy = event.clientY - gesture.start.y;
      const pinned = gesture.pinned;
      if (
        pinned &&
        gesture.touch &&
        !pinched &&
        event.type === "pointerup" &&
        Math.abs(dx) > Math.abs(dy) &&
        Math.abs(dx) > viewport.width * EDGE_PAGE &&
        (dx < 0 ? pinned.right : pinned.left)
      ) {
        const rtl =
          s.dialog.ownerDocument.defaultView?.getComputedStyle(s.dialog)
            .direction === "rtl";
        const direction = dx < 0 !== rtl ? 1 : -1;
        const index = state.index + direction;
        if (looping() || (index >= 0 && index < items.length)) {
          freezeZoom(s);
          updateState({ zoom: { ...identity } });
          applyZoom(s);
          step(direction);
          return;
        }
      }
      const limit = panLimits(scale, content, viewport);
      if (pinched) s.pinned = undefined;
      else if (gesture.moved)
        s.pinned = {
          index: state.index,
          zoom: target,
          left: target.x >= limit.x - 0.5,
          right: target.x <= -limit.x + 0.5,
        };
    }
    if (target.scale <= 1) s.pinned = undefined;
    moveZoom(s, target, reduced ? 0 : GLIDE_DURATION, s.timing.ease);
    publish({});
  }

  function copyImage(s: Session, event: KeyboardEvent) {
    const win = s.dialog.ownerDocument.defaultView;
    const Item = (
      win as (Window & { ClipboardItem?: typeof ClipboardItem }) | null
    )?.ClipboardItem;
    if (
      settings.protect ||
      items[state.index]?.type ||
      !win ||
      !Item ||
      typeof win.navigator.clipboard?.write !== "function" ||
      Item.supports?.("image/png") === false ||
      win.getSelection()?.toString()
    )
      return;
    event.preventDefault();
    const doc = s.dialog.ownerDocument;
    const image = s.loaded.get(state.index)?.image;
    const source = image?.currentSrc || image?.src;
    const size = imageSize(state.index, s);
    const draw = async (file: Blob) => {
      const canvas = doc.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) throw new Error("No canvas");
      if (file.type.split(";")[0].trim() === "image/svg+xml") {
        const url = win.URL.createObjectURL(file);
        try {
          const svg = new win.Image();
          await new Promise((resolve, reject) => {
            svg.onload = resolve;
            svg.onerror = reject;
            svg.src = url;
          });
          canvas.width = Math.round(size.width);
          canvas.height = Math.round(size.height);
          context.drawImage(svg, 0, 0, canvas.width, canvas.height);
        } finally {
          win.URL.revokeObjectURL(url);
        }
      } else {
        const bitmap = await win.createImageBitmap(file);
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        context.drawImage(bitmap, 0, 0);
        bitmap.close();
      }
      return new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (result) => (result ? resolve(result) : reject(new Error("No blob"))),
          "image/png",
        ),
      );
    };
    const shown = () => {
      if (!image?.complete || !image.naturalWidth) throw new Error("No image");
      const canvas = doc.createElement("canvas");
      const svg = formatOf(source ?? "", doc.baseURI) === "svg";
      canvas.width = Math.round(svg ? size.width : image.naturalWidth);
      canvas.height = Math.round(svg ? size.height : image.naturalHeight);
      canvas
        .getContext("2d")
        ?.drawImage(image, 0, 0, canvas.width, canvas.height);
      return new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (result) => (result ? resolve(result) : reject(new Error("No blob"))),
          "image/png",
        ),
      );
    };
    // Only a tainted canvas fetches the file, since a page's connect-src may refuse data: and blob:.
    const blob = (async () => {
      try {
        return await shown();
      } catch (error) {
        if ((error as Error).name !== "SecurityError") throw error;
      }
      if (!source) throw new Error("No image");
      const response = await win.fetch(source, {
        mode: "cors",
        credentials: "same-origin",
      });
      if (!response.ok) throw new Error("No file");
      const file = await response.blob();
      return file.type === "image/png" ? file : draw(file);
    })();
    blob.catch(() => {});
    win.navigator.clipboard
      .write([new Item({ "image/png": blob })])
      .catch(() => {});
  }

  function installGestures(s: Session) {
    const signal = s.abort.signal;
    const point = (event: PointerEvent): Point => ({
      x: event.clientX,
      y: event.clientY,
    });
    const focus = (p: Point): Point => ({
      x: p.x - s.box.left - s.box.width / 2,
      y: p.y - s.box.top - s.box.height / 2,
    });
    const resetGesture = () => {
      const points = [...s.pointers.values()];
      if (!points.length) {
        s.gesture = undefined;
        return;
      }
      const limit = panLimits(state.zoom.scale, fit(state.index, s), view(s));
      const middle = points.length > 1 ? midpoint(points) : points[0];
      s.gesture = {
        start: points[0],
        zoom: { ...state.zoom },
        raw: {
          x: unrubber(state.zoom.x, limit.x),
          y: unrubber(state.zoom.y, limit.y),
        },
        distance: points.length > 1 ? distance(points) : 0,
        midpoint: middle,
        focus: focus(middle),
        moved: false,
        touch: s.gesture?.touch ?? true,
        pinched: false,
        half: 1,
        samples: [],
      };
    };
    s.dialog.addEventListener(
      "pointerdown",
      (event) => {
        if (
          !isElement(event.target) ||
          !event.target.matches(".re-lightbox-image")
        )
          return;
        if (
          event.pointerType === "mouse" &&
          !settings.protect &&
          state.zoom.scale <= 1
        )
          event.target.setAttribute("data-carousel-no-drag", "");
        else event.target.removeAttribute("data-carousel-no-drag");
      },
      { signal, capture: true },
    );
    s.viewport.addEventListener(
      "pointerdown",
      (event) => {
        if (
          event.button !== 0 ||
          state.isClosing ||
          (isElement(event.target) &&
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
        if (!s.pointers.size) s.box = measure(s.viewport);
        s.pointers.set(event.pointerId, point(event));
        resetGesture();
        if (s.gesture) {
          s.gesture.touch = event.pointerType !== "mouse";
          s.gesture.samples.push({
            time: event.timeStamp,
            x: event.clientX,
            y: event.clientY,
          });
          const pinned = s.pinned;
          if (
            s.pointers.size === 1 &&
            pinned?.index === state.index &&
            sameZoom(pinned.zoom, state.zoom)
          )
            s.gesture.pinned = pinned;
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
        gesture.samples.push({
          time: event.timeStamp,
          x: event.clientX,
          y: event.clientY,
        });
        while (gesture.samples[0].time < event.timeStamp - SPEED_WINDOW * 2)
          gesture.samples.shift();
        if (points.length > 1 && gesture.distance > 0) {
          event.preventDefault();
          const middle = midpoint(points);
          const range = limits(s);
          const scale = clamp(
            (gesture.zoom.scale * distance(points)) / gesture.distance,
            PINCH_MIN * range.min,
            PINCH_OVER * range.max,
          );
          const zoom = zoomAround(gesture.zoom, scale, focus(gesture.midpoint));
          zoom.x += middle.x - gesture.midpoint.x;
          zoom.y += middle.y - gesture.midpoint.y;
          gesture.focus = focus(middle);
          updateState({ zoom });
          applyZoom(s, false);
        } else {
          if (
            gesture.touch &&
            points.length === 1 &&
            gesture.zoom.scale <= 1 &&
            !gesture.pinched &&
            !gesture.axis &&
            Math.hypot(dx, dy) >= 10
          ) {
            const limit = panLimits(
              gesture.zoom.scale,
              fit(state.index, s),
              view(s),
            ).y;
            gesture.axis =
              Math.abs(dy) <= Math.abs(dx)
                ? "x"
                : limit > 0.5 && !(dy > 0 && gesture.zoom.y >= limit - 0.5)
                  ? "pan"
                  : "y";
            if (gesture.axis !== "x") {
              s.carousel.setEnabled(false);
              s.viewport.setPointerCapture?.(event.pointerId);
            }
            if (gesture.axis === "y") {
              gesture.half = view(s).height / 2;
              setPhase(s, "dragging");
            }
          }
          if (
            gesture.zoom.scale > 1 ||
            gesture.pinched ||
            gesture.axis === "pan"
          ) {
            event.preventDefault();
            if (gesture.moved && !s.dialog.dataset.panning)
              s.dialog.dataset.panning = "true";
            updateState({
              zoom: elasticZoom(
                {
                  scale: gesture.zoom.scale,
                  x: gesture.raw.x + (gesture.axis === "pan" ? 0 : dx),
                  y: gesture.raw.y + dy,
                },
                fit(state.index, s),
                view(s),
              ),
            });
            applyZoom(s, false);
          } else if (gesture.axis === "y") {
            event.preventDefault();
            dismissDrag(s, dx, dy, gesture.half);
            if (!gesture.buzzed && Math.abs(dy) > DISMISS_DISTANCE) {
              gesture.buzzed = true;
              s.dialog.ownerDocument.defaultView?.navigator.vibrate?.(10);
            }
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
        const speed = releaseVelocity(gesture.samples, event.timeStamp, {
          x: event.clientX,
          y: event.clientY,
        }).y;
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
        !hadPinch &&
        !gesture.pinched
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
          settings.imageClick !== "close" &&
          settings.doubleTapZoom !== false &&
          (state.zoom.scale !== 1 || limits(s).max > 1 || limits(s).min < 1);
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
          resetGesture();
          return;
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
      if (s.pointers.size > 0) {
        const focusPoint = gesture?.focus;
        resetGesture();
        if (s.gesture) {
          s.gesture.moved = true;
          s.gesture.pinched = true;
          if (focusPoint) s.gesture.focus = focusPoint;
        }
        s.lastTap = undefined;
        return;
      }
      if (gesture)
        settle(s, gesture, event, hadPinch, hadPinch || gesture.pinched);
      resetGesture();
      if (gesture?.axis === "pan" && session === s) applyZoom(s, false);
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
      "dragstart",
      (event) => {
        if (
          !isElement(event.target) ||
          !event.target.matches(".re-lightbox-image")
        )
          return;
        if (
          settings.protect ||
          state.zoom.scale > 1 ||
          s.gesture?.axis === "pan" ||
          s.dialog.dataset.panning
        ) {
          event.preventDefault();
          return;
        }
        s.pointers.clear();
        resetGesture();
      },
      { signal },
    );
    s.viewport.addEventListener(
      "contextmenu",
      (event) => {
        if (
          settings.protect &&
          isElement(event.target) &&
          event.target.matches(".re-lightbox-image")
        )
          event.preventDefault();
      },
      { signal },
    );
    s.viewport.addEventListener(
      "click",
      (event) => {
        if (Date.now() < s.suppressClickUntil || state.isClosing) return;
        const target = event.target;
        if (
          !isElement(target) ||
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
    const settleLater = () => {
      clearTimeout(s.wheelTimer);
      s.wheelTimer = setTimeout(() => {
        s.wheelTimer = undefined;
        if (session === s && !state.isClosing) publish({});
      }, 150);
    };
    s.viewport.addEventListener(
      "wheel",
      (event) => {
        const zooming = event.ctrlKey || event.metaKey;
        if (
          !zooming &&
          (state.isClosing ||
            (state.zoom.scale <= 1 &&
              (!tall(state.index, s) ||
                Math.abs(event.deltaX) > Math.abs(event.deltaY))))
        )
          return;
        event.preventDefault();
        if (
          state.isClosing ||
          s.pointers.size > 0 ||
          (s.animations.size > 0 && !s.zoomMotion)
        )
          return;
        freezeZoom(s);
        if (zooming) {
          setZoom(
            state.zoom.scale * Math.exp(-event.deltaY * 0.01),
            focus({ x: event.clientX, y: event.clientY }),
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
        settleLater();
      },
      { signal, passive: false },
    );
    // Safari reports a trackpad pinch as gesture events, and iOS sends them beside the touches.
    type GestureEvent = Event & {
      scale?: number;
      clientX?: number;
      clientY?: number;
    };
    s.viewport.addEventListener(
      "gesturestart",
      (event) => {
        event.preventDefault();
        s.safariScale = undefined;
        if (
          state.isClosing ||
          s.pointers.size > 0 ||
          (s.animations.size > 0 && !s.zoomMotion)
        )
          return;
        freezeZoom(s);
        s.box = measure(s.viewport);
        s.safariScale = state.zoom.scale;
      },
      { signal },
    );
    s.viewport.addEventListener(
      "gesturechange",
      (input) => {
        const event = input as GestureEvent;
        event.preventDefault();
        const base = s.safariScale;
        if (base === undefined || state.isClosing || s.pointers.size > 0)
          return;
        if (!Number.isFinite(event.scale)) return;
        setZoom(
          base * (event.scale as number),
          focus({
            x: event.clientX ?? s.box.left + s.box.width / 2,
            y: event.clientY ?? s.box.top + s.box.height / 2,
          }),
          false,
        );
      },
      { signal },
    );
    s.viewport.addEventListener(
      "gestureend",
      (event) => {
        event.preventDefault();
        if (s.safariScale === undefined) return;
        s.safariScale = undefined;
        if (session === s && !state.isClosing) publish({});
      },
      { signal },
    );
  }

  function connect(viewport: HTMLDivElement) {
    const carousel = createCarousel(viewport, {
      drag: true,
      loop: looping(),
      onChange: (value) => {
        if (
          !syncingCarousel &&
          session?.viewport === viewport &&
          session.resizeFrame === undefined
        )
          activeChanged(session, value.index);
      },
    });
    (carousel as unknown as Record<symbol, { silence(): void } | undefined>)[
      carouselInternals
    ]?.silence();
    return carousel;
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

  // The caption panel shows when some photo has a caption, so the photo keeps one width while paging.
  function placeAside(s: Session, relayout = false) {
    const needed =
      Boolean(settings.slots?.aside) ||
      (settings.caption === "side" && items.some((item) => item.caption));
    if (needed === Boolean(s.aside)) return;
    if (s.aside) {
      s.aside.remove();
      s.chromeRoots = s.chromeRoots.filter((root) => root !== s.aside);
      s.aside = undefined;
      delete s.dialog.dataset.aside;
    } else {
      const aside = s.dialog.ownerDocument.createElement("div");
      aside.className = "re-lightbox-aside";
      if (settings.caption === "side") aside.append(s.caption);
      s.stage.append(aside);
      s.chromeRoots.push(aside);
      s.aside = aside;
      s.dialog.dataset.aside = "";
    }
    if (relayout) {
      const win = s.dialog.ownerDocument.defaultView;
      s.resizeFrame ??= win?.requestAnimationFrame(() => resized(s));
    }
  }

  // A side column turns into the bottom strip below 720px, where the strip pages as a carousel.
  function placeThumbs(s: Session) {
    const strip = s.thumbStrip;
    if (!strip) return;
    const win = s.dialog.ownerDocument.defaultView;
    const side =
      settings.thumbnails === "side" &&
      !win?.matchMedia?.("(max-width: 719.98px)").matches;
    const layout = side ? "side" : "bottom";
    if (s.dialog.dataset.thumbnails === layout) return;
    s.dialog.dataset.thumbnails = layout;
    s.thumbCarousel?.destroy();
    s.thumbCarousel = undefined;
    s.chromeRoots = s.chromeRoots.filter((root) => root !== strip);
    if (side) {
      s.stage.append(strip);
      s.chromeRoots.push(strip);
    } else {
      s.footer.append(strip);
      strip.tabIndex = -1;
      s.thumbCarousel = createCarousel(strip, { drag: true, align: "center" });
      (
        s.thumbCarousel as unknown as Record<
          symbol,
          { silence(): void } | undefined
        >
      )[carouselInternals]?.silence();
    }
    s.centeredThumb = -1;
    centerThumb(s);
  }

  function watchControls(s: Session) {
    const doc = s.dialog.ownerDocument;
    const win = doc.defaultView;
    const signal = s.abort.signal;
    doc.addEventListener(
      "fullscreenchange",
      () => {
        const full = doc.fullscreenElement === s.stage;
        s.fullscreenButton?.setAttribute(
          "aria-label",
          full ? s.strings.fullscreenExit : s.strings.fullscreenEnter,
        );
        if (full) s.dialog.dataset.fullscreen = "";
        else delete s.dialog.dataset.fullscreen;
      },
      { signal },
    );
    doc.addEventListener("visibilitychange", () => scheduleSlideshow(s), {
      signal,
    });
    const hover = (event: PointerEvent, target: EventTarget | null) => {
      if (event.pointerType !== "mouse") return;
      holdSlideshow(
        s,
        "hover",
        isNode(target) && s.chromeRoots.some((root) => root.contains(target)),
      );
    };
    s.dialog.addEventListener(
      "pointerover",
      (event) => hover(event, event.target),
      {
        signal,
      },
    );
    s.dialog.addEventListener(
      "pointerout",
      (event) => hover(event, event.relatedTarget),
      { signal },
    );
    if (s.slots.length && win?.MutationObserver) {
      // :popover-open throws where popovers are missing, so each selector is tried alone.
      const opened = () =>
        holdSlideshow(
          s,
          "menu",
          ['[aria-expanded="true"]', "details[open]", ":popover-open"].some(
            (selector) => {
              try {
                return Boolean(s.stage.querySelector(selector));
              } catch {
                return false;
              }
            },
          ),
        );
      const observer = new win.MutationObserver(opened);
      observer.observe(s.stage, {
        subtree: true,
        attributes: true,
        attributeFilter: ["aria-expanded", "open"],
      });
      s.stage.addEventListener("toggle", opened, { signal, capture: true });
      signal.addEventListener("abort", () => observer.disconnect());
    }
    const strip = s.thumbStrip;
    if (!strip) return;
    strip.addEventListener(
      "keydown",
      (event) => {
        const at = s.thumbs.indexOf(event.target as HTMLButtonElement);
        if (at < 0 || event.altKey || event.ctrlKey || event.metaKey) return;
        const side = s.dialog.dataset.thumbnails === "side";
        const rtl = win?.getComputedStyle(strip).direction === "rtl";
        const forward = side ? "ArrowDown" : rtl ? "ArrowLeft" : "ArrowRight";
        const back = side ? "ArrowUp" : rtl ? "ArrowRight" : "ArrowLeft";
        const to = {
          [forward]: at + 1,
          [back]: at - 1,
          Home: 0,
          End: s.thumbs.length - 1,
        }[event.key];
        if (to === undefined) return;
        event.preventDefault();
        const index = clamp(to, 0, s.thumbs.length - 1);
        rove(s, index);
        s.thumbs[index].focus();
      },
      // Ahead of the strip carousel's own keys, which would scroll it instead.
      { signal, capture: true },
    );
    strip.addEventListener(
      "focusout",
      (event) => {
        if (
          !isNode(event.relatedTarget) ||
          !strip.contains(event.relatedTarget)
        )
          rove(s, state.index);
      },
      { signal },
    );
    if (settings.thumbnails === "side")
      win
        ?.matchMedia?.("(max-width: 719.98px)")
        .addEventListener("change", () => placeThumbs(s), { signal });
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
    const nextItems = validateItems(input, options.content);
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
    if (settings.protect) dialog.dataset.protect = "";
    const control = (name: LightboxControl) =>
      settings.controls?.[name] ?? defaultControls[name];
    const stage = doc.createElement("div");
    stage.className = "re-lightbox-stage";
    dialog.append(stage);
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
    stage.append(backdrop, viewport, toolbar);
    const abort = new AbortController();
    const button = <K extends "button" | "a">(
      tag: K,
      name: LightboxIcon,
      label: string,
      text: string,
      action: (() => void) | undefined,
      parent: HTMLElement,
    ) => {
      const element = doc.createElement(tag);
      if (tag === "button") element.setAttribute("type", "button");
      element.className = `re-lightbox-button re-lightbox-${name}`;
      element.setAttribute("aria-label", label);
      const icon = settings.icons?.[name]?.();
      if (icon) element.append(icon);
      else element.textContent = text;
      if (action)
        element.addEventListener("click", action, { signal: abort.signal });
      parent.append(element);
      return element;
    };
    let counter: HTMLSpanElement | undefined;
    if (control("counter")) {
      counter = doc.createElement("span");
      counter.className = "re-lightbox-counter";
      counter.setAttribute("aria-hidden", "true");
      toolbarStart.append(counter);
    }
    const zoomButton = control("zoom")
      ? button(
          "button",
          "zoom",
          strings.zoomIn,
          "+",
          () => toggleZoom(),
          toolbarEnd,
        )
      : undefined;
    const slideshowButton = control("slideshow")
      ? button(
          "button",
          "slideshow",
          strings.slideshowStart,
          "▶",
          () => toggleSlideshow(s),
          toolbarEnd,
        )
      : undefined;
    const fullscreenButton =
      control("fullscreen") && doc.fullscreenEnabled
        ? button(
            "button",
            "fullscreen",
            strings.fullscreenEnter,
            "⤢",
            () => {
              if (doc.fullscreenElement === stage)
                void doc.exitFullscreen().catch(() => {});
              else void stage.requestFullscreen().catch(() => {});
            },
            toolbarEnd,
          )
        : undefined;
    const download = control("download")
      ? button("a", "download", strings.download, "↓", undefined, toolbarEnd)
      : undefined;
    download?.setAttribute("download", "");
    const closeButton = control("close")
      ? button(
          "button",
          "close",
          strings.close,
          "×",
          () => void close(),
          toolbarEnd,
        )
      : undefined;
    if (closeButton) closeButton.autofocus = true;
    const prev = control("arrows")
      ? button("button", "prev", strings.previous, "‹", () => step(-1), stage)
      : undefined;
    const next = control("arrows")
      ? button("button", "next", strings.next, "›", () => step(1), stage)
      : undefined;
    const footer = doc.createElement("div");
    footer.className = "re-lightbox-footer";
    const caption = doc.createElement("p");
    caption.className = "re-lightbox-caption";
    if (settings.caption !== "side") footer.append(caption);
    const status = doc.createElement("div");
    status.className = "re-lightbox-status";
    status.setAttribute("role", "status");
    stage.append(footer, status);
    const thumbs: HTMLButtonElement[] = [];
    let thumbStrip: HTMLDivElement | undefined;
    if (settings.thumbnails) {
      thumbStrip = doc.createElement("div");
      thumbStrip.className = "re-lightbox-thumbnails";
      thumbStrip.setAttribute("role", "group");
      thumbStrip.setAttribute("aria-label", strings.thumbnails);
    }
    const makeThumbs = () => {
      if (!thumbStrip) return;
      thumbs.length = 0;
      thumbStrip.replaceChildren(
        ...items.map((item, i) => {
          const thumb = doc.createElement("button");
          thumb.type = "button";
          thumb.tabIndex = -1;
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
    const previousFocus = isHTMLElement(doc.activeElement)
      ? doc.activeElement
      : null;
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
      stage,
      viewport,
      backdrop,
      slides,
      loaded: new Map(),
      carousel: connect(viewport),
      carouselLoops: looping(),
      heading: 1,
      strings,
      slots: [],
      footer,
      thumbStrip,
      roving: -1,
      centeredThumb: -1,
      pauses: new Set(["phase"]),
      abort,
      animations: new Set(),
      finishAnimations: new Set(),
      previousFocus,
      restoreScroll,
      phase: "entering",
      timing: { open: OPEN_DURATION, close: CLOSE_DURATION, ease: FLIGHT_EASE },
      chrome: initialChrome(false),
      chromeRoots: [toolbar, footer, ...(prev && next ? [prev, next] : [])],
      openingFocus: closeButton ?? viewport,
      zoomed: false,
      counter,
      counterText: "",
      status,
      caption,
      prev,
      next,
      zoomButton,
      fullscreenButton,
      download,
      slideshowButton,
      thumbs,
      makeSlide,
      makeThumbs,
      pointers: new Map(),
      box: measure(viewport),
      suppressClickUntil: 0,
      flying: true,
      watchedScale: 1,
      sharpScale: 1,
      autoplay:
        settings.autoplay !== false &&
        (doc.defaultView?.navigator.userActivation?.isActive ?? true),
    };
    session = s;
    if (doc.defaultView) enterHistory(doc.defaultView);
    publish({
      isOpen: true,
      isClosing: false,
      isAnimating: false,
      index: clamp(Math.floor(index), 0, items.length - 1),
      count: items.length,
      zoom: restZoom(s, clamp(Math.floor(index), 0, items.length - 1)),
      chrome: "shown",
    });
    placeAside(s);
    mountSlots(s, {
      toolbarStart: (node) => toolbarStart.append(node),
      toolbarEnd: (node) =>
        closeButton ? closeButton.before(node) : toolbarEnd.append(node),
      footer: (node) => footer.append(node),
      aside: (node) => s.aside?.append(node),
    });
    placeThumbs(s);
    s.box = measure(viewport);
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
          (isElement(event.target) &&
            event.target.closest(
              "input,textarea,select,[contenteditable=true],[data-lightbox-interactive]",
            ))
        )
          return;
        if (
          (event.ctrlKey || event.metaKey) &&
          !event.altKey &&
          (event.key.toLowerCase() === "c" ||
            (!/^[a-z]$/i.test(event.key) && event.code === "KeyC"))
        ) {
          copyImage(s, event);
          return;
        }
        if (event.altKey || event.ctrlKey || event.metaKey) return;
        const pan = {
          ArrowLeft: [KEY_PAN, 0],
          ArrowRight: [-KEY_PAN, 0],
          ArrowUp: [0, KEY_PAN],
          ArrowDown: [0, -KEY_PAN],
        }[event.key];
        if (
          pan &&
          (state.zoom.scale > 1 || (pan[0] === 0 && tall(state.index, s)))
        ) {
          event.preventDefault();
          panBy(s, pan[0] * view(s).width, pan[1] * view(s).height);
        } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
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
        s.resizeFrame ??= doc.defaultView?.requestAnimationFrame(() =>
          resized(s),
        );
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
    for (const [type, input] of [
      ["keydown", "keyboard"],
      ["pointerdown", "pointer"],
    ] as const)
      win?.addEventListener(
        type,
        () => {
          s.input = input;
        },
        { signal: abort.signal, capture: true, passive: true },
      );
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
          isNode(target) &&
          s.chromeRoots.some((root) => root.contains(target))
        )
          chromeInput(s, { type: "focus" });
      },
      { signal: abort.signal },
    );
    (closeButton ?? viewport).focus({ preventScroll: true });
    watchControls(s);
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
      s.flying = false;
      for (const entry of s.loaded.values()) {
        const commit = entry.commit;
        entry.commit = undefined;
        commit?.();
      }
      const current = s.loaded.get(state.index);
      if (current?.media?.mounted) current.media.mounted.resume?.();
      else if (current) mountMedia(s, state.index, current);
      if (s.phase === "opening") setPhase(s, "open");
      emit("opened", s);
    });
  }

  function close(): Promise<void> {
    return closeSession(false);
  }

  function pinToPage(s: Session) {
    const win = s.dialog.ownerDocument.defaultView;
    if (!win) return;
    const box = s.dialog.getBoundingClientRect();
    Object.assign(s.dialog.style, {
      position: "absolute",
      inset: "auto",
      top: `${box.top + win.scrollY}px`,
      left: `${box.left + win.scrollX}px`,
      width: `${box.width}px`,
      height: `${box.height}px`,
    });
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
    const landing = s.phase !== "entering" && s.phase !== "opening";
    if (fromHistory) s.input = "pointer";
    cancelAnimations(s);
    clearTimeout(s.tapTimer);
    s.tapTimer = undefined;
    chromeInput(s, { type: "close" });
    publish({ isClosing: true });
    leaveFullscreen(s);
    for (const entry of s.loaded.values()) entry.media?.mounted?.pause?.();
    s.dialog.style.removeProperty("--re-lightbox-chrome-opacity");
    setPhase(s, "closing");
    s.restoreScroll();
    pinToPage(s);
    let closing: Promise<void> | undefined;
    closing = (async () => {
      await flight(s, true, landing);
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
    const nextItems = validateItems(input, options.content);
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
        (candidate, i) =>
          !taken.has(i) && item.src !== undefined && candidate.src === item.src,
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
    s.marked = undefined;
    s.makeThumbs();
    s.roving = -1;
    s.thumbCarousel?.refresh();
    s.centeredThumb = Number.NaN;
    placeAside(s, true);
    const changed = target !== state.index;
    if ((changed || !kept || s.carouselLoops) && state.zoom.scale > 1) {
      updateState({ zoom: restZoom(s, target) });
      applyZoom(s);
    } else if (changed || !kept) updateState({ zoom: restZoom(s, target) });
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

function dimension(value: string | undefined) {
  const number = Number(value);
  return value && Number.isFinite(number) && number > 0 ? number : undefined;
}

export function lightboxItemFromImage(
  image: HTMLImageElement,
  source?: string,
): LightboxItem {
  const base = image.baseURI;
  const link = image.closest<HTMLAnchorElement>("a[href]");
  const href = link?.getAttribute("href");
  const tile = image.currentSrc || image.src;
  const src =
    source ||
    (href && isImageFile(href, base) ? href : undefined) ||
    image.dataset.lightboxSrc ||
    tile;
  const resolve = (url: string) => {
    try {
      return new URL(url, base).href;
    } catch {
      return url;
    }
  };
  const sameFile = resolve(src) === resolve(tile);
  const width = dimension(image.dataset.lightboxWidth);
  const height = dimension(image.dataset.lightboxHeight);
  const caption =
    image
      .closest("figure")
      ?.querySelector(":scope > figcaption")
      ?.textContent?.trim() ||
    image.dataset.caption ||
    link?.dataset.caption;
  // Without JavaScript the link still leads to the video or the page it plays.
  const type = link?.dataset.lightboxType || image.dataset.lightboxType;
  if (type) {
    const media = href || src;
    return {
      type,
      src: media,
      embed: media,
      video: { src: media, poster: tile },
      previewSrc: tile,
      width,
      height,
      alt: image.alt,
      caption: caption || undefined,
      origin: image,
    };
  }
  return {
    src,
    srcset: image.dataset.lightboxSrcset || undefined,
    sizes: image.dataset.lightboxSizes || undefined,
    previewSrc: tile,
    width: width ?? ((sameFile && image.naturalWidth) || undefined),
    height: height ?? ((sameFile && image.naturalHeight) || undefined),
    alt: image.alt,
    caption: caption || undefined,
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
  const controller = createLightbox({
    ...options,
    // Read at each open, so a page that swaps its body still gets the dialog in the live one.
    get container() {
      return options.container ?? root.ownerDocument.body;
    },
  });
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
    if (!isElement(target)) return;
    const images = [
      ...root.querySelectorAll<HTMLImageElement>(options.selector || "img"),
    ];
    const image = images.find(
      (candidate) =>
        candidate === target ||
        candidate.closest("a, button")?.contains(target),
    );
    if (!image) return;
    let list: readonly LightboxItem[];
    let index: number;
    if (options.items) {
      list = options.items(root);
      index = list.findIndex(
        (item) =>
          (typeof item.origin === "function" ? item.origin() : item.origin) ===
          image,
      );
      if (index < 0) index = images.indexOf(image);
    } else {
      const group =
        options.group ??
        ((element: HTMLImageElement) =>
          element.closest<HTMLElement>("[data-lightbox-group]")?.dataset
            .lightboxGroup ?? "");
      const name = group(image);
      const members = images.filter((candidate) => group(candidate) === name);
      list = members.map((member) =>
        (options.getItem || lightboxItemFromImage)(member),
      );
      index = members.indexOf(image);
    }
    // A clicked link whose media type has no module is followed; others leave such items out.
    const supported = list.filter(
      (item) =>
        item.type === undefined ||
        options.content?.some((module) => module.type === item.type),
    );
    const at = supported.indexOf(list[index]);
    if (at < 0) return;
    event.preventDefault();
    controller.open(supported, at);
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
