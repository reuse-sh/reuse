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
}

let tooltipId = 0;

export function createFloatingTooltip(
  root: HTMLElement,
  options: FloatingTooltipOptions = {},
) {
  const document = root.ownerDocument;
  const view = document.defaultView;
  if (!view) throw new Error("The root must belong to a window.");
  const selector = options.selector ?? "[data-reuse-tooltip]";
  const popup = document.createElement("div");
  popup.className = "reuse-floating-tooltip";
  popup.id = `reuse-tooltip-${++tooltipId}`;
  popup.setAttribute("role", "tooltip");
  popup.hidden = true;
  document.body.append(popup);
  const reduced = view.matchMedia?.("(prefers-reduced-motion: reduce)");
  let trigger: HTMLElement | null = null;
  let describedBy: string | null = null;
  let keyboard = false;
  let point = { x: 0, y: 0 };
  let current = { x: 0, y: 0 };
  let velocity = { x: 0, y: 0 };
  let target = { x: 0, y: 0 };
  let frame = 0;
  let lastTime = 0;
  let openTimer: number | undefined;
  let closeTimer: number | undefined;
  let destroyed = false;
  let swap: Animation | undefined;
  const restoreDescription = () => {
    if (!trigger) return;
    if (describedBy === null) trigger.removeAttribute("aria-describedby");
    else trigger.setAttribute("aria-describedby", describedBy);
  };
  const render = () => {
    popup.style.transform = `translate3d(${current.x}px, ${current.y}px, 0)`;
  };
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
          (700 * (target[axis] - current[axis]) - 45 * velocity[axis]) / 0.4;
        velocity[axis] += acceleration * step;
        current[axis] += velocity[axis] * step;
      }
    }
    render();
    if (
      Math.abs(target.x - current.x) +
        Math.abs(target.y - current.y) +
        Math.abs(velocity.x) +
        Math.abs(velocity.y) >
      0.15
    )
      frame = view.requestAnimationFrame(animate);
    else {
      current = { ...target };
      render();
    }
  };
  const position = (snap = false) => {
    if (!trigger || popup.hidden) return;
    const rect = trigger.getBoundingClientRect();
    const side = options.side ?? "top";
    const offset = options.sideOffset ?? 12;
    const padding = options.viewportPadding ?? 12;
    const width = popup.getBoundingClientRect().width;
    const height = popup.getBoundingClientRect().height;
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
    const x = keyboard || options.track?.x === "anchor" ? anchor.x : point.x;
    const y = keyboard || options.track?.y === "anchor" ? anchor.y : point.y;
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
      render();
    } else if (!frame) {
      lastTime = 0;
      frame = view.requestAnimationFrame(animate);
    }
  };
  const dismiss = () => {
    view.clearTimeout(openTimer);
    view.clearTimeout(closeTimer);
    view.cancelAnimationFrame(frame);
    frame = 0;
    swap?.cancel();
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
      const wasOpen = !popup.hidden;
      const previous = { ...target };
      restoreDescription();
      trigger = next;
      keyboard = isKeyboard;
      describedBy = next.getAttribute("aria-describedby");
      next.setAttribute(
        "aria-describedby",
        [describedBy, popup.id].filter(Boolean).join(" "),
      );
      const content = next.getAttribute("data-reuse-tooltip") ?? "";
      const changed = popup.textContent !== content;
      popup.textContent = content;
      popup.hidden = false;
      position(!wasOpen);
      if (
        wasOpen &&
        changed &&
        !reduced?.matches &&
        typeof popup.animate === "function"
      ) {
        swap?.cancel();
        const dx = target.x - previous.x;
        const dy = target.y - previous.y;
        const translate =
          Math.abs(dy) > Math.abs(dx)
            ? `0 ${dy >= 0 ? 8 : -8}px`
            : `${dx >= 0 ? 8 : -8}px 0`;
        swap = popup.animate(
          [
            { opacity: 0.4, translate },
            { opacity: 1, translate: "0 0" },
          ],
          { duration: 180, easing: "cubic-bezier(.33,1,.68,1)" },
        );
      }
    };
    if (popup.hidden && !isKeyboard && (options.delay ?? 150) > 0)
      openTimer = view.setTimeout(show, options.delay ?? 150);
    else show();
  };
  const find = (event: Event) =>
    event.target instanceof view.Element
      ? event.target.closest<HTMLElement>(selector)
      : null;
  const over = (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    const next = find(event);
    if (next && root.contains(next) && next !== trigger)
      open(next, false, { x: event.clientX, y: event.clientY });
  };
  const move = (event: PointerEvent) => {
    if (event.pointerType === "touch" || keyboard || !trigger) return;
    point = { x: event.clientX, y: event.clientY };
    position();
  };
  const scheduleClose = () => {
    view.clearTimeout(openTimer);
    view.clearTimeout(closeTimer);
    closeTimer = view.setTimeout(dismiss, options.closeDelay ?? 80);
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
    const content = trigger.getAttribute("data-reuse-tooltip") ?? "";
    if (popup.textContent !== content) popup.textContent = content;
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
