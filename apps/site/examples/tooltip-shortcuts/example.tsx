"use client";

import {
  FloatingTooltipGroup,
  MovingHighlight,
} from "@reuse-sh/interactions/react";
import "@reuse-sh/interactions/styles.css";
export function Example() {
  return (
    <FloatingTooltipGroup className="mx-auto w-full max-w-[640px] p-4 text-[15px] leading-6 text-[#111] sm:p-8">
      <div className="rounded-2xl bg-white p-4 shadow-[0_0_0_1px_#00000014,0_8px_24px_-12px_#00000026]">
        {/* biome-ignore lint/performance/noImgElement: this portable recipe also runs outside Next.js. */}
        <img
          className="mb-4 h-60 w-full rounded-xl object-cover"
          src="https://reuse.sh/images/marble-mountains.svg"
          alt="A soft marble texture in mint, blue and orange"
        />
        <MovingHighlight
          className="mx-auto flex w-fit flex-wrap gap-1"
          role="toolbar"
          aria-label="Photo actions"
        >
          <button
            type="button"
            className="rounded-lg border-0 bg-transparent px-3 py-2 text-inherit focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label="Zoom in"
            data-re-row=""
            data-re-tooltip="Zoom in ⌘+"
          >
            +
          </button>
          <button
            type="button"
            className="rounded-lg border-0 bg-transparent px-3 py-2 text-inherit focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label="Zoom out"
            data-re-row=""
            data-re-tooltip="Zoom out ⌘−"
          >
            −
          </button>
          <button
            type="button"
            className="rounded-lg border-0 bg-transparent px-3 py-2 text-inherit focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label="Duplicate"
            data-re-row=""
            data-re-tooltip="Duplicate ⌘D"
          >
            ▣
          </button>
          <button
            type="button"
            className="rounded-lg border-0 bg-transparent px-3 py-2 text-inherit focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label="Copy link"
            data-re-row=""
            data-re-tooltip="Copy link ⌘L"
          >
            ↗
          </button>
          <button
            type="button"
            className="rounded-lg border-0 bg-transparent px-3 py-2 text-inherit focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label="Share"
            data-re-row=""
            data-re-tooltip="Share ⇧⌘S"
          >
            ↑
          </button>
          <button
            type="button"
            className="rounded-lg border-0 bg-transparent px-3 py-2 text-inherit focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label="Delete"
            data-re-row=""
            data-re-tooltip="Delete ⌫"
          >
            ×
          </button>
        </MovingHighlight>
      </div>
    </FloatingTooltipGroup>
  );
}
