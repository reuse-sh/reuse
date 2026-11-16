import {
  breakRows,
  type LastRow,
  type Row,
  type RowMetrics,
  rowsCost,
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

interface Written {
  style: boolean;
  ratio: string;
  share: string;
  count: string;
  row: string | null;
  hidden: string | null;
}

interface Layout {
  items: HTMLElement[];
  ratios: number[];
  rows: Row[];
  metrics: RowMetrics;
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

function naturalRatio(element: Element | null): number {
  const source = picture(element);
  if (!source) return 0;
  const image = source as HTMLImageElement & HTMLVideoElement;
  const width =
    source.tagName === "VIDEO" ? image.videoWidth : image.naturalWidth;
  const height =
    source.tagName === "VIDEO" ? image.videoHeight : image.naturalHeight;
  if (width > 0 && height > 0) return width / height;
  const attributeWidth = Number(source.getAttribute("width"));
  const attributeHeight = Number(source.getAttribute("height"));
  return attributeWidth > 0 && attributeHeight > 0
    ? attributeWidth / attributeHeight
    : 0;
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
  const written = new Map<HTMLElement, Written>();
  const seen = new WeakSet<HTMLElement>();
  const authored = new WeakSet<HTMLElement>();
  let current: Layout | undefined;
  let width = 0;
  let pending = false;
  let destroyed = false;

  const write = (item: HTMLElement) => {
    if (written.has(item)) return;
    written.set(item, {
      style: item.hasAttribute("style"),
      ratio: item.style.getPropertyValue(RATIO),
      share: item.style.getPropertyValue(SHARE),
      count: item.style.getPropertyValue(COUNT),
      row: item.getAttribute(ROW),
      hidden: item.getAttribute(HIDDEN),
    });
  };

  const readItems = () =>
    Array.from(container.children).filter(
      (child): child is HTMLElement =>
        child instanceof view.HTMLElement &&
        (child.hasAttribute(HIDDEN) ||
          view.getComputedStyle(child).display !== "none"),
    );

  const declaredRatio = (item: HTMLElement) =>
    Number.parseFloat(view.getComputedStyle(item).getPropertyValue(RATIO));

  // A ratio the page declares wins. One the controller wrote is read again
  // from the picture each time, since the picture may have loaded since.
  const readRatio = (item: HTMLElement) => {
    if (!seen.has(item)) {
      seen.add(item);
      if (declaredRatio(item) > 0) authored.add(item);
    }
    const declared = authored.has(item) ? declaredRatio(item) : 0;
    return declared > 0 ? declared : naturalRatio(media(item)) || 1;
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
        write(item);
        if (!authored.has(item)) {
          item.style.setProperty(RATIO, String(layout.ratios[index]));
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
    const metrics = readMetrics();
    if (metrics.width <= 0) {
      pending = true;
      return;
    }
    pending = false;
    width = metrics.width;
    const items = readItems();
    const ratios = items.map(readRatio);
    const unchanged = !fresh && sameContent(items, ratios);
    const sameHeight = current?.metrics.rowHeight === metrics.rowHeight;
    const kept = unchanged && sameHeight ? current : undefined;
    let rows = kept?.rows;
    if (!kept || !rowsHold(kept.rows, ratios, metrics)) {
      const optimal = breakRows(ratios, metrics, lastRow);
      if (
        !kept ||
        (!sameRows(optimal, kept.rows) &&
          rowsCost(optimal, ratios, metrics) <
            rowsCost(kept.rows, ratios, metrics))
      ) {
        rows = optimal;
      }
    }
    const next = { items, ratios, rows: rows ?? [], metrics };
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
  // the same frame. Until then the rows scale with the container.
  let frame = 0;
  const resize = view.ResizeObserver
    ? new view.ResizeObserver(() => {
        if (frame) return;
        frame = view.requestAnimationFrame(() => {
          frame = 0;
          const next = readMetrics().width;
          if (next > 0 && (pending || next !== width)) layout(false);
        });
      })
    : undefined;
  // Item style, class and hidden can show, hide or re-ratio an item; a picture's
  // size attributes and source can change its ratio at any depth.
  const mutation = view.MutationObserver
    ? new view.MutationObserver((records) => {
        const relevant = records.some(
          (record) =>
            record.type === "childList" ||
            record.attributeName === "width" ||
            record.attributeName === "height" ||
            record.attributeName === "src" ||
            (record.target as Element).parentElement === container,
        );
        if (relevant) layout(false);
      })
    : undefined;
  const onLoad = (event: Event) => {
    if (event.target !== container) layout(false);
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
      for (const [item, original] of written) {
        const restore = (name: string, value: string) => {
          if (value) item.style.setProperty(name, value);
          else item.style.removeProperty(name);
        };
        restore(RATIO, original.ratio);
        restore(SHARE, original.share);
        restore(COUNT, original.count);
        if (original.row === null) item.removeAttribute(ROW);
        else item.setAttribute(ROW, original.row);
        if (original.hidden === null) item.removeAttribute(HIDDEN);
        else item.setAttribute(HIDDEN, original.hidden);
        if (!original.style && !item.getAttribute("style")) {
          item.removeAttribute("style");
        }
      }
      written.clear();
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
