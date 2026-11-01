"use client";

import { type ShadowLevel, shadowLevels } from "@reuse-sh/shadows";
import { useState } from "react";
import { CodeCard } from "../copy-control";
import { Icon } from "../icons";

export function ShadowsDemo() {
  const [level, setLevel] = useState<ShadowLevel>("md");
  return (
    <div className="shadow-playground">
      <div className="shadow-surface">
        <div className={`shadow-object reuse-shadow-ring-${level}`}>
          <Icon name="shadows" size={28} />
          <strong>A little depth.</strong>
          <span>Two layers and a fine edge.</span>
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

export function CardPatterns() {
  return (
    <div className="card-patterns">
      <CodeCard code={'import "@reuse-sh/shadows/styles.css";'} />
      <div className="reuse-card-frame">
        <div className="reuse-card reuse-card-action reuse-shadow-ring-xs">
          <div>
            <h3>Keep the details in one place.</h3>
            <p>
              Read the guide, reuse the implementation, and adapt it to your
              project.
            </p>
          </div>
          <a className="button button-outline" href="/for-agents">
            Read the guide <Icon name="arrow" size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}
