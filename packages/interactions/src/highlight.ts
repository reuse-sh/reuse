export interface MovingHighlightOptions {
  rowSelector?: string;
  selectedSelector?: string;
  mode?: "hover" | "selected";
  className?: string;
}

type Move = "appear" | "slide" | "fade" | "instant";

interface RootClaim {
  count: number;
  style: string | null;
  marker: string | null;
  fills: Set<Element>;
}

const JUMP_ROW_HEIGHTS = 3;
const FADE_MS = 90;
const HANDOVER_MS = 80;
const COLLAPSE_MS = 100;
const claims = new WeakMap<HTMLElement, RootClaim>();

function claimRoot(root: HTMLElement, view: Window, fill: Element) {
  let claim = claims.get(root);
  if (!claim) {
    claim = {
      count: 0,
      style: root.getAttribute("style"),
      marker: root.getAttribute("data-reuse-highlight-root"),
      fills: new Set(),
    };
    claims.set(root, claim);
    root.setAttribute("data-reuse-highlight-root", "");
    const position = view.getComputedStyle(root).position;
    if (position === "static" || !position) root.style.position = "relative";
    root.style.isolation = "isolate";
  }
  claim.count++;
  claim.fills.add(fill);
  return claim;
}

function releaseRoot(root: HTMLElement, fill: Element) {
  const claim = claims.get(root);
  if (!claim) return;
  claim.fills.delete(fill);
  if (--claim.count > 0) return;
  claims.delete(root);
  if (claim.style === null) root.removeAttribute("style");
  else root.setAttribute("style", claim.style);
  if (claim.marker === null) root.removeAttribute("data-reuse-highlight-root");
  else root.setAttribute("data-reuse-highlight-root", claim.marker);
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
  const followsPointer = (options.mode ?? "hover") === "hover";
  const fill = root.ownerDocument.createElement("span");
  fill.className = ["reuse-moving-highlight", options.className]
    .filter(Boolean)
    .join(" ");
  fill.setAttribute("aria-hidden", "true");
  fill.dataset.move = "appear";
  fill.dataset.visible = "false";
  const claim = claimRoot(root, view, fill);
  root.prepend(fill);
  const reduced = view.matchMedia?.("(prefers-reduced-motion: reduce)");
  let hovered: HTMLElement | null = null;
  let keyboardLeads = false;
  let placed: HTMLElement | null = null;
  let placedBox = { left: 0, top: 0, width: 0, height: 0 };
  let fadeTimer: number | undefined;
  let hideTimer: number | undefined;
  let collapseTimer: number | undefined;
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
  const selected = () =>
    Array.from(root.querySelectorAll<HTMLElement>(rowSelector)).find(
      (row) => eligible(row) && row.matches(selectedSelector),
    ) ?? null;
  const pick = () => {
    if (!followsPointer) return selected();
    const focus = focused();
    if (keyboardLeads && focus) return focus;
    if (eligible(hovered)) return hovered;
    return focus ?? selected();
  };
  const measure = (row: HTMLElement) => {
    const box = root.getBoundingClientRect();
    const rect = row.getBoundingClientRect();
    const scaleX = root.offsetWidth ? box.width / root.offsetWidth || 1 : 1;
    const scaleY = root.offsetHeight ? box.height / root.offsetHeight || 1 : 1;
    return {
      left: (rect.left - box.left) / scaleX + root.scrollLeft - root.clientLeft,
      top: (rect.top - box.top) / scaleY + root.scrollTop - root.clientTop,
      width: rect.width / scaleX,
      height: rect.height / scaleY,
    };
  };
  const setMove = (move: Move) => {
    fill.dataset.move = move === "slide" && reduced?.matches ? "instant" : move;
  };
  const place = (row: HTMLElement, next: typeof placedBox, move: Move) => {
    view.clearTimeout(collapseTimer);
    setMove(move);
    fill.style.translate = `${next.left}px ${next.top}px`;
    fill.style.width = `${next.width}px`;
    fill.style.height = `${next.height}px`;
    fill.style.borderRadius = view.getComputedStyle(row).borderRadius;
    fill.dataset.visible = "true";
    placed = row;
    placedBox = next;
  };
  const hide = () => {
    setMove("fade");
    fill.dataset.visible = "false";
    placed = null;
    view.clearTimeout(collapseTimer);
    collapseTimer = view.setTimeout(() => {
      fill.style.width = "0px";
      fill.style.height = "0px";
    }, COLLAPSE_MS);
  };
  const sync = (resized = false) => {
    if (destroyed) return;
    view.clearTimeout(fadeTimer);
    view.clearTimeout(hideTimer);
    const row = pick();
    if (!row) {
      if (placed) hideTimer = view.setTimeout(hide, HANDOVER_MS);
      return;
    }
    const next = measure(row);
    if (!placed) return place(row, next, "appear");
    if (
      row === placed &&
      next.left === placedBox.left &&
      next.top === placedBox.top &&
      next.width === placedBox.width &&
      next.height === placedBox.height
    )
      return;
    if (
      resized ||
      reduced?.matches ||
      Math.abs(next.top - placedBox.top) <= next.height * JUMP_ROW_HEIGHTS
    )
      return place(row, next, resized ? "instant" : "slide");
    hide();
    fadeTimer = view.setTimeout(() => {
      if (eligible(row)) place(row, measure(row), "appear");
    }, FADE_MS);
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
    if (records.every((record) => claim.fills.has(record.target as Element)))
      return;
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
  if (followsPointer) {
    root.addEventListener("pointerover", over);
    root.addEventListener("pointermove", move);
    root.addEventListener("pointerleave", leave);
    root.addEventListener("focusin", focusIn);
    root.addEventListener("focusout", focusOut);
  }
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
      view.clearTimeout(collapseTimer);
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
      releaseRoot(root, fill);
    },
  };
}
