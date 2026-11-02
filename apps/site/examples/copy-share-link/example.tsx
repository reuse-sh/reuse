"use client";
import { CopyButton } from "@reuse-sh/interactions/react";
import { useEffect, useState } from "react";

const link = "https://prints.example/coral-sky";

export function CopyShareLink() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <div className="[max-width:460px] [--re-card-padding:20px] re-card re-shadow-ring-md">
      <p className="font-semibold">Share Coral sky</p>
      <p className="[margin-top:2px] [font-size:14px] [line-height:22px] [color:#5b5b5b]">
        Anyone with the link can see the print and order a proof.
      </p>
      <div className="flex gap-2 [margin-top:16px]">
        <input
          className="[flex:1] min-w-0 h-8 [padding:0_10px] border-0 [border-radius:9px] [background:#f6f6f5] [color:#2e2e2e] [font-size:13px] [&:focus-visible]:[outline:2px_solid_#111] [&:focus-visible]:[outline-offset:1px]"
          value={link}
          readOnly
          aria-label="Link to the print"
        />
        <CopyButton
          disabled={!ready}
          text={link}
          className="relative inline-flex items-center [gap:7px] h-8 [padding:0_12px_0_10px] border-0 [border-radius:9px] bg-white [box-shadow:0_0_0_0.5px_rgb(0_0_0_/_8%),0_1px_2px_rgb(0_0_0_/_5%),0_2px_4px_rgb(0_0_0_/_2%)] [color:#111] [font-size:13px] [font-weight:500] [--re-copy-icon-size:15px] [--re-copy-gap:7px] [transition:scale_160ms_cubic-bezier(0.23,_1,_0.32,_1),_background-color_160ms_ease,_color_150ms_ease,_opacity_150ms_ease] [&:hover]:[background:#f7f7f7]"
        >
          Copy link
        </CopyButton>
      </div>
    </div>
  );
}

export const Example = CopyShareLink;

import "@reuse-sh/shadows/styles.css";

import "@reuse-sh/interactions/styles.css";
