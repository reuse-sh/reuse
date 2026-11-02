"use client";
import "@reuse-sh/loaders/styles.css";
import { figureConfig, figureNames } from "@reuse-sh/loaders";
import { ThinkingDots } from "@reuse-sh/loaders/react";
export function Example() {
  return (
    <div className="grid grid-cols-4 gap-x-4 gap-y-9 max-[760px]:grid-cols-3 max-[600px]:grid-cols-2">
      {figureNames.map((name) => (
        <div key={name} className="grid justify-items-center gap-3 text-[#111]">
          <ThinkingDots size={38} config={figureConfig(name)} />
          <code className="text-center font-mono text-xs leading-[18px] text-[#858585]">
            {name}
          </code>
        </div>
      ))}
    </div>
  );
}
