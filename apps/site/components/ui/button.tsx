import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-control border-0 font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 [&_svg]:shrink-0 [&[hidden]]:hidden",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-control hover:bg-primary/85",
        secondary: "bg-secondary text-secondary-foreground hover:bg-muted",
        outline:
          "border border-input bg-card text-card-foreground hover:bg-accent",
        ghost: "bg-transparent text-foreground hover:bg-accent",
        surface: "bg-card text-card-foreground shadow-control hover:bg-muted",
        destructive:
          "bg-destructive/8 text-destructive hover:bg-destructive/12",
        link: "bg-transparent text-foreground underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-3.5 text-ui",
        sm: "h-8 gap-1.5 px-3 text-label",
        lg: "h-10 px-4 text-ui",
        icon: "size-8 p-0 text-ui",
        "icon-sm": "size-7 p-0 text-label",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return (
    <button
      type={type}
      data-slot="button"
      data-variant={variant ?? "default"}
      data-size={size ?? "default"}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
