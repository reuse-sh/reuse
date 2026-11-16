export interface LaneItem {
  /** Outer size along the lanes, margins included; by start lane when lanes differ in width. */
  size: number | readonly number[];
  /** Lanes the item spans, at least 1. */
  span: number;
}

export interface LanePlacement {
  /** First lane, from 0. */
  lane: number;
  span: number;
  /** Distance from the start of the lanes to the item's margin edge. */
  offset: number;
}

/**
 * Place items the way css-grid-3 grid lanes do (§4.4): an item takes the first
 * start at or after the cursor whose position is within the tolerance of the
 * lowest, or the first such start when none follows the cursor, and the cursor
 * moves past it.
 */
export function placeLanes(
  items: readonly LaneItem[],
  lanes: number,
  gap: number,
  tolerance: number,
): { placements: LanePlacement[]; size: number } {
  const running = new Array<number>(Math.max(1, lanes)).fill(0);
  const count = running.length;
  const placements: LanePlacement[] = [];
  let cursor = 0;
  for (const item of items) {
    const span = Math.min(count, Math.max(1, Math.floor(item.span)));
    const starts = count - span + 1;
    const positions = new Array<number>(starts);
    let lowest = Number.POSITIVE_INFINITY;
    for (let start = 0; start < starts; start++) {
      let position = 0;
      for (let lane = start; lane < start + span; lane++) {
        position = Math.max(position, running[lane]);
      }
      positions[start] = position;
      lowest = Math.min(lowest, position);
    }
    let chosen = -1;
    let first = -1;
    for (let start = 0; start < starts; start++) {
      if (positions[start] - lowest > tolerance) continue;
      if (first < 0) first = start;
      if (start >= cursor) {
        chosen = start;
        break;
      }
    }
    const lane = chosen < 0 ? first : chosen;
    const offset = positions[lane];
    const size =
      typeof item.size === "number" ? item.size : (item.size[lane] ?? 0);
    for (let index = lane; index < lane + span; index++) {
      running[index] = offset + Math.max(0, size) + gap;
    }
    cursor = lane + span;
    placements.push({ lane, span, offset });
  }
  const size = items.length ? Math.max(...running) - gap : 0;
  return { placements, size: Math.max(0, size) };
}
