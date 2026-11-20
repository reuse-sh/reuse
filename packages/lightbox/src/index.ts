import { type Carousel, createCarousel } from "@reuse-sh/carousel";
import type { CarouselInternals } from "@reuse-sh/carousel/internal";
import { createThinkingDots } from "@reuse-sh/loaders";
import {
  type ChromeInput,
  type ChromeModel,
  initialChrome,
  stepChrome,
} from "./chrome.js";
import {
  type Area,
  boundZoom,
  clamp,
  contain,
  cover,
  elasticZoom,
  identity,
  type Point,
  panRange,
  type Rect,
  type Size,
  shapeOf,
  unrubber,
  widthFit,
  type Zoom,
  zoomAround,
  zoomLimits,
} from "./geometry.js";
import { type BuiltInIcon, showIcon } from "./icons.js";
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

function carouselInternalsOf(carousel: Carousel) {
  return (carousel as unknown as Record<symbol, CarouselInternals | undefined>)[
    carouselInternals
  ];
}

// What bindLightboxGallery reads from a controller it did not create, under a key that another
// copy of this package finds too: whether a module plays a type, and the options set so far,
// which markup options must not override.
const lightboxInternals = Symbol.for("@reuse-sh/lightbox internals");

type LightboxInternals = {
  /** The state at creation, which a server render shows. */
  initial: LightboxState<never>;
  shows(type: string): boolean;
  destroyed(): boolean;
  /** Closes at once without a flight and frees the DOM and listeners; the lightbox opens again. */
  release(): void;
  /** Runs open() with options that fill what the lightbox's own options leave unset, until that viewer closes. */
  openWith(
    options: Partial<LightboxOptions<never>> | undefined,
    open: () => void,
  ): void;
};

function internalsOf(lightbox: unknown) {
  return (lightbox as { [lightboxInternals]?: LightboxInternals } | null)?.[
    lightboxInternals
  ];
}

export type { Point, Rect, Size, Zoom } from "./geometry.js";

export interface LightboxStrings {
  dialog: string;
  slide: (index: number, count: number, caption?: string) => string;
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
  carouselRole: string;
}

const defaultStrings: LightboxStrings = {
  dialog: "Image gallery",
  slide: (index, count, caption) =>
    `Image ${index + 1} of ${count}${caption ? `, ${caption}` : ""}`,
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
  carouselRole: "carousel",
};

export type LightboxSlotName =
  | "toolbarStart"
  | "toolbarEnd"
  | "footer"
  | "aside";

export type LightboxSlot<Item extends LightboxItem = LightboxItem> = (context: {
  lightbox: Lightbox<Item>;
  document: Document;
  /** The icon a built-in control shows: yours from the icons option, else the package's. */
  icon: (name: LightboxIcon) => Node;
  /** A new counter that shows the position and rolls its digits like the built-in one. */
  counter: () => HTMLElement;
}) => {
  node: Node;
  update?: (state: LightboxState<Item>) => void;
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

const builtInIcons: Record<LightboxIcon, BuiltInIcon> = {
  close: "close",
  previous: "previous",
  next: "next",
  zoom: "zoomIn",
  zoomOut: "zoomOut",
  fullscreen: "fullscreenEnter",
  fullscreenExit: "fullscreenExit",
  download: "download",
  slideshow: "play",
  slideshowPause: "pause",
};

const firstStateIcon: Partial<Record<LightboxIcon, LightboxIcon>> = {
  zoomOut: "zoom",
  fullscreenExit: "fullscreen",
  slideshowPause: "slideshow",
};

export type LightboxIcon =
  | "close"
  | "previous"
  | "next"
  | "zoom"
  | "zoomOut"
  | "fullscreen"
  | "fullscreenExit"
  | "download"
  | "slideshow"
  | "slideshowPause";

export interface LightboxEvent {
  readonly type: LightboxEventName;
  readonly index: number;
  readonly slide: HTMLElement | null;
}

export interface LightboxCancelableEvent extends LightboxEvent {
  /** False for the close an emptied list starts, which preventDefault() cannot stop. */
  readonly cancelable: boolean;
  readonly defaultPrevented: boolean;
  /** Keeps the viewer open. */
  preventDefault(): void;
}

export interface LightboxBeforeChangeEvent extends LightboxEvent {
  readonly nextIndex: number;
}

export interface LightboxEventMap {
  open: LightboxEvent;
  opened: LightboxEvent;
  beforechange: LightboxBeforeChangeEvent;
  change: LightboxEvent;
  settle: LightboxEvent;
  beforeclose: LightboxCancelableEvent;
  closed: LightboxEvent;
}

export type LightboxEventName = keyof LightboxEventMap;

export interface LightboxListenOptions {
  /** Removes the listener when it aborts. */
  signal?: AbortSignal;
}

interface LightboxItemBase {
  alt?: string;
  caption?: string;
  /** The file's own size; without it the viewer fits the preview's proportions until the file decodes. */
  width?: number;
  height?: number;
  /** Shown while the file loads when the origin has no loaded image, and as a player's poster. */
  previewSrc?: string;
  thumbnailSrc?: string;
  /** The tile the photo opens from and closes to, read again whenever the photo changes. */
  origin?: HTMLElement | null | (() => HTMLElement | null);
}

export interface LightboxImageItem extends LightboxItemBase {
  type?: undefined;
  src: string;
  srcset?: string;
  sizes?: string;
}

export interface LightboxMediaItem extends LightboxItemBase {
  /** Picks the content module whose type matches, such as "video" for video(). */
  type: string;
  /** The media file, page or player link its module plays. */
  src?: string;
  /** Builds an HTML slide's content; HTML strings are never parsed. */
  html?: () => Node;
}

export type LightboxItem = LightboxImageItem | LightboxMediaItem;

export interface LightboxState<Item extends LightboxItem = LightboxItem> {
  readonly isOpen: boolean;
  readonly isClosing: boolean;
  readonly isAnimating: boolean;
  readonly index: number;
  readonly count: number;
  /** The item at index, the object passed to open() or setItems(). */
  readonly item: Item | undefined;
  readonly canPrev: boolean;
  readonly canNext: boolean;
  /** The slideshow runs, also while it waits on a zoom, a player or a hover. */
  readonly isPlaying: boolean;
  readonly zoom: Readonly<Zoom>;
  readonly chrome: "shown" | "hidden";
}

export interface LightboxContentContext<
  Item extends LightboxItem = LightboxItem,
> {
  item: Extract<Item, LightboxImageItem>;
  index: number;
  container: HTMLElement;
  image: HTMLImageElement;
}

export interface LightboxMountContext {
  item: LightboxMediaItem;
  index: number;
  /** Aborts when the slide unmounts. */
  signal: AbortSignal;
  /** True when the player should start once it is current: the autoplayMedia option and an open by a user action. */
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

export interface LightboxOptions<Item extends LightboxItem = LightboxItem> {
  container?: HTMLElement;
  imageClick?: "zoom" | "close" | "none";
  doubleTapZoom?: boolean;
  maxZoom?: number;
  tapZoom?: number;
  preload?: number;
  controls?: Partial<Record<LightboxControl, boolean>>;
  thumbnails?: false | "bottom" | "side";
  thumbnailsVisible?: boolean;
  caption?: "bottom" | "side";
  slideshow?: { interval?: number };
  autoHide?: number | false;
  className?: string;
  icons?: Partial<Record<LightboxIcon, () => Node>>;
  renderContent?: (
    context: LightboxContentContext<Item>,
  ) => undefined | (() => void);
  /** Content modules for items with a type, such as video() from @reuse-sh/lightbox/video. */
  content?: readonly LightboxContent[];
  /** Starts the current player once it shows, when the viewer opened from a user action; default true. */
  autoplayMedia?: boolean;
  loop?: boolean;
  history?: boolean;
  strings?: Partial<LightboxStrings>;
  slots?: Partial<Record<LightboxSlotName, LightboxSlot<Item>>>;
  protect?: boolean;
}

export interface Lightbox<Item extends LightboxItem = LightboxItem> {
  open(items: readonly Item[], index?: number): void;
  close(): Promise<void>;
  next(): void;
  prev(): void;
  goTo(index: number): void;
  zoomTo(scale: number, focus?: Point): void;
  toggleZoom(focus?: Point): void;
  /** Starts the slideshow on the open viewer. */
  play(): void;
  pause(): void;
  /** The last state subscribers received; a gesture or a wheel shows up once it settles. */
  getState(): LightboxState<Item>;
  /** Reports discrete actions, completed pointer gestures, and wheel input after 150ms idle. */
  subscribe(
    listener: (state: LightboxState<Item>) => void,
    options?: LightboxListenOptions,
  ): () => void;
  on<K extends LightboxEventName>(
    type: K,
    listener: (event: LightboxEventMap[K]) => void,
    options?: LightboxListenOptions,
  ): () => void;
  append(items: readonly Item[]): void;
  /** Keeps the current image when the new list still has it, otherwise shows index or the nearest image left. */
  setItems(items: readonly Item[], index?: number): void;
  /** Takes effect at the next open; loop and strings also change an open viewer at once. */
  setOptions(options: Partial<Omit<LightboxOptions<Item>, "container">>): void;
  getSlide(index: number): HTMLElement | null;
  destroy(): void;
}

type MediaSlide = {
  content: LightboxContent;
  mounted?: LightboxMounted;
  abort?: AbortController;
  holder?: HTMLElement;
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
  /** The full file's swap, held until the open flight has landed or the gesture on it ends. */
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
  paddingProbe: HTMLDivElement;
  backdrop: HTMLDivElement;
  slides: HTMLDivElement[];
  loaded: Map<number, LoadedSlide>;
  carousel: Carousel;
  heading: 1 | -1;
  marked?: number;
  strings: LightboxStrings;
  slots: ReturnType<LightboxSlot>[];
  motion?: { frame: number; left: number; still: number; moved: boolean };
  /** The photo changed since the last settle. */
  paged: boolean;
  phase: "entering" | "opening" | "open" | "dragging" | "returning" | "closing";
  timing: {
    open: number;
    close: number;
    zoom: number;
    fade: number;
    ease: string;
  };
  chrome: ChromeModel;
  chromeRoots: HTMLElement[];
  chromeTimer?: ReturnType<typeof setTimeout>;
  tapTimer?: ReturnType<typeof setTimeout>;
  openingFocus: HTMLElement | null;
  zoomed: boolean;
  footer: HTMLDivElement;
  thumbStrip?: HTMLDivElement;
  thumbRing?: HTMLSpanElement;
  thumbCarousel?: Carousel;
  roving: number;
  centeredThumb: number;
  /** A press or a wheel on the strip, until a click, a key, a settle, or a move to the current photo. */
  stripInput: boolean;
  /** The strip has changed the photo since that input; full files wait for it to settle. */
  scrubbing: boolean;
  /** The index the last change event reported, so a scrub reports once when it ends. */
  reported: number;
  scrubTimer?: ReturnType<typeof setTimeout>;
  scrubFrame?: number;
  /** Each thumbnail's center along the strip in scroll coordinates, read once per layout. */
  thumbCenters?: number[];
  aside?: HTMLDivElement;
  slideshow?: Slideshow;
  /** Reasons the slideshow waits, kept while it is off so a start honors them. */
  pauses: Set<string>;
  abort: AbortController;
  animations: Set<Animation>;
  finishAnimations: Set<(landed?: boolean) => void>;
  previousFocus: HTMLElement | null;
  releasedFocus?: Element | null;
  input?: "keyboard" | "pointer";
  restoreScroll: () => void;
  hiddenOrigin?: { element: HTMLElement; visibility: string };
  landing?: HTMLElement;
  counters: HTMLSpanElement[];
  counterText: string;
  status: HTMLDivElement;
  caption: HTMLParagraphElement;
  captionText: string;
  captionFade?: {
    fade: Animation;
    drift: Animation;
    from: number;
    to: number;
  };
  prev?: HTMLButtonElement;
  next?: HTMLButtonElement;
  zoomButton?: HTMLButtonElement;
  fullscreenButton?: HTMLButtonElement;
  download?: HTMLAnchorElement;
  slideshowButton?: HTMLButtonElement;
  thumbs: HTMLButtonElement[];
  makeSlide: () => HTMLDivElement;
  makeThumbs: (strings: LightboxStrings) => void;
  pointers: Map<number, Point>;
  box: Rect;
  area: Area;
  inset: { left: number; right: number; bottom: number };
  room: { left: number; right: number; bottom: number };
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
  stands?: {
    moved: Map<HTMLElement, string>;
    hidden: Map<HTMLElement, string>;
  };
  leaving?: number;
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

// A tile often rounds a wrapper that clips the image to its own box rather than the image itself.
function corners(origin: HTMLElement, rect: DOMRect, win: Window) {
  const sides = [
    "borderTopLeftRadius",
    "borderTopRightRadius",
    "borderBottomRightRadius",
    "borderBottomLeftRadius",
  ] as const;
  for (
    let element: HTMLElement | null = origin;
    element;
    element = element.parentElement
  ) {
    const box = element.getBoundingClientRect();
    if (
      Math.abs(box.left - rect.left) > 1 ||
      Math.abs(box.top - rect.top) > 1 ||
      Math.abs(box.right - rect.right) > 1 ||
      Math.abs(box.bottom - rect.bottom) > 1
    )
      break;
    const style = win.getComputedStyle(element);
    if (element !== origin && style.overflow === "visible") continue;
    const radii = sides.map((side) => {
      const value = style[side].split(" ")[0] ?? "";
      const size = Number.parseFloat(value) || 0;
      return value.endsWith("%") ? (size * rect.width) / 100 : size;
    });
    if (radii.some(Boolean)) return radii;
  }
  return [0, 0, 0, 0];
}

// A tile shows when part of it lies inside the window and inside every ancestor that clips it.
function onScreen(origin: HTMLElement, rect: DOMRect, win: Window) {
  let left = Math.max(rect.left, 0);
  let top = Math.max(rect.top, 0);
  let right = Math.min(rect.right, win.innerWidth);
  let bottom = Math.min(rect.bottom, win.innerHeight);
  for (
    let element = origin.parentElement;
    // The body's overflow belongs to the window, which the start already clips to.
    element &&
    element !== origin.ownerDocument.body &&
    right > left &&
    bottom > top;
    element = element.parentElement
  ) {
    const style = win.getComputedStyle(element);
    if (style.overflowX === "visible" && style.overflowY === "visible")
      continue;
    const clip = element.getBoundingClientRect();
    if (style.overflowX !== "visible") {
      left = Math.max(left, clip.left);
      right = Math.min(right, clip.right);
    }
    if (style.overflowY !== "visible") {
      top = Math.max(top, clip.top);
      bottom = Math.min(bottom, clip.bottom);
    }
  }
  return right > left && bottom > top;
}

function counterNode(doc: Document) {
  const counter = doc.createElement("span");
  counter.className = "re-lightbox-counter";
  counter.dir = "auto";
  counter.setAttribute("aria-hidden", "true");
  return counter;
}

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

// A viewer that leaves while another viewer's entry sits above its own cannot go back to it, so
// its entry is drained once it becomes the current one.
const HISTORY_KEY = "reuseLightbox";
const orphans = new WeakMap<Window, Set<string>>();

function entryOf(win: Window) {
  const current: unknown = win.history.state;
  const id =
    typeof current === "object" && current !== null
      ? (current as Record<string, unknown>)[HISTORY_KEY]
      : undefined;
  return typeof id === "string" ? id : undefined;
}

function orphan(win: Window, id: string) {
  const current = entryOf(win);
  if (current === undefined || current === id) return;
  const set = orphans.get(win) ?? new Set();
  orphans.set(win, set);
  set.add(id);
}

function takeOrphan(win: Window) {
  const id = entryOf(win);
  return id !== undefined && Boolean(orphans.get(win)?.delete(id));
}

function landed(win: Window, event: Event) {
  if (landings.has(event)) return true;
  const back = historyBacks.get(win);
  if (!back) return false;
  landings.add(event);
  if (takeOrphan(win)) {
    win.history.back();
    return true;
  }
  win.removeEventListener("popstate", back.drain);
  historyBacks.delete(win);
  releaseScroll(win);
  back.land();
  return true;
}

// Going back would restore the scroll the page had when the viewer opened and undo a scroll made
// during the close flight. Chrome and Firefox read the mode of the entry they return to, Safari
// reads the current mode in a task after popstate, so the page's entry is manual while the viewer
// has its own entry, the viewer's entry keeps the page's mode for a reload, and the back sets
// manual again until one task after it lands.
const heldScrolls = new WeakMap<
  Window,
  { mode: ScrollRestoration; release?: object }
>();

function holdScroll(win: Window) {
  const held = heldScrolls.get(win);
  if (held) {
    held.release = undefined;
    return held.mode;
  }
  const mode = win.history.scrollRestoration;
  heldScrolls.set(win, { mode });
  win.history.scrollRestoration = "manual";
  return mode;
}

function releaseScroll(win: Window) {
  const held = heldScrolls.get(win);
  if (!held || held.release) return;
  const release = {};
  held.release = release;
  const restore = () => {
    if (held.release !== release) return;
    heldScrolls.delete(win);
    win.history.scrollRestoration = held.mode;
  };
  const Channel = (win as Window & typeof globalThis).MessageChannel;
  if (!Channel) return restore();
  const channel = new Channel();
  channel.port1.onmessage = () => {
    channel.port1.close();
    restore();
  };
  channel.port2.postMessage(null);
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
  if (heldScrolls.has(win)) win.history.scrollRestoration = "manual";
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
const ZOOM_DURATION = 350;
const FADE_DURATION = 240;
const PADDING = 32;
const FLIGHT_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const ZOOM_EASE = "cubic-bezier(.16,1,.3,1)";
const NUDGE_DURATION = 220;
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
const LANDING_HANDOFF = 0.7;
const MAX_THUMB_RATIO = 3;

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

function resolveOrigin(origin: LightboxItem["origin"]) {
  return (typeof origin === "function" ? origin() : origin) ?? null;
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

export function createLightbox<Item extends LightboxItem = LightboxItem>(
  options: LightboxOptions<Item> = {},
): Lightbox<Item> {
  // The caller's object is copied once, so changing it later changes nothing; setOptions does.
  const current: LightboxOptions<Item> = { ...options };
  let settings: LightboxOptions<Item> = { ...current };
  let preload = 1;
  let padding = PADDING;
  let autoHide: number | false = 2500;
  let loop = Boolean(options.loop);
  let items: LightboxItem[] = [];
  let sources: readonly Item[] = [];
  let session: Session | undefined;
  let destroyed = false;
  let syncingCarousel = false;
  let closePromise: Promise<void> | undefined;
  let pendingClosed: (() => void) | undefined;
  let listAfterClose:
    | { items: LightboxItem[]; sources: readonly Item[] }
    | undefined;
  let state: LightboxState<Item> = {
    isOpen: false,
    isClosing: false,
    isAnimating: false,
    index: 0,
    count: 0,
    item: undefined,
    canPrev: false,
    canNext: false,
    isPlaying: false,
    zoom: { ...identity },
    chrome: "shown",
  };
  const listeners = new Set<(state: LightboxState<Item>) => void>();
  const stops = new Set<() => void>();
  const handlers = new Map<
    LightboxEventName,
    Set<(event: LightboxCancelableEvent) => void>
  >();
  const historyId = Math.random().toString(36).slice(2);
  let historyWindow: Window | undefined;
  let vetting = false;
  let forcing = false;

  let notifiedState = state;
  const initial = state;

  // A gallery's markup options for the next open, set only while bindLightboxGallery opens.
  let galleryOptions: Partial<LightboxOptions<Item>> | undefined;

  function configure(layer?: Partial<LightboxOptions<Item>>) {
    settings = { ...current };
    for (const [key, value] of Object.entries(layer ?? {}))
      if (settings[key as keyof typeof settings] === undefined)
        Object.assign(settings, { [key]: value });
    if (layer?.strings && current.strings)
      settings.strings = { ...layer.strings, ...current.strings };
    loop = Boolean(settings.loop);
    preload = clamp(Math.floor(settings.preload ?? 1), 0, 2);
    autoHide =
      settings.autoHide === false
        ? false
        : Number.isFinite(settings.autoHide)
          ? Math.max(0, settings.autoHide as number)
          : 2500;
  }
  configure();

  // item, canPrev and canNext follow index, count, the list and loop.
  function updateState(update: Partial<LightboxState<Item>>) {
    const next = { ...state, ...update };
    const many = next.count > 1;
    state = {
      ...next,
      item: sources[next.index],
      canPrev: many && (loop || next.index > 0),
      canNext: many && (loop || next.index < next.count - 1),
    };
  }

  function publish(update: Partial<LightboxState<Item>>) {
    updateState(update);
    if (
      state.isOpen === notifiedState.isOpen &&
      state.isClosing === notifiedState.isClosing &&
      state.isAnimating === notifiedState.isAnimating &&
      state.index === notifiedState.index &&
      state.count === notifiedState.count &&
      state.item === notifiedState.item &&
      state.canPrev === notifiedState.canPrev &&
      state.canNext === notifiedState.canNext &&
      state.isPlaying === notifiedState.isPlaying &&
      state.chrome === notifiedState.chrome &&
      state.zoom.scale === notifiedState.zoom.scale &&
      state.zoom.x === notifiedState.zoom.x &&
      state.zoom.y === notifiedState.zoom.y
    )
      return;
    notifiedState = state;
    for (const listener of listeners) listener(state);
    for (const slot of session?.slots ?? []) slot.update?.(state);
  }

  function emit(
    type: LightboxEventName,
    s: Session | null,
    {
      cancelable = true,
      nextIndex,
    }: { cancelable?: boolean; nextIndex?: number } = {},
  ) {
    let prevented = false;
    const event: LightboxEvent = {
      type,
      index: state.index,
      slide: s?.slides[state.index] ?? null,
    };
    if (type === "beforechange")
      Object.defineProperty(event, "nextIndex", {
        value: nextIndex,
        enumerable: true,
      });
    if (type === "beforeclose")
      Object.defineProperties(event, {
        cancelable: { value: cancelable, enumerable: true },
        defaultPrevented: { get: () => prevented, enumerable: true },
        preventDefault: {
          value: () => {
            prevented = cancelable;
          },
        },
      });
    for (const listener of [...(handlers.get(type) ?? [])])
      listener(event as LightboxCancelableEvent);
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
    else goTo(0);
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
    if (session === s) publish({ isPlaying: on });
    else updateState({ isPlaying: on });
    if (!button) return;
    button.setAttribute(
      "aria-label",
      on ? s.strings.slideshowStop : s.strings.slideshowStart,
    );
    showStateIcon(button, "slideshow", "slideshowPause", on);
  }

  // A CSS easing list passes CSS.supports but makes animate() throw, so the check asks the same parser animate() uses.
  function easing(value: string, win: Window | null) {
    const Effect = (win as (Window & typeof globalThis) | null)?.KeyframeEffect;
    if (!value || !Effect) return FLIGHT_EASE;
    try {
      new Effect(null, null, { easing: value });
      return value;
    } catch {
      return FLIGHT_EASE;
    }
  }

  function readTiming(s: Session) {
    const style = s.dialog.ownerDocument.defaultView?.getComputedStyle(
      s.dialog,
    );
    const read = (name: string) => style?.getPropertyValue(name) ?? "";
    s.timing = {
      open: milliseconds(read("--re-lightbox-open-duration"), OPEN_DURATION),
      close: milliseconds(read("--re-lightbox-close-duration"), CLOSE_DURATION),
      zoom: milliseconds(read("--re-lightbox-zoom-duration"), ZOOM_DURATION),
      fade: milliseconds(read("--re-lightbox-fade-duration"), FADE_DURATION),
      ease: easing(
        read("--re-lightbox-ease").trim(),
        s.dialog.ownerDocument.defaultView,
      ),
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

  // The carousel's change events come from the viewer's own moves here, so they are ignored.
  function quietly(move: () => void) {
    const syncing = syncingCarousel;
    syncingCarousel = true;
    try {
      move();
    } finally {
      syncingCarousel = syncing;
    }
  }

  const shownIcons = new WeakMap<Element, LightboxIcon>();

  function showControlIcon(button: Element, name: LightboxIcon) {
    if (shownIcons.get(button) === name) return;
    shownIcons.set(button, name);
    const own = settings.icons?.[name]?.();
    if (own) button.replaceChildren(own);
    else showIcon(button, builtInIcons[name]);
  }

  // A given first icon stays in the second state unless the second one is given too.
  function showStateIcon(
    button: Element,
    first: LightboxIcon,
    second: LightboxIcon,
    on: boolean,
  ) {
    const icons = settings.icons;
    showControlIcon(
      button,
      on && (icons?.[second] || !icons?.[first]) ? second : first,
    );
  }

  function lastIndex() {
    return clamp(state.index, 0, Math.max(0, items.length - 1));
  }

  function wrap(index: number) {
    return ((index % items.length) + items.length) % items.length;
  }

  function originOf(index: number) {
    return resolveOrigin(items[index]?.origin);
  }

  function rendered(element: HTMLElement) {
    if (!element.isConnected || element.checkVisibility?.() === false)
      return undefined;
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 ? rect : undefined;
  }

  function measure(s: Session) {
    const rect = s.viewport.getBoundingClientRect();
    const win = s.viewport.ownerDocument.defaultView;
    const space = Number.parseFloat(
      win?.getComputedStyle(s.paddingProbe).paddingLeft ?? "",
    );
    padding = Number.isFinite(space) ? Math.max(0, space) : PADDING;
    const room = Number.parseFloat(
      win?.getComputedStyle(s.paddingProbe).height ?? "",
    );
    const width = rect.width || win?.innerWidth || 1;
    const height = rect.height || win?.innerHeight || 1;
    const strip = s.thumbStrip?.getBoundingClientRect();
    const layout =
      strip?.width && strip.height ? s.dialog.dataset.thumbnails : undefined;
    const rtl = s.viewport.matches(":dir(rtl)");
    const inset = { left: 0, right: 0, bottom: 0 };
    if (strip && layout === "bottom")
      inset.bottom = Math.max(0, rect.bottom - strip.top);
    else if (strip && layout === "side" && rtl)
      inset.left = Math.max(0, strip.right - rect.left);
    else if (strip && layout === "side")
      inset.right = Math.max(0, rect.right - strip.left);
    const kept = {
      left: 0,
      right: 0,
      bottom: Number.isFinite(room) ? room : 0,
    };
    const aside = s.aside && rendered(s.aside);
    if (aside) {
      const above = width * Math.max(0, aside.top - rect.top);
      const before = height * Math.max(0, aside.left - rect.left);
      const after = height * Math.max(0, rect.right - aside.right);
      if (above >= before && above >= after)
        kept.bottom = Math.max(kept.bottom, rect.bottom - aside.top);
      else if (after > before) kept.left = Math.max(0, aside.right - rect.left);
      else kept.right = Math.max(0, rect.right - aside.left);
    }
    s.room = kept;
    inset.left = Math.max(inset.left, kept.left);
    inset.right = Math.max(inset.right, kept.right);
    inset.bottom = Math.max(inset.bottom, kept.bottom);
    s.inset = inset;
    s.viewport.style.setProperty(
      "--re-lightbox-thumbnails-room",
      `0px ${inset.right}px ${inset.bottom}px ${inset.left}px`,
    );
    s.box = {
      left: rect.left + inset.left,
      top: rect.top,
      width: width - inset.left - inset.right,
      height: height - inset.bottom,
    };
    s.area = {
      width,
      height,
      x: (inset.right - inset.left) / 2,
      y: inset.bottom / 2,
    };
  }

  function view(s: Session): Size {
    return s.box;
  }

  function area(s: Session, scale: number): Area {
    return scale > 1 ? s.area : s.box;
  }

  function bound(s: Session, zoom: Zoom) {
    return boundZoom(zoom, fit(state.index, s), area(s, zoom.scale));
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

  function filling(aspect: number, s: Session): Size {
    const { width, height } = view(s);
    return {
      width: Math.max(width, height * aspect),
      height: Math.max(height, width / aspect),
    };
  }

  // Before the file arrives, the shown preview or the tile gives only the proportions, since its
  // pixels are the tile's and not the file's; a player has no pixels to stop at. Both fill the screen.
  function imageSize(index: number, s: Session): Size {
    const item = items[index];
    if (item.width && item.height)
      return { width: item.width, height: item.height };
    if (item.type)
      return filling(s.loaded.get(index)?.media?.mounted?.aspect || 16 / 9, s);
    for (const image of [s.loaded.get(index)?.image, tileImage(index)])
      if (image?.naturalWidth && image.naturalHeight)
        return filling(image.naturalWidth / image.naturalHeight, s);
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
      ? { scale: 1, x: 0, y: panRange(1, fit(index, s), view(s)).y.max }
      : { ...identity };
    s.rest = zoom;
    return zoom;
  }

  function limits(s: Session, index = state.index) {
    const item = items[index];
    const entry = s.loaded.get(index);
    if (entry?.status === "failed" || item?.type !== undefined)
      return { min: 1, max: 1, tap: 1 };
    return zoomLimits({
      fileWidth: largestWidth(item?.srcset) ?? entry?.natural ?? item?.width,
      image: imageSize(index, s),
      viewport: view(s),
      zoomed: s.area,
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
      quietly(() =>
        s.carousel.setEnabled(
          state.zoom.scale <= 1 &&
            state.zoom.scale >= range.min - 1e-3 &&
            s.gesture?.axis !== "pan" &&
            s.pointers.size < 2 &&
            items.length > 1,
        ),
      );
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
    if (zoomButton) showStateIcon(zoomButton, "zoom", "zoomOut", out);
    s.dialog.dataset.zoomed = String(state.zoom.scale > 1);
    s.dialog.dataset.zoom = out ? "out" : "in";
    if (s.watchedScale !== state.zoom.scale) {
      s.watchedScale = state.zoom.scale;
      clearTimeout(s.sharpTimer);
      s.sharpTimer = setTimeout(() => sharpen(s), ZOOM_IDLE);
    }
    if (s.zoomed !== state.zoom.scale > 1) {
      s.zoomed = state.zoom.scale > 1;
      const active = s.dialog.ownerDocument.activeElement;
      if (
        active &&
        active !== s.viewport &&
        s.dialog.contains(active) &&
        ((s.zoomed &&
          !active.closest(".re-lightbox-zoom, .re-lightbox-close")) ||
          active.checkVisibility?.() === false)
      )
        s.viewport.focus({ preventScroll: true });
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
    const animation = node.animate(frames, {
      duration,
      easing,
      fill: "both",
    });
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
      // The deadline counts from the animation's start, so a busy main thread does not cut it short,
      // and waits while a visible document has yet to start it.
      let elapsed = -1;
      const deadline = () => {
        const time = Number(animation.currentTime);
        if (
          animation.pending &&
          node.ownerDocument.visibilityState === "visible"
        )
          timer = setTimeout(deadline, duration + 80);
        else if (
          animation.startTime === null ||
          !(time > elapsed) ||
          time >= duration
        )
          finish(true);
        else {
          elapsed = time;
          timer = setTimeout(deadline, duration - time + 80);
        }
      };
      let timer = setTimeout(deadline, duration + 80);
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
    const animation = frame.animate(
      [{ transform: zoomTransform(from) }, { transform: zoomTransform(to) }],
      { duration, easing: ease },
    );
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
    return prefersReducedMotion(s) ? 0 : s.timing.zoom;
  }

  function nudgeDuration(s: Session) {
    return Math.min(zoomDuration(s), NUDGE_DURATION);
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
    rect: DOMRect,
    size: Size,
    box: Rect,
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
    const reset =
      "position:absolute;left:0;top:0;right:auto;bottom:auto;display:block;box-sizing:content-box;min-width:0;min-height:0;max-width:none;max-height:none;margin:0;padding:0;border:0;border-radius:0;box-shadow:none;outline:0;opacity:1;visibility:visible;filter:none;transition:none;animation:none;transform:none;translate:none;rotate:none;scale:none;pointer-events:none";
    copy.style.cssText = `${reset};width:${size.width}px;height:${size.height}px;object-fit:fill;transform-origin:center`;
    // The box covers the tile and clips the copy, so the full-size copy adds no scrollable
    // overflow to a strip whose tiles have no position of their own.
    const holder = doc.createElement("span");
    holder.setAttribute("aria-hidden", "true");
    holder.style.cssText = `${reset};width:${rect.width}px;height:${rect.height}px;overflow:hidden;overflow:clip`;
    holder.append(copy);
    // A carousel of bare children would count a copy beside its slide as one more slide.
    const parent = origin.parentElement;
    (parent?.classList.contains("re-carousel") ? parent : origin).after(holder);
    const at = holder.getBoundingClientRect();
    holder.style.left = `${rect.left - at.left}px`;
    holder.style.top = `${rect.top - at.top}px`;
    copy.style.left = `${box.left + (box.width - size.width) / 2 - rect.left}px`;
    copy.style.top = `${box.top + (box.height - size.height) / 2 - rect.top}px`;
    return { holder, copy };
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
    let slide = s.slides[state.index]?.getBoundingClientRect();
    const shift = slide ? slide.left - box.left : 0;
    // Disabling ends a held mouse drag and a touch fling, and keeps the strip still while it flies.
    if (closing) quietly(() => s.carousel.setEnabled(false));
    if (closing && Math.abs(shift) > 1) {
      quietly(() => {
        s.carousel.setEnabled(true);
        s.carousel.goTo(state.index, "instant");
        s.carousel.setEnabled(false);
      });
      slide = s.slides[state.index]?.getBoundingClientRect();
      if (slide && Math.abs(slide.left - box.left) <= 1)
        live.transform = `translate(${shift}px, 0px) ${live.transform}`;
    }
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
      origin &&
      rect &&
      slide &&
      Math.abs(slide.left - box.left) <= 1 &&
      Math.abs(slide.right - box.right) <= 1 &&
      onScreen(origin, rect, win);
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
    const room = {
      left: box.left + s.inset.left,
      top: box.top,
      width: box.width - s.inset.left - s.inset.right,
      height: box.height - s.inset.bottom,
    };
    const x = rect.left + left + crop.width / 2 - room.left - room.width / 2;
    const y = rect.top + top + crop.height / 2 - room.top - room.height / 2;
    const radius = corners(origin, rect, win)
      .map((corner) => `${corner / scale}px`)
      .join(" ");
    const clipped = {
      transform: `translate(${x}px, ${y}px) scale(${scale})`,
      clipPath: `inset(${Math.max(0, -top / scale)}px ${Math.max(0, (crop.width + left - rect.width) / scale)}px ${Math.max(0, (crop.height + top - rect.height) / scale)}px ${Math.max(0, -left / scale)}px round ${radius})`,
      opacity: 1,
    };
    const expanded = {
      transform: resting,
      clipPath: "inset(0px round 0px)",
      opacity: 1,
    };
    if (!closing)
      return animate(s, entry.frame, [clipped, expanded], duration, ease);
    const made =
      landing && duration > 0
        ? landingCopy(s, entry.image, origin, rect, size, room)
        : undefined;
    if (!made) return animate(s, entry.frame, [live, clipped], duration, ease);
    const { holder, copy } = made;
    s.landing = holder;
    return Promise.all([
      animate(
        s,
        entry.frame,
        [
          { transform: live.transform, clipPath: live.clipPath },
          { transform: clipped.transform, clipPath: clipped.clipPath },
        ],
        duration,
        ease,
      ),
      animate(
        s,
        entry.frame,
        [
          { opacity: live.opacity },
          { opacity: live.opacity, offset: LANDING_HANDOFF },
          { opacity: 0 },
        ],
        duration,
        "linear",
      ),
      animate(s, copy, [{ ...live, opacity: 1 }, clipped], duration, ease),
    ]);
  }

  // A zoom asks for a larger file only once its scale has rested, through sizes.
  function requestSizes(s: Session) {
    for (const [index, entry] of s.loaded) {
      const item = items[index];
      if (
        item.type !== undefined ||
        !item.srcset ||
        !entry.loader ||
        entry.status === "failed"
      )
        continue;
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
        zoom: scale > 1 ? bound(s, { ...state.zoom, scale }) : { ...identity },
      });
    }
    applyZoom(s);
  }

  function resized(s: Session) {
    s.resizeFrame = undefined;
    if (session !== s) return;
    cancelAnimations(s, true);
    clearStands(s);
    const before = state.zoom;
    const from = fit(state.index, s);
    const resting = s.rest !== undefined && sameZoom(before, s.rest);
    measure(s);
    s.pinned = undefined;
    s.thumbCenters = undefined;
    if (resting) updateState({ zoom: restZoom(s, state.index) });
    else {
      const to = fit(state.index, s);
      const range = limits(s);
      const scale = clamp(before.scale, range.min, range.max);
      const ratio = scale / before.scale;
      updateState({
        zoom: bound(s, {
          scale,
          x: ((before.x * to.width) / from.width) * ratio,
          y: ((before.y * to.height) / from.height) * ratio,
        }),
      });
    }
    layout(s);
    quietly(() => {
      s.carousel.setEnabled(true);
      s.carousel.refresh();
      s.carousel.goTo(state.index, "instant");
    });
    applyZoom(s, false);
    ringThumb(s, false);
    if (!sameZoom(before, state.zoom)) publish({});
  }

  function visibleRange(s: Session) {
    const count = s.slides.length;
    const size = count ? s.slides[0].getBoundingClientRect().width : 0;
    if (!size) return [];
    const width = s.viewport.clientWidth;
    const start = Math.abs(s.viewport.scrollLeft);
    const looped = s.carousel.getState().isLooping;
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
      if (
        distanceTo(index) <= preload ||
        visible.includes(index) ||
        index === s.leaving ||
        s.stands?.moved.has(s.slides[index])
      )
        continue;
      entry.cancel();
      entry.frame.remove();
      s.loaded.delete(index);
    }
  }

  // The current image loads first; the neighbors wait until it has decoded or failed, and
  // Save-Data keeps them at their previews.
  function startLoads(s: Session) {
    if (s.scrubbing) return;
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
    const item = items[index];
    if (!media || media.mounted || session !== s || item.type === undefined)
      return;
    const doc = s.dialog.ownerDocument;
    const holder = doc.createElement("div");
    holder.className = "re-lightbox-media";
    entry.frame.append(holder);
    const abort = new AbortController();
    const mounted = media.content.mount(holder, {
      item,
      index,
      signal: abort.signal,
      autoplay: s.autoplay,
    });
    media.abort = abort;
    media.mounted = mounted;
    media.holder = holder;
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
    if (index === state.index) holdForMedia(s);
  }

  function holdForMedia(s: Session) {
    const media = s.loaded.get(state.index)?.media;
    const player =
      media?.holder?.querySelector<HTMLMediaElement>("video, audio");
    holdSlideshow(
      s,
      "media",
      Boolean(media?.mounted) &&
        (player
          ? !player.paused && !player.ended
          : media?.content.type === "embed"),
    );
  }

  function swapHeld(s: Session) {
    for (const entry of s.loaded.values()) {
      const commit = entry.commit;
      entry.commit = undefined;
      commit?.();
    }
  }

  function unmountMedia(entry: LoadedSlide) {
    const media = entry.media;
    if (!media?.mounted) return;
    const { mounted, abort } = media;
    media.mounted = media.abort = media.holder = undefined;
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
      image.draggable = false;
      image.decoding = "async";
      if (item.type !== undefined) {
        const content = settings.content?.find(
          (module) => module.type === item.type,
        );
        if (!content) continue;
        frame.dataset.media = content.type;
        const poster = previewOf(index);
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
      const fetcher = (url: string, init?: RequestInit) =>
        (doc.defaultView ?? globalThis).fetch(url, init);
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
        if (!format && /^blob:/i.test(url))
          void lookupFormat(url, doc.baseURI, fetcher).then((found) => {
            if (alive && shown === url) mark(found);
          });
      };
      const show = (source: HTMLImageElement, width: number, size?: Size) => {
        if (!alive || session !== s) return;
        if (entry.natural !== undefined && width <= entry.natural) return;
        entry.natural = width;
        const before =
          index === state.index && !s.flying ? fit(index, s) : undefined;
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
                : (largestWidth(item.srcset) ?? width);
          if (!item.height) item.height = Math.round(item.width * ratio);
        }
        display(source.currentSrc || source.src);
        frame.removeAttribute("data-loading");
        layout(s);
        const after = before && fit(index, s);
        if (
          before &&
          after &&
          (Math.abs(after.width - before.width) > 0.5 ||
            Math.abs(after.height - before.height) > 0.5)
        )
          void animate(
            s,
            frame,
            [
              { width: `${before.width}px`, height: `${before.height}px` },
              { width: `${after.width}px`, height: `${after.height}px` },
            ],
            nudgeDuration(s),
          );
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
            const held =
              s.flying ||
              (s.pointers.size > 0 && s.loaded.get(state.index) === entry);
            if (held && image.hasAttribute("src"))
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
            // Only an SVG without its own size decodes at 300x150, so a CDN URL without an
            // extension asks for no type.
            if (
              !format &&
              !/^blob:/i.test(source) &&
              (loader.naturalWidth !== 300 || loader.naturalHeight !== 150)
            )
              return ready();
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
        loader.src = item.src;
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
        item: item as Extract<Item, LightboxImageItem>,
        index,
        container: frame,
        image,
      });
    }
    layout(s);
    startLoads(s);
  }

  let notifyingBeforeChange = false;

  function notifyBeforeChange(s: Session, nextIndex: number) {
    if (notifyingBeforeChange) return true;
    const previousIndex = state.index;
    const previousItems = items;
    notifyingBeforeChange = true;
    try {
      emit("beforechange", s, { nextIndex });
    } finally {
      notifyingBeforeChange = false;
    }
    return (
      session === s &&
      !state.isClosing &&
      state.index === previousIndex &&
      items === previousItems
    );
  }

  function activeChanged(s: Session, index: number, report = true) {
    if (session !== s || state.index === index || state.isClosing) return;
    if (!notifyBeforeChange(s, index)) return;
    cancelAnimations(s);
    s.backdrop.style.opacity = "";
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
    s.paged = true;
    publish({ index, zoom: restZoom(s, index) });
    update(s, forward ? 1 : -1);
    arrived(s, index, report);
  }

  function arrived(s: Session, index: number, report = true) {
    const entry = s.loaded.get(index);
    if (entry?.media?.mounted) entry.media.mounted.resume?.();
    else if (entry) mountMedia(s, index, entry);
    holdForMedia(s);
    restartSlideshow(s);
    if (report) announce(s, index);
  }

  function announce(s: Session, index: number) {
    s.reported = index;
    s.status.textContent = s.strings.slide(
      index,
      items.length,
      items[index]?.caption || undefined,
    );
    emit("change", s);
  }

  function showCaption(s: Session, text: string, direction: 1 | -1 | 0) {
    const caption = s.caption;
    if (text === s.captionText) return;
    s.captionText = text;
    const shown = caption.textContent ?? "";
    const win = caption.ownerDocument.defaultView;
    const opacity = () => Number(win?.getComputedStyle(caption).opacity ?? 1);
    const running = s.captionFade;
    const at = running ? opacity() : 1;
    const drift = running?.drift.effect?.getComputedTiming().progress;
    const side = running
      ? running.from + (running.to - running.from) * (drift ?? 1)
      : 0;
    running?.fade.cancel();
    running?.drift.cancel();
    s.captionFade = undefined;
    const duration = s.timing.fade;
    if (
      direction === 0 ||
      duration <= 0 ||
      prefersReducedMotion(s) ||
      typeof caption.animate !== "function"
    ) {
      caption.textContent = text;
      return;
    }
    const rest = opacity();
    const share = running && rest > 0 ? Math.min(at / rest, 1) : 1;
    const run = (
      frames: Keyframe[],
      from: number,
      to: number,
      timing: KeyframeAnimationOptions,
    ) => {
      const fade = caption.animate(frames, timing);
      const drift = caption.animate(
        [from, to].map((shift) => ({ translate: `0 ${shift * 0.4}em` })),
        { ...timing, composite: "add" },
      );
      s.captionFade = { fade, drift, from, to };
      return fade;
    };
    const fadeIn = (start: number, from: number, share = 0) => {
      const fade = run([{ opacity: start, offset: 0 }], from, 0, {
        duration: duration * 0.55 * (1 - share),
        easing: "ease-out",
      });
      fade.onfinish = () => {
        if (s.captionFade?.fade === fade) s.captionFade = undefined;
      };
    };
    if (text === shown) return fadeIn(running ? at : rest, side, share);
    if (!shown) {
      caption.textContent = text;
      return fadeIn(0, direction);
    }
    const fadeOut = run(
      [{ opacity: running ? at : rest }, { opacity: 0 }],
      side,
      -direction,
      {
        duration: duration * 0.45 * share,
        easing: "ease-in",
        fill: "forwards",
      },
    );
    fadeOut.onfinish = () => {
      const current = s.captionFade;
      if (current?.fade !== fadeOut) return;
      s.captionFade = undefined;
      caption.textContent = text;
      if (text) fadeIn(0, direction);
      current.fade.cancel();
      current.drift.cancel();
    };
  }

  function renderCounter(s: Session, direction: 1 | -1 | 0) {
    const text = s.strings.counter(state.index, items.length);
    if (text === s.counterText) return;
    s.counterText = text;
    for (const counter of s.counters) drawCounter(s, counter, text, direction);
  }

  function drawCounter(
    s: Session,
    counter: HTMLSpanElement,
    text: string,
    direction: 1 | -1 | 0,
  ) {
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
    showCaption(s, item.caption || "", direction);
    const single = items.length < 2;
    for (const control of [s.prev, s.next, ...s.counters, s.slideshowButton])
      if (control) control.hidden = single;
    if (s.prev) s.prev.disabled = !looping() && state.index === 0;
    if (s.next)
      s.next.disabled = !looping() && state.index === items.length - 1;
    if (single) toggleSlideshow(s, false);
    if (s.download) {
      const href =
        item.type === undefined ? largestSource(item.srcset, item.src) : "";
      let file = false;
      if (href)
        try {
          const url = new URL(href, s.dialog.ownerDocument.baseURI);
          file =
            /^(https?|blob):$/.test(url.protocol) ||
            /^data:image\/(png|jpeg|gif|webp|avif)[;,]/i.test(url.href);
        } catch {}
      s.download.hidden = !file;
      if (file) s.download.setAttribute("href", href);
      else s.download.removeAttribute("href");
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
    ringThumb(s, true);
    applyZoom(s);
  }

  function rove(s: Session, index: number) {
    if (s.roving === index) return;
    if (s.thumbs[s.roving]) s.thumbs[s.roving].tabIndex = -1;
    if (s.thumbs[index]) s.thumbs[index].tabIndex = 0;
    s.roving = index;
  }

  function inRoom(s: Session, x: number, y: number) {
    const rect = s.viewport.getBoundingClientRect();
    return (
      x < rect.left + s.room.left ||
      x > rect.right - s.room.right ||
      y > rect.bottom - s.room.bottom
    );
  }

  function overThumbnails(s: Session, x: number, y: number) {
    const first = s.thumbs[0]?.getBoundingClientRect();
    const last = s.thumbs.at(-1)?.getBoundingClientRect();
    const strip = s.thumbStrip?.getBoundingClientRect();
    if (!first || !last || !strip?.width) return false;
    return (
      x >= Math.max(strip.left, Math.min(first.left, last.left)) &&
      x <= Math.min(strip.right, Math.max(first.right, last.right)) &&
      y >= Math.max(strip.top, Math.min(first.top, last.top)) &&
      y <= Math.min(strip.bottom, Math.max(first.bottom, last.bottom))
    );
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
    s.stripInput = false;
    if (s.thumbCarousel) {
      s.thumbCarousel.goTo(state.index, behavior);
      return;
    }
    strip.scrollTo({
      top: thumb.offsetTop - (strip.clientHeight - thumb.offsetHeight) / 2,
      behavior,
    });
  }

  // The ring stands over the strip's center and takes the current thumbnail's size; the
  // thumbnails scroll under it.
  function ringThumb(s: Session, glide: boolean) {
    const ring = s.thumbRing;
    const strip = s.thumbStrip;
    const thumb = s.thumbs[state.index];
    if (!ring || !strip) return;
    ring.hidden = !thumb;
    if (!thumb) return;
    const instant = !glide || !ring.style.width;
    if (instant) ring.style.transition = "none";
    const left = strip.offsetLeft + strip.clientLeft;
    const top = strip.offsetTop + strip.clientTop;
    if (s.dialog.dataset.thumbnails === "side") {
      ring.style.left = `${left + thumb.offsetLeft}px`;
      ring.style.top = `${top + strip.clientHeight / 2}px`;
      ring.style.bottom = "";
    } else {
      const parent = ring.parentElement?.clientHeight ?? 0;
      ring.style.left = `${left + strip.clientWidth / 2}px`;
      ring.style.top = "";
      ring.style.bottom = `${parent - top - thumb.offsetTop - thumb.offsetHeight}px`;
    }
    ring.style.width = `${thumb.offsetWidth}px`;
    ring.style.height = `${thumb.offsetHeight}px`;
    if (!instant) return;
    void ring.offsetWidth;
    ring.style.removeProperty("transition");
  }

  // A drag on the strip swaps the photo in place as each thumbnail reaches the ring, without
  // paging, and the full files wait until the strip settles.
  function scrubTo(s: Session, index: number) {
    if (session !== s || state.isClosing || index === state.index) return;
    s.scrubbing = true;
    finishFade(s, true);
    clearStands(s);
    s.centeredThumb = index;
    quietly(() => {
      activeChanged(s, index, false);
      s.carousel.goTo(index, "instant");
    });
    trimSlides(s);
  }

  function scrubNow(s: Session, ended = false) {
    const strip = s.thumbStrip;
    if (s.scrubFrame !== undefined)
      s.dialog.ownerDocument.defaultView?.cancelAnimationFrame(s.scrubFrame);
    s.scrubFrame = undefined;
    if (strip && (ended || s.stripInput)) scrubTo(s, thumbUnderRing(s, strip));
  }

  // The photo the strip landed on is reported once, and focus and the tab stop follow it.
  function endScrub(s: Session) {
    clearTimeout(s.scrubTimer);
    if (s.scrubFrame !== undefined) scrubNow(s, true);
    if (!s.scrubbing) return;
    s.scrubbing = false;
    if (session !== s) return;
    if (!state.isClosing && s.reported !== state.index)
      announce(s, state.index);
    rove(s, state.index);
    const thumb = s.thumbs[state.index];
    const active = s.dialog.ownerDocument.activeElement;
    if (thumb && active !== thumb && s.thumbStrip?.contains(active))
      thumb.focus({ preventScroll: true, focusVisible: false });
    startLoads(s);
  }

  function thumbCenters(s: Session, strip: HTMLElement, side: boolean) {
    if (s.thumbCenters) return s.thumbCenters;
    const box = strip.getBoundingClientRect();
    const scrolled = side ? strip.scrollTop : strip.scrollLeft;
    s.thumbCenters = s.thumbs.map((thumb) => {
      const rect = thumb.getBoundingClientRect();
      return (
        scrolled +
        (side
          ? rect.top + rect.height / 2 - box.top
          : rect.left + rect.width / 2 - box.left)
      );
    });
    return s.thumbCenters;
  }

  // Walks from the current thumbnail toward the ring over positions read once per layout, so a
  // frame of scrolling reads only the strip's scroll offset.
  function thumbUnderRing(s: Session, strip: HTMLElement) {
    const side = s.dialog.dataset.thumbnails === "side";
    const centers = thumbCenters(s, strip, side);
    const middle = side
      ? strip.scrollTop + strip.clientHeight / 2
      : strip.scrollLeft + strip.clientWidth / 2;
    const away = (index: number) =>
      index in centers
        ? Math.abs(centers[index] - middle)
        : Number.POSITIVE_INFINITY;
    let index = state.index;
    let distance = away(index);
    for (const step of [1, -1]) {
      while (away(index + step) < distance) {
        index += step;
        distance = away(index);
      }
    }
    return index;
  }

  function teardown(s: Session) {
    if (session === s) {
      session = undefined;
      configure();
    }
    s.abort.abort();
    clearTimeout(s.wheelTimer);
    clearTimeout(s.sharpTimer);
    clearTimeout(s.chromeTimer);
    clearTimeout(s.tapTimer);
    clearTimeout(s.scrubTimer);
    const win = s.dialog.ownerDocument.defaultView;
    if (s.scrubFrame !== undefined) win?.cancelAnimationFrame(s.scrubFrame);
    if (s.motion) win?.cancelAnimationFrame(s.motion.frame);
    s.motion = undefined;
    if (s.resizeFrame !== undefined) win?.cancelAnimationFrame(s.resizeFrame);
    s.resizeFrame = undefined;
    finishFade(s, false);
    clearStands(s);
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
    const active = s.dialog.ownerDocument.activeElement;
    if (
      s.releasedFocus === undefined ||
      active === s.releasedFocus ||
      active === s.dialog.ownerDocument.body
    )
      returnFocus(s);
    if (listAfterClose) {
      ({ items, sources } = listAfterClose);
      listAfterClose = undefined;
      updateState({ count: items.length, index: lastIndex() });
    }
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
    if (nextScale > 1 && state.zoom.scale <= 1)
      quietly(() => s.carousel.goTo(state.index, "instant"));
    const animated = notify && Math.abs(nextScale - state.zoom.scale) > 0.001;
    if (animated && s.animations.size > 0 && !s.zoomMotion)
      interruptImageMotion(s);
    if (!animated) freezeZoom(s);
    const zoom = bound(s, zoomAround(state.zoom, nextScale, focus));
    const frame = s.loaded.get(state.index)?.frame;
    if (frame && animated) {
      frame.style.clipPath = "";
      frame.style.opacity = "";
    }
    moveZoom(s, zoom, animated ? zoomDuration(s) : 0, s.timing.ease);
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
      bound(s, { ...state.zoom, x: state.zoom.x + dx, y: state.zoom.y + dy }),
      nudgeDuration(s),
      ZOOM_EASE,
    );
    publish({});
  }

  function keepLaps(s: Session, slides: readonly HTMLElement[]) {
    carouselInternalsOf(s.carousel)?.keepLaps(slides);
  }

  function clearStands(s: Session) {
    const stands = s.stands;
    if (!stands) return;
    s.stands = undefined;
    keepLaps(s, []);
    for (const [slide, transform] of stands.moved)
      slide.style.transform = transform;
    for (const [slide, visibility] of stands.hidden)
      slide.style.visibility = visibility;
  }

  // A distant photo pages in like the next one: the slides on screen keep their place while the
  // strip jumps to the slot beside the photo, then the strip moves one slide with the usual
  // spring. Without that slot it fades.
  function slideTo(s: Session, from: number, target: number, forward: boolean) {
    const side = forward ? -1 : 1;
    const beside =
      looping() && s.carousel.getState().isLooping
        ? wrap(target + side)
        : target + side;
    if (
      prefersReducedMotion(s) ||
      beside < 0 ||
      beside >= items.length ||
      !s.box.width
    ) {
      fadeTo(s, target);
      return;
    }
    const port = s.viewport.getBoundingClientRect();
    const shown = new Map<HTMLElement, number>();
    const candidates = new Set([
      ...(s.stands?.moved.keys() ?? []),
      ...visibleRange(s).map((index) => s.slides[index]),
    ]);
    for (const slide of candidates) {
      if (s.stands?.hidden.has(slide)) continue;
      const rect = slide.getBoundingClientRect();
      if (rect.right > port.left + 1 && rect.left < port.right - 1)
        shown.set(slide, rect.left);
    }
    const anchor = s.slides[from];
    const anchorLeft = shown.get(anchor) ?? port.left;
    const moved = new Map(s.stands?.moved);
    const hidden = new Map(s.stands?.hidden);
    clearStands(s);
    s.carousel.goTo(beside, "instant");
    if (Math.abs(anchorLeft - port.left) > 0.5)
      s.viewport.scrollLeft -= anchorLeft - port.left;
    const arriving = s.slides[target].getBoundingClientRect();
    const stands: NonNullable<Session["stands"]> = {
      moved: new Map(),
      hidden: new Map(),
    };
    const covered: DOMRect[] = [];
    for (const [slide, left] of shown) {
      if (slide === s.slides[target]) continue;
      if (
        Math.abs(left - arriving.left) < arriving.width - 1 &&
        slide !== anchor
      )
        continue;
      const transform = moved.get(slide) ?? slide.style.transform;
      const natural = slide.getBoundingClientRect().left;
      if (Math.abs(left - natural) > 0.5) {
        stands.moved.set(slide, transform);
        slide.style.transform = `translateX(${left - natural}px) ${transform}`;
      }
      covered.push(slide.getBoundingClientRect());
    }
    for (const index of visibleRange(s)) {
      const slide = s.slides[index];
      if (index === target || shown.has(slide)) continue;
      const rect = slide.getBoundingClientRect();
      if (
        !covered.some(
          (cover) => rect.right > cover.left + 1 && rect.left < cover.right - 1,
        )
      )
        continue;
      stands.hidden.set(slide, hidden.get(slide) ?? slide.style.visibility);
      slide.style.visibility = "hidden";
    }
    if (stands.moved.size || stands.hidden.size) {
      s.stands = stands;
      keepLaps(s, [...stands.moved.keys()]);
    }
    s.carousel[forward ? "next" : "prev"]();
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
        quietly(() => s.carousel.goTo(target, "instant"));
        trimSlides(s);
      },
    };
    const duration = s.timing.fade;
    if (
      prefersReducedMotion(s) ||
      duration <= 0 ||
      typeof s.viewport.animate !== "function"
    ) {
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
    const from = state.index;
    const paged = far || (s.stands !== undefined && target !== from);
    quietly(() => {
      if (paged) s.leaving = from;
      activeChanged(s, target);
      // A change listener that paged on owns the strip now.
      if (session !== s || state.index !== target) {
        s.leaving = undefined;
        return;
      }
      if (paged) {
        slideTo(s, from, target, direction ? direction > 0 : target > from);
        s.leaving = undefined;
        trimSlides(s);
      } else if (direction && looping() && s.carousel.getState().isLooping)
        s.carousel[direction > 0 ? "next" : "prev"]();
      else s.carousel.goTo(target, "smooth");
    });
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
          zoom: bound(s, {
            scale: Math.max(1, scale),
            x: matrix.e,
            y: matrix.f,
          }),
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
    const viewport = view(s);
    const reduced = prefersReducedMotion(s);
    let target: Zoom;
    if (scale < min)
      target = bound(s, zoomAround(state.zoom, min, gesture.focus));
    else if (scale > max)
      target = bound(s, zoomAround(state.zoom, max, gesture.focus));
    else {
      const speed =
        pinch || reduced || event.type !== "pointerup" || gesture.axis === "x"
          ? { x: 0, y: 0 }
          : releaseVelocity(gesture.samples, event.timeStamp, {
              x: event.clientX,
              y: event.clientY,
            });
      target = bound(s, {
        scale,
        x: state.zoom.x + speed.x * GLIDE_TIME,
        y: state.zoom.y + speed.y * GLIDE_TIME,
      });
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
      const range = panRange(scale, fit(state.index, s), area(s, scale)).x;
      if (pinched) s.pinned = undefined;
      else if (gesture.moved)
        s.pinned = {
          index: state.index,
          zoom: target,
          left: target.x >= range.max - 0.5,
          right: target.x <= range.min + 0.5,
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
      const range = panRange(
        state.zoom.scale,
        fit(state.index, s),
        area(s, state.zoom.scale),
      );
      const middle = points.length > 1 ? midpoint(points) : points[0];
      s.gesture = {
        start: points[0],
        zoom: { ...state.zoom },
        raw: {
          x: unrubber(state.zoom.x, range.x),
          y: unrubber(state.zoom.y, range.y),
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
    s.viewport.addEventListener(
      "pointerdown",
      (event) => {
        if (
          event.button !== 0 ||
          state.isClosing ||
          // A dismiss swipe stays with its finger.
          s.gesture?.axis === "y" ||
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
        if (!s.pointers.size) measure(s);
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
            const range = panRange(
              gesture.zoom.scale,
              fit(state.index, s),
              view(s),
            ).y;
            gesture.axis =
              Math.abs(dy) <= Math.abs(dx)
                ? "x"
                : range.max - range.min > 1 &&
                    !(dy > 0 && gesture.zoom.y >= range.max - 0.5)
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
                area(s, gesture.zoom.scale),
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
      lift(event);
      if (session === s && !s.flying && !state.isClosing && !s.pointers.size)
        swapHeld(s);
    };
    const lift = (event: PointerEvent) => {
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
        if (
          !onPhoto &&
          (overThumbnails(s, current.x, current.y) ||
            inRoom(s, current.x, current.y))
        )
          return;
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
          isElement(event.target) &&
          event.target.matches(".re-lightbox-image")
        )
          event.preventDefault();
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
        // A pan captures the pointer, which retargets its click to the viewport.
        const box = s.loaded.get(state.index)?.frame.getBoundingClientRect();
        const onPhoto =
          target.closest(".re-lightbox-frame") !== null ||
          (box !== undefined &&
            event.clientX >= box.left &&
            event.clientX <= box.right &&
            event.clientY >= box.top &&
            event.clientY <= box.bottom);
        if (!onPhoto) {
          if (
            !overThumbnails(s, event.clientX, event.clientY) &&
            !inRoom(s, event.clientX, event.clientY)
          )
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
            zoom: bound(s, {
              ...state.zoom,
              x: state.zoom.x - event.deltaX * unit,
              y: state.zoom.y - event.deltaY * unit,
            }),
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
        measure(s);
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

  function connect(viewport: HTMLDivElement, strings: LightboxStrings) {
    const carousel = createCarousel(viewport, {
      drag: true,
      loop: looping(),
      strings: { carouselRole: strings.carouselRole },
    });
    carousel.subscribe((value) => {
      if (
        !syncingCarousel &&
        session?.viewport === viewport &&
        session.resizeFrame === undefined
      )
        activeChanged(session, value.index);
    });
    carouselInternalsOf(carousel)?.silence();
    return carousel;
  }

  function ownsHistory(win: Window) {
    return entryOf(win) === historyId;
  }

  function pushHistory(win: Window) {
    const current: unknown = win.history.state;
    const mode = holdScroll(win);
    win.history.pushState(
      {
        ...(typeof current === "object" && current !== null ? current : {}),
        [HISTORY_KEY]: historyId,
      },
      "",
      win.location.href,
    );
    win.history.scrollRestoration = mode;
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
    if (!ownsHistory(win)) orphan(win, historyId);
    if (!ownsHistory(win) && !historyBacks.has(win)) releaseScroll(win);
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
      if (
        session &&
        !state.isClosing &&
        !ownsHistory(win) &&
        !historyBacks.has(win)
      )
        pushHistory(win);
      return;
    }
    if (ownsHistory(win)) return;
    if (takeOrphan(win)) void goBack(win);
    else releaseScroll(win);
    if (session && !state.isClosing) void closeSession(true);
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
    const layout =
      settings.thumbnailsVisible === false
        ? undefined
        : side
          ? "side"
          : "bottom";
    if (s.dialog.dataset.thumbnails === layout) return;
    endScrub(s);
    s.thumbCarousel?.destroy();
    s.thumbCarousel = undefined;
    s.chromeRoots = s.chromeRoots.filter((root) => root !== strip);

    if (!layout) {
      if (strip.contains(strip.ownerDocument.activeElement)) {
        s.viewport.focus({ preventScroll: true });
      }
      strip.remove();
      s.thumbRing?.remove();
      delete s.dialog.dataset.thumbnails;
      return;
    }

    s.dialog.dataset.thumbnails = layout;
    if (side) {
      s.stage.append(strip);
      s.chromeRoots.push(strip);
    } else {
      s.footer.append(strip);
      strip.tabIndex = -1;
      s.thumbCarousel = createCarousel(strip, { drag: true, align: "center" });
      const internals = carouselInternalsOf(s.thumbCarousel);
      internals?.silence();
      internals?.passClicks();
    }
    if (s.thumbRing) strip.after(s.thumbRing);
    s.thumbCenters = undefined;
    s.centeredThumb = -1;
    centerThumb(s);
    ringThumb(s, false);
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
        if (s.fullscreenButton)
          showStateIcon(
            s.fullscreenButton,
            "fullscreen",
            "fullscreenExit",
            full,
          );
        if (full) s.dialog.dataset.fullscreen = "";
        else delete s.dialog.dataset.fullscreen;
      },
      { signal },
    );
    doc.addEventListener("visibilitychange", () => scheduleSlideshow(s), {
      signal,
    });
    for (const type of ["play", "pause", "ended"])
      s.viewport.addEventListener(
        type,
        (event) => {
          holdForMedia(s);
          const player = s.loaded
            .get(state.index)
            ?.media?.holder?.querySelector("video, audio");
          if (
            type === "ended" &&
            event.target === player &&
            s.slideshow &&
            slideshowRuns(s)
          )
            advanceSlideshow(s);
        },
        { signal, capture: true },
      );
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
        s.stripInput = false;
        const count = s.thumbs.length;
        const index = looping()
          ? (to + count) % count
          : clamp(to, 0, count - 1);
        rove(s, index);
        goTo(index);
        s.thumbs[index].focus({ preventScroll: true });
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
    const pressed = () => {
      s.stripInput = true;
    };
    strip.addEventListener("pointerdown", pressed, { signal });
    strip.addEventListener("wheel", pressed, { signal, passive: true });
    strip.addEventListener("re-carousel:settle", () => endScrub(s), { signal });
    strip.addEventListener(
      "scroll",
      () => {
        if (!s.stripInput) return;
        s.scrubFrame ??= win?.requestAnimationFrame(() => {
          s.scrubFrame = undefined;
          scrubNow(s);
        });
        clearTimeout(s.scrubTimer);
        s.scrubTimer = setTimeout(() => endScrub(s), 180);
      },
      { signal, passive: true },
    );
    if (settings.thumbnails === "side")
      win
        ?.matchMedia?.("(max-width: 719.98px)")
        .addEventListener("change", () => placeThumbs(s), { signal });
  }

  // New strings reach every label at once; the live region keeps its last announcement.
  function relabel(s: Session) {
    const strings = { ...defaultStrings, ...settings.strings };
    s.strings = strings;
    const doc = s.dialog.ownerDocument;
    const name = (selector: string, label: string) =>
      s.stage.querySelector(selector)?.setAttribute("aria-label", label);
    s.dialog.setAttribute("aria-label", strings.dialog);
    s.viewport.setAttribute("aria-label", strings.dialog);
    s.carousel.setOptions({ strings: { carouselRole: strings.carouselRole } });
    name(".re-lightbox-close", strings.close);
    name(".re-lightbox-prev", strings.previous);
    name(".re-lightbox-next", strings.next);
    name(".re-lightbox-download", strings.download);
    name(
      ".re-lightbox-fullscreen",
      doc.fullscreenElement === s.stage
        ? strings.fullscreenExit
        : strings.fullscreenEnter,
    );
    name(
      ".re-lightbox-slideshow",
      s.slideshow ? strings.slideshowStop : strings.slideshowStart,
    );
    s.thumbStrip?.setAttribute("aria-label", strings.thumbnails);
    for (const [index, thumb] of s.thumbs.entries())
      thumb.setAttribute("aria-label", strings.thumbnail(index, items.length));
    for (const node of s.stage.querySelectorAll(".re-lightbox-loading"))
      node.setAttribute("aria-label", strings.loading);
    for (const node of s.stage.querySelectorAll(".re-lightbox-error p"))
      node.textContent = strings.error;
    for (const node of s.stage.querySelectorAll(".re-lightbox-retry"))
      node.textContent = strings.retry;
    s.marked = undefined;
    update(s);
  }

  function mountSlots(
    s: Session,
    places: Record<LightboxSlotName, (node: Node) => void>,
  ) {
    const doc = s.dialog.ownerDocument;
    for (const name of Object.keys(places) as LightboxSlotName[]) {
      const slot = settings.slots?.[name];
      if (!slot) continue;
      const instance = slot({
        lightbox: controller,
        document: doc,
        icon: (name) => {
          const own =
            settings.icons?.[name]?.() ??
            (firstStateIcon[name]
              ? settings.icons?.[firstStateIcon[name]]?.()
              : undefined);
          if (own) {
            if (
              (name === "previous" || name === "next") &&
              own instanceof Element
            )
              own.classList.add("re-lightbox-arrow-icon");
            return own;
          }
          const holder = doc.createElement("span");
          showIcon(holder, builtInIcons[name]);
          return holder.firstElementChild as Node;
        },
        counter: () => {
          const counter = counterNode(doc);
          counter.hidden = items.length < 2;
          s.counters.push(counter);
          drawCounter(
            s,
            counter,
            s.strings.counter(state.index, items.length),
            0,
          );
          return counter;
        },
      });
      places[name](instance.node);
      s.slots.push(instance as ReturnType<LightboxSlot>);
      instance.update?.(state);
    }
  }

  function open(input: readonly Item[], index = 0) {
    const before = session;
    try {
      openSession(input, index);
    } catch (error) {
      const s = session;
      if (s && s !== before) {
        // The same callback may throw again while focus returns; the first error is the one to report.
        try {
          teardown(s);
        } catch {}
        publish({
          isOpen: false,
          isClosing: false,
          isAnimating: false,
          zoom: { ...identity },
        });
        void leaveHistory();
      }
      throw error;
    }
  }

  function openSession(input: readonly Item[], index: number) {
    if (destroyed) throw new Error("This lightbox has been destroyed.");
    const nextItems = validateItems(input, current.content);
    if (!Number.isFinite(index))
      throw new TypeError("Image index must be finite.");
    const layer = galleryOptions;
    const doc =
      current.container?.ownerDocument ??
      resolveOrigin(
        nextItems[clamp(Math.floor(index), 0, nextItems.length - 1)].origin,
      )?.ownerDocument ??
      (typeof document === "undefined" ? undefined : document);
    if (!doc?.body)
      throw new Error("Opening a lightbox needs a browser document.");
    pendingClosed?.();
    if (session) {
      teardown(session);
      emit("closed", null);
    }
    if (destroyed) return;
    configure(layer);
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
    dialog.setAttribute("aria-label", strings.dialog);
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
    viewport.setAttribute("aria-label", strings.dialog);
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
    const paddingProbe = doc.createElement("div");
    paddingProbe.setAttribute("aria-hidden", "true");
    paddingProbe.style.cssText =
      "position:absolute;left:0;top:0;width:0;height:var(--re-lightbox-bottom-room, 0px);visibility:hidden;pointer-events:none;padding-left:var(--re-lightbox-padding, 32px)";
    stage.append(backdrop, viewport, toolbar, paddingProbe);
    const abort = new AbortController();
    const button = <K extends "button" | "a">(
      tag: K,
      name: LightboxIcon,
      label: string,
      action: (() => void) | undefined,
      parent: HTMLElement,
    ) => {
      const element = doc.createElement(tag);
      if (tag === "button") element.setAttribute("type", "button");
      element.className = `re-lightbox-button re-lightbox-${name === "previous" ? "prev" : name}`;
      element.setAttribute("aria-label", label);
      showControlIcon(element, name);
      if (action)
        element.addEventListener("click", action, { signal: abort.signal });
      parent.append(element);
      return element;
    };
    let counter: HTMLSpanElement | undefined;
    if (control("counter")) {
      counter = counterNode(doc);
      toolbarStart.append(counter);
    }
    const zoomButton = control("zoom")
      ? button("button", "zoom", strings.zoomIn, () => toggleZoom(), toolbarEnd)
      : undefined;
    const slideshowButton = control("slideshow")
      ? button(
          "button",
          "slideshow",
          strings.slideshowStart,
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
            () => {
              if (doc.fullscreenElement === stage)
                void doc.exitFullscreen().catch(() => {});
              else void stage.requestFullscreen().catch(() => {});
            },
            toolbarEnd,
          )
        : undefined;
    const download = control("download")
      ? button("a", "download", strings.download, undefined, toolbarEnd)
      : undefined;
    download?.setAttribute("download", "");
    download?.setAttribute("rel", "noopener");
    // Browsers ignore the download attribute across origins, also after a same-origin URL
    // redirects to another one, and navigate the tab instead, and block a popup opened after
    // an await, so every web file is fetched before the click.
    let fetched:
      | {
          href: string;
          blob?: Blob;
          name?: string;
          failed?: boolean;
          wanted?: boolean;
        }
      | undefined;
    const native = () =>
      !download ||
      download.protocol === "data:" ||
      download.protocol === "blob:";
    const save = (blob: Blob, pathname: string, named?: string) => {
      const link = doc.createElement("a");
      link.href = URL.createObjectURL(blob);
      const name = pathname.split("/").pop() ?? "";
      try {
        link.download = named ?? decodeURIComponent(name);
      } catch {
        link.download = name;
      }
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 60_000);
    };
    const prefetch = () => {
      if (!download || native() || fetched?.href === download.href) return;
      const { href, pathname } = download;
      const entry: NonNullable<typeof fetched> = { href };
      fetched = entry;
      fetch(href)
        .then((response) => {
          if (!response.ok) return Promise.reject();
          entry.name = dispositionName(
            response.headers.get("content-disposition"),
          );
          return response.blob();
        })
        .then(
          (blob) => {
            entry.blob = blob;
            if (entry.wanted) save(blob, pathname, entry.name);
            entry.wanted = false;
          },
          () => {
            entry.failed = true;
            if (entry.wanted) doc.defaultView?.open(href, "_blank", "noopener");
            entry.wanted = false;
          },
        );
    };
    download?.addEventListener("pointerdown", prefetch, {
      signal: abort.signal,
    });
    download?.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Enter" || event.key === " ") prefetch();
      },
      { signal: abort.signal },
    );
    download?.addEventListener(
      "click",
      (event) => {
        download.removeAttribute("target");
        if (
          native() ||
          event.button ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        prefetch();
        const entry = fetched;
        if (!entry) return;
        if (entry.failed) {
          download.target = "_blank";
          return;
        }
        event.preventDefault();
        if (entry.blob) save(entry.blob, download.pathname, entry.name);
        else entry.wanted = true;
      },
      { signal: abort.signal },
    );
    const closeButton = control("close")
      ? button("button", "close", strings.close, () => void close(), toolbarEnd)
      : undefined;
    if (closeButton) closeButton.autofocus = true;
    const prev = control("arrows")
      ? button("button", "previous", strings.previous, () => step(-1), stage)
      : undefined;
    const next = control("arrows")
      ? button("button", "next", strings.next, () => step(1), stage)
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
    let thumbRing: HTMLSpanElement | undefined;
    if (settings.thumbnails) {
      thumbStrip = doc.createElement("div");
      thumbStrip.className = "re-lightbox-thumbnails";
      thumbStrip.setAttribute("role", "group");
      thumbStrip.setAttribute("aria-label", strings.thumbnails);
      thumbRing = doc.createElement("span");
      thumbRing.className = "re-lightbox-thumbnail-ring";
      thumbRing.setAttribute("aria-hidden", "true");
      thumbRing.hidden = true;
    }
    const makeThumbs = (labels: LightboxStrings) => {
      if (!thumbStrip) return;
      thumbs.length = 0;
      thumbStrip.replaceChildren(
        ...items.map((item, i) => {
          const thumb = doc.createElement("button");
          thumb.type = "button";
          thumb.tabIndex = -1;
          if (item.width && item.height)
            thumb.style.aspectRatio =
              item.width > MAX_THUMB_RATIO * item.height
                ? String(MAX_THUMB_RATIO)
                : `${item.width} / ${item.height}`;
          thumb.setAttribute("aria-label", labels.thumbnail(i, items.length));
          const thumbnailSrc = item.thumbnailSrc || item.previewSrc;
          if (thumbnailSrc) {
            const image = doc.createElement("img");
            image.src = thumbnailSrc;
            image.alt = "";
            image.loading = "lazy";
            thumb.append(image);
          } else thumb.textContent = String(i + 1);
          thumb.addEventListener(
            "click",
            () => {
              if (session) session.stripInput = false;
              if (i === state.index) session?.thumbCarousel?.goTo(i, "smooth");
              goTo(i);
            },
            {
              signal: abort.signal,
            },
          );
          thumbs.push(thumb);
          return thumb;
        }),
      );
    };
    makeThumbs(strings);
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
      carousel: connect(viewport, strings),
      heading: 1,
      strings,
      slots: [],
      footer,
      thumbStrip,
      thumbRing,
      roving: -1,
      centeredThumb: -1,
      stripInput: false,
      scrubbing: false,
      reported: -1,
      pauses: new Set(["phase"]),
      abort,
      animations: new Set(),
      finishAnimations: new Set(),
      previousFocus,
      restoreScroll,
      phase: "entering",
      timing: {
        open: OPEN_DURATION,
        close: CLOSE_DURATION,
        zoom: ZOOM_DURATION,
        fade: FADE_DURATION,
        ease: FLIGHT_EASE,
      },
      chrome: initialChrome(false),
      chromeRoots: [toolbar, footer, ...(prev && next ? [prev, next] : [])],
      openingFocus: closeButton ?? viewport,
      zoomed: false,
      counters: counter ? [counter] : [],
      counterText: "",
      status,
      caption,
      captionText: "",
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
      paddingProbe,
      box: { left: 0, top: 0, width: 1, height: 1 },
      area: { width: 1, height: 1 },
      inset: { left: 0, right: 0, bottom: 0 },
      room: { left: 0, right: 0, bottom: 0 },
      suppressClickUntil: 0,
      paged: false,
      flying: true,
      watchedScale: 1,
      sharpScale: 1,
      autoplay:
        settings.autoplayMedia !== false &&
        (doc.defaultView?.navigator.userActivation?.isActive ?? true),
    };
    measure(s);
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
    measure(s);
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
        if (session !== s || s.phase === "closing") return;
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
    viewport.addEventListener(
      "pointerdown",
      () => {
        if (!s.stands) return;
        clearStands(s);
        quietly(() => s.carousel.goTo(state.index, "instant"));
      },
      { signal: abort.signal, capture: true },
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
      if (!Number.isNaN(motion.left) && left !== motion.left)
        motion.moved = true;
      motion.left = left;
      if ((motion.still >= 3 && isSettled(s)) || motion.still >= 30) {
        s.motion = undefined;
        clearStands(s);
        trimSlides(s);
        syncAnimating(s);
        const moved = motion.moved || s.paged;
        s.paged = false;
        if (moved) emit("settle", s);
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
          moved: false,
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
    const opening = closeButton ?? viewport;
    // window.event is the click or tap that called open(); a key's click has detail 0.
    const opener = win?.event;
    const pointerOpen =
      opener !== undefined &&
      (/^(pointer|touch|mouse)/.test(opener.type) ||
        (opener.type === "click" && (opener as MouseEvent).detail > 0));
    opening.focus(
      pointerOpen
        ? { preventScroll: true, focusVisible: false }
        : { preventScroll: true },
    );
    if (pointerOpen && matches(opening, ":focus-visible")) quietFocus(opening);
    watchControls(s);
    readTiming(s);
    void win?.getComputedStyle(toolbar).opacity;
    setPhase(s, "opening");
    applyChrome(
      s,
      initialChrome(Boolean(win?.matchMedia?.("(hover: hover)").matches)),
    );
    s.reported = state.index;
    emit("open", s);
    void flight(s, false).then(() => {
      if (session !== s || state.isClosing) return;
      s.flying = false;
      swapHeld(s);
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

  // The stage keeps its open size, so a page scrollbar that returns does not reflow the viewer,
  // and the dialog clips it to the page's new client size, which WebKit's dialog box lags behind.
  function pinToPage(s: Session, open: DOMRect) {
    const win = s.dialog.ownerDocument.defaultView;
    if (!win) return;
    const root = s.dialog.ownerDocument.documentElement;
    Object.assign(s.stage.style, {
      right: "auto",
      bottom: "auto",
      width: `${open.width}px`,
      height: `${open.height}px`,
    });
    Object.assign(s.dialog.style, {
      position: "absolute",
      inset: "auto",
      top: `${open.top + win.scrollY}px`,
      left: `${open.left + win.scrollX}px`,
      width: `${Math.min(open.width, root.clientWidth)}px`,
      height: `${Math.min(open.height, root.clientHeight)}px`,
    });
  }

  // A modal dialog keeps the page inert, so the close flight moves to a manual popover: still
  // above the page, but wheel, touch and clicks pass through to it.
  function releasePage(s: Session) {
    const dialog = s.dialog;
    if (typeof dialog.showPopover !== "function") return;
    dialog.inert = true;
    dialog.close();
    dialog.style.display = "block";
    dialog.popover = "manual";
    dialog.showPopover();
    s.releasedFocus = dialog.ownerDocument.activeElement;
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

  function closeSession(fromHistory: boolean, force = false): Promise<void> {
    const s = session;
    if (!s) return closePromise ?? Promise.resolve();
    if (closePromise) return closePromise;
    if (vetting) {
      forcing ||= force;
      return Promise.resolve();
    }
    vetting = true;
    forcing = force;
    let prevented: boolean;
    try {
      prevented = emit("beforeclose", s, { cancelable: !force }) && !forcing;
    } finally {
      vetting = false;
      forcing = false;
    }
    if (prevented) {
      if (fromHistory && historyWindow) pushHistory(historyWindow);
      return Promise.resolve();
    }
    if (session !== s || closePromise) return closePromise ?? Promise.resolve();
    const landing = s.phase !== "entering" && s.phase !== "opening";
    if (fromHistory) s.input = "pointer";
    cancelAnimations(s);
    clearStands(s);
    clearTimeout(s.tapTimer);
    s.tapTimer = undefined;
    s.pointers.clear();
    s.gesture = undefined;
    delete s.dialog.dataset.panning;
    // beforeclose may have rendered the tile again.
    hideOrigin(s);
    chromeInput(s, { type: "close" });
    publish({ isClosing: true });
    leaveFullscreen(s);
    for (const entry of s.loaded.values()) entry.media?.mounted?.pause?.();
    s.dialog.style.removeProperty("--re-lightbox-chrome-opacity");
    setPhase(s, "closing");
    const open = s.dialog.getBoundingClientRect();
    s.restoreScroll();
    pinToPage(s, open);
    releasePage(s);
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

  function setItems(input: readonly Item[], index?: number) {
    if (destroyed) throw new Error("This lightbox has been destroyed.");
    const nextItems = input.length
      ? validateItems(input, (session ? settings : current).content)
      : [];
    if (index !== undefined && !Number.isFinite(index))
      throw new TypeError("Image index must be finite.");
    const s = session;
    if (!s) {
      items = nextItems;
      sources = [...input];
      publish({ count: items.length, index: lastIndex() });
      return;
    }
    if (state.isClosing || !nextItems.length) {
      listAfterClose = { items: nextItems, sources: [...input] };
      if (!state.isClosing) void closeSession(false, true);
      if (!state.isClosing && !forcing && session === s)
        listAfterClose = undefined;
      return;
    }
    finishFade(s, true);
    clearStands(s);
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
    if ((!kept || target !== state.index) && !notifyBeforeChange(s, target))
      return;
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
    s.makeThumbs(s.strings);
    s.thumbCenters = undefined;
    s.roving = -1;
    s.thumbCarousel?.refresh();
    s.centeredThumb = Number.NaN;
    placeAside(s, true);
    const changed = target !== state.index;
    const looped = s.carousel.getState().isLooping;
    if ((changed || !kept || looped) && state.zoom.scale > 1) {
      updateState({ zoom: restZoom(s, target) });
      applyZoom(s);
    } else if (changed || !kept) updateState({ zoom: restZoom(s, target) });
    quietly(() => {
      s.carousel.refresh();
      s.carousel.setOptions({ loop: looping() });
      if (!kept || looped !== s.carousel.getState().isLooping)
        s.carousel.goTo(target, "instant");
    });
    publish({ index: target, count: items.length });
    update(s);
    s.reported = target;
    if (!kept) arrived(s, target);
    else if (changed) emit("change", s);
  }

  const controller: Lightbox<Item> = {
    open,
    close,
    next: () => step(1),
    prev: () => step(-1),
    goTo,
    zoomTo,
    toggleZoom,
    play: () => {
      if (session && !state.isClosing && items.length > 1)
        toggleSlideshow(session, true);
    },
    pause: () => {
      if (session) toggleSlideshow(session, false);
    },
    getState: () => notifiedState,
    subscribe: (listener, { signal } = {}) =>
      listen(listeners, listener, stops, signal),
    on: (type, listener, { signal } = {}) => {
      const set = handlers.get(type) ?? new Set();
      handlers.set(type, set);
      return listen(
        set,
        listener as (event: LightboxCancelableEvent) => void,
        stops,
        signal,
      );
    },
    append: (input) =>
      setItems([...(listAfterClose?.sources ?? sources), ...input]),
    setItems,
    setOptions: (next) => {
      for (const key of Object.keys(next) as (keyof typeof next)[])
        if ((key as string) !== "container")
          Object.assign(current, { [key]: next[key] });
      const s = session;
      if ("strings" in next) {
        settings.strings = next.strings;
        if (s) relabel(s);
      }
      if (
        "thumbnailsVisible" in next &&
        settings.thumbnailsVisible !== next.thumbnailsVisible
      ) {
        settings.thumbnailsVisible = next.thumbnailsVisible;
        if (s?.thumbStrip && !state.isClosing) {
          placeThumbs(s);
          resized(s);
        }
      }
      if (!("loop" in next) || Boolean(next.loop) === loop) return;
      loop = Boolean(next.loop);
      publish({});
      if (!s || state.isClosing) return;
      const looped = s.carousel.getState().isLooping;
      quietly(() => {
        s.carousel.setOptions({ loop: looping() });
        s.carousel.goTo(state.index, "instant");
      });
      if (looped !== s.carousel.getState().isLooping) applyZoom(s);
      update(s);
    },
    getSlide: (index) => session?.slides[index] ?? null,
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      release();
      for (const stop of [...stops]) stop();
      listeners.clear();
      handlers.clear();
    },
  };

  function release() {
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
    else if (win) {
      orphan(win, historyId);
      if (!historyBacks.has(win)) releaseScroll(win);
    }
    win?.removeEventListener("popstate", onPopState);
    historyWindow = undefined;
  }

  const reach: LightboxInternals = {
    initial: initial as LightboxState<never>,
    release: () => {
      if (!destroyed) release();
    },
    shows: (type) =>
      Boolean(current.content?.some((module) => module.type === type)),
    destroyed: () => destroyed,
    openWith: (layer, open) => {
      galleryOptions = layer as Partial<LightboxOptions<Item>> | undefined;
      try {
        open();
      } finally {
        galleryOptions = undefined;
      }
    },
  };
  Object.defineProperty(controller, lightboxInternals, { value: reach });
  return controller;
}

function listen<T>(
  set: Set<T>,
  listener: T,
  stops: Set<() => void>,
  signal?: AbortSignal,
) {
  const stop = () => {
    set.delete(listener);
    stops.delete(stop);
    signal?.removeEventListener("abort", stop);
  };
  if (signal?.aborted) return stop;
  set.add(listener);
  stops.add(stop);
  signal?.addEventListener("abort", stop, { once: true });
  return stop;
}

function dispositionName(header: string | null) {
  if (!header) return undefined;
  const extended = /filename\*\s*=\s*utf-8'[^']*'([^;\s]+)/i.exec(header);
  if (extended)
    try {
      return decodeURIComponent(extended[1]);
    } catch {}
  const plain = /filename\s*=\s*(?:"((?:\\.|[^"\\])*)"|([^;\s]+))/i.exec(
    header,
  );
  return plain?.[1]?.replace(/\\(.)/g, "$1") || plain?.[2] || undefined;
}

function dimension(value: string | undefined) {
  const number = Number(value);
  return value && Number.isFinite(number) && number > 0 ? number : undefined;
}

/**
 * The item a gallery trigger opens: a link, a button or an img, and the img inside it. Returns
 * null when the trigger names no image file and no media type, so the page keeps its click.
 */
export function lightboxItemFromElement(
  trigger: HTMLElement,
): LightboxItem | null {
  const image =
    trigger.localName === "img"
      ? (trigger as HTMLImageElement)
      : trigger.querySelector("img");
  const base = trigger.baseURI;
  const link = trigger.closest<HTMLAnchorElement>("a[href]");
  const href = link?.getAttribute("href") || undefined;
  const data = (name: string) =>
    trigger.dataset[name] || image?.dataset[name] || undefined;
  const tile = (image && (image.currentSrc || image.src)) || undefined;
  const width = dimension(data("lightboxWidth"));
  const height = dimension(data("lightboxHeight"));
  const caption =
    trigger
      .closest("figure")
      ?.querySelector(":scope > figcaption")
      ?.textContent?.trim() ||
    data("lightboxCaption") ||
    link?.dataset.lightboxCaption;
  const alt = image
    ? image.alt
    : trigger.getAttribute("aria-label") || trigger.textContent?.trim();
  const origin = image ?? trigger;
  // Without JavaScript the link still leads to the video or the page it plays.
  const type = data("lightboxType") || link?.dataset.lightboxType;
  if (type)
    return {
      type,
      src: href || data("lightboxSrc") || tile,
      previewSrc: tile,
      width,
      height,
      alt,
      caption: caption || undefined,
      origin,
    };
  const src =
    (href && isImageFile(href, base) ? href : undefined) ||
    data("lightboxSrc") ||
    tile;
  if (!src) return null;
  const resolve = (url: string) => {
    try {
      return new URL(url, base).href;
    } catch {
      return url;
    }
  };
  const file =
    image?.naturalWidth &&
    image.naturalHeight &&
    resolve(src) === resolve(tile ?? "")
      ? fileWidth(image, image.srcset || undefined, base)
      : undefined;
  return {
    src,
    srcset: data("lightboxSrcset"),
    sizes: data("lightboxSizes"),
    previewSrc: tile,
    width: width ?? file,
    height:
      height ??
      (file && image
        ? Math.round((file * image.naturalHeight) / image.naturalWidth)
        : undefined),
    alt,
    caption: caption || undefined,
    origin,
  };
}

// Options that JSON can carry; strings only the ones that are text, not functions.
const MARKUP_OPTIONS = new Set([
  "imageClick",
  "doubleTapZoom",
  "maxZoom",
  "tapZoom",
  "preload",
  "controls",
  "thumbnails",
  "thumbnailsVisible",
  "caption",
  "slideshow",
  "autoHide",
  "className",
  "autoplayMedia",
  "loop",
  "history",
  "strings",
  "protect",
]);

function markupOptions(root: HTMLElement) {
  const text = root.dataset.lightboxOptions;
  if (text === undefined) return undefined;
  const name = [
    root.localName,
    root.id && `#${root.id}`,
    ...[...root.classList].map((name) => `.${name}`),
  ].join("");
  const fail = (reason: string): never => {
    throw new TypeError(`Invalid data-lightbox-options on ${name}: ${reason}`);
  };
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    fail((error as Error).message);
  }
  if (typeof value !== "object" || value === null || Array.isArray(value))
    fail("expected a JSON object");
  const options = value as Record<string, unknown>;
  for (const key of Object.keys(options))
    if (!MARKUP_OPTIONS.has(key)) fail(`${key} cannot be set in markup`);
  const strings = options.strings;
  if (
    strings !== undefined &&
    (typeof strings !== "object" || strings === null || Array.isArray(strings))
  )
    fail("strings must be an object");
  if (strings)
    for (const [key, text] of Object.entries(strings))
      if (
        typeof text !== "string" ||
        typeof defaultStrings[key as keyof LightboxStrings] !== "string"
      )
        fail(`strings.${key} must be one of the text strings`);
  return options as Partial<LightboxOptions>;
}

const DEFAULT_TRIGGERS =
  "a[href]:not([download]):is(:has(img), [data-lightbox-type], [data-lightbox-src]), button, img:not(a[download] img)";

export interface LightboxGalleryOptions<
  Item extends LightboxItem = LightboxItem,
> {
  /** The triggers inside root; by default buttons, images and links that hold an img or carry data-lightbox-type or data-lightbox-src, never a[download]. A trigger inside another counts as the outer one. */
  selector?: string;
  /** The item a trigger opens, lightboxItemFromElement by default; null leaves the trigger's click to the page. */
  item?: (trigger: HTMLElement) => Item | null;
  /** Triggers open only with the triggers of the same group, the closest data-lightbox-group by default. */
  group?: (trigger: HTMLElement) => string;
}

/** Opens the triggers inside root in the lightbox on a plain click, and returns the function that unbinds. */
export function bindLightboxGallery<Item extends LightboxItem = LightboxItem>(
  root: HTMLElement,
  lightbox: Lightbox<Item>,
  options: LightboxGalleryOptions<Item> = {},
): () => void {
  const reach = internalsOf(lightbox);
  if (!reach)
    throw new TypeError(
      "bindLightboxGallery needs a lightbox from createLightbox() as its second argument.",
    );
  const markup = markupOptions(root);
  const selector = options.selector ?? DEFAULT_TRIGGERS;
  const read =
    options.item ??
    (lightboxItemFromElement as (trigger: HTMLElement) => Item | null);
  const group =
    options.group ??
    ((trigger: HTMLElement) =>
      trigger.closest<HTMLElement>("[data-lightbox-group]")?.dataset
        .lightboxGroup ?? "");
  const click = (event: MouseEvent) => {
    if (
      event.defaultPrevented ||
      reach.destroyed() ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const target = event.target;
    if (!isElement(target) || target.closest(".re-lightbox")) return;
    const triggers = [...root.querySelectorAll<HTMLElement>(selector)].filter(
      (element) => {
        if (
          element.classList.contains("re-lightbox-landing") ||
          element.closest(".re-lightbox")
        )
          return false;
        const outer = element.parentElement?.closest(selector);
        return !outer || outer === root || !root.contains(outer);
      },
    );
    const trigger = triggers.find((candidate) => candidate.contains(target));
    if (!trigger) return;
    const name = group(trigger);
    // A clicked trigger whose media type has no module is followed; others leave such items out.
    const opened = triggers
      .filter((candidate) => group(candidate) === name)
      .map((candidate) => [candidate, read(candidate)] as const)
      .filter(
        (entry): entry is readonly [HTMLElement, Item] =>
          entry[1] !== null &&
          (entry[1].type === undefined || reach.shows(entry[1].type)),
      );
    const at = opened.findIndex(([candidate]) => candidate === trigger);
    if (at < 0) return;
    reach.openWith(markup, () =>
      lightbox.open(
        opened.map(([, item]) => item),
        at,
      ),
    );
    event.preventDefault();
  };
  root.addEventListener("click", click);
  return () => root.removeEventListener("click", click);
}
