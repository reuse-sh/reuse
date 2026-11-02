"use client";
import { CopyButton } from "@reuse-sh/interactions/react";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
export function Example() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <div className="flex items-center justify-center flex-row gap-3">
      <CopyButton
        disabled={!ready}
        text="npm install @reuse-sh/interactions"
        className={cn(
          buttonVariants({ variant: "surface", size: "icon" }),
          "size-8 p-0",
        )}
        aria-label="Copy install command"
      />
      <CopyButton
        disabled={!ready}
        text="https://reuse.sh/copy-button"
        className={buttonVariants({ variant: "surface", size: "sm" })}
      >
        Copy link
      </CopyButton>
    </div>
  );
}
