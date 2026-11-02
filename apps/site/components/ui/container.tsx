import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const containerVariants = cva("min-w-0", {
  variants: {
    size: {
      content: "mx-auto w-page",
      docs: "mx-auto w-docs wide:ml-docs-start wide:mr-auto",
      full: "w-full",
    },
  },
  defaultVariants: { size: "content" },
});
export function Container({
  className,
  size,
  ...props
}: ComponentProps<"div"> & VariantProps<typeof containerVariants>) {
  return (
    <div
      data-slot="container"
      className={cn(containerVariants({ size }), className)}
      {...props}
    />
  );
}
export { containerVariants };
