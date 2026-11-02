"use client";

import {
  HoldToConfirmButton,
  MovingHighlight,
} from "@reuse-sh/interactions/react";
import { useEffect, useRef, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HoldLabel } from "../hold-label";
import { Icon, type IconName } from "../icons";

export function HighlightDemo() {
  const [selected, setSelected] = useState("Overview");
  return (
    <div className="flex flex-col items-center justify-center">
      <MovingHighlight className="grid w-58 max-w-full gap-px rounded-xl bg-card p-1.5 shadow-raised [&_.re-moving-highlight]:rounded-lg [&_.re-moving-highlight]:bg-accent">
        {[
          { label: "Overview", icon: "book" },
          { label: "Image library", icon: "lightbox" },
          { label: "Annotations", icon: "annotations" },
          { label: "Team", icon: "avatars" },
        ].map((item) => (
          <button
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "justify-start rounded-lg px-2.5 hover:bg-transparent [&_svg]:text-muted-foreground",
            )}
            type="button"
            data-re-row=""
            aria-pressed={selected === item.label}
            data-current={selected === item.label ? "" : undefined}
            key={item.label}
            onClick={() => setSelected(item.label)}
          >
            <Icon name={item.icon as IconName} size={16} />
            <span>{item.label}</span>
          </button>
        ))}
      </MovingHighlight>
    </div>
  );
}

export function HoldDemo() {
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <div className="flex flex-col items-center justify-center">
      <HoldToConfirmButton
        className={cn(
          buttonVariants({ variant: "destructive", size: "lg" }),
          "select-none active:scale-97 data-done:scale-100 data-done:cursor-default data-done:bg-destructive/8 [&_.re-hold-fill]:opacity-12",
        )}
        data-done={done ? "" : undefined}
        aria-disabled={done || undefined}
        onConfirm={() => {
          setDone(true);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => setDone(false), 2400);
        }}
      >
        <Icon name="trash" size={16} />
        <HoldLabel
          labels={["Hold to delete", "Deleted"]}
          shown={done ? "Deleted" : "Hold to delete"}
        />
      </HoldToConfirmButton>
      <span className="sr-only" role="status">
        {done ? "Deleted" : ""}
      </span>
    </div>
  );
}
