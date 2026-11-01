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
      <div className="loader-gallery">
        {presets.map(({ name, config }) => (
          <div key={name} className="loader-preset">
            <ThinkingDots size={38} config={config} />
            <span>{name.replaceAll("-", " ")}</span>
          </div>
        ))}
      </div>
    );
  return (
    <div className="loader-stage">
      <ThinkingDots size={72} label="Preparing the next detail" />
      <p>One sequence. Sixteen ways to keep moving.</p>
    </div>
  );
}
