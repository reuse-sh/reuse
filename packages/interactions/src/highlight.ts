export interface MovingHighlightOptions {
  rowSelector?: string;
  selectedSelector?: string;
}

export function createMovingHighlight(
  root: HTMLElement,
  options: MovingHighlightOptions = {},
) {
  const view = root.ownerDocument.defaultView;
  if (!view) throw new Error("The root must belong to a window.");
  const rowSelector = options.rowSelector ?? "[data-reuse-row]";
  const selectedSelector =
    options.selectedSelector ??
    '[data-current], [aria-selected="true"], [data-highlighted]';
  const originalStyle = root.getAttribute("style");
  const originalRoot = root.getAttribute("data-reuse-highlight-root");
  root.setAttribute("data-reuse-highlight-root", "");
  if (
    view.getComputedStyle(root).position === "static" ||
    !view.getComputedStyle(root).position
  )
    root.style.position = "relative";
  root.style.isolation = "isolate";
  const fill = root.ownerDocument.createElement("span");
  fill.className = "reuse-moving-highlight";
  fill.setAttribute("aria-hidden", "true");
  root.prepend(fill);
  const reduced = view.matchMedia?.("(prefers-reduced-motion: reduce)");
  let hovered: HTMLElement | null = null;
  let keyboardLeads = false;
  let placed: HTMLElement | null = null;
  let placedTop = 0;
  let fadeTimer: number | undefined;
  let hideTimer: number | undefined;
  let destroyed = false;
  const eligible = (row: HTMLElement | null): row is HTMLElement =>
    Boolean(
      row?.isConnected &&
        root.contains(row) &&
        row.closest("[data-reuse-highlight-root]") === root &&
        !row.matches(
          ':disabled,[aria-disabled="true"],[data-disabled],[hidden]',
        ),
    );
  const rowOf = (target: EventTarget | null) =>
    target instanceof view.Element
      ? target.closest<HTMLElement>(rowSelector)
      : null;
  const focused = () => {
    const row = rowOf(root.ownerDocument.activeElement);
    return eligible(row) ? row : null;
  };
  const pick = () => {
    const focus = focused();
    if (keyboardLeads && focus) return focus;
    if (eligible(hovered)) return hovered;
    if (focus) return focus;
    return (
      Array.from(root.querySelectorAll<HTMLElement>(rowSelector)).find(
        (row) => eligible(row) && row.matches(selectedSelector),
      ) ?? null
    );
  };
  const place = (row: HTMLElement, instant: boolean) => {
    const box = root.getBoundingClientRect();
    const rect = row.getBoundingClientRect();
    const scaleX = root.offsetWidth ? box.width / root.offsetWidth || 1 : 1;
    const scaleY = root.offsetHeight ? box.height / root.offsetHeight || 1 : 1;
    const top = (rect.top - box.top) / scaleY + root.scrollTop - root.clientTop;
    const left =
      (rect.left - box.left) / scaleX + root.scrollLeft - root.clientLeft;
    fill.dataset.move =
      instant || reduced?.matches ? "instant" : placed ? "slide" : "appear";
    fill.style.transform = `translate(${left}px, ${top}px)`;
    fill.style.width = `${rect.width / scaleX}px`;
    fill.style.height = `${rect.height / scaleY}px`;
    fill.style.borderRadius = view.getComputedStyle(row).borderRadius;
    fill.dataset.visible = "true";
    placed = row;
    placedTop = top;
  };
  const sync = (instant = false) => {
    if (destroyed) return;
    view.clearTimeout(fadeTimer);
    view.clearTimeout(hideTimer);
    const row = pick();
    if (!row) {
      hideTimer = view.setTimeout(() => {
        fill.dataset.visible = "false";
        placed = null;
        hideTimer = view.setTimeout(() => {
          fill.style.width = "0px";
          fill.style.height = "0px";
        }, 100);
      }, 80);
      return;
    }
    const box = root.getBoundingClientRect();
    const rect = row.getBoundingClientRect();
    const scale = root.offsetHeight ? box.height / root.offsetHeight || 1 : 1;
    const top = (rect.top - box.top) / scale + root.scrollTop - root.clientTop;
    if (
      !instant &&
      placed &&
      !reduced?.matches &&
      Math.abs(top - placedTop) > (rect.height / scale) * 3
    ) {
      fill.dataset.visible = "false";
      fadeTimer = view.setTimeout(() => {
        if (eligible(row)) place(row, true);
      }, 90);
    } else place(row, instant);
  };
  const over = (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    hovered = rowOf(event.target);
    sync();
  };
  const move = (event: PointerEvent) => {
    if (event.pointerType !== "touch" && keyboardLeads) {
      keyboardLeads = false;
      sync();
    }
  };
  const leave = () => {
    hovered = null;
    sync();
  };
  const focusIn = () => {
    keyboardLeads = true;
    sync();
  };
  const focusOut = (event: FocusEvent) => {
    if (
      event.relatedTarget instanceof view.Node &&
      root.contains(event.relatedTarget)
    )
      return;
    keyboardLeads = false;
    sync();
  };
  const resize = () => sync(true);
  const observer = new view.MutationObserver((records) => {
    if (records.every((record) => record.target === fill)) return;
    observeRows();
    sync();
  });
  const resizeObserver =
    typeof view.ResizeObserver === "function"
      ? new view.ResizeObserver(resize)
      : null;
  const observeRows = () => {
    resizeObserver?.disconnect();
    resizeObserver?.observe(root);
    for (const row of root.querySelectorAll<HTMLElement>(rowSelector))
      resizeObserver?.observe(row);
  };
  observer.observe(root, {
    attributes: true,
    childList: true,
    subtree: true,
    characterData: true,
  });
  observeRows();
  root.addEventListener("pointerover", over);
  root.addEventListener("pointermove", move);
  root.addEventListener("pointerleave", leave);
  root.addEventListener("focusin", focusIn);
  root.addEventListener("focusout", focusOut);
  root.addEventListener("scroll", resize, true);
  view.addEventListener("resize", resize);
  reduced?.addEventListener("change", resize);
  sync();
  return {
    refresh: resize,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      view.clearTimeout(fadeTimer);
      view.clearTimeout(hideTimer);
      observer.disconnect();
      resizeObserver?.disconnect();
      root.removeEventListener("pointerover", over);
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerleave", leave);
      root.removeEventListener("focusin", focusIn);
      root.removeEventListener("focusout", focusOut);
      root.removeEventListener("scroll", resize, true);
      view.removeEventListener("resize", resize);
      reduced?.removeEventListener("change", resize);
      fill.remove();
      if (originalStyle === null) root.removeAttribute("style");
      else root.setAttribute("style", originalStyle);
      if (originalRoot === null)
        root.removeAttribute("data-reuse-highlight-root");
      else root.setAttribute("data-reuse-highlight-root", originalRoot);
    },
  };
}
