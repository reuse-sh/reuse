import {
  type CursorPreviewFrame,
  createCursorPreviewMotion,
} from "./preview-motion.js";

export type CursorPreviewPlacement = "corner" | "center";
export interface CursorPreviewOptions {
  selector?: string;
  content?: (item: HTMLElement) => Node | null;
  placement?: CursorPreviewPlacement;
  offset?: number;
  tilt?: number;
  delay?: number;
  closeDelay?: number;
  viewportPadding?: number;
  className?: string;
  media?: string;
}

type Settings = Required<CursorPreviewOptions>;
type Size = { width: number; height: number };
type Layer = {
  element: HTMLElement;
  content: Node;
  ready: Promise<boolean>;
  key?: string;
};

const SWAP_MS = 200;
const SETTLE_MS = 700;
const MORPH_MS = 240;
const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
const EASE_MORPH = "cubic-bezier(0.2, 0, 0, 1)";

function defaultContent(item: HTMLElement): Node | null {
  const id = item.getAttribute("data-re-preview-template");
  const template = id ? item.ownerDocument.getElementById(id) : null;
  if (template && "content" in template)
    return (template as HTMLTemplateElement).content.cloneNode(true);
  const src = item.getAttribute("data-re-preview");
  if (!src) return null;
  const image = item.ownerDocument.createElement("img");
  image.className = "re-cursor-preview-image";
  image.src = src;
  image.alt = "";
  image.decoding = "async";
  return image;
}

const DEFAULTS: Settings = {
  selector: "[data-re-preview], [data-re-preview-template]",
  content: defaultContent,
  placement: "corner",
  offset: 24,
  tilt: 8,
  delay: 60,
  closeDelay: 80,
  viewportPadding: 16,
  className: "",
  media: "(hover: hover) and (pointer: fine)",
};

function settle(options: CursorPreviewOptions): Settings {
  const settings = { ...DEFAULTS };
  for (const [key, value] of Object.entries(options))
    if (value !== undefined) Object.assign(settings, { [key]: value });
  return settings;
}

const decoded = (element: HTMLElement) =>
  Promise.all(
    [...element.querySelectorAll("img")].map((image) => {
      image.loading = "eager";
      return typeof image.decode === "function"
        ? image.decode().then(
            () => true,
            () => false,
          )
        : true;
    }),
  ).then((results) => results.every(Boolean));

export function createCursorPreview(
  root: HTMLElement,
  options: CursorPreviewOptions = {},
) {
  const document = root.ownerDocument;
  const view = document.defaultView;
  if (!view) throw new Error("The root must belong to a window.");
  let given = { ...options };
  let opts = settle(given);
  let media = view.matchMedia?.(opts.media);
  const reduced = view.matchMedia?.("(prefers-reduced-motion: reduce)");
  const animates = () =>
    !reduced?.matches && typeof HTMLElement.prototype.animate === "function";

  const popup = document.createElement("div");
  popup.className = "re-cursor-preview";
  popup.setAttribute("aria-hidden", "true");
  popup.hidden = true;
  const frame = document.createElement("div");
  frame.className = "re-cursor-preview-frame";
  popup.append(frame);
  document.body.append(popup);
  const applyPadding = () =>
    popup.style.setProperty(
      "--re-preview-viewport-padding",
      `${opts.viewportPadding}px`,
    );
  applyPadding();
  let extraClasses: string[] = [];
  const applyClassName = () => {
    popup.classList.remove(...extraClasses);
    extraClasses = opts.className.split(/\s+/).filter(Boolean);
    popup.classList.add(...extraClasses);
  };
  applyClassName();

  let layers = new WeakMap<HTMLElement, Layer>();
  const fades = new WeakMap<HTMLElement, Animation>();
  let requested: HTMLElement | null = null;
  let shown: Layer | null = null;
  let shownItem: HTMLElement | null = null;
  let inside = false;
  let ticket = 0;
  let origin = { x: 0, y: 0 };
  let owner: number | undefined;
  let point = { x: 0, y: 0 };
  let size: Size = { width: 0, height: 0 };
  let openTimer: number | undefined;
  let closeTimer: number | undefined;
  let preloaded = false;
  let destroyed = false;

  const render = ({ x, y, tilt }: CursorPreviewFrame) => {
    popup.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${tilt}deg)`;
  };
  const motion = createCursorPreviewMotion(view, render);

  const enabled = () => !destroyed && (media?.matches ?? true);
  const isOpen = () => !popup.hidden && popup.dataset.state === "open";

  const canShow = (item: HTMLElement) => {
    if (
      !item.isConnected ||
      !root.contains(item) ||
      item.matches(':disabled,[aria-disabled="true"]') ||
      item.closest("[hidden],[inert]")
    )
      return false;
    if (typeof item.checkVisibility === "function")
      return item.checkVisibility({ visibilityProperty: true });
    return view.getComputedStyle(item).visibility !== "hidden";
  };
  const itemAt = (target: EventTarget | null) => {
    if (!(target instanceof view.Element)) return null;
    const item = target.closest<HTMLElement>(opts.selector);
    return item && root.contains(item) && canShow(item) ? item : null;
  };

  const lean = () => (reduced?.matches ? 0 : opts.tilt);
  const overhang = () => {
    const { width, height } = size;
    const angle = (lean() * Math.PI) / 180;
    const ox = origin.x * width;
    const oy = origin.y * height;
    const reach = { left: 0, right: 0, top: 0, bottom: 0 };
    for (const sign of [-1, 1]) {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle) * sign;
      for (const [x, y] of [
        [0, 0],
        [width, 0],
        [0, height],
        [width, height],
      ]) {
        const rx = ox + (x - ox) * cos - (y - oy) * sin;
        const ry = oy + (x - ox) * sin + (y - oy) * cos;
        reach.left = Math.max(reach.left, -rx);
        reach.top = Math.max(reach.top, -ry);
        reach.right = Math.max(reach.right, rx - width);
        reach.bottom = Math.max(reach.bottom, ry - height);
      }
    }
    return reach;
  };
  const target = () => {
    const pad = opts.viewportPadding;
    const { width, height } = size;
    const reach = overhang();
    const viewport = { width: view.innerWidth, height: view.innerHeight };
    let x: number;
    let y: number;
    let flipX = false;
    let flipY = false;
    if (opts.placement === "center") {
      x = point.x - width / 2;
      y = point.y - height / 2;
    } else {
      x = point.x + opts.offset;
      y = point.y + opts.offset;
      flipX = x + width > viewport.width - pad - reach.right;
      flipY = y + height > viewport.height - pad - reach.bottom;
      if (flipX) x = point.x - opts.offset - width;
      if (flipY) y = point.y - opts.offset - height;
    }
    const fit = (
      at: number,
      size: number,
      room: number,
      before: number,
      after: number,
    ) => {
      const low = pad + before;
      const high = room - size - pad - after;
      return high < low
        ? Math.max(pad, (room - size) / 2)
        : Math.min(Math.max(low, at), high);
    };
    return {
      x: fit(x, width, viewport.width, reach.left, reach.right),
      y: fit(y, height, viewport.height, reach.top, reach.bottom),
      flipX,
      flipY,
    };
  };
  const aim = (snap = false) =>
    motion.setTarget(target(), {
      snap: snap || Boolean(reduced?.matches),
      lean: lean(),
    });

  const layerFor = (item: HTMLElement) => {
    const key = given.content
      ? undefined
      : `${item.getAttribute("data-re-preview-template")} ${item.getAttribute("data-re-preview")}`;
    const cached = layers.get(item);
    if (
      cached &&
      cached.key === key &&
      (cached.content.parentNode === cached.element ||
        cached.content.nodeType === Node.DOCUMENT_FRAGMENT_NODE)
    )
      return cached;
    const content = opts.content(item);
    if (!content) return null;
    const element = document.createElement("div");
    element.className = "re-cursor-preview-layer";
    if (!given.content) element.inert = true;
    element.append(content);
    const layer = { element, content, ready: decoded(element), key };
    layers.set(item, layer);
    return layer;
  };
  const measure = (layer: Layer) => {
    const attached = layer.element.parentElement === frame;
    if (!attached) frame.append(layer.element);
    const next = {
      width: layer.element.offsetWidth,
      height: layer.element.offsetHeight,
    };
    if (!attached) layer.element.remove();
    return next;
  };
  const resize = (next: Size, animate: boolean) => {
    const from = size;
    size = next;
    frame.style.width = `${next.width}px`;
    frame.style.height = `${next.height}px`;
    if (
      animate &&
      animates() &&
      (Math.abs(from.width - next.width) > 0.5 ||
        Math.abs(from.height - next.height) > 0.5)
    )
      frame.animate(
        [
          { width: `${from.width}px`, height: `${from.height}px` },
          { width: `${next.width}px`, height: `${next.height}px` },
        ],
        { duration: MORPH_MS, easing: EASE_MORPH },
      );
  };
  const fade = (element: HTMLElement, to: number) => {
    const from = view.getComputedStyle(element).opacity || "1";
    fades.get(element)?.cancel();
    const animation = element.animate(
      { opacity: [from, String(to)] },
      { duration: SWAP_MS, easing: "ease", fill: "forwards" },
    );
    fades.set(element, animation);
    return animation;
  };
  const drop = (element: HTMLElement) => {
    fades.get(element)?.cancel();
    fades.delete(element);
    element.remove();
  };

  const hide = () => {
    view.clearTimeout(closeTimer);
    closeTimer = undefined;
    motion.stop();
    for (const element of [...frame.children] as HTMLElement[]) drop(element);
    shown = null;
    shownItem = null;
    popup.hidden = true;
    delete popup.dataset.state;
  };
  const dismiss = () => {
    ticket++;
    view.clearTimeout(openTimer);
    openTimer = undefined;
    requested = null;
    owner = undefined;
    hide();
  };
  const close = () => {
    ticket++;
    view.clearTimeout(openTimer);
    openTimer = undefined;
    requested = null;
    owner = undefined;
    if (popup.hidden || popup.dataset.state === "closing") return;
    popup.dataset.state = "closing";
    const exit =
      animates() && typeof frame.getAnimations === "function"
        ? frame
            .getAnimations()
            .find(
              (animation) =>
                "transitionProperty" in animation &&
                animation.transitionProperty === "opacity",
            )
        : undefined;
    if (!exit) return hide();
    exit.finished.then(
      () => {
        if (popup.dataset.state === "closing") hide();
      },
      () => {},
    );
  };
  const scheduleClose = () => {
    view.clearTimeout(openTimer);
    openTimer = undefined;
    view.clearTimeout(closeTimer);
    closeTimer = view.setTimeout(close, opts.closeDelay);
  };

  const switchTo = (layer: Layer) => {
    const { element } = layer;
    shown = layer;
    if (!animates()) {
      for (const other of [...frame.children] as HTMLElement[])
        if (other !== element) drop(other);
      fades.get(element)?.cancel();
      if (element.parentElement !== frame) frame.append(element);
      resize(measure(layer), false);
      return;
    }
    let rising: Animation | null = null;
    if (element.parentElement === frame) rising = fade(element, 1);
    else {
      frame.prepend(element);
      element.firstElementChild?.animate(
        { scale: ["1.06", "1"] },
        { duration: SETTLE_MS, easing: EASE_OUT },
      );
    }
    resize(measure(layer), true);
    for (const other of [...frame.children] as HTMLElement[]) {
      if (other === element) continue;
      const above =
        element.compareDocumentPosition(other) &
        Node.DOCUMENT_POSITION_FOLLOWING;
      const gone = above ? fade(other, 0).finished : rising?.finished;
      gone?.then(
        () => {
          if (other !== shown?.element) drop(other);
        },
        () => {},
      );
    }
  };

  const present = (layer: Layer, item: HTMLElement) => {
    view.clearTimeout(closeTimer);
    closeTimer = undefined;
    shownItem = item;
    if (popup.hidden) {
      for (const other of [...frame.children] as HTMLElement[]) drop(other);
      frame.append(layer.element);
      shown = layer;
      popup.hidden = false;
      resize(measure(layer), false);
      origin = { x: 0, y: 0 };
      const at = target();
      origin =
        opts.placement === "center"
          ? { x: 0.5, y: 0.5 }
          : { x: at.flipX ? 1 : 0, y: at.flipY ? 1 : 0 };
      const css = `${origin.x * 100}% ${origin.y * 100}%`;
      popup.style.transformOrigin = css;
      frame.style.transformOrigin = css;
      aim(true);
      void frame.offsetWidth;
      popup.dataset.state = "open";
      return;
    }
    popup.dataset.state = "open";
    if (layer !== shown) switchTo(layer);
    aim();
  };

  const request = (item: HTMLElement) => {
    requested = item;
    const current = ++ticket;
    const layer = layerFor(item);
    if (!layer) return close();
    layer.ready.then((ok) => {
      if (destroyed || current !== ticket || !inside || !enabled()) return;
      if (!canShow(item)) return close();
      if (ok) return present(layer, item);
      if (layers.get(item) === layer) layers.delete(item);
      if (popup.hidden) requested = null;
    });
  };

  const preload = () => {
    if (preloaded || given.content) return;
    preloaded = true;
    for (const item of root.querySelectorAll<HTMLElement>(opts.selector))
      if (canShow(item)) layerFor(item);
  };

  const foreign = (event: PointerEvent) =>
    owner !== undefined && event.pointerId !== owner;
  const ignored = (event: PointerEvent) =>
    event.pointerType === "touch" || event.isPrimary === false || !enabled();

  const over = (event: PointerEvent) => {
    if (ignored(event) || (foreign(event) && !event.isTrusted)) return;
    view.clearTimeout(closeTimer);
    closeTimer = undefined;
    point = { x: event.clientX, y: event.clientY };
    inside = true;
    preload();
    const item = itemAt(event.target);
    if (!item) {
      if (
        popup.dataset.state === "closing" &&
        shownItem &&
        canShow(shownItem)
      ) {
        owner = event.pointerId;
        requested = shownItem;
        popup.dataset.state = "open";
        aim();
      }
      return;
    }
    owner = event.pointerId;
    if (item === requested) return;
    if (popup.hidden && opts.delay > 0) {
      requested = item;
      layerFor(item);
      view.clearTimeout(openTimer);
      openTimer = view.setTimeout(() => {
        openTimer = undefined;
        if (requested === item) request(item);
      }, opts.delay);
      return;
    }
    request(item);
  };
  const move = (event: PointerEvent) => {
    if (ignored(event) || foreign(event)) return;
    point = { x: event.clientX, y: event.clientY };
    if (isOpen()) aim();
  };
  const leave = (event: PointerEvent) => {
    if (ignored(event) || foreign(event)) return;
    inside = false;
    ticket++;
    if (popup.hidden) return dismiss();
    scheduleClose();
  };
  const onScroll = () => {
    if (!inside || (popup.hidden && openTimer === undefined)) return;
    const under = document.elementFromPoint(point.x, point.y);
    if (!under || !root.contains(under)) return close();
    const item = itemAt(under);
    if (item && item !== requested) request(item);
  };
  const relayout = (snap: boolean) => {
    if (!popup.hidden && shown) {
      resize(measure(shown), false);
      aim(snap);
    }
  };
  const onResize = () => relayout(true);
  const onKey = (event: KeyboardEvent) => {
    if (
      event.key === "Escape" &&
      (!popup.hidden || openTimer !== undefined || requested)
    )
      dismiss();
  };
  const onMedia = () => {
    if (!enabled()) dismiss();
  };
  const onReduced = () => {
    if (popup.hidden) return;
    if (reduced?.matches) {
      if (popup.dataset.state === "closing") return hide();
      if (typeof frame.getAnimations === "function")
        for (const animation of frame.getAnimations({ subtree: true }))
          if (!("transitionProperty" in animation)) animation.cancel();
      for (const other of [...frame.children] as HTMLElement[])
        if (other !== shown?.element) drop(other);
    }
    relayout(true);
  };
  const observer = new view.MutationObserver(() => {
    if (requested && !canShow(requested)) close();
  });
  observer.observe(root, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: [
      "hidden",
      "inert",
      "disabled",
      "aria-disabled",
      "style",
      "class",
    ],
  });

  root.addEventListener("pointerover", over);
  root.addEventListener("pointermove", move);
  root.addEventListener("pointerleave", leave);
  view.addEventListener("scroll", onScroll, true);
  view.addEventListener("resize", onResize);
  view.addEventListener("keydown", onKey);
  view.addEventListener("blur", dismiss);
  media?.addEventListener("change", onMedia);
  reduced?.addEventListener("change", onReduced);

  return {
    dismiss,
    refresh() {
      if (requested && !canShow(requested)) return close();
      if (given.content) layers = new WeakMap();
      if (requested && !popup.hidden) request(requested);
      relayout(false);
    },
    update(partial: CursorPreviewOptions = {}) {
      if (destroyed) return;
      const content = opts.content;
      given = { ...given, ...partial };
      opts = settle(given);
      applyClassName();
      applyPadding();
      if (opts.content !== content) {
        dismiss();
        layers = new WeakMap();
      }
      if (media?.media !== view.matchMedia?.(opts.media).media) {
        media?.removeEventListener("change", onMedia);
        media = view.matchMedia?.(opts.media);
        media?.addEventListener("change", onMedia);
      }
      if (!enabled()) dismiss();
      else relayout(false);
    },
    destroy() {
      if (destroyed) return;
      dismiss();
      destroyed = true;
      observer.disconnect();
      root.removeEventListener("pointerover", over);
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerleave", leave);
      view.removeEventListener("scroll", onScroll, true);
      view.removeEventListener("resize", onResize);
      view.removeEventListener("keydown", onKey);
      view.removeEventListener("blur", dismiss);
      media?.removeEventListener("change", onMedia);
      reduced?.removeEventListener("change", onReduced);
      popup.remove();
    },
  };
}
