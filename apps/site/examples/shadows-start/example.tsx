"use client";
import "@reuse-sh/shadows/styles.css";
import { type ShadowLevel, shadowLevels } from "@reuse-sh/shadows";
import { useEffect, useState } from "react";

export function Example() {
  const [level, setLevel] = useState<ShadowLevel>("md");
  const [enhanced, setEnhanced] = useState(false);
  useEffect(() => setEnhanced(true), []);
  return (
    <div>
      <div className="grid min-h-[240px] place-items-center pb-8">
        <div
          className={`re-shadow-ring-${level} flex w-[min(260px,100%)] flex-col items-center gap-3 rounded-[14px] bg-white px-5 py-8 transition-[box-shadow] duration-[220ms] ease-[ease] motion-reduce:transition-none`}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M8.64298 3.14559L6.93816 3.93362C4.31272 5.14719 3 5.75397 3 6.75C3 7.74603 4.31272 8.35281 6.93817 9.56638L8.64298 10.3544C10.2952 11.1181 11.1214 11.5 12 11.5C12.8786 11.5 13.7048 11.1181 15.357 10.3544L17.0618 9.56638C19.6873 8.35281 21 7.74603 21 6.75C21 5.75397 19.6873 5.14719 17.0618 3.93362L15.357 3.14559C13.7048 2.38186 12.8786 2 12 2C11.1214 2 10.2952 2.38186 8.64298 3.14559Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M20.788 11.0972C20.9293 11.2959 21 11.5031 21 11.7309C21 12.7127 19.6873 13.3109 17.0618 14.5072L15.357 15.284C13.7048 16.0368 12.8786 16.4133 12 16.4133C11.1214 16.4133 10.2952 16.0368 8.64298 15.284L6.93817 14.5072C4.31272 13.3109 3 12.7127 3 11.7309C3 11.5031 3.07067 11.2959 3.212 11.0972"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M20.3767 16.2661C20.7922 16.5971 21 16.927 21 17.3176C21 18.2995 19.6873 18.8976 17.0618 20.0939L15.357 20.8707C13.7048 21.6236 12.8786 22 12 22C11.1214 22 10.2952 21.6236 8.64298 20.8707L6.93817 20.0939C4.31272 18.8976 3 18.2995 3 17.3176C3 16.927 3.20778 16.5971 3.62334 16.2661"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <strong className="font-[560] text-[#111]">Order a test print</strong>
          <span className="text-[13px] text-[#858585]">
            re-shadow-ring-{level}
          </span>
        </div>
      </div>
      <fieldset className="mx-auto my-0 min-w-0 flex w-fit max-w-full gap-0.5 overflow-x-auto rounded-[10px] border-0 bg-black/5 p-[3px]">
        <legend className="sr-only">Shadow size</legend>
        {shadowLevels.map((size) => (
          <button
            key={size}
            type="button"
            aria-pressed={level === size}
            onClick={() => setLevel(size)}
            disabled={!enhanced}
            className="cursor-pointer rounded-lg border-0 bg-transparent px-[11px] py-1.5 text-[13px] aria-pressed:bg-white aria-pressed:shadow-[0_0_0_0.5px_#00000014,0_1px_2px_#0000000d,0_2px_4px_#00000005]"
          >
            {size}
          </button>
        ))}
      </fieldset>
    </div>
  );
}
