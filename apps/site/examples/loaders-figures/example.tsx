"use client";
import { figureConfig, figureNames } from "@reuse-sh/loaders";
import { ThinkingDots } from "@reuse-sh/loaders/react";
export function Example() {
  return (
    <div className="grid grid-cols-4 gap-x-4 gap-y-9 max-md:grid-cols-3 max-sm:grid-cols-2">
      {figureNames.map((name) => (
        <div
          key={name}
          className="grid justify-items-center gap-3 text-foreground"
        >
          <ThinkingDots size={38} config={figureConfig(name)} />
          <code className="text-center font-mono text-xs leading-4.5 text-subtle-foreground">
            {name}
          </code>
        </div>
      ))}
    </div>
  );
}
