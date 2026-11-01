"use client";

import { copyText } from "@reuse-sh/core/clipboard";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons";

export function CopyControl({
  value,
  label = "Copy code",
  text = false,
}: {
  value: string;
  label?: string;
  text?: boolean;
}) {
  const [state, setState] = useState<"idle" | "pending" | "copied" | "error">(
    "idle",
  );
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(timer.current);
    };
  }, []);
  return (
    <button
      type="button"
      className={
        text ? "button button-outline copy-control" : "icon-button copy-control"
      }
      data-copy-state={state}
      aria-label={state === "copied" ? "Copied" : label}
      disabled={state === "pending"}
      onClick={async () => {
        clearTimeout(timer.current);
        setState("pending");
        const success = await copyText(value);
        if (!mounted.current) return;
        setState(success ? "copied" : "error");
        timer.current = setTimeout(() => setState("idle"), 2000);
      }}
    >
      <Icon name={state === "copied" ? "check" : "copy"} size={16} />
      {text ? <span>{state === "copied" ? "Copied" : label}</span> : null}
      <span className="sr-only" role="status">
        {state === "copied"
          ? "Copied"
          : state === "error"
            ? "Copy failed. Try again."
            : ""}
      </span>
    </button>
  );
}

export function CodeCard({ code, label }: { code: string; label?: string }) {
  return (
    <div className="code-card reuse-card reuse-shadow-ring-sm">
      {label ? <p className="code-card-label">{label}</p> : null}
      <pre>
        <code>{code}</code>
      </pre>
      <CopyControl value={code} />
    </div>
  );
}
