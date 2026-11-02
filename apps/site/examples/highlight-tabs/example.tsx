"use client";
import { createMovingHighlight } from "@reuse-sh/interactions";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";

const step = (key: string, index: number, count: number) => {
  const moves: Record<string, number> = {
    ArrowDown: index + 1,
    ArrowRight: index + 1,
    ArrowUp: index - 1,
    ArrowLeft: index - 1,
    Home: 0,
    End: count - 1,
  };
  return key in moves ? (moves[key] + count) % count : null;
};

const tabs = [
  [
    "Overview",
    "Nine prints, two waiting for review. The next proof ships on Friday.",
  ],
  [
    "Prints",
    "Coral sky, Mint and ember, Lilac bloom and six more, in print order.",
  ],
  ["Orders", "14 orders this week. Three are framed and wait for the courier."],
  [
    "Settings",
    "Who can see the series, how prints are named, and where proofs go.",
  ],
] as const;

export function HighlightTabs() {
  const list = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(0);
  useEffect(() => {
    const root = list.current;
    if (!root) return;
    const fill = createMovingHighlight(root, {
      rowSelector: '[role="tab"]',
      selectedSelector: '[aria-selected="true"]',
      mode: "selected",
      className: "re-highlight-tabs-x-tab-fill",
    });
    const hover = createMovingHighlight(root, {
      rowSelector: '[role="tab"]',
      selectedSelector: "[data-re-none]",
      mode: "hover",
      className: "re-highlight-tabs-x-tab-hover",
    });
    return () => {
      hover.destroy();
      fill.destroy();
    };
  }, []);
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") return;
    const next = step(event.key, selected, tabs.length);
    if (next === null) return;
    event.preventDefault();
    setSelected(next);
    document.getElementById(`x-tab-${next}`)?.focus();
  };
  return (
    <div className="overflow-hidden [border-radius:16px] bg-white [box-shadow:0_0_0_0.5px_rgb(0_0_0_/_8%),0_2px_4px_rgb(0_0_0_/_4%),0_8px_16px_rgb(0_0_0_/_5%)] re-highlight-tabs-x-app-tabs">
      <header className="[padding:20px_20px_0] [box-shadow:inset_0_-1px_rgb(0_0_0_/_7%)]">
        <h2 className="[font-size:18px] [line-height:26px] font-semibold [letter-spacing:-0.012em]">
          Spring catalogue
        </h2>
        <div
          ref={list}
          role="tablist"
          aria-label="Project"
          className="flex gap-0.5 [margin-top:14px] [padding-bottom:8px] overflow-x-auto [scrollbar-width:none] [&_.re-highlight-tabs-x-tab-fill]:[background:rgb(0_0_0_/_7%)] [&_.re-highlight-tabs-x-tab-hover]:[background:rgb(0_0_0_/_3%)]"
          onKeyDown={onKeyDown}
        >
          {tabs.map(([name], index) => (
            <button
              key={name}
              id={`x-tab-${index}`}
              type="button"
              role="tab"
              className="[&:focus-visible]:[outline:2px_solid_#111] [&:focus-visible]:[outline-offset:-2px] flex-none h-8 [padding:0_12px] border-0 [border-radius:9px] bg-transparent [color:#5b5b5b] [font-size:13.5px] cursor-pointer [&[aria-selected=true]]:[color:#111] [&[aria-selected=true]]:[font-weight:540]"
              aria-selected={index === selected}
              aria-controls="re-highlight-tabs-x-tab-panel"
              tabIndex={index === selected ? 0 : -1}
              onClick={() => setSelected(index)}
            >
              {name}
            </button>
          ))}
        </div>
      </header>
      <div
        id="re-highlight-tabs-x-tab-panel"
        role="tabpanel"
        aria-labelledby={`x-tab-${selected}`}
        className="[min-height:96px] [padding:18px_20px_22px] [font-size:14px] [line-height:22px] [color:#5b5b5b]"
      >
        {tabs[selected][1]}
      </div>
    </div>
  );
}

export const Example = HighlightTabs;

import "@reuse-sh/interactions/styles.css";
