"use client";

import { CopyButton } from "@reuse-sh/interactions/react";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDocFramework } from "../lib/framework-context";

function useCopyReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready;
}

export function CopyControl({
  value,
  label = "Copy code",
  text = false,
  className,
}: {
  value: string;
  label?: string;
  text?: boolean;
  className?: string;
}) {
  const ready = useCopyReady();
  return (
    <CopyButton
      disabled={!ready}
      text={value}
      data-slot="copy-control"
      className={cn(
        buttonVariants({
          variant: text ? "surface" : "ghost",
          size: text ? "sm" : "icon-sm",
        }),
        "copy-control",
        !text && "text-subtle-foreground hover:text-foreground",
        className,
      )}
      aria-label={text ? undefined : label}
    >
      {text ? label : null}
    </CopyButton>
  );
}

export function PromptButton({
  prompt,
  className,
}: {
  prompt: string;
  className?: string;
}) {
  const ready = useCopyReady();
  const framework = useDocFramework();
  const value = framework
    ? `${prompt} Use ${framework === "react" ? "React with Tailwind CSS" : "HTML, CSS and JavaScript"}.`
    : prompt;
  return (
    <CopyButton
      disabled={!ready}
      text={value}
      className={cn(
        buttonVariants({ variant: "surface" }),
        "copy-control",
        className,
      )}
    >
      Copy prompt for your agent
    </CopyButton>
  );
}
