"use client";

import { MovingHighlight } from "@reuse-sh/interactions/react";
import { useEffect, useState } from "react";
import "@reuse-sh/interactions/styles.css";

const items = [
  ["Prints", "24 prints"],
  ["Favorites", "8 prints"],
  ["Shared with me", "5 prints"],
  ["Members", "6 people"],
  ["Drafts", "2 drafts"],
];
export function Example() {
  const [selected, setSelected] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  return (
    <div className="mx-auto w-full max-w-[640px] p-4 text-[15px] leading-6 text-[#111] sm:p-8">
      <div className="rounded-2xl bg-white p-4 shadow-[0_0_0_1px_#00000014,0_8px_24px_-12px_#00000026] grid gap-6 sm:grid-cols-[180px_1fr]">
        <nav aria-label="Workspace">
          <b>Ink and Paper</b>
          <MovingHighlight>
            {items.map(([name], index) => (
              <a
                key={name}
                href={`#page-${index}`}
                className="rounded-lg border-0 bg-transparent px-3 py-2 text-inherit focus-visible:outline-2 focus-visible:outline-offset-2 flex"
                data-re-row=""
                data-current={selected === index ? "" : undefined}
                aria-current={selected === index ? "page" : undefined}
                onClick={() => setSelected(index)}
              >
                {name}
              </a>
            ))}
          </MovingHighlight>
        </nav>
        <div>
          {items.map(([name, summary], index) => (
            <section
              key={name}
              id={`page-${index}`}
              hidden={ready && selected !== index}
            >
              <h2 className="text-[21px] font-semibold">{name}</h2>
              <p className="text-[#5b5b5b]">{summary}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
