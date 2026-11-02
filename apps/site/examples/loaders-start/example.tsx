"use client";
import "@reuse-sh/loaders/styles.css";
import { ThinkingDots } from "@reuse-sh/loaders/react";
export function Example() {
  return (
    <div className="flex flex-col items-center justify-center gap-7 text-[#111]">
      <ThinkingDots size={72} label="Loading" />
    </div>
  );
}
