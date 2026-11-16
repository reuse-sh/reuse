import { claim, unclaim } from "./owners.js";
import {
  breakRows,
  type LastRow,
  openRowsFit,
  type Row,
  type RowMetrics,
  rowsHold,
  sameRows,
  shownRows,
} from "./rows.js";

export type { LastRow } from "./rows.js";

export interface JustifiedGalleryOptions {
  /** How far a full row may settle from the target height, as a fraction of it. Default 0.25. */
  tolerance?: number;
  /** How the last row that is not full is laid out. Default `start`. */
  lastRow?: LastRow;
  /** Rows after this count are hidden. Default 0, every row. */
  maxRows?: number;
}

export interface JustifiedGallery {
  /** Read the items, their proportions and the sizes again, and lay out from scratch. */
  refresh(): void;
  destroy(): void;
}

const lastRows: readonly LastRow[] = [
  "start",
  "center",
  "end",
  "justify",
  "hide",
];
const STATE = "data-re-justified";
const ROW = "data-re-justified-row";
const HIDDEN = "data-re-justified-hidden";
const RATIO = "--re-ratio";
const SHARE = "--re-justified-share";
const COUNT = "--re-justified-count";
const COLUMN_GAP = "--re-justified-column-gap";
const DEFAULT_ROW_HEIGHT = 240;
/** The width vertical scrollbars take from the container: the page's and every scrolling ancestor's. */
function scrollbarsAround(
  container: HTMLElement,
  view: Window & typeof globalThis,
): number {
  const root = container.ownerDocument.documentElement;
  let total = view.innerWidth - root.clientWidth;
  let node: Node | null = container.parentNode;
  while (node && node !== root) {
    if (node instanceof view.ShadowRoot) {
      node = node.host;
      continue;
    }
    if (node instanceof view.HTMLElement) {
      const styles = view.getComputedStyle(node);
      if (/auto|scroll/.test(styles.overflowY)) {
        total +=
          node.offsetWidth -
          node.clientWidth -
          (Number.parseFloat(styles.borderLeftWidth) || 0) -
          (Number.parseFloat(styles.borderRightWidth) || 0);
      }
    }
    node = node.parentNode;
  }
  return total;
}

/** What an item held before the controller wrote to it, and the ratio it wrote. */
interface Owned {
  style: boolean;
  ratio: string;
  share: string;
  count: string;
  row: string | null;
  hidden: string | null;
  wroteRatio?: string;
}

interface Layout {
  items: HTMLElement[];
  ratios: number[];
  rows: Row[];
  metrics: RowMetrics;
  scrollbars: number;
}

function media(item: HTMLElement): Element | null {
  if (/^(IMG|VIDEO|PICTURE)$/.test(item.tagName)) return item;
  return (
    item.querySelector(".re-justified-media") ??
    item.querySelector("img, video")
  );
}

function picture(element: Element | null): Element | null {
  if (element?.tagName === "PICTURE") return element.querySelector("img");
  if (element?.classList.contains("re-justified-media")) {
    return /^(IMG|VIDEO)$/.test(element.tagName)
      ? element
      : element.querySelector("img, video");
  }
  return element;
}

/** The size the markup declares first, so a picture that loads at a slightly other size does not move. */
function mediaRatio(element: Element | null): number {
  const source = picture(element);
  if (!source) return 0;
  const declaredWidth = Number(source.getAttribute("width"));
  const declaredHeight = Number(source.getAttribute("height"));
  if (declaredWidth > 0 && declaredHeight > 0) {
    return declaredWidth / declaredHeight;
  }
  const image = source as HTMLImageElement & HTMLVideoElement;
  const width =
    source.tagName === "VIDEO" ? image.videoWidth : image.naturalWidth;
  const height =
    source.tagName === "VIDEO" ? image.videoHeight : image.naturalHeight;
  return width > 0 && height > 0 ? width / height : 0;
}

function lengthOf(value: string, base: number): number {
  const number = Number.parseFloat(value);
  if (!Number.isFinite(number)) return 0;
  return value.trim().endsWith("%") ? (number / 100) * base : number;
}

export function createJustifiedGallery(
  container: HTMLElement,
  options: JustifiedGalleryOptions = {},
): JustifiedGallery {
  const view = container.ownerDocument.defaultView;
  if (!view) throw new Error("Justified gallery requires a browser document.");
  const tolerance = options.tolerance ?? 0.25;
  if (!Number.isFinite(tolerance) || tolerance < 0) {
    throw new RangeError("Justified gallery tolerance must be zero or more.");
  }
  const lastRow = options.lastRow ?? "start";
  if (!lastRows.includes(lastRow)) {
    throw new RangeError(
      "Justified gallery lastRow must be start, center, end, justify or hide.",
    );
  }
  const maxRows = options.maxRows ?? 0;
  if (!Number.isInteger(maxRows) || maxRows < 0) {
    throw new RangeError(
      "Justified gallery maxRows must be a whole number, 0 for every row.",
    );
  }

  const hadClass = container.classList.contains("re-justified");
  const hadClassAttribute = container.hasAttribute("class");
  const previousState = container.getAttribute(STATE);
  const previousGap = container.style.getPropertyValue(COLUMN_GAP);
  const hadStyle = container.hasAttribute("style");
  const owned = new Map<HTMLElement, Owned>();
  let current: Layout | undefined;
  // Rows given up when a scrollbar took or gave back exactly the width that
  // changed, so a scrollbar that comes and goes with the gallery's own height
  // does not flip the rows with it.
  let abandoned: { rows: Row[]; width: number } | undefined;
  let pending = false;
  let destroyed = false;

  const own = (item: HTMLElement) => {
    let entry = owned.get(item);
    if (!entry) {
      claim(item, release);
      entry = {
        style: item.hasAttribute("style"),
        ratio: item.style.getPropertyValue(RATIO),
        share: item.style.getPropertyValue(SHARE),
        count: item.style.getPropertyValue(COUNT),
        row: item.getAttribute(ROW),
        hidden: item.getAttribute(HIDDEN),
      };
      owned.set(item, entry);
    }
    return entry;
  };

  function release(item: HTMLElement) {
    const entry = owned.get(item);
    if (!entry) return;
    owned.delete(item);
    unclaim(item, release);
    const restore = (name: string, value: string) => {
      if (value) item.style.setProperty(name, value);
      else item.style.removeProperty(name);
    };
    // A ratio the page set since is the page's, not one to put back.
    if (
      item.style.getPropertyValue(RATIO) === (entry.wroteRatio ?? entry.ratio)
    ) {
      restore(RATIO, entry.ratio);
    }
    restore(SHARE, entry.share);
    restore(COUNT, entry.count);
    if (entry.row === null) item.removeAttribute(ROW);
    else item.setAttribute(ROW, entry.row);
    if (entry.hidden === null) item.removeAttribute(HIDDEN);
    else item.setAttribute(HIDDEN, entry.hidden);
    if (!entry.style && !item.getAttribute("style")) {
      item.removeAttribute("style");
    }
  }

  const readItems = () =>
    Array.from(container.children).filter(
      (child): child is HTMLElement =>
        child instanceof view.HTMLElement &&
        (child.hasAttribute(HIDDEN) ||
          view.getComputedStyle(child).display !== "none"),
    );

  // Once the page sets the ratio itself, it is the page's from then on, even
  // when it later sets a value the controller once wrote.
  const isOwnRatio = (item: HTMLElement) => {
    const entry = owned.get(item);
    if (entry?.wroteRatio === undefined) return false;
    if (item.style.getPropertyValue(RATIO) === entry.wroteRatio) return true;
    entry.wroteRatio = undefined;
    return false;
  };

  // A ratio the page declares wins. One the controller wrote is read again
  // from the picture each time, since the picture may have loaded since.
  const readRatio = (item: HTMLElement) => {
    const declared = isOwnRatio(item)
      ? 0
      : Number.parseFloat(view.getComputedStyle(item).getPropertyValue(RATIO));
    return declared > 0 ? declared : mediaRatio(media(item)) || 1;
  };

  const readMetrics = (): RowMetrics => {
    const styles = view.getComputedStyle(container);
    const contentWidth =
      container.clientWidth -
      (Number.parseFloat(styles.paddingLeft) || 0) -
      (Number.parseFloat(styles.paddingRight) || 0);
    return {
      width: contentWidth,
      gap: lengthOf(styles.columnGap, contentWidth),
      rowHeight:
        Number.parseFloat(
          styles.getPropertyValue("--re-justified-row-height"),
        ) || DEFAULT_ROW_HEIGHT,
      tolerance,
    };
  };

  const apply = (layout: Layout) => {
    const shown = shownRows(layout.rows, lastRow, maxRows);
    container.setAttribute(STATE, lastRow);
    container.style.setProperty(COLUMN_GAP, `${layout.metrics.gap}px`);
    layout.rows.forEach((row, rowIndex) => {
      let sum = 0;
      for (let index = row.start; index < row.end; index++) {
        sum += layout.ratios[index];
      }
      for (let index = row.start; index < row.end; index++) {
        const item = layout.items[index];
        const entry = own(item);
        const declared =
          !isOwnRatio(item) &&
          Number.parseFloat(
            view.getComputedStyle(item).getPropertyValue(RATIO),
          ) > 0;
        if (!declared) {
          entry.wroteRatio = String(layout.ratios[index]);
          item.style.setProperty(RATIO, entry.wroteRatio);
        }
        item.style.setProperty(SHARE, String(layout.ratios[index] / sum));
        item.style.setProperty(COUNT, String(row.end - row.start));
        if (row.full) item.removeAttribute(ROW);
        else item.setAttribute(ROW, "open");
        if (rowIndex < shown) item.removeAttribute(HIDDEN);
        else item.setAttribute(HIDDEN, "");
      }
    });
  };

  const sameContent = (items: HTMLElement[], ratios: number[]) =>
    current !== undefined &&
    current.items.length === items.length &&
    items.every(
      (item, index) =>
        item === current?.items[index] &&
        ratios[index] === current.ratios[index],
    );

  const layout = (fresh: boolean) => {
    if (destroyed) return;
    for (const item of [...owned.keys()]) {
      if (item.parentElement !== container) release(item);
    }
    const metrics = readMetrics();
    if (metrics.width <= 0) {
      pending = true;
      mutation?.takeRecords();
      return;
    }
    pending = false;
    const scrollbars = scrollbarsAround(container, view);
    const items = readItems();
    const ratios = items.map(readRatio);
    const unchanged = !fresh && sameContent(items, ratios);
    const sameHeight = current?.metrics.rowHeight === metrics.rowHeight;
    const kept = unchanged && sameHeight ? current : undefined;
    let rows: Row[];
    if (kept && rowsHold(kept.rows, ratios, metrics)) {
      rows = kept.rows;
    } else {
      const optimal = breakRows(ratios, metrics, lastRow);
      const flipsBack =
        abandoned !== undefined &&
        Math.abs(metrics.width - abandoned.width) < 1 &&
        sameRows(optimal, abandoned.rows);
      if (
        kept &&
        (sameRows(optimal, kept.rows) ||
          (flipsBack && openRowsFit(kept.rows, ratios, metrics)))
      ) {
        rows = kept.rows;
      } else {
        const byScrollbar =
          kept !== undefined &&
          Math.abs(
            kept.metrics.width - metrics.width - (scrollbars - kept.scrollbars),
          ) < 1;
        abandoned =
          kept && byScrollbar
            ? { rows: kept.rows, width: kept.metrics.width }
            : undefined;
        rows = optimal;
      }
    }
    const next = { items, ratios, rows, metrics, scrollbars };
    if (kept && rows === kept.rows) {
      if (kept.metrics.gap !== metrics.gap) {
        container.style.setProperty(COLUMN_GAP, `${metrics.gap}px`);
      }
    } else {
      apply(next);
    }
    current = next;
    mutation?.takeRecords();
  };

  // Laid out on the next frame rather than inside the observer: the layout
  // changes the container's height, which the observer would report again in
  // the same frame. Until then the rows scale with the container. Pictures
  // that load in one frame share one layout.
  let frame = 0;
  let loaded = false;
  const schedule = () => {
    if (frame) return;
    frame = view.requestAnimationFrame(() => {
      frame = 0;
      const next = readMetrics();
      const last = current?.metrics;
      // A media query or an ancestor can change the gap or the row height
      // without touching the container's own attributes.
      const changed =
        !last ||
        next.width !== last.width ||
        next.gap !== last.gap ||
        next.rowHeight !== last.rowHeight;
      if (next.width > 0 && (loaded || pending || changed)) {
        loaded = false;
        layout(false);
      }
    });
  };
  const resize = view.ResizeObserver
    ? new view.ResizeObserver(schedule)
    : undefined;
  // The container's style and class can change the row height or the gap.
  // Item style, class and hidden can show, hide or re-ratio an item; a
  // picture's size attributes and source can change its ratio at any depth.
  const mutation = view.MutationObserver
    ? new view.MutationObserver((records) => {
        const relevant = records.some(
          (record) =>
            record.type === "childList" ||
            record.attributeName === "width" ||
            record.attributeName === "height" ||
            record.attributeName === "src" ||
            record.target === container ||
            (record.target as Element).parentElement === container,
        );
        if (relevant) layout(false);
      })
    : undefined;
  const onLoad = (event: Event) => {
    if (event.target === container) return;
    loaded = true;
    schedule();
  };

  if (!hadClass) container.classList.add("re-justified");
  layout(true);
  resize?.observe(container);
  mutation?.observe(container, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["style", "class", "hidden", "width", "height", "src"],
  });
  container.addEventListener("load", onLoad, true);
  container.addEventListener("loadedmetadata", onLoad, true);

  return {
    refresh() {
      layout(true);
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
      if (previousGap) container.style.setProperty(COLUMN_GAP, previousGap);
      else container.style.removeProperty(COLUMN_GAP);
      if (!hadStyle && !container.getAttribute("style")) {
        container.removeAttribute("style");
      }
      if (previousState === null) container.removeAttribute(STATE);
      else container.setAttribute(STATE, previousState);
      if (!hadClass) container.classList.remove("re-justified");
      if (!hadClassAttribute && !container.getAttribute("class")) {
        container.removeAttribute("class");
      }
      current = undefined;
    },
  };
}
