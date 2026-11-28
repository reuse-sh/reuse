"use client";
import { HoldToConfirmButton } from "@reuse-sh/interactions/react";
import type { ComponentProps } from "react";
import { useQuietPointerFocus } from "@/lib/use-quiet-pointer-focus";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button";

export function HoldButton({
  className,
  onPointerDown,
  ...props
}: ComponentProps<typeof HoldToConfirmButton>) {
  const [quietFocus, setQuietFocus] = useQuietPointerFocus();
  return (
    <HoldToConfirmButton
      className={cn(
        buttonVariants({ variant: "destructive", size: "lg" }),
        "select-none data-confirmed:cursor-default data-done:cursor-default data-confirmed:bg-destructive/8 data-done:bg-destructive/8 [&_.re-hold-fill]:opacity-12",
        className,
      )}
      {...props}
      data-re-focus-quiet={quietFocus}
      onPointerDown={(event) => {
        if (event.button === 0 && event.isPrimary) setQuietFocus(true);
        onPointerDown?.(event);
      }}
    />
  );
}
