"use client";
import "@reuse-sh/shadows/styles.css";
import "@reuse-sh/interactions/styles.css";
import { CopyButton } from "@reuse-sh/interactions/react";

import { useEffect, useState } from "react";

const command = "npm install @reuse-sh/shadows";
export function Example() {
  const [enhanced, setEnhanced] = useState(false);
  useEffect(() => setEnhanced(true), []);
  return (
    <div className="mx-auto grid w-full min-w-0 max-w-[560px] grid-cols-1 gap-7">
      <div className="re-card re-card-code re-shadow-ring-sm [--re-card-radius:12px] [--re-card-padding:6px_6px_6px_16px]">
        <pre>
          <code className="text-[13px]">{command}</code>
        </pre>
        <CopyButton
          disabled={!enhanced}
          text={command}
          aria-label="Copy code"
          className="relative inline-flex size-[30px] items-center justify-center gap-[7px] rounded-[9px] border-0 bg-transparent p-0 text-[13px] font-medium text-[#8a8a8a] shadow-none transition-[scale,background-color,color,opacity] hover:bg-black/4 hover:text-[#111] [--re-copy-icon-size:15px] [--re-copy-gap:7px]"
        />
      </div>
      <div className="re-card-frame">
        <div className="re-card re-card-action re-shadow-ring-xs">
          <div>
            <h3 className="m-0 text-[15px] font-semibold leading-[22px]">
              Order a test print
            </h3>
            <p className="m-0 mt-0.5 text-[13.5px] leading-[21px] text-[#5b5b5b]">
              A 20 × 15 cm proof of Coral sky on the same cotton paper, shipped
              in two days.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] border-0 bg-white px-3.5 text-[13.5px] font-[540] text-[#111] hover:bg-[#fafafa] shadow-[inset_0_0_0_1px_#0000001f]"
          >
            Order a proof{" "}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M7 7h10v10M7 17 17 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
