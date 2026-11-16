import { placeLanes } from "./lanes.js";
import { claim, unclaim } from "./owners.js";
import { resolveTolerance } from "./tolerance.js";

export interface Masonry {
  /** Whether the browser lays the items out itself with `display: grid-lanes`. */
  readonly native: boolean;
  /** Measure the items again and place them. Does nothing when native. */
  refresh(): void;
  destroy(): void;
}

const STATE = "data-re-masonry";

/** What an item held before the fallback wrote to it, and what it wrote last. */
interface Owned {
  style: boolean;
  column: string;
  margin: string;
  wroteColumn?: string;
  wroteMargin?: string;
}

function spanOf(value: string): number {
  const match = /span\s+(\d+)/.exec(value);
  return match ? Number(match[1]) : 1;
}

/** Track sizes of a resolved grid-template-columns, without its line names. */
function tracksOf(value: string): number[] {
  return value
    .replace(/\[[^\]]*\]/g, " ")
    .trim()
    .split(/\s+/)
    .map(Number.parseFloat)
    .filter(Number.isFinite);
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
  const owned = new Map<HTMLElement, Owned>();
  const observed = new Set<HTMLElement>();
  let frame = 0;
  let destroyed = false;

  const own = (item: HTMLElement) => {
    let entry = owned.get(item);
    if (!entry) {
      claim(item, release);
      entry = {
        style: item.hasAttribute("style"),
        column: item.style.gridColumn,
        margin: item.style.marginTop,
      };
      owned.set(item, entry);
    }
    // A value the page set since the last placement is the page's now.
    if (
      entry.wroteColumn !== undefined &&
      item.style.gridColumn !== entry.wroteColumn
    ) {
      entry.column = item.style.gridColumn;
    }
    if (
      entry.wroteMargin !== undefined &&
      item.style.marginTop !== entry.wroteMargin
    ) {
      entry.margin = item.style.marginTop;
    }
    return entry;
  };

  function release(item: HTMLElement) {
    const entry = owned.get(item);
    if (!entry) return;
    owned.delete(item);
    unclaim(item, release);
    if (item.style.gridColumn === (entry.wroteColumn ?? entry.column)) {
      item.style.gridColumn = entry.column;
    }
    if (item.style.marginTop === (entry.wroteMargin ?? entry.margin)) {
      item.style.marginTop = entry.margin;
    }
    if (!entry.style && !item.getAttribute("style")) {
      item.removeAttribute("style");
    }
  }

  const place = () => {
    if (destroyed) return;
    for (const item of [...owned.keys()]) {
      if (item.parentElement !== container) release(item);
    }
    for (const item of [...observed]) {
      if (item.parentElement !== container) {
        resize?.unobserve(item);
        observed.delete(item);
      }
    }
    const styles = view.getComputedStyle(container);
    const contentWidth =
      container.clientWidth -
      (Number.parseFloat(styles.paddingLeft) || 0) -
      (Number.parseFloat(styles.paddingRight) || 0);
    if (contentWidth <= 0) {
      mutation?.takeRecords();
      return;
    }
    container.setAttribute(STATE, "");
    // A child out of the flow (a spinner, an overlay) takes no place in a lane.
    const children = Array.from(container.children).filter(
      (child): child is HTMLElement =>
        child instanceof view.HTMLElement &&
        !/^(absolute|fixed)$/.test(view.getComputedStyle(child).position),
    );
    // Hidden items stay observed: showing one changes its size.
    for (const item of children) {
      if (!observed.has(item)) {
        observed.add(item);
        resize?.observe(item);
      }
      const entry = own(item);
      item.style.gridColumn = entry.column;
      item.style.marginTop = entry.margin;
    }
    const items = children.filter(
      (item) => view.getComputedStyle(item).display !== "none",
    );
    // The page's own spans and margins, read with the fallback's taken off.
    // Every item then starts in the first lane, so a span adds no tracks.
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
      tracksOf(view.getComputedStyle(container).gridTemplateColumns).length,
    );
    // Read the widths with every lane holding an item: a plain grid collapses
    // the empty tracks of `auto-fit`, where grid lanes keep them.
    items.forEach((item, index) => {
      item.style.gridColumn = String((index % lanes) + 1);
    });
    const tracks = tracksOf(
      view.getComputedStyle(container).gridTemplateColumns,
    );
    const spans = authored.map((item) => Math.min(lanes, item.span));
    const even = tracks.every((track) => track === tracks[0]);
    const sizes = items.map(() => [] as number[]);
    const outer = (item: HTMLElement, index: number) =>
      item.getBoundingClientRect().height +
      authored[index].margin +
      (Number.parseFloat(view.getComputedStyle(item).marginBottom) || 0);
    // Measured with every lane holding an item, as the widths were read:
    // equal lanes once, in place; lanes of different widths once per lane,
    // each pass turning every item one lane further round, so each item is
    // measured at every start it could take.
    for (let turn = 0; turn < (even ? 1 : lanes); turn++) {
      const starts = items.map((_, index) =>
        Math.min((index + turn) % lanes, lanes - spans[index]),
      );
      items.forEach((item, index) => {
        item.style.gridColumn = `${starts[index] + 1} / span ${spans[index]}`;
      });
      items.forEach((item, index) => {
        sizes[index][even ? 0 : starts[index]] = outer(item, index);
      });
    }
    const { placements } = placeLanes(
      items.map((_, index) => ({
        size: even ? sizes[index][0] : sizes[index],
        span: spans[index],
      })),
      lanes,
      // A percentage resolves against the lanes' height, which is not known
      // while they are laid out, so grid lanes take it as no gap at all.
      styles.rowGap.trim().endsWith("%")
        ? 0
        : Number.parseFloat(styles.rowGap) || 0,
      // The stylesheet registers the property, so it computes to a keyword,
      // pixels, a percentage, or a math function of them. WebKit, the one
      // engine shipping grid lanes, resolves a percentage here against zero;
      // the WebKit parity test fails when that changes.
      resolveTolerance(
        styles.getPropertyValue("--re-masonry-tolerance"),
        0,
        Number.parseFloat(styles.fontSize) || 16,
      ),
    );
    placements.forEach((placement, index) => {
      const item = items[index];
      const entry = owned.get(item) as Owned;
      item.style.gridColumn = `${placement.lane + 1} / span ${placement.span}`;
      item.style.marginTop = `${placement.offset + authored[index].margin}px`;
      entry.wroteColumn = item.style.gridColumn;
      entry.wroteMargin = item.style.marginTop;
    });
    mutation?.takeRecords();
  };

  // Placed on the next frame rather than inside the observer: placing changes
  // the container's height, which the observer would report again in the same
  // frame. Items that change size in one frame share one placement. A picture's
  // load schedules from its own task, so the placement lands before the frame
  // that would show the taller item paints.
  const schedule = () => {
    if (frame) return;
    frame = view.requestAnimationFrame(() => {
      frame = 0;
      place();
    });
  };
  const resize = view.ResizeObserver
    ? new view.ResizeObserver(schedule)
    : undefined;
  // Hiding, showing or re-spanning an item changes its size, which the resize
  // observer reports; only items coming and going need watching here.
  const mutation = view.MutationObserver
    ? new view.MutationObserver(() => place())
    : undefined;

  const onLoad = (event: Event) => {
    if (event.target !== container) schedule();
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
      for (const item of [...owned.keys()]) release(item);
      observed.clear();
      if (previousState === null) container.removeAttribute(STATE);
      else container.setAttribute(STATE, previousState);
      restoreClass();
    },
  };
}
