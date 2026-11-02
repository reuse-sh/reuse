"use client";

import { MovingHighlight } from "@reuse-sh/interactions/react";
import { type KeyboardEvent, useRef, useState } from "react";
import "@reuse-sh/interactions/styles.css";

const items = [
  ["New print", "\u2318N"],
  ["Duplicate", "\u2318D"],
  ["Copy link", "\u2318L"],
  ["Share", "\u21e7\u2318S"],
  ["Move to trash", "\u232b"],
];
export function Example() {
  const [selected, setSelected] = useState(0);
  const [last, setLast] = useState("");
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, number> = {
      ArrowDown: selected + 1,
      ArrowUp: selected - 1,
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
    <div className="mx-auto w-full max-w-[640px] p-4 text-[15px] leading-6 text-[#111] sm:p-8">
      <div className="mb-2 text-sm text-[#858585]" aria-hidden="true">
        File　 Edit　 View
      </div>
      <MovingHighlight
        className="rounded-2xl bg-white p-4 shadow-[0_0_0_1px_#00000014,0_8px_24px_-12px_#00000026] "
        role="menu"
        aria-label="File"
        mode="hover"
        onKeyDown={onKeyDown}
      >
        {items.map(([name, detail], index) => (
          <button
            key={name}
            ref={(node) => {
              buttons.current[index] = node;
            }}
            type="button"
            role="menuitem"
            data-re-row=""
            className="rounded-lg border-0 bg-transparent px-3 py-2 text-inherit focus-visible:outline-2 focus-visible:outline-offset-2 flex w-full items-center justify-between text-left"
            tabIndex={selected === index ? 0 : -1}
            onFocus={() => setSelected(index)}
            onClick={() => {
              setSelected(index);
              setLast(name);
            }}
          >
            {name}
            <kbd className="text-xs text-[#858585]">{detail}</kbd>
          </button>
        ))}
      </MovingHighlight>
      <p className="mt-3 min-h-6 text-sm text-[#5b5b5b]" role="status">
        {last ? `Chose ${last}` : "Choose a file action."}
      </p>
    </div>
  );
}
