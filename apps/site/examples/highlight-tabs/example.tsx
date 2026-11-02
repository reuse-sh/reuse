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
    <div className="overflow-hidden rounded-2xl bg-card shadow-panel re-highlight-tabs-x-app-tabs">
      <header className="px-5 pt-5 border-b border-border">
        <h2 className="text-subsection leading-6.5 font-semibold tracking-tight">
          Spring catalogue
        </h2>
        <div
          ref={list}
          role="tablist"
          aria-label="Project"
          className="flex gap-0.5 mt-3.5 pb-2 overflow-x-auto [&_.re-highlight-tabs-x-tab-fill]:bg-border [&_.re-highlight-tabs-x-tab-hover]:bg-accent"
          onKeyDown={onKeyDown}
        >
          {tabs.map(([name], index) => (
            <button
              key={name}
              id={`x-tab-${index}`}
              type="button"
              role="tab"
              className="[&:focus-visible]:outline-2 [&:focus-visible]:outline-ring [&:focus-visible]:-outline-offset-2 flex-none h-8 px-3 border-0 rounded-control bg-transparent text-muted-foreground text-ui cursor-pointer [&[aria-selected=true]]:text-foreground [&[aria-selected=true]]:font-medium"
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
        className="min-h-24 px-5 pt-4.5 pb-5.5 text-ui leading-5.5 text-muted-foreground"
      >
        {tabs[selected][1]}
      </div>
    </div>
  );
}

export const Example = HighlightTabs;
