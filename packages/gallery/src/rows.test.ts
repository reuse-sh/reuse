import { describe, expect, it } from "vitest";
import {
  breakRows,
  type Row,
  type RowMetrics,
  rowCost,
  rowHeightAt,
  rowsHold,
  shownRows,
} from "./rows.js";

const metrics: RowMetrics = {
  width: 1000,
  gap: 8,
  rowHeight: 240,
  tolerance: 0.25,
};

function seeded(count: number, seed = 7): number[] {
  let state = seed;
  const shapes = [0.56, 0.67, 0.75, 1, 1.33, 1.5, 1.78, 2.4];
  return Array.from({ length: count }, () => {
    state = (state * 16807) % 2147483647;
    return shapes[state % shapes.length] * (0.95 + (state % 11) / 100);
  });
}

function heights(ratios: number[], rows: Row[], at: RowMetrics) {
  return rows
    .filter((row) => row.full)
    .map((row) => rowHeightAt(ratios, row.start, row.end, at));
}

/** First-fit rows, closed as soon as they come down into the range: the shape of fjGallery and Gallery Loop. */
function greedy(ratios: number[], at: RowMetrics): Row[] {
  const rows: Row[] = [];
  let start = 0;
  for (let end = 1; end <= ratios.length; end++) {
    if (
      rowHeightAt(ratios, start, end, at) <=
      at.rowHeight * (1 + at.tolerance)
    ) {
      rows.push({ start, end, full: true });
      start = end;
    }
  }
  if (start < ratios.length)
    rows.push({ start, end: ratios.length, full: false });
  return rows;
}

/** The cost breakRows minimises: full rows only, each penalised against the item count. */
function rowsCost(rows: Row[], ratios: number[], at: RowMetrics) {
  return rows
    .filter((row) => row.full)
    .reduce(
      (total, row) =>
        total +
        rowCost(
          rowHeightAt(ratios, row.start, row.end, at),
          row.end - row.start,
          at,
          ratios.length + 1,
        ),
      0,
    );
}

const meanDeviation = (values: number[], target: number) =>
  values.reduce(
    (total, value) => total + Math.abs(value - target) / target,
    0,
  ) / values.length;

describe("breakRows", () => {
  it("returns no rows for no items", () => {
    expect(breakRows([], metrics)).toEqual([]);
  });

  it("covers every item once, in order", () => {
    const ratios = seeded(80);
    const rows = breakRows(ratios, metrics);
    expect(rows[0].start).toBe(0);
    expect(rows.at(-1)?.end).toBe(80);
    rows.slice(1).forEach((row, index) => {
      expect(row.start).toBe(rows[index].end);
    });
  });

  it("keeps every full row inside the height range for ordinary photos", () => {
    const ratios = seeded(200).map((ratio) =>
      Math.min(1.6, Math.max(0.66, ratio)),
    );
    for (const width of [768, 1000, 1440]) {
      const at = { ...metrics, width };
      for (const height of heights(ratios, breakRows(ratios, at), at)) {
        expect(height).toBeGreaterThanOrEqual(240 * 0.75 - 1e-9);
        expect(height).toBeLessThanOrEqual(240 * 1.25 + 1e-9);
      }
    }
  });

  it("splits a row that cannot fit rather than making it far shorter", () => {
    const ratios = seeded(14, 3);
    const at = { ...metrics, width: 320 };
    for (const height of heights(ratios, breakRows(ratios, at), at)) {
      expect(height).toBeGreaterThan(120);
    }
  });

  it("finds the cheapest breaks of all", () => {
    for (const seed of [3, 7, 11]) {
      const ratios = seeded(13, seed);
      for (const width of [320, 390, 1000]) {
        const at = { ...metrics, width };
        let cheapest = Number.POSITIVE_INFINITY;
        for (let mask = 0; mask < 1 << (ratios.length - 1); mask++) {
          const rows: Row[] = [];
          let start = 0;
          for (let index = 1; index <= ratios.length; index++) {
            if (index === ratios.length || mask & (1 << (index - 1))) {
              rows.push({ start, end: index, full: true });
              start = index;
            }
          }
          const last = rows.at(-1) as Row;
          last.full = rowHeightAt(ratios, last.start, last.end, at) < 240;
          cheapest = Math.min(cheapest, rowsCost(rows, ratios, at));
        }
        expect(rowsCost(breakRows(ratios, at), ratios, at)).toBeCloseTo(
          cheapest,
          9,
        );
      }
    }
  });

  it("deviates from the target less than first-fit rows", () => {
    const ratios = seeded(1000);
    const optimal = heights(ratios, breakRows(ratios, metrics), metrics);
    const firstFit = heights(ratios, greedy(ratios, metrics), metrics);
    expect(meanDeviation(optimal, 240)).toBeLessThan(
      meanDeviation(firstFit, 240) * 0.75,
    );
  });

  it("gives a panorama that cannot fit a row of its own", () => {
    const ratios = [1.5, 1.33, 1.78, 12, 1.5, 1.33, 1.78, 0.75];
    const rows = breakRows(ratios, metrics).filter((row) => row.full);
    const outside = rows.filter((row) => {
      const height = rowHeightAt(ratios, row.start, row.end, metrics);
      return height < 180 || height > 300;
    });
    expect(outside).toEqual([{ start: 3, end: 4, full: true }]);
  });

  it("leaves a last row that fits at the target height unstretched", () => {
    const rows = breakRows([1.5, 1.5, 1.5, 1.5, 1], metrics);
    const last = rows.at(-1) as Row;
    expect(last.full).toBe(false);
    expect(
      rowHeightAt([1.5, 1.5, 1.5, 1.5, 1], last.start, last.end, metrics),
    ).toBeGreaterThanOrEqual(240);
  });

  it("stretches the last row like the others for justify", () => {
    const ratios = [1.5, 1.5, 1.5, 1.5, 1];
    const rows = breakRows(ratios, metrics, "justify");
    expect(rows.every((row) => row.full)).toBe(true);
  });

  it("lays one item out as a row that is not full", () => {
    expect(breakRows([1.5], metrics)).toEqual([
      { start: 0, end: 1, full: false },
    ]);
  });
});

describe("rowsHold", () => {
  const ratios = seeded(60);
  const rows = breakRows(ratios, metrics);

  it("holds after a scrollbar's width either way", () => {
    expect(rowsHold(rows, ratios, { ...metrics, width: 985 })).toBe(true);
    expect(rowsHold(rows, ratios, { ...metrics, width: 1015 })).toBe(true);
  });

  it("breaks once a row leaves the height range", () => {
    expect(rowsHold(rows, ratios, { ...metrics, width: 1400 })).toBe(false);
    expect(rowsHold(rows, ratios, { ...metrics, width: 700 })).toBe(false);
  });

  it("breaks when a row that is not full no longer fits", () => {
    const short = [1.5, 1.5, 1.5, 1.5, 1.4];
    const open = breakRows(short, metrics);
    expect(open.at(-1)?.full).toBe(false);
    expect(rowsHold(open, short, { ...metrics, width: 300 })).toBe(false);
  });
});

describe("shownRows", () => {
  const rows: Row[] = [
    { start: 0, end: 3, full: true },
    { start: 3, end: 6, full: true },
    { start: 6, end: 7, full: false },
  ];

  it("shows every row by default", () => {
    expect(shownRows(rows, "start")).toBe(3);
  });

  it("drops a last row that is not full for hide", () => {
    expect(shownRows(rows, "hide")).toBe(2);
  });

  it("keeps a full last row for hide", () => {
    expect(shownRows(rows.slice(0, 2), "hide")).toBe(2);
  });

  it("never hides the only row", () => {
    expect(shownRows([{ start: 0, end: 2, full: false }], "hide")).toBe(1);
  });

  it("stops at maxRows", () => {
    expect(shownRows(rows, "start", 1)).toBe(1);
    expect(shownRows(rows, "hide", 5)).toBe(2);
  });
});
