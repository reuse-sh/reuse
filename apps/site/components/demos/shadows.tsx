"use client";

import { type ShadowLevel, shadowLevels } from "@reuse-sh/shadows";
import { useState } from "react";
import { CopyControl } from "../copy-control";
import { Icon } from "../icons";

export function ShadowsDemo() {
  const [level, setLevel] = useState<ShadowLevel>("md");
  return (
    <div className="shadow-playground">
      <div className="shadow-surface">
        <div className={`shadow-object re-shadow-ring-${level}`}>
          <Icon name="shadows" size={28} />
          <strong>Order a test print</strong>
          <span>re-shadow-ring-{level}</span>
        </div>
      </div>
      <fieldset className="shadow-levels">
        <legend className="sr-only">Shadow size</legend>
        {shadowLevels.map((size) => (
          <button
            type="button"
            key={size}
            aria-pressed={level === size}
            onClick={() => setLevel(size)}
          >
            {size}
          </button>
        ))}
      </fieldset>
    </div>
  );
}

const install = "npm install @reuse-sh/shadows";

export function CardPatterns() {
  return (
    <div className="card-patterns">
      <div className="re-card re-card-code re-shadow-ring-sm">
        <pre>
          <code className="card-patterns-code">{install}</code>
        </pre>
        <CopyControl value={install} />
      </div>
      <div className="re-card-frame">
        <div className="re-card re-card-action re-shadow-ring-xs">
          <div>
            <h3 className="card-patterns-title">Order a test print</h3>
            <p className="card-patterns-text">
              A 20 × 15 cm proof of Coral sky on the same cotton paper, shipped
              in two days.
            </p>
          </div>
          <button type="button" className="card-patterns-action">
            Order a proof <Icon name="arrow" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
