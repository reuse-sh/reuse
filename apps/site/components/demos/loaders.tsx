"use client";

import { figureConfig, figureNames } from "@reuse-sh/loaders";
import { ThinkingDots } from "@reuse-sh/loaders/react";

const presets = figureNames.map((name) => ({
  name,
  config: figureConfig(name),
}));

export function LoadersDemo({ gallery = false }: { gallery?: boolean }) {
  if (gallery)
    return (
      <div className="loader-gallery grid [grid-template-columns:repeat(4,_minmax(0,_1fr))] [gap:36px_16px] mt-[44px]">
        {presets.map(({ name, config }) => (
          <div
            key={name}
            className="loader-preset grid justify-items-center gap-[12px] text-[color:var(--ink)]"
          >
            <ThinkingDots size={38} config={config} />
            <code className="loader-name [font-family:var(--mono)] text-[12px] leading-[18px] text-[color:var(--mute)] text-center">
              {name}
            </code>
          </div>
        ))}
      </div>
    );
  return (
    <div className="loader-stage">
      <ThinkingDots size={72} label="Loading" />
    </div>
  );
}
