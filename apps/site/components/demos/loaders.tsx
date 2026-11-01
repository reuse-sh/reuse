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
            <code className="loader-name">{name}</code>
          </div>
        ))}
      </div>
    );
  return (
    <div className="loader-stage">
      <ThinkingDots size={72} label="Loading" />
      <p>The default sequence, moving through all sixteen figures.</p>
    </div>
  );
}
