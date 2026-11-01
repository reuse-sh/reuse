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

const FOLLOW = { stiffness: 700, damping: 45, mass: 0.4 };
const LEAN = { stiffness: 280, damping: 28, mass: 0.4 };
const LEAN_SCALE = 0.45;
const LEAN_DEADZONE = 0.45;
const LEAN_SETTLE_MS = 40;
const MORPH_MS = 220;
const SWAP_MS = 180;
const EASE = "cubic-bezier(0.33, 1, 0.68, 1)";

let tooltipId = 0;

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
      ? "right"
      : side === "right" || side.endsWith("-right")
        ? "left"
        : "center";
  const y = side.startsWith("top")
    ? "bottom"
    : side.startsWith("bottom")
      ? "top"
      : "center";
  return `${x} ${y}`;
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
  let describedBy: string | null = null;
  let keyboard = false;
  let shown: Content | null = null;
  let size = { width: 0, height: 0 };
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

  const applyClassName = () => {
    popup.classList.remove(...extraClasses);
    extraClasses = opts.className.split(/\s+/).filter(Boolean);
    popup.classList.add(...extraClasses);
  };
  const applyOrigin = () => {
    popup.style.transformOrigin = originFor(opts.side);
  };
  applyClassName();
  applyOrigin();

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
  const render = () => {
    popup.style.transform = `translate3d(${current.x}px, ${current.y}px, 0) rotate(${lean}deg)`;
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
    if (!trigger?.isConnected || trigger.closest("[hidden],[inert]"))
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
    return size;
  };
  const position = (snap = false) => {
    if (!trigger || popup.hidden) return;
    const rect = trigger.getBoundingClientRect();
    const side = opts.side;
    const offset = opts.sideOffset;
    const padding = opts.viewportPadding;
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
    target = {
      x: Math.min(
        Math.max(padding, x + dx),
        Math.max(padding, view.innerWidth - width - padding),
      ),
      y: Math.min(
        Math.max(padding, y + dy),
        Math.max(padding, view.innerHeight - height - padding),
      ),
    };
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
        if (morph === animation) finishMorph();
      };
      animation.addEventListener("finish", done);
      animation.addEventListener("cancel", done);
    }
    return true;
  };
  const dismiss = () => {
    view.clearTimeout(openTimer);
    view.clearTimeout(closeTimer);
    view.cancelAnimationFrame(frame);
    frame = 0;
    swap?.cancel();
    morph?.cancel();
    finishMorph();
    resetLean();
    popup.hidden = true;
    restoreDescription();
    trigger = null;
  };
  const open = (
    next: HTMLElement,
    isKeyboard: boolean,
    client?: { x: number; y: number },
  ) => {
    if (
      destroyed ||
      next.matches(':disabled,[aria-disabled="true"]') ||
      next.closest("[hidden],[inert]")
    )
      return;
    view.clearTimeout(openTimer);
    view.clearTimeout(closeTimer);
    if (client) point = client;
    const show = () => {
      if (!next.isConnected || destroyed) return;
      const content = resolveContent(next);
      if (content === null) {
        if (!popup.hidden) dismiss();
        return;
      }
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
    if (popup.hidden && !isKeyboard && opts.delay > 0)
      openTimer = view.setTimeout(show, opts.delay);
    else show();
  };
  const find = (event: Event) =>
    event.target instanceof view.Element
      ? event.target.closest<HTMLElement>(opts.selector)
      : null;
  const over = (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    const next = find(event);
    if (!next || !root.contains(next)) return;
    if (next === trigger) view.clearTimeout(closeTimer);
    else open(next, false, { x: event.clientX, y: event.clientY });
  };
  const move = (event: PointerEvent) => {
    if (event.pointerType === "touch" || keyboard || !trigger) return;
    point = { x: event.clientX, y: event.clientY };
    const previousX = target.x;
    position();
    if (tilting()) impulse(target.x - previousX);
  };
  const scheduleClose = () => {
    view.clearTimeout(openTimer);
    view.clearTimeout(closeTimer);
    closeTimer = view.setTimeout(dismiss, opts.closeDelay);
  };
  const out = (event: PointerEvent) => {
    const related = event.relatedTarget;
    if (
      related instanceof view.Node &&
      (trigger?.contains(related) || popup.contains(related))
    )
      return;
    if (keyboard && trigger?.contains(document.activeElement)) return;
    scheduleClose();
  };
  const focus = (event: FocusEvent) => {
    const next = find(event);
    if (next && root.contains(next) && next.matches(":focus-visible"))
      open(next, true);
  };
  const blur = (event: FocusEvent) => {
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
    if (!trigger) return;
    if (
      !trigger.isConnected ||
      trigger.closest("[hidden],[inert]") ||
      view.getComputedStyle(trigger).display === "none" ||
      view.getComputedStyle(trigger).visibility === "hidden"
    )
      return dismiss();
    const content = resolveContent(trigger);
    if (content === null) return dismiss();
    if (!change(content, false)) measure();
    position();
  };
  const keepOpen = () => view.clearTimeout(closeTimer);
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
      ? new view.ResizeObserver(refresh)
      : null;
  resizeObserver?.observe(root);
  resizeObserver?.observe(popup);
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
  reduced?.addEventListener("change", refresh);
  return {
    dismiss,
    refresh,
    update(partial: FloatingTooltipOptions = {}) {
      if (destroyed) return;
      given = { ...given, ...partial };
      opts = settle(given);
      applyClassName();
      applyOrigin();
      if (!tilting()) resetLean();
      if (trigger && !popup.hidden) {
        if (!morph) measure();
        position();
        render();
      }
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      dismiss();
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
      reduced?.removeEventListener("change", refresh);
      popup.remove();
    },
  };
}
