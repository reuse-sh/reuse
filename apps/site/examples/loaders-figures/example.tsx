"use client";
import "@reuse-sh/loaders/styles.css";
import { figureConfig, figureNames } from "@reuse-sh/loaders";
import { ThinkingDots } from "@reuse-sh/loaders/react";
export function Example() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-4">
      {figureNames.map((name) => (
        <div key={name} className="grid justify-items-center gap-3 text-[#111]">
          <ThinkingDots size={38} config={figureConfig(name)} />
          <code className="text-center text-xs text-[#858585]">{name}</code>
        </div>
      ))}
    </div>
  );
}
