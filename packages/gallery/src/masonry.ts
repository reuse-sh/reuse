import { type LaneItem, placeLanes } from "./lanes.js";

export interface Masonry {
  /** Whether the browser lays the items out itself with `display: grid-lanes`. */
  readonly native: boolean;
  /** Measure the items again and place them. Does nothing when native. */
  refresh(): void;
  destroy(): void;
}

const STATE = "data-re-masonry";

interface Written {
  style: boolean;
  column: string;
  margin: string;
}

function spanOf(value: string): number {
  const match = /span\s+(\d+)/.exec(value);
  return match ? Number(match[1]) : 1;
}

export function createMasonry(container: HTMLElement): Masonry {
  const view = container.ownerDocument.defaultView;
  if (!view) throw new Error("Masonry requires a browser document.");
  const hadClass = container.classList.contains("re-masonry");
  const hadClassAttribute = container.hasAttribute("class");
  if (!hadClass) container.classList.add("re-masonry");
  const native = view.CSS?.supports?.("display", "grid-lanes") === true;

  const restoreClass = () => {
    if (!hadClass) container.classList.remove("re-masonry");
    if (!hadClassAttribute && !container.getAttribute("class")) {
      container.removeAttribute("class");
    }
  };

  if (native) {
    let destroyed = false;
    return {
      native,
      refresh() {},
      destroy() {
        if (destroyed) return;
        destroyed = true;
        restoreClass();
      },
    };
  }

  const previousState = container.getAttribute(STATE);
  const written = new Map<HTMLElement, Written>();
  const observed = new Set<HTMLElement>();
  let frame = 0;
  let destroyed = false;

  const readItems = () =>
    Array.from(container.children).filter(
      (child): child is HTMLElement =>
        child instanceof view.HTMLElement &&
        view.getComputedStyle(child).display !== "none",
    );

  const remember = (item: HTMLElement) => {
    if (written.has(item)) return;
    written.set(item, {
      style: item.hasAttribute("style"),
      column: item.style.gridColumn,
      margin: item.style.marginTop,
    });
  };

  const tolerance = (styles: CSSStyleDeclaration, contentWidth: number) => {
    const value = styles.getPropertyValue("--re-masonry-tolerance").trim();
    if (value === "infinite") return Number.POSITIVE_INFINITY;
    const number = Number.parseFloat(value);
    if (!Number.isFinite(number)) {
      return Number.parseFloat(styles.fontSize) || 16;
    }
    if (value.endsWith("%")) return (number / 100) * contentWidth;
    if (value.endsWith("em")) {
      return number * (Number.parseFloat(styles.fontSize) || 16);
    }
    return number;
  };

  const spans = new Map<HTMLElement, number>();

  // The page's top margin, not the one placing wrote, since the offset lives there.
  const measure = (items: HTMLElement[], margins: number[]): LaneItem[] =>
    items.map((item, index) => ({
      size:
        item.getBoundingClientRect().height +
        margins[index] +
        (Number.parseFloat(view.getComputedStyle(item).marginBottom) || 0),
      span: spans.get(item) ?? 1,
    }));

  const place = () => {
    if (destroyed) return;
    const styles = view.getComputedStyle(container);
    const contentWidth =
      container.clientWidth -
      (Number.parseFloat(styles.paddingLeft) || 0) -
      (Number.parseFloat(styles.paddingRight) || 0);
    if (contentWidth <= 0) return;
    container.setAttribute(STATE, "");
    const items = readItems();
    // The page's own placement, read with the controller's taken off. Every
    // item starts in the first lane, so a span never adds implicit tracks.
    for (const item of items) {
      remember(item);
      const original = written.get(item) as Written;
      item.style.gridColumn = original.column;
      item.style.marginTop = original.margin;
    }
    const authored = items.map((item) => {
      const own = view.getComputedStyle(item);
      return {
        span: Math.max(
          spanOf(own.gridColumnStart),
          spanOf(own.gridColumnEnd),
          spanOf(item.style.gridColumn),
        ),
        margin: Number.parseFloat(own.marginTop) || 0,
      };
    });
    for (const item of items) item.style.gridColumn = "1";
    const lanes = Math.max(
      1,
      view.getComputedStyle(container).gridTemplateColumns.split(/\s+/).length,
    );
    items.forEach((item, index) => {
      const span = Math.min(lanes, authored[index].span);
      spans.set(item, span);
      item.style.gridColumn = `1 / span ${span}`;
    });
    const gap = Number.parseFloat(styles.rowGap) || 0;
    const reach = tolerance(styles, contentWidth);
    const write = (sizes: LaneItem[]) => {
      const { placements } = placeLanes(sizes, lanes, gap, reach);
      placements.forEach((placement, index) => {
        const item = items[index];
        item.style.gridColumn = `${placement.lane + 1} / span ${placement.span}`;
        item.style.marginTop = `${placement.offset + authored[index].margin}px`;
      });
    };
    const margins = authored.map((item) => item.margin);
    const sizes = measure(items, margins);
    write(sizes);
    // Lanes of different widths give an item another height in its own lane.
    const placed = measure(items, margins);
    if (
      placed.some(
        (item, index) => Math.abs(item.size - sizes[index].size) > 0.5,
      )
    ) {
      write(placed);
    }
    for (const item of observed) {
      if (!items.includes(item)) {
        resize?.unobserve(item);
        observed.delete(item);
      }
    }
    for (const item of items) {
      if (!observed.has(item)) {
        observed.add(item);
        resize?.observe(item);
      }
    }
    mutation?.takeRecords();
  };

  // Placed on the next frame rather than inside the observer: placing changes
  // the container's height, which the observer would report again in the same
  // frame. A picture that loads is placed at once, from its load event.
  const resize = view.ResizeObserver
    ? new view.ResizeObserver(() => {
        if (frame) return;
        frame = view.requestAnimationFrame(() => {
          frame = 0;
          place();
        });
      })
    : undefined;
  // Hiding an item or changing its span changes its size, which the resize
  // observer reports; only items coming and going need watching here.
  const mutation = view.MutationObserver
    ? new view.MutationObserver(() => place())
    : undefined;
  const onLoad = (event: Event) => {
    if (event.target !== container) place();
  };

  place();
  resize?.observe(container);
  mutation?.observe(container, { childList: true });
  container.addEventListener("load", onLoad, true);
  container.addEventListener("loadedmetadata", onLoad, true);

  return {
    native,
    refresh() {
      place();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      view.cancelAnimationFrame(frame);
      resize?.disconnect();
      mutation?.disconnect();
      container.removeEventListener("load", onLoad, true);
      container.removeEventListener("loadedmetadata", onLoad, true);
      for (const [item, original] of written) {
        item.style.gridColumn = original.column;
        item.style.marginTop = original.margin;
        if (!original.style && !item.getAttribute("style")) {
          item.removeAttribute("style");
        }
      }
      written.clear();
      observed.clear();
      spans.clear();
      if (previousState === null) container.removeAttribute(STATE);
      else container.setAttribute(STATE, previousState);
      restoreClass();
    },
  };
}
