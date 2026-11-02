import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
export function CodeSurface({
  className,
  children,
  action,
  label,
  ...props
}: ComponentProps<"div"> & { action?: ReactNode; label?: string }) {
  return (
    <div
      data-slot="code-block"
      className={cn(
        "group/code min-w-0 rounded-code bg-frame p-1 text-card-foreground shadow-ring",
        className,
      )}
      {...props}
    >
      <div
        data-slot="code-toolbar"
        className="flex min-h-8 items-center justify-between gap-3 px-3"
      >
        <span className="font-mono text-caption text-muted-foreground">
          {label}
        </span>
        {action ? (
          <div
            data-slot="code-copy"
            className="shrink-0 transition-opacity duration-150 motion-reduce:transition-none [@media(hover:hover)]:opacity-0 group-hover/code:opacity-100 group-focus-within/code:opacity-100 has-[[data-state]:not([data-state=idle])]:opacity-100"
          >
            {action}
          </div>
        ) : null}
      </div>
      <div
        data-slot="code-surface"
        className="min-w-0 overflow-hidden rounded-xl bg-card shadow-raised"
      >
        {children}
      </div>
    </div>
  );
}
export function CodeContent({ className, ...props }: ComponentProps<"pre">) {
  return (
    <pre
      className={cn(
        "m-0 max-h-120 overflow-auto p-4 font-mono text-code tracking-normal",
        className,
      )}
      {...props}
    />
  );
}
