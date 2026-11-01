"use client";

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

export function ChatReply() {
  const [count, setCount] = useState(1);
  const [thinking, setThinking] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
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
    <div className="x-assist">
      <div className="x-assist-msgs">
        {shown.map(({ position, pair: [question, answer] }, index) => {
          const pending = thinking && index === shown.length - 1;
          return (
            <div key={position} className="x-assist-turn">
              <p className="x-msg x-me">{question}</p>
              <div className="x-msg x-reply" aria-busy={pending}>
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
      <form className="x-compose" onSubmit={send}>
        <input
          type="text"
          readOnly
          value={next[0]}
          aria-label="Next question"
        />
        <button
          type="submit"
          aria-label="Send"
          data-reuse-tooltip="Send"
          disabled={thinking}
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
