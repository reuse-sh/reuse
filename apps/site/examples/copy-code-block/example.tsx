"use client";
import { CopyButton } from "@reuse-sh/interactions/react";
import { useEffect, useState } from "react";

const command = "npm install @reuse-sh/interactions";

export function CopyCodeBlock() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <div className="relative flex items-center justify-between gap-3 [--re-card-padding:10px_10px_10px_18px] w-full re-card re-shadow-ring-sm">
      <pre className="m-0 overflow-x-auto [font-family:var(--mono,ui-monospace,monospace)] [font-size:13px] [line-height:22px]">
        <code>
          <span className="[color:#858585]" aria-hidden="true">
            ${" "}
          </span>
          {command}
        </code>
      </pre>
      <CopyButton
        disabled={!ready}
        text={command}
        className="relative inline-flex items-center [gap:7px] border-0 [border-radius:9px] [font-size:13px] [font-weight:500] [--re-copy-icon-size:15px] [--re-copy-gap:7px] [transition:scale_160ms_cubic-bezier(0.23,_1,_0.32,_1),_background-color_160ms_ease,_color_150ms_ease,_opacity_150ms_ease] justify-center [width:30px] [height:30px] p-0 bg-transparent [box-shadow:none] [color:#8a8a8a] [&:hover]:[background:rgb(0_0_0_/_4%)] [&:hover]:[color:#111]"
        aria-label="Copy command"
      />
    </div>
  );
}

export const Example = CopyCodeBlock;

import "@reuse-sh/shadows/styles.css";

import "@reuse-sh/interactions/styles.css";
