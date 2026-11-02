"use client";
import { HoldToConfirmButton } from "@reuse-sh/interactions/react";
import { useEffect, useRef, useState } from "react";

function useKeepFocus<E extends HTMLElement>(swap: unknown) {
  const root = useRef<E>(null);
  const refocus = useRef(false);
  const keyHeld = useRef(false);
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") keyHeld.current = true;
    };
    const up = () => {
      keyHeld.current = false;
    };
    document.addEventListener("keydown", down, true);
    document.addEventListener("keyup", up, true);
    return () => {
      document.removeEventListener("keydown", down, true);
      document.removeEventListener("keyup", up, true);
    };
  }, []);
  // biome-ignore lint/correctness/useExhaustiveDependencies: focus moves after each swap renders.
  useEffect(() => {
    if (!refocus.current) return;
    refocus.current = false;
    const focus = () => root.current?.querySelector("button")?.focus();
    if (!keyHeld.current) {
      focus();
      return;
    }

    document.addEventListener("keyup", focus, { once: true });
    return () => document.removeEventListener("keyup", focus);
  }, [swap]);
  const mark = () => {
    refocus.current = Boolean(root.current?.contains(document.activeElement));
  };
  return { root, mark };
}

const rows = [
  ["Workspace name", "Ink and Paper"],
  ["Members", "6 people"],
  ["Default paper", "Matte cotton, 310 g"],
] as const;

export function SettingsRow() {
  const [scheduled, setScheduled] = useState(false);
  const { root, mark } = useKeepFocus<HTMLElement>(scheduled);
  const change = (next: boolean) => {
    mark();
    setScheduled(next);
  };
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <section
      className="[max-width:600px]"
      aria-labelledby="re-hold-settings-x-settings-h"
      ref={root}
    >
      <h2
        id="re-hold-settings-x-settings-h"
        className="[padding-bottom:10px] [font-size:15px] font-semibold"
      >
        Workspace
      </h2>
      <dl>
        {rows.map(([name, value]) => (
          <div
            key={name}
            className="flex items-center justify-between gap-4 [min-height:56px] [padding:12px_0] [box-shadow:inset_0_1px_rgb(0_0_0_/_7%)] [font-size:14px]"
          >
            <dt className="[color:#5b5b5b]">{name}</dt>
            <dd className="[color:#111] text-right">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex items-center justify-between gap-4 [min-height:56px] [font-size:14px] [margin-top:28px] [padding:16px] [border-radius:14px] [background:#fdf5f4] [box-shadow:inset_0_0_0_1px_rgb(194_54_43_/_14%)] [&_.re-hold-settings-c-hold]:flex-none max-[600px]:flex-col max-[600px]:items-stretch max-[600px]:[&_.re-hold-settings-c-hold]:justify-center">
        <div>
          <b className="[font-weight:560]">Delete workspace</b>
          <p
            className="[margin-top:2px] [font-size:13px] [line-height:19px] [color:#5b5b5b]"
            role="status"
          >
            {scheduled
              ? "Scheduled. Everything is removed in 7 days."
              : "Removes every print, order and member after 7 days."}
          </p>
        </div>
        {scheduled ? (
          <button
            type="button"
            className="[padding:4px_2px] border-0 [background:none] [color:#111] [font-size:13.5px] [font-weight:550] [text-decoration:underline] [text-decoration-color:rgb(0_0_0_/_25%)] [text-underline-offset:4px] cursor-pointer [&:hover]:[text-decoration-color:currentColor]"
            onClick={() => change(false)}
          >
            Cancel deletion
          </button>
        ) : (
          <HoldToConfirmButton
            className="re-hold-settings-c-hold"
            disabled={!ready}
            holdMs={2000}
            onConfirm={() => change(true)}
          >
            Hold to delete
          </HoldToConfirmButton>
        )}
      </div>
    </section>
  );
}

export const Example = SettingsRow;

import "./effects.css";
