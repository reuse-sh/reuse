"use client";
import { HoldToConfirmButton } from "@reuse-sh/interactions/react";
import { useEffect, useRef, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const iconPaths = {
  doc: (
    <>
      <path
        d="M16.5 2V5M7.5 2V5M12 2V5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M13 3.5H11C7.70017 3.5 6.05025 3.5 5.02513 4.52513C4 5.55025 4 7.20017 4 10.5V15C4 18.2998 4 19.9497 5.02513 20.9749C6.05025 22 7.70017 22 11 22H13C16.2998 22 17.9497 22 18.9749 20.9749C20 19.9497 20 18.2998 20 15V10.5C20 7.20017 20 5.55025 18.9749 4.52512C17.9497 3.5 16.2998 3.5 13 3.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M8 15H12M8 11H16"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </>
  ),
  trash: (
    <>
      <path
        d="M19.5 5.5L18.8803 15.5251C18.7219 18.0864 18.6428 19.3671 18.0008 20.2879C17.6833 20.7431 17.2747 21.1273 16.8007 21.416C15.8421 22 14.559 22 11.9927 22C9.42312 22 8.1383 22 7.17905 21.4149C6.7048 21.1257 6.296 20.7408 5.97868 20.2848C5.33688 19.3626 5.25945 18.0801 5.10461 15.5152L4.5 5.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <path
        d="M3 5.5H21M16.0557 5.5L15.3731 4.09173C14.9196 3.15626 14.6928 2.68852 14.3017 2.39681C14.215 2.3321 14.1231 2.27454 14.027 2.2247C13.5939 2 13.0741 2 12.0345 2C10.9688 2 10.436 2 9.99568 2.23412C9.8981 2.28601 9.80498 2.3459 9.71729 2.41317C9.32164 2.7167 9.10063 3.20155 8.65861 4.17126L8.05292 5.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <path
        d="M9.5 16.5L9.5 10.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <path
        d="M14.5 16.5L14.5 10.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </>
  ),
};
function Icon({
  name,
  size = 18,
}: {
  name: keyof typeof iconPaths;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      {iconPaths[name]}
    </svg>
  );
}

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

export function DeleteFile() {
  const [deleted, setDeleted] = useState(false);
  const { root, mark } = useKeepFocus<HTMLDivElement>(deleted);
  const change = (next: boolean) => {
    mark();
    setDeleted(next);
  };
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <div className="grid gap-3 max-w-140" ref={root}>
      {deleted ? (
        <div
          className="flex items-center justify-between gap-3.5 min-h-18 py-3.5 pr-3.5 pl-4 rounded-xl bg-card shadow-raised text-ui text-muted-foreground"
          role="status"
        >
          <p>
            <b className="text-foreground font-medium wrap-anywhere">
              coral-sky-proof-03.tif
            </b>{" "}
            was moved to the trash.
          </p>
          <button
            type="button"
            className="py-1 px-0.5 border-0 bg-transparent text-foreground text-ui font-semibold underline decoration-foreground/25 underline-offset-4 cursor-pointer [&:hover]:decoration-current"
            onClick={() => change(false)}
          >
            Undo
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap sm:flex-nowrap [&>span:nth-child(2)]:flex-1 items-center gap-3.5 min-h-18 py-3.5 pr-3.5 pl-4 rounded-xl bg-card shadow-raised">
          <span
            className="grid place-items-center w-10 h-11 rounded-lg bg-muted text-muted-foreground"
            aria-hidden="true"
          >
            <Icon name="doc" size={20} />
          </span>
          <span className="grid min-w-0">
            <b className="overflow-hidden text-ui leading-5 font-medium whitespace-nowrap text-ellipsis">
              coral-sky-proof-03.tif
            </b>
            <small className="text-caption leading-4.5 text-subtle-foreground">
              48.2 MB · Edited 2 hours ago by Mara Lind
            </small>
          </span>
          <div className="grid justify-items-center gap-3 max-sm:w-full max-sm:justify-items-stretch max-sm:[&_.re-hold-delete-file-button]:justify-center">
            <HoldToConfirmButton
              className={cn(
                buttonVariants({ variant: "destructive", size: "lg" }),
                "re-hold-delete-file-button select-none transition duration-150 ease-ui data-confirmed:cursor-default data-confirmed:bg-destructive/10 [&_.re-hold-fill]:opacity-12",
              )}
              disabled={!ready}
              onConfirm={() => change(true)}
            >
              <Icon name="trash" size={16} />
              <span>Hold to delete</span>
            </HoldToConfirmButton>
          </div>
        </div>
      )}
      <p className="text-label leading-4.5 text-subtle-foreground">
        Release early, move off the button or press <kbd>Esc</kbd> to cancel.
      </p>
    </div>
  );
}

export const Example = DeleteFile;

import "./effects.css";
