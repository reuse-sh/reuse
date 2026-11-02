"use client";
import { CopyButton } from "@reuse-sh/interactions/react";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const command = "npm install @reuse-sh/shadows";
export function Example() {
  const [enhanced, setEnhanced] = useState(false);
  useEffect(() => setEnhanced(true), []);
  return (
    <div className="mx-auto grid w-full min-w-0 max-w-140 grid-cols-1 gap-7">
      <div className="rounded-xl bg-card flex items-center justify-between gap-3 re-shadow-ring-sm py-1.5 pr-1.5 pl-4">
        <pre className="m-0 min-w-0 overflow-x-auto font-mono text-code">
          <code className="text-label">{command}</code>
        </pre>
        <CopyButton
          disabled={!enhanced}
          text={command}
          aria-label="Copy code"
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "size-8 p-0 text-subtle-foreground hover:text-foreground",
          )}
        />
      </div>
      <div className="rounded-frame bg-frame p-1 shadow-ring">
        <div className="rounded-panel bg-card p-5 flex flex-col items-start gap-4 sm:flex-row sm:items-center re-shadow-ring-xs">
          <div>
            <h3 className="m-0 text-body font-semibold leading-5.5">
              Order a test print
            </h3>
            <p className="m-0 mt-0.5 text-ui leading-5 text-muted-foreground">
              A 20 × 15 cm proof of Coral sky on the same cotton paper, shipped
              in two days.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-control border-0 bg-card px-3.5 text-ui font-medium text-foreground hover:bg-secondary shadow-ring"
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
