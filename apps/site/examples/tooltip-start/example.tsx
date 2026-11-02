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
            data-re-tooltip="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            className="rounded-lg border-0 bg-transparent px-3 py-2 text-inherit focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label="Add to favorites"
            data-re-row=""
            data-re-tooltip="Add to favorites"
          >
            ♡
          </button>
          <button
            type="button"
            className="rounded-lg border-0 bg-transparent px-3 py-2 text-inherit focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label="Share"
            data-re-row=""
            data-re-tooltip="Share"
          >
            ↑
          </button>
          <button
            type="button"
            className="rounded-lg border-0 bg-transparent px-3 py-2 text-inherit focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label="Copy link"
            data-re-row=""
            data-re-tooltip="Copy link"
          >
            ↗
          </button>
          <button
            type="button"
            className="rounded-lg border-0 bg-transparent px-3 py-2 text-inherit focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label="Move to trash"
            data-re-row=""
            data-re-tooltip="Move to trash"
          >
            ×
          </button>
        </MovingHighlight>
      </div>
    </FloatingTooltipGroup>
  );
}
