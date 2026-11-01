"use client";

import { copyText } from "@reuse-sh/core/clipboard";
import { useEffect, useRef, useState } from "react";
import { agentPrompt } from "../../lib/prompt";

const labels = {
  idle: "Copy prompt for your agent",
  copied: "Copied",
  error: "Copy failed",
};

export function CopyPromptButton() {
  const [state, setState] = useState<keyof typeof labels>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <button
      type="button"
      className="c-btn h-copy"
      data-copy-state={state}
      onClick={async () => {
        clearTimeout(timer.current);
        const success = await copyText(agentPrompt);
        setState(success ? "copied" : "error");
        timer.current = setTimeout(() => setState("idle"), 1600);
      }}
    >
      <span className="h-copy-in">
        <span className="h-copy-size" aria-hidden="true">
          {labels.idle}
        </span>
        <span aria-live="polite">{labels[state]}</span>
      </span>
    </button>
  );
}
