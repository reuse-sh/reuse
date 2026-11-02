"use client";

import { createMovingHighlight } from "@reuse-sh/interactions";
import { MovingHighlight } from "@reuse-sh/interactions/react";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import "@reuse-sh/interactions/styles.css";

const items = [
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
];
export function Example() {
  const [selected, setSelected] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const list = root.current?.querySelector<HTMLElement>('[role="tablist"]');
    if (!list) return;
    const hover = createMovingHighlight(list, {
      mode: "hover",
      selectedSelector: "[data-none]",
      className: "bg-black/[0.03]",
    });
    return () => hover.destroy();
  }, []);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, number> = {
      ArrowRight: selected + 1,
      ArrowLeft: selected - 1,
      Home: 0,
      End: items.length - 1,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    const next = (moves[event.key] + items.length) % items.length;
    setSelected(next);
    buttons.current[next]?.focus();
  };
  return (
    <div
      ref={root}
      className="mx-auto w-full max-w-[640px] p-4 text-[15px] leading-6 text-[#111] sm:p-8"
    >
      <h2 className="mb-4 text-[21px] font-semibold">Spring catalogue</h2>
      <MovingHighlight
        className="rounded-2xl bg-white p-4 shadow-[0_0_0_1px_#00000014,0_8px_24px_-12px_#00000026] flex w-fit flex-wrap gap-1"
        role="tablist"
        aria-label="Project"
        mode="selected"
        highlightClassName="bg-black/[0.055]"
        onKeyDown={onKeyDown}
      >
        {items.map(([name], index) => (
          <button
            key={name}
            ref={(node) => {
              buttons.current[index] = node;
            }}
            type="button"
            role="tab"
            data-re-row=""
            className="rounded-lg border-0 bg-transparent px-3 py-2 text-inherit focus-visible:outline-2 focus-visible:outline-offset-2 "
            tabIndex={selected === index ? 0 : -1}
            id={`tab-${index}`}
            aria-controls={`panel-${index}`}
            aria-selected={selected === index}
            onClick={() => {
              setSelected(index);
            }}
          >
            {name}
          </button>
        ))}
      </MovingHighlight>
      {items.map(([name, detail], index) => (
        <section
          key={name}
          id={`panel-${index}`}
          role="tabpanel"
          aria-labelledby={`tab-${index}`}
          hidden={selected !== index}
        >
          <p className="mt-4 text-[#5b5b5b]">{detail}</p>
        </section>
      ))}
    </div>
  );
}
