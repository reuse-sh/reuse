import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const headingVariants = cva("text-foreground text-balance", {
  variants: {
    variant: {
      display: "font-display text-display font-light tracking-tight",
      page: "font-display text-page-title font-light tracking-tight",
      section: "text-section font-semibold tracking-tight",
      subsection: "text-subsection font-semibold tracking-tight",
    },
  },
  defaultVariants: { variant: "section" },
});
export function Heading({
  as,
  variant,
  className,
  ...props
}: ComponentProps<"h2"> &
  VariantProps<typeof headingVariants> & { as?: "h1" | "h2" | "h3" | "h4" }) {
  const Tag =
    as ??
    (variant === "page" || variant === "display"
      ? "h1"
      : variant === "subsection"
        ? "h3"
        : "h2");
  return (
    <Tag
      data-slot="heading"
      className={cn(headingVariants({ variant }), className)}
      {...props}
    />
  );
}
const textVariants = cva("text-pretty", {
  variants: {
    variant: {
      body: "text-body text-muted-foreground",
      lead: "text-lead text-secondary-foreground",
      ui: "text-ui text-foreground",
      label: "text-label text-foreground",
      caption: "text-caption text-subtle-foreground",
    },
  },
  defaultVariants: { variant: "body" },
});
export function Text({
  className,
  variant,
  ...props
}: ComponentProps<"p"> & VariantProps<typeof textVariants>) {
  return (
    <p
      data-slot="text"
      className={cn(textVariants({ variant }), className)}
      {...props}
    />
  );
}
export function InlineCode({ className, ...props }: ComponentProps<"code">) {
  return (
    <code
      className={cn(
        "rounded-md bg-accent px-1 py-0.5 font-mono text-caption font-normal tracking-normal text-foreground",
        className,
      )}
      {...props}
    />
  );
}
export function Kbd({ className, ...props }: ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "inline-grid h-5 min-w-5 place-items-center rounded-md bg-card px-1 font-sans text-caption font-medium leading-none text-foreground shadow-control",
        className,
      )}
      {...props}
    />
  );
}
export function ContentFlow({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="content-flow"
      className={cn("space-y-4", className)}
      {...props}
    />
  );
}
