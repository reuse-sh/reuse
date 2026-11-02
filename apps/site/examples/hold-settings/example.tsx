"use client";

import { HoldToConfirmButton } from "@reuse-sh/interactions/react";
import { useEffect, useRef, useState } from "react";
import "@reuse-sh/interactions/styles.css";
export function Example() {
  const [ready, setReady] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => setReady(true), []);
  return (
    <div
      className="mx-auto w-full max-w-[640px] p-4 text-[15px] leading-6 text-[#111] sm:p-8"
      ref={root}
    >
      <div className="rounded-2xl bg-white p-4 shadow-[0_0_0_1px_#00000014,0_8px_24px_-12px_#00000026]">
        <h2 className="mb-3 text-lg font-semibold">Workspace</h2>
        <dl>
          <div className="flex flex-wrap justify-between gap-4 border-b border-black/10 py-4">
            <dt>Workspace name</dt>
            <dd>Ink and Paper</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-4 border-b border-black/10 py-4">
            <dt>Members</dt>
            <dd>6 people</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-4 border-b border-black/10 py-4">
            <dt>Default paper</dt>
            <dd>Matte cotton, 310 g</dd>
          </div>
        </dl>
        <b>Delete workspace</b>
        <p className="my-3 text-sm text-[#5b5b5b]" role="status">
          {confirmed
            ? "Scheduled. Everything is removed in 7 days."
            : "Removes every print, order and member after 7 days."}
        </p>
        <HoldToConfirmButton
          className="rounded-[10px] border-0 bg-[#c2362b]/8 px-4 py-2.5 text-[#c2362b] hover:bg-[#c2362b]/12 disabled:opacity-55 data-confirmed:bg-[#c2362b] data-confirmed:text-white"
          disabled={!ready || confirmed}
          holdMs={2000}
          onConfirm={() => setConfirmed(true)}
        >
          Hold to delete
        </HoldToConfirmButton>
        {confirmed && (
          <button
            type="button"
            className="ml-4 underline underline-offset-4"
            onClick={() => {
              setConfirmed(false);
              requestAnimationFrame(() =>
                root.current
                  ?.querySelector<HTMLButtonElement>(".re-hold")
                  ?.focus(),
              );
            }}
          >
            {" "}
            Cancel deletion
          </button>
        )}
      </div>
    </div>
  );
}
