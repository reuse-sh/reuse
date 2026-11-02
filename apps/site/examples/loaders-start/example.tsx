"use client";
import "@reuse-sh/loaders/styles.css";
import { ThinkingDots } from "@reuse-sh/loaders/react";
export function Example() {
  return (
    <div className="flex min-h-48 items-center justify-center text-[#111]">
      <ThinkingDots size={72} label="Loading" />
    </div>
  );
}
