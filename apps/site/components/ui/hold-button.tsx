"use client";
import { HoldToConfirmButton } from "@reuse-sh/interactions/react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button";

export function HoldButton({
  className,
  ...props
}: ComponentProps<typeof HoldToConfirmButton>) {
  return (
    <HoldToConfirmButton
      className={cn(
        buttonVariants({ variant: "destructive", size: "lg" }),
        "select-none data-confirmed:cursor-default data-done:cursor-default data-confirmed:bg-destructive/8 data-done:bg-destructive/8 [&_.re-hold-fill]:opacity-12",
        className,
      )}
      {...props}
    />
  );
}
