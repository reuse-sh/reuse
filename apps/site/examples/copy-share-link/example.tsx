"use client";

import { CopyButton } from "@reuse-sh/interactions/react";
import "@reuse-sh/interactions/styles.css";
export function Example() {
  return (
    <div className="mx-auto w-full max-w-[640px] p-4 text-[15px] leading-6 text-[#111] sm:p-8">
      <div className="rounded-2xl bg-white p-4 shadow-[0_0_0_1px_#00000014,0_8px_24px_-12px_#00000026]">
        <h2 className="mb-2 text-lg font-semibold">Share Coral sky</h2>
        <p className="mb-4 text-[#5b5b5b]">
          Anyone with the link can see the print and order a proof.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <input
            className="min-w-0 flex-1 rounded-lg border border-black/15 p-2"
            value="https://prints.example/coral-sky"
            readOnly
            aria-label="Link to the print"
          />
          <CopyButton
            text="https://prints.example/coral-sky"
            className="rounded-lg border border-black/10 bg-white px-3 py-2 whitespace-nowrap"
          >
            Copy link
          </CopyButton>
        </div>
      </div>
    </div>
  );
}
