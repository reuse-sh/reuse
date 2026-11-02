"use client";
import { CopyButton } from "@reuse-sh/interactions/react";
import { useEffect, useState } from "react";
export function Example() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <div className="flex items-center justify-center flex-row gap-3">
      <CopyButton
        disabled={!ready}
        text="npm install @reuse-sh/interactions"
        className="relative inline-flex items-center [gap:7px] h-8 border-0 [border-radius:9px] bg-white [box-shadow:0_0_0_0.5px_rgb(0_0_0_/_8%),0_1px_2px_rgb(0_0_0_/_5%),0_2px_4px_rgb(0_0_0_/_2%)] [color:#111] [font-size:13px] [font-weight:500] [--re-copy-icon-size:15px] [--re-copy-gap:7px] [transition:scale_160ms_cubic-bezier(0.23,_1,_0.32,_1),_background-color_160ms_ease,_color_150ms_ease,_opacity_150ms_ease] [&:hover]:[background:#f7f7f7] justify-center w-8 p-0"
        aria-label="Copy install command"
      />
      <CopyButton
        disabled={!ready}
        text="https://reuse.sh/copy-button"
        className="relative inline-flex items-center [gap:7px] h-8 [padding:0_12px_0_10px] border-0 [border-radius:9px] bg-white [box-shadow:0_0_0_0.5px_rgb(0_0_0_/_8%),0_1px_2px_rgb(0_0_0_/_5%),0_2px_4px_rgb(0_0_0_/_2%)] [color:#111] [font-size:13px] [font-weight:500] [--re-copy-icon-size:15px] [--re-copy-gap:7px] [transition:scale_160ms_cubic-bezier(0.23,_1,_0.32,_1),_background-color_160ms_ease,_color_150ms_ease,_opacity_150ms_ease] [&:hover]:[background:#f7f7f7]"
      >
        Copy link
      </CopyButton>
    </div>
  );
}

import "@reuse-sh/interactions/styles.css";
