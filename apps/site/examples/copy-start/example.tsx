"use client";

import { CopyButton } from "@reuse-sh/interactions/react";
import "@reuse-sh/interactions/styles.css";
export function Example() {
  return (
    <div className="mx-auto w-full max-w-[640px] p-4 text-[15px] leading-6 text-[#111] sm:p-8">
      <div className="rounded-2xl bg-white p-4 shadow-[0_0_0_1px_#00000014,0_8px_24px_-12px_#00000026]">
        <div className="flex flex-wrap items-center gap-3">
          <pre className="min-w-0 flex-1 whitespace-pre-wrap break-all">
            <code>npm install @reuse-sh/interactions</code>
          </pre>
          <CopyButton
            text="npm install @reuse-sh/interactions"
            className="rounded-lg border border-black/10 bg-white px-3 py-2 whitespace-nowrap"
          >
            Copy command
          </CopyButton>
        </div>
      </div>
    </div>
  );
}
