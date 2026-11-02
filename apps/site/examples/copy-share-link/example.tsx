"use client";
import { CopyButton } from "@reuse-sh/interactions/react";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";

const link = "https://prints.example/coral-sky";

export function CopyShareLink() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <div className="max-w-115 rounded-panel bg-card p-5 re-shadow-ring-md">
      <p className="font-semibold">Share Coral sky</p>
      <p className="mt-0.5 text-ui leading-5.5 text-muted-foreground">
        Anyone with the link can see the print and order a proof.
      </p>
      <div className="flex gap-2 mt-4">
        <input
          className="flex-1 min-w-0 h-8 px-2.5 border-0 rounded-control bg-secondary text-secondary-foreground text-label [&:focus-visible]:outline-2 [&:focus-visible]:outline-ring [&:focus-visible]:outline-offset-1"
          value={link}
          readOnly
          aria-label="Link to the print"
        />
        <CopyButton
          disabled={!ready}
          text={link}
          className={buttonVariants({ variant: "surface", size: "sm" })}
        >
          Copy link
        </CopyButton>
      </div>
    </div>
  );
}

export const Example = CopyShareLink;
