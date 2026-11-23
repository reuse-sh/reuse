export type FloatingTooltipSide =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";
export interface FloatingTooltipOptions {
  selector?: string;
  side?: FloatingTooltipSide;
  sideOffset?: number;
  delay?: number;
  closeDelay?: number;
  viewportPadding?: number;
  track?: { x?: "pointer" | "anchor"; y?: "pointer" | "anchor" };
  tilt?: number;
  className?: string;
  content?: (trigger: HTMLElement) => string | Node | null;
}

type Content = string | Node;
type Settings = Required<Omit<FloatingTooltipOptions, "track">> &
  Pick<FloatingTooltipOptions, "track">;
type Point = { x: number; y: number };
type Size = { width: number; height: number };

const FOLLOW = { stiffness: 700, damping: 45, mass: 0.4 };
const LEAN = { stiffness: 280, damping: 28, mass: 0.4 };
const LEAN_SCALE = 0.45;
const LEAN_DEADZONE = 0.45;
const LEAN_SETTLE_MS = 40;
const FADE_OUT_MS = 160;
const MORPH_MS = 220;
const SWAP_MS = 180;
const EASE = "cubic-bezier(0.33, 1, 0.68, 1)";

let tooltipId = 0;
const scopes = new WeakMap<Element, Set<() => string>>();

function defaultContent(trigger: HTMLElement): Content {
  const id = trigger.getAttribute("data-re-tooltip-template");
  const template = id ? trigger.ownerDocument.getElementById(id) : null;
  if (template && "content" in template)
    return (template as HTMLTemplateElement).content.cloneNode(true);
  return trigger.getAttribute("data-re-tooltip") ?? "";
}

const DEFAULTS: Settings = {
  selector: "[data-re-tooltip], [data-re-tooltip-template]",
  side: "bottom-right",
  sideOffset: 10,
  delay: 150,
  closeDelay: 80,
  viewportPadding: 12,
  track: undefined,
  tilt: 5,
  className: "",
  content: defaultContent,
};

function settle(options: FloatingTooltipOptions): Settings {
  const settings = { ...DEFAULTS };
  for (const [key, value] of Object.entries(options))
    if (value !== undefined) Object.assign(settings, { [key]: value });
  return settings;
}

function originFor(side: FloatingTooltipSide) {
  const x =
    side === "left" || side.endsWith("-left")
      ? 1
      : side === "right" || side.endsWith("-right")
        ? 0
        : 0.5;
  const y = side.startsWith("top") ? 1 : side.startsWith("bottom") ? 0 : 0.5;
  return { x, y };
}

const clamp = (value: number, limit: number) =>
  Math.max(-limit, Math.min(limit, value));

const sameContent = (a: Content, b: Content) =>
  typeof a === "string" || typeof b === "string" ? a === b : a.isEqualNode(b);

export function createFloatingTooltip(
  root: HTMLElement,
  options: FloatingTooltipOptions = {},
) {
  const document = root.ownerDocument;
  const view = document.defaultView;
  if (!view) throw new Error("The root must belong to a window.");
  let given = { ...options };
  let opts = settle(given);
  const popup = document.createElement("div");
  popup.className = "re-floating-tooltip";
  popup.id = `re-tooltip-${++tooltipId}`;
  popup.setAttribute("role", "tooltip");
  popup.hidden = true;
  const body = document.createElement("span");
  body.className = "re-floating-tooltip-content";
  popup.append(body);
  document.body.append(popup);
  let extraClasses: string[] = [];
  const reduced = view.matchMedia?.("(prefers-reduced-motion: reduce)");
  let trigger: HTMLElement | null = null;
  let pending: HTMLElement | null = null;
  let owner: number | undefined;
  const foreign = (event: PointerEvent) =>
    owner !== undefined && event.pointerId !== owner;
  let describedBy: string | null = null;
  let keyboard = false;
  let shown: Content | null = null;
  let size = { width: 0, height: 0 };
  let displayedSize = size;
  let origin = originFor(opts.side);
  let point = { x: 0, y: 0 };
  let current = { x: 0, y: 0 };
  let velocity = { x: 0, y: 0 };
  let target = { x: 0, y: 0 };
  let lean = 0;
  let leanVelocity = 0;
  let leanTarget = 0;
  let frame = 0;
  let lastTime = 0;
  let openTimer: number | undefined;
  let closeTimer: number | undefined;
  let leanTimer: number | undefined;
  let destroyed = false;
  let swap: Animation | undefined;
  let morph: Animation | undefined;
  let fade: { animation: Animation; closing: boolean } | undefined;

  const applyClassName = () => {
    popup.classList.remove(...extraClasses);
    extraClasses = opts.className.split(/\s+/).filter(Boolean);
    popup.classList.add(...extraClasses);
  };
  const applyPlacementStyles = () => {
    origin = originFor(opts.side);
    popup.style.transformOrigin = `${origin.x * 100}% ${origin.y * 100}%`;
    popup.style.setProperty(
      "--re-tooltip-viewport-padding",
      `${opts.viewportPadding}px`,
    );
  };
  applyClassName();
  applyPlacementStyles();

  const tilting = () =>
    opts.tilt > 0 &&
    !keyboard &&
    !reduced?.matches &&
    opts.track?.x !== "anchor";
  const resetLean = () => {
    view.clearTimeout(leanTimer);
    lean = 0;
    leanVelocity = 0;
    leanTarget = 0;
  };
  const restoreDescription = () => {
    if (!trigger) return;
    if (describedBy === null) trigger.removeAttribute("aria-describedby");
    else trigger.setAttribute("aria-describedby", describedBy);
  };
  const findTrigger = (element: Element) => {
    for (
      let scope: Element | null = element;
      scope && scope !== root;
      scope = scope.parentElement
    ) {
      const selectors = scopes.get(scope);
      if (!selectors) continue;
      for (const selector of selectors) {
        const nested = element.closest(selector());
        if (nested && scope.contains(nested)) return null;
      }
    }
    const next = element.closest<HTMLElement>(opts.selector);
    return next && root.contains(next) ? next : null;
  };
  const canShow = (element: HTMLElement) => {
    if (
      !element.isConnected ||
      findTrigger(element) !== element ||
      element.matches(':disabled,[aria-disabled="true"]') ||
      element.closest("[hidden],[inert]")
    )
      return false;
    if (typeof element.checkVisibility === "function")
      return element.checkVisibility({ visibilityProperty: true });
    const style = view.getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden";
  };
  const fit = ({ x, y }: Point, { width, height }: Size) => {
    const padding = opts.viewportPadding;
    return {
      x: Math.min(
        Math.max(padding, x),
        Math.max(padding, view.innerWidth - width - padding),
      ),
      y: Math.min(
        Math.max(padding, y),
        Math.max(padding, view.innerHeight - height - padding),
      ),
    };
  };
  const render = () => {
    const { width, height } = displayedSize;
    const radians = (lean * Math.PI) / 180;
    const sin = Math.sin(radians);
    const cos = Math.cos(radians);
    const ox = width * origin.x;
    const oy = height * origin.y;
    const left =
      ox * (1 - cos) +
      oy * sin +
      Math.min(0, width * cos) +
      Math.min(0, -height * sin);
    const top =
      oy * (1 - cos) -
      ox * sin +
      Math.min(0, width * sin) +
      Math.min(0, height * cos);
    const placed = fit(
      { x: current.x + left, y: current.y + top },
      {
        width: width * Math.abs(cos) + height * Math.abs(sin),
        height: height * Math.abs(cos) + width * Math.abs(sin),
      },
    );
    popup.style.transform = `translate3d(${placed.x - left}px, ${placed.y - top}px, 0) rotate(${lean}deg)`;
  };
  const unsettled = () =>
    Math.abs(target.x - current.x) +
      Math.abs(target.y - current.y) +
      Math.abs(velocity.x) +
      Math.abs(velocity.y) >
      0.15 || Math.abs(leanTarget - lean) + Math.abs(leanVelocity) > 0.01;
  const animate = (time: number) => {
    frame = 0;
    if (destroyed || popup.hidden) return;
    if (
      !trigger?.isConnected ||
      !root.contains(trigger) ||
      trigger.closest("[hidden],[inert]")
    )
      return dismiss();
    const elapsed = Math.min(0.032, (time - (lastTime || time - 16)) / 1000);
    lastTime = time;
    const steps = Math.ceil(elapsed / 0.005);
    const step = elapsed / steps;
    for (let index = 0; index < steps; index++) {
      for (const axis of ["x", "y"] as const) {
        const acceleration =
          (FOLLOW.stiffness * (target[axis] - current[axis]) -
            FOLLOW.damping * velocity[axis]) /
          FOLLOW.mass;
        velocity[axis] += acceleration * step;
        current[axis] += velocity[axis] * step;
      }
      const leanAcceleration =
        (LEAN.stiffness * (leanTarget - lean) - LEAN.damping * leanVelocity) /
        LEAN.mass;
      leanVelocity += leanAcceleration * step;
      lean += leanVelocity * step;
    }
    if (unsettled()) {
      render();
      frame = view.requestAnimationFrame(animate);
    } else {
      current = { ...target };
      velocity = { x: 0, y: 0 };
      lean = leanTarget;
      leanVelocity = 0;
      render();
    }
  };
  const run = () => {
    if (frame || popup.hidden) return;
    lastTime = 0;
    frame = view.requestAnimationFrame(animate);
  };
  const measure = () => {
    if (morph) return size;
    const style = view.getComputedStyle(popup);
    size = {
      width: Number.parseFloat(style.width) || 0,
      height: Number.parseFloat(style.height) || 0,
    };
    displayedSize = size;
    return size;
  };
  const position = (snap = false) => {
    if (!trigger || popup.hidden) return;
    const rect = trigger.getBoundingClientRect();
    const side = opts.side;
    const offset = opts.sideOffset;
    const { width, height } = size;
    const anchor = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    if (keyboard) {
      if (side.startsWith("top")) anchor.y = rect.top;
      if (side.startsWith("bottom")) anchor.y = rect.bottom;
      if (side === "left") anchor.x = rect.left;
      if (side === "right") anchor.x = rect.right;
    }
    const x = keyboard || opts.track?.x === "anchor" ? anchor.x : point.x;
    const y = keyboard || opts.track?.y === "anchor" ? anchor.y : point.y;
    const dx =
      side === "left" || side.endsWith("-left")
        ? -width - offset
        : side === "right" || side.endsWith("-right")
          ? offset
          : -width / 2;
    const dy = side.startsWith("top")
      ? -height - offset
      : side.startsWith("bottom")
        ? offset
        : -height / 2;
    target = fit({ x: x + dx, y: y + dy }, size);
    if (snap || reduced?.matches) {
      view.cancelAnimationFrame(frame);
      frame = 0;
      velocity = { x: 0, y: 0 };
      current = { ...target };
      if (!tilting()) resetLean();
      render();
      if (unsettled()) run();
    } else run();
  };
  const impulse = (deltaX: number) => {
    if (Math.abs(deltaX) < LEAN_DEADZONE) return;
    const sign = opts.side.startsWith("top") ? -1 : 1;
    leanTarget = clamp(
      lean * 0.35 + clamp(deltaX * LEAN_SCALE * sign, opts.tilt),
      opts.tilt,
    );
    view.clearTimeout(leanTimer);
    leanTimer = view.setTimeout(() => {
      leanTarget = 0;
      run();
    }, LEAN_SETTLE_MS);
    run();
  };
  const finishMorph = () => {
    morph = undefined;
    displayedSize = size;
    body.style.width = "";
  };
  const setContent = (content: Content) => {
    if (typeof content === "string") {
      shown = content;
      popup.removeAttribute("data-rich");
      body.textContent = content;
    } else {
      shown = content.cloneNode(true);
      popup.setAttribute("data-rich", "");
      body.replaceChildren(content);
    }
  };
  const resolveContent = (next: HTMLElement) => opts.content(next) ?? null;
  const change = (content: Content, wasOpen: boolean) => {
    if (typeof content !== "string" && body.firstChild === content)
      return false;
    if (shown !== null && sameContent(shown, content)) return false;
    const animated =
      wasOpen && !reduced?.matches && typeof popup.animate === "function";
    const from = morph
      ? { width: popup.offsetWidth, height: popup.offsetHeight }
      : { ...size };
    morph?.cancel();
    finishMorph();
    setContent(content);
    measure();
    if (
      animated &&
      (Math.abs(from.width - size.width) > 0.5 ||
        Math.abs(from.height - size.height) > 0.5)
    ) {
      displayedSize = from;
      body.style.width = view.getComputedStyle(body).width;
      const animation = popup.animate(
        [
          {
            width: `${from.width}px`,
            height: `${from.height}px`,
            maxWidth: "none",
          },
          {
            width: `${size.width}px`,
            height: `${size.height}px`,
            maxWidth: "none",
          },
        ],
        { duration: MORPH_MS, easing: EASE },
      );
      morph = animation;
      const done = () => {
        if (morph !== animation) return;
        finishMorph();
        render();
      };
      animation.addEventListener("finish", done);
      animation.addEventListener("cancel", done);
    }
    return true;
  };
  const cancelOpen = () => {
    view.clearTimeout(openTimer);
    pending = null;
  };
  const dismiss = () => {
    cancelOpen();
    view.clearTimeout(closeTimer);
    view.cancelAnimationFrame(frame);
    frame = 0;
    swap?.cancel();
    morph?.cancel();
    fade?.animation.cancel();
    fade = undefined;
    finishMorph();
    resetLean();
    popup.hidden = true;
    restoreDescription();
    trigger = null;
    owner = undefined;
  };
  const keepOpen = () => {
    view.clearTimeout(closeTimer);
    if (fade?.closing) {
      fade.closing = false;
      fade.animation.reverse();
    }
  };
  const close = () => {
    if (popup.hidden || reduced?.matches || typeof popup.animate !== "function")
      return dismiss();
    if (fade) {
      if (!fade.closing) {
        fade.closing = true;
        fade.animation.reverse();
      }
      return;
    }
    const animation = popup.animate(
      [{ opacity: view.getComputedStyle(popup).opacity }, { opacity: 0 }],
      { duration: FADE_OUT_MS, easing: "ease-out", fill: "forwards" },
    );
    fade = { animation, closing: true };
    animation.onfinish = () => {
      if (fade?.animation !== animation) return;
      if (fade.closing) dismiss();
      else {
        fade = undefined;
        animation.cancel();
      }
    };
  };
  const open = (
    next: HTMLElement,
    isKeyboard: boolean,
    client?: { x: number; y: number },
  ) => {
    if (destroyed) return;
    cancelOpen();
    keepOpen();
    if (client) point = client;
    const show = () => {
      pending = null;
      if (!canShow(next)) return dismiss();
      const content = resolveContent(next);
      if (content === null) return dismiss();
      const wasOpen = !popup.hidden;
      const previous = { ...target };
      restoreDescription();
      trigger = next;
      keyboard = isKeyboard;
      if (!tilting()) resetLean();
      describedBy = next.getAttribute("aria-describedby");
      next.setAttribute(
        "aria-describedby",
        [describedBy, popup.id].filter(Boolean).join(" "),
      );
      popup.hidden = false;
      if (!wasOpen) {
        resetLean();
        shown = null;
      }
      const changed = change(content, wasOpen);
      if (!changed) measure();
      position(!wasOpen);
      if (
        wasOpen &&
        changed &&
        !reduced?.matches &&
        typeof body.animate === "function"
      ) {
        swap?.cancel();
        const dx = target.x - previous.x;
        const dy = target.y - previous.y;
        const translate =
          Math.abs(dy) > Math.abs(dx)
            ? `0 ${dy >= 0 ? 8 : -8}px`
            : `${dx >= 0 ? 8 : -8}px 0`;
        swap = body.animate(
          [
            { opacity: 0.4, translate },
            { opacity: 1, translate: "0 0" },
          ],
          { duration: SWAP_MS, easing: EASE },
        );
      }
    };
    if (popup.hidden && !isKeyboard && opts.delay > 0) {
      pending = next;
      openTimer = view.setTimeout(show, opts.delay);
    } else show();
  };
  const find = (event: Event) =>
    event.target instanceof view.Element ? findTrigger(event.target) : null;
  const over = (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    if (foreign(event) && !event.isTrusted) return;
    const next = find(event);
    if (!next || next === pending || !canShow(next)) return;
    owner = event.pointerId;
    if (next === trigger) keepOpen();
    else open(next, false, { x: event.clientX, y: event.clientY });
  };
  const move = (event: PointerEvent) => {
    if (event.pointerType === "touch" || foreign(event)) return;
    const active = pending ?? (keyboard ? null : trigger);
    if (!(event.target instanceof view.Node) || !active?.contains(event.target))
      return;
    point = { x: event.clientX, y: event.clientY };
    if (pending) return;
    const previousX = target.x;
    position();
    if (tilting()) impulse(target.x - previousX);
  };
  const scheduleClose = () => {
    if (popup.hidden) return dismiss();
    cancelOpen();
    view.clearTimeout(closeTimer);
    closeTimer = view.setTimeout(close, opts.closeDelay);
  };
  const out = (event: PointerEvent) => {
    if (event.pointerType === "touch" || foreign(event)) return;
    const active = pending ?? trigger;
    if (!(event.target instanceof view.Node) || !active?.contains(event.target))
      return;
    const related = event.relatedTarget;
    if (
      related instanceof view.Node &&
      (active.contains(related) || popup.contains(related))
    )
      return;
    if (keyboard && trigger?.contains(document.activeElement)) return;
    scheduleClose();
  };
  const focus = (event: FocusEvent) => {
    const next = find(event);
    if (next?.matches(":focus-visible") && canShow(next)) open(next, true);
  };
  const blur = (event: FocusEvent) => {
    if (
      !(event.target instanceof view.Node) ||
      !trigger?.contains(event.target)
    )
      return;
    if (
      event.relatedTarget instanceof view.Node &&
      trigger?.contains(event.relatedTarget)
    )
      return;
    scheduleClose();
  };
  const onEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape") dismiss();
  };
  const refresh = () => {
    if (pending && !canShow(pending)) return dismiss();
    if (!trigger) return;
    if (!canShow(trigger)) return dismiss();
    const content = resolveContent(trigger);
    if (content === null) return dismiss();
    if (!change(content, false)) measure();
    position();
  };
  const onMotionPreferenceChange = () => {
    if (reduced?.matches) {
      if (fade?.closing) return dismiss();
      fade?.animation.cancel();
      fade = undefined;
      swap?.cancel();
      morph?.cancel();
      finishMorph();
    }
    refresh();
  };
  const observer = new view.MutationObserver((records) => {
    if (records.every((record) => popup.contains(record.target))) return;
    refresh();
  });
  observer.observe(document.documentElement, {
    subtree: true,
    attributes: true,
    childList: true,
  });
  const resizeObserver =
    typeof view.ResizeObserver === "function"
      ? new view.ResizeObserver((entries) => {
          const entry = entries.find((entry) => entry.target === popup);
          if (morph && entry) {
            const box = entry.borderBoxSize?.[0];
            displayedSize = box
              ? { width: box.inlineSize, height: box.blockSize }
              : { width: popup.offsetWidth, height: popup.offsetHeight };
            render();
          }
          refresh();
        })
      : null;
  resizeObserver?.observe(root);
  resizeObserver?.observe(popup, { box: "border-box" });
  const selector = () => opts.selector;
  const selectors = scopes.get(root) ?? new Set<() => string>();
  selectors.add(selector);
  scopes.set(root, selectors);
  root.addEventListener("pointerover", over);
  root.addEventListener("pointermove", move);
  root.addEventListener("pointerout", out);
  root.addEventListener("focusin", focus);
  root.addEventListener("focusout", blur);
  popup.addEventListener("pointerenter", keepOpen);
  popup.addEventListener("pointerleave", scheduleClose);
  view.addEventListener("keydown", onEscape);
  view.addEventListener("scroll", refresh, true);
  view.addEventListener("resize", refresh);
  view.addEventListener("blur", dismiss);
  reduced?.addEventListener("change", onMotionPreferenceChange);
  return {
    dismiss,
    refresh,
    update(partial: FloatingTooltipOptions = {}) {
      if (destroyed) return;
      given = { ...given, ...partial };
      opts = settle(given);
      applyClassName();
      applyPlacementStyles();
      if (!tilting()) resetLean();
      refresh();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      dismiss();
      selectors.delete(selector);
      if (selectors.size === 0) scopes.delete(root);
      observer.disconnect();
      resizeObserver?.disconnect();
      root.removeEventListener("pointerover", over);
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerout", out);
      root.removeEventListener("focusin", focus);
      root.removeEventListener("focusout", blur);
      popup.removeEventListener("pointerenter", keepOpen);
      popup.removeEventListener("pointerleave", scheduleClose);
      view.removeEventListener("keydown", onEscape);
      view.removeEventListener("scroll", refresh, true);
      view.removeEventListener("resize", refresh);
      view.removeEventListener("blur", dismiss);
      reduced?.removeEventListener("change", onMotionPreferenceChange);
      popup.remove();
    },
  };
}
