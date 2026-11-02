"use client";
import { CopyButton } from "@reuse-sh/interactions/react";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const command = "npm install @reuse-sh/interactions";

export function CopyCodeBlock() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <div className="relative flex items-center justify-between gap-3 py-2.5 pr-2.5 pl-4.5 w-full rounded-panel bg-card re-shadow-ring-sm">
      <pre className="m-0 overflow-x-auto font-mono text-label leading-5.5">
        <code>
          <span className="text-subtle-foreground" aria-hidden="true">
            ${" "}
          </span>
          {command}
        </code>
      </pre>
      <CopyButton
        disabled={!ready}
        text={command}
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "size-8 p-0 text-subtle-foreground hover:text-foreground",
        )}
        aria-label="Copy command"
      />
    </div>
  );
}

export const Example = CopyCodeBlock;
