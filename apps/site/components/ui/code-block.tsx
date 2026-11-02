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
        "relative min-w-0 overflow-hidden rounded-code bg-card text-card-foreground shadow-raised",
        className,
      )}
      {...props}
    >
      {label ? (
        <div className="flex h-11 items-center border-b border-border px-4 font-mono text-caption text-subtle-foreground">
          {label}
        </div>
      ) : null}
      {action ? (
        <div className="absolute top-2 right-2 z-10">{action}</div>
      ) : null}
      {children}
    </div>
  );
}
export function CodeContent({ className, ...props }: ComponentProps<"pre">) {
  return (
    <pre
      className={cn(
        "m-0 max-h-120 overflow-auto p-4 pr-14 font-mono text-code tracking-normal",
        className,
      )}
      {...props}
    />
  );
}
