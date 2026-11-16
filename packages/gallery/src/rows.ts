export type LastRow = "start" | "center" | "end" | "justify" | "hide";

export interface RowMetrics {
  /** Content width of the container in pixels. */
  width: number;
  /** Gap between items in a row in pixels. */
  gap: number;
  /** Target row height in pixels. */
  rowHeight: number;
  /** Allowed deviation from the target height, as a fraction of it. */
  tolerance: number;
}

/** Items `start` to `end - 1`. A row that is not full keeps the target height. */
export interface Row {
  start: number;
  end: number;
  full: boolean;
}

export function rowHeightAt(
  ratios: readonly number[],
  start: number,
  end: number,
  { width, gap }: RowMetrics,
): number {
  let sum = 0;
  for (let index = start; index < end; index++) sum += ratios[index];
  return (width - gap * (end - start - 1)) / sum;
}

function rowCost(
  height: number,
  count: number,
  metrics: RowMetrics,
  outsidePenalty: number,
): number {
  const { rowHeight, tolerance } = metrics;
  // Measured as a scale, so a row half as tall is as wrong as one twice as tall.
  const deviation = Math.log(height / rowHeight);
  let cost = deviation * deviation * count;
  const low = rowHeight * (1 - tolerance);
  const high = rowHeight * (1 + tolerance);
  if (height < low || height > high) {
    const excess = Math.log(height < low ? low / height : height / high);
    cost += outsidePenalty * (1 + 100 * excess * excess);
  }
  return cost;
}

function fitsAtTarget(height: number, metrics: RowMetrics): boolean {
  return height >= metrics.rowHeight;
}

/**
 * Break the items into rows with the lowest total cost.
 *
 * A full row costs its squared deviation from the target per picture. A row
 * outside the height range costs more than every row inside it together, so a
 * break that keeps all rows in range always wins over one that does not.
 */
export function breakRows(
  ratios: readonly number[],
  metrics: RowMetrics,
  lastRow: LastRow = "start",
): Row[] {
  const count = ratios.length;
  if (!count) return [];
  const outsidePenalty = count + 1;
  const low = metrics.rowHeight * (1 - metrics.tolerance);
  const best = new Array<number>(count + 1).fill(Number.POSITIVE_INFINITY);
  const from = new Array<number>(count + 1).fill(0);
  best[0] = 0;
  for (let end = 1; end <= count; end++) {
    const isLast = end === count && lastRow !== "justify";
    let sum = 0;
    for (let start = end - 1; start >= 0; start--) {
      sum += ratios[start];
      const height = (metrics.width - metrics.gap * (end - start - 1)) / sum;
      const cost =
        isLast && fitsAtTarget(height, metrics)
          ? 0
          : rowCost(height, end - start, metrics, outsidePenalty);
      if (best[start] + cost < best[end]) {
        best[end] = best[start] + cost;
        from[end] = start;
      }
      // Below the range a longer row only costs more, and no earlier start
      // costs less than nothing, so no longer row can win.
      if (height < low && cost >= best[end]) break;
    }
  }
  const rows: Row[] = [];
  for (let end = count; end > 0; end = from[end]) {
    const start = from[end];
    const height = rowHeightAt(ratios, start, end, metrics);
    const full =
      end !== count || lastRow === "justify" || !fitsAtTarget(height, metrics);
    rows.unshift({ start, end, full });
  }
  return rows;
}

/** The total cost of these rows at the given metrics. */
export function rowsCost(
  rows: readonly Row[],
  ratios: readonly number[],
  metrics: RowMetrics,
): number {
  const outsidePenalty = ratios.length + 1;
  let total = 0;
  for (const row of rows) {
    if (!row.full) continue;
    const height = rowHeightAt(ratios, row.start, row.end, metrics);
    total += rowCost(height, row.end - row.start, metrics, outsidePenalty);
  }
  return total;
}

/**
 * Whether the rows still hold at new metrics: every full row inside the height
 * range, and a row that is not full still fits at the target height.
 */
export function rowsHold(
  rows: readonly Row[],
  ratios: readonly number[],
  metrics: RowMetrics,
): boolean {
  const low = metrics.rowHeight * (1 - metrics.tolerance);
  const high = metrics.rowHeight * (1 + metrics.tolerance);
  return rows.every((row) => {
    const height = rowHeightAt(ratios, row.start, row.end, metrics);
    if (!row.full) return fitsAtTarget(height, metrics);
    return height >= low && height <= high;
  });
}

/** How many rows are shown. `hide` drops a last row that is not full, unless it is the only one. */
export function shownRows(
  rows: readonly Row[],
  lastRow: LastRow,
  maxRows = 0,
): number {
  let shown = rows.length;
  if (lastRow === "hide" && shown > 1 && !rows[shown - 1].full) shown--;
  return maxRows > 0 ? Math.min(shown, maxRows) : shown;
}

export function sameRows(a: readonly Row[], b: readonly Row[]): boolean {
  return (
    a.length === b.length &&
    a.every(
      (row, index) =>
        row.start === b[index].start &&
        row.end === b[index].end &&
        row.full === b[index].full,
    )
  );
}
