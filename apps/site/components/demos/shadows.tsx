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
    <div className="card-patterns grid [grid-template-columns:minmax(0,_1fr)] gap-[28px] max-w-[560px] [margin:0_auto]">
      <div className="re-card re-card-code re-shadow-ring-sm">
        <pre>
          <code className="card-patterns-code [font-family:var(--mono)] text-[13px]">
            {install}
          </code>
        </pre>
        <CopyControl value={install} />
      </div>
      <div className="re-card-frame">
        <div className="re-card re-card-action re-shadow-ring-xs">
          <div>
            <h3 className="card-patterns-title text-[15px] leading-[22px] font-semibold">
              Order a test print
            </h3>
            <p className="card-patterns-text mt-[2px] text-[13.5px] leading-[21px] text-[color:var(--prose)]">
              A 20 × 15 cm proof of Coral sky on the same cotton paper, shipped
              in two days.
            </p>
          </div>
          <button
            type="button"
            className="card-patterns-action inline-flex [flex:none] items-center gap-[6px] h-[36px] [padding:0_14px] [border:0] rounded-[10px] [background:var(--surface)] [box-shadow:inset_0_0_0_1px_rgb(0_0_0_/_12%)] text-[color:var(--ink)] text-[13.5px] font-[540] [cursor:pointer]"
          >
            Order a proof <Icon name="arrow" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
