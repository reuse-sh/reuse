"use client";

import { useEffect, useRef, useState } from "react";
import { HoldButton } from "@/components/ui/hold-button";

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
      className="max-w-150"
      aria-labelledby="re-hold-settings-x-settings-h"
      ref={root}
    >
      <h2
        id="re-hold-settings-x-settings-h"
        className="pb-2.5 text-body font-semibold"
      >
        Workspace
      </h2>
      <dl>
        {rows.map(([name, value]) => (
          <div
            key={name}
            className="flex items-center justify-between gap-4 min-h-14 py-3 border-t border-border text-ui"
          >
            <dt className="text-muted-foreground">{name}</dt>
            <dd className="text-foreground text-right">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex items-center justify-between gap-4 min-h-14 text-ui mt-7 p-4 rounded-xl bg-destructive/5 ring-1 ring-destructive/15 [&_.re-hold-settings-button]:flex-none max-sm:flex-col max-sm:items-stretch max-sm:[&_.re-hold-settings-button]:justify-center">
        <div>
          <b className="font-semibold">Delete workspace</b>
          <p
            className="mt-0.5 text-label leading-5 text-muted-foreground"
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
            className="py-1 px-0.5 border-0 bg-transparent text-foreground text-ui font-semibold underline decoration-foreground/25 underline-offset-4 cursor-pointer [&:hover]:decoration-current"
            onClick={() => change(false)}
          >
            Cancel deletion
          </button>
        ) : (
          <HoldButton
            className="re-hold-settings-button transition duration-150 ease-ui"
            disabled={!ready}
            holdMs={2000}
            onConfirm={() => change(true)}
          >
            Hold to delete
          </HoldButton>
        )}
      </div>
    </section>
  );
}

export const Example = SettingsRow;

import "./effects.css";
