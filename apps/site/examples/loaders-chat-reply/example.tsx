"use client";

import "@reuse-sh/loaders/styles.css";
import { ThinkingDots } from "@reuse-sh/loaders/react";
import { type FormEvent, useEffect, useRef, useState } from "react";

const exchanges = [
  [
    "Which frame suits Coral sky?",
    "A thin oak frame keeps the sand tones warm. Black would pull the blue forward and make the print feel cooler.",
  ],
  [
    "And for Blue hour?",
    "White or natural ash. The gold veins read best with a pale edge and a wide mount.",
  ],
  [
    "Can both hang side by side?",
    "Yes. Hang them at the same center height with a 6 cm gap, and keep the frames alike so the colors carry the pair.",
  ],
] as const;

const REPLY_MS = 2400;

export function Example() {
  const [count, setCount] = useState(1);
  const [thinking, setThinking] = useState(false);
  const [enhanced, setEnhanced] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    setEnhanced(true);
    return () => clearTimeout(timer.current);
  }, []);
  const next = exchanges[count % exchanges.length];
  const shown = Array.from({ length: Math.min(count, 2) }, (_, index) => {
    const position = count - Math.min(count, 2) + index;
    return { position, pair: exchanges[position % exchanges.length] };
  });

  const send = (event: FormEvent) => {
    event.preventDefault();
    if (thinking) return;
    setCount((value) => value + 1);
    setThinking(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setThinking(false), REPLY_MS);
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] w-full max-w-[560px] overflow-hidden rounded-2xl bg-white shadow-[0_0_0_0.5px_#00000014,0_2px_4px_#0000000a,0_8px_16px_#0000000d]">
      <div className="grid min-h-[300px] content-end gap-[18px] px-4 py-[18px]">
        {shown.map(({ position, pair: [question, answer] }, index) => {
          const pending = thinking && index === shown.length - 1;
          return (
            <div key={position} className="flex flex-col gap-1.5">
              <p className="m-0 mt-1.5 max-w-[74%] self-end rounded-[18px_18px_6px_18px] bg-[#1f6feb] px-3 py-2 text-sm leading-5 text-white">
                {question}
              </p>
              <div
                className="flex min-h-9 max-w-[74%] self-start items-center rounded-[18px_18px_18px_6px] bg-[#efefee] px-3 py-2 text-sm leading-5 text-[#111] [&_.re-thinking-dots]:text-[#858585]"
                aria-busy={pending}
              >
                {pending ? (
                  <ThinkingDots size={22} label="Writing a reply" />
                ) : (
                  answer
                )}
              </div>
            </div>
          );
        })}
      </div>
      <form
        className="mx-3 mb-3 flex items-center gap-2 rounded-[20px] py-1 pr-1 pl-3.5 shadow-[inset_0_0_0_1px_#0000001a]"
        onSubmit={send}
      >
        <input
          type="text"
          className="h-[30px] min-w-0 flex-1 border-0 bg-transparent text-sm text-[#111] outline-none"
          readOnly
          value={next[0]}
          aria-label="Next question"
        />
        <button
          type="submit"
          className="grid size-[30px] shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-[#1f6feb] p-0 text-white disabled:cursor-default disabled:opacity-40"
          aria-label="Send"
          data-re-tooltip="Send"
          disabled={!enhanced || thinking}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M12 19V5m0 0-6 6m6-6 6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </form>
    </div>
  );
}
