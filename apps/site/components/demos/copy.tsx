"use client";

import { CopyButton } from "@reuse-sh/interactions/react";

const refused = () =>
  Promise.reject(new Error("This demo refuses the copy on purpose."));

export function CopyDemo() {
  return (
    <div className="interaction-stage copy-demo">
      <ul className="copy-demo-list">
        <li>
          <CopyButton
            text="npm install @reuse-sh/interactions"
            className="c-copy copy-demo-square"
            aria-label="Copy install command"
          />
          <span>Icon only</span>
        </li>
        <li>
          <CopyButton text="https://reuse.sh/copy-button" className="c-copy">
            Copy link
          </CopyButton>
          <span>Icon and label</span>
        </li>
        <li>
          <CopyButton getText={refused} className="c-copy">
            Copy
          </CopyButton>
          <span>Refused copy</span>
        </li>
      </ul>
      <p className="demo-hint">
        Click each one. The icon turns into a check or a cross, then back.
      </p>
    </div>
  );
}
