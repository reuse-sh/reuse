export interface HoldToConfirmOptions {
  onConfirm: () => void;
  onReset?: () => void;
  holdMs?: number;
  resetMs?: number;
}

export function createHoldToConfirm(
  button: HTMLButtonElement,
  options: HoldToConfirmOptions,
) {
  const view = button.ownerDocument.defaultView;
  if (!view) throw new Error("The button must belong to a window.");
  const duration = options.holdMs ?? 1200;
  if (!Number.isFinite(duration) || duration <= 0)
    throw new RangeError("holdMs must be positive.");
  const resetMs = options.resetMs ?? 1600;
  if (!Number.isFinite(resetMs) || resetMs <= 0)
    throw new RangeError("resetMs must be positive.");
  const originalStyle = button.getAttribute("style");
  const originalHolding = button.getAttribute("data-holding");
  const originalConfirmed = button.getAttribute("data-confirmed");
  const hadClass = button.classList.contains("re-hold");
  button.classList.add("re-hold");
  const fill = button.ownerDocument.createElement("span");
  fill.className = "re-hold-fill";
  fill.setAttribute("aria-hidden", "true");
  button.append(fill);
  let state: "idle" | "holding" | "confirmed" = "idle";
  let timer: number | undefined;
  let holdingPointer: number | undefined;
  let destroyed = false;
  const isDisabled = () =>
    button.disabled || button.getAttribute("aria-disabled") === "true";
  const empty = () => {
    view.clearTimeout(timer);
    timer = undefined;
    holdingPointer = undefined;
    state = "idle";
    fill.style.transitionDuration = "200ms";
    fill.style.transform = "scaleX(0)";
  };
  const cancel = () => {
    if (state !== "holding") return;
    button.removeAttribute("data-holding");
    empty();
  };
  const reset = () => {
    if (state !== "confirmed") return;
    button.removeAttribute("data-confirmed");
    empty();
    options.onReset?.();
  };
  const confirm = () => {
    state = "confirmed";
    holdingPointer = undefined;
    button.removeAttribute("data-holding");
    button.setAttribute("data-confirmed", "");
    fill.style.transform = "scaleX(1)";
    timer = view.setTimeout(reset, resetMs);
    options.onConfirm();
  };
  const start = () => {
    if (destroyed || isDisabled() || state !== "idle") return;
    state = "holding";
    button.setAttribute("data-holding", "");
    fill.style.transitionDuration = `${duration}ms`;
    fill.style.transform = "scaleX(1)";
    timer = view.setTimeout(() => {
      timer = undefined;
      if (isDisabled()) return cancel();
      confirm();
    }, duration);
  };
  const pointerDown = (event: PointerEvent) => {
    if (event.button !== 0 || event.isPrimary === false) return;
    start();
    if (state === "holding") holdingPointer = event.pointerId;
  };
  const pointerLeave = (event: PointerEvent) => {
    if (holdingPointer !== undefined && event.pointerId === holdingPointer)
      cancel();
  };
  const keyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") return cancel();
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    if (!event.repeat) start();
  };
  const keyUp = (event: KeyboardEvent) => {
    if (event.key === " " || event.key === "Enter") cancel();
  };
  const click = (event: MouseEvent) => {
    if (event.detail !== 0 || state !== "idle" || isDisabled() || destroyed)
      return;
    fill.style.transitionDuration = "200ms";
    confirm();
  };
  const onEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape") cancel();
  };
  button.addEventListener("pointerdown", pointerDown);
  button.addEventListener("pointerleave", pointerLeave);
  button.addEventListener("keydown", keyDown);
  button.addEventListener("click", click);
  button.addEventListener("blur", cancel);
  view.addEventListener("pointerup", cancel);
  view.addEventListener("pointercancel", cancel);
  view.addEventListener("keyup", keyUp);
  view.addEventListener("keydown", onEscape);
  view.addEventListener("blur", cancel);
  const observer = new view.MutationObserver(() => {
    if (isDisabled()) cancel();
  });
  observer.observe(button, {
    attributes: true,
    attributeFilter: ["disabled", "aria-disabled"],
  });
  return {
    cancel,
    reset,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      view.clearTimeout(timer);
      observer.disconnect();
      button.removeEventListener("pointerdown", pointerDown);
      button.removeEventListener("pointerleave", pointerLeave);
      button.removeEventListener("keydown", keyDown);
      button.removeEventListener("click", click);
      button.removeEventListener("blur", cancel);
      view.removeEventListener("pointerup", cancel);
      view.removeEventListener("pointercancel", cancel);
      view.removeEventListener("keyup", keyUp);
      view.removeEventListener("keydown", onEscape);
      view.removeEventListener("blur", cancel);
      fill.remove();
      if (!hadClass) button.classList.remove("re-hold");
      if (originalStyle === null) button.removeAttribute("style");
      else button.setAttribute("style", originalStyle);
      if (originalHolding === null) button.removeAttribute("data-holding");
      else button.setAttribute("data-holding", originalHolding);
      if (originalConfirmed === null) button.removeAttribute("data-confirmed");
      else button.setAttribute("data-confirmed", originalConfirmed);
    },
  };
}
