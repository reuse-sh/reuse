"use client";

import { CopyButton } from "@reuse-sh/interactions/react";

export function CopyDemo() {
  return (
    <div className="interaction-stage copy-demo">
      <CopyButton
        text="npm install @reuse-sh/interactions"
        className="c-copy copy-demo-square"
        aria-label="Copy install command"
      />
      <CopyButton text="https://reuse.sh/copy-button" className="c-copy">
        Copy link
      </CopyButton>
    </div>
  );
}
