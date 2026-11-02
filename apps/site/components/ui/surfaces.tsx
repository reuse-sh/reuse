import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
export function Toolbar({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="toolbar"
      className={cn(
        "inline-flex w-fit items-center gap-0.5 rounded-xl bg-card p-1 shadow-raised",
        className,
      )}
      {...props}
    />
  );
}
export function MenuSurface({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="menu-surface"
      className={cn(
        "min-w-0 rounded-panel bg-popover p-2 text-popover-foreground shadow-pop",
        className,
      )}
      {...props}
    />
  );
}
