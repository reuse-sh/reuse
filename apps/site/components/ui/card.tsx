import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const cardVariants = cva("min-w-0 text-card-foreground", {
  variants: {
    variant: {
      framed: "rounded-frame bg-frame p-1 shadow-ring",
      plain: "rounded-panel bg-card",
      raised: "rounded-panel bg-card shadow-raised",
      panel: "rounded-panel bg-card shadow-panel",
    },
  },
  defaultVariants: { variant: "framed" },
});
export function Card({
  className,
  variant = "framed",
  children,
  ...props
}: ComponentProps<"div"> & VariantProps<typeof cardVariants>) {
  return (
    <div
      data-slot="card"
      data-variant={variant}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    >
      {variant === "framed" ? (
        <div
          data-slot="card-surface"
          className="h-full min-w-0 rounded-panel bg-card shadow-raised"
        >
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
}
const contentVariants = cva("h-full min-w-0", {
  variants: {
    padding: { none: "p-0", compact: "p-4", default: "p-6", roomy: "p-8" },
  },
  defaultVariants: { padding: "default" },
});
export function CardContent({
  className,
  padding,
  ...props
}: ComponentProps<"div"> & VariantProps<typeof contentVariants>) {
  return (
    <div
      data-slot="card-content"
      className={cn(contentVariants({ padding }), className)}
      {...props}
    />
  );
}
