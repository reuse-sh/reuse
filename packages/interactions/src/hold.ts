export interface HoldToConfirmOptions {
  onConfirm: () => void;
  holdMs?: number;
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
  const originalStyle = button.getAttribute("style");
  const originalHolding = button.getAttribute("data-holding");
  const hadClass = button.classList.contains("reuse-hold");
  button.classList.add("reuse-hold");
  const fill = button.ownerDocument.createElement("span");
  fill.className = "reuse-hold-fill";
  fill.setAttribute("aria-hidden", "true");
  button.append(fill);
  let timer: number | undefined;
  let holdingPointer: number | undefined;
  let active = false;
  let destroyed = false;
  const cancel = () => {
    view.clearTimeout(timer);
    timer = undefined;
    holdingPointer = undefined;
    active = false;
    button.removeAttribute("data-holding");
    fill.style.transitionDuration = "200ms";
    fill.style.transform = "scaleX(0)";
  };
  const start = () => {
    if (
      destroyed ||
      button.disabled ||
      button.getAttribute("aria-disabled") === "true" ||
      active
    )
      return;
    active = true;
    button.setAttribute("data-holding", "");
    fill.style.transitionDuration = `${duration}ms`;
    fill.style.transform = "scaleX(1)";
    timer = view.setTimeout(() => {
      timer = undefined;
      if (button.disabled || button.getAttribute("aria-disabled") === "true")
        return cancel();
      button.removeAttribute("data-holding");
      options.onConfirm();
    }, duration);
  };
  const pointerDown = (event: PointerEvent) => {
    if (event.button !== 0 || event.isPrimary === false) return;
    start();
    if (active) holdingPointer = event.pointerId;
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
    if (
      event.detail === 0 &&
      !active &&
      !button.disabled &&
      button.getAttribute("aria-disabled") !== "true" &&
      !destroyed
    )
      options.onConfirm();
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
    if (button.disabled || button.getAttribute("aria-disabled") === "true")
      cancel();
  });
  observer.observe(button, {
    attributes: true,
    attributeFilter: ["disabled", "aria-disabled"],
  });
  return {
    cancel,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cancel();
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
      if (!hadClass) button.classList.remove("reuse-hold");
      if (originalStyle === null) button.removeAttribute("style");
      else button.setAttribute("style", originalStyle);
      if (originalHolding === null) button.removeAttribute("data-holding");
      else button.setAttribute("data-holding", originalHolding);
    },
  };
}
