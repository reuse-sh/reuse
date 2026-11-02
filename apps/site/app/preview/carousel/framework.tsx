"use client";

import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import { Icon } from "../../../components/icons";

export function Framework({
  variant,
  platform,
  view,
}: {
  variant: "2" | "3";
  platform: "react" | "html";
  view: "preview" | "code";
}) {
  const root = useRef<HTMLDetailsElement>(null);
  const id = useId();
  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !root.current?.contains(event.target) &&
        root.current
      )
        root.current.open = false;
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !root.current?.open) return;
      root.current.open = false;
      root.current.querySelector("summary")?.focus();
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);
  return (
    <details className="re-framework" ref={root} key={platform}>
      <summary aria-controls={id}>
        <Icon name={platform === "react" ? "react" : "code"} size={14} />
        <span>{platform === "react" ? "React" : "HTML + JavaScript"}</span>
        <Icon name="down" size={12} className="re-framework-chevron" />
      </summary>
      <div id={id} className="re-framework-options">
        {(["react", "html"] as const).map((option) => {
          const next = new URLSearchParams({ __v: variant });
          if (view === "code") next.set("view", view);
          next.set("framework", option);
          next.delete("file");
          return (
            <Link
              key={option}
              href={`/preview/carousel?${next}`}
              scroll={false}
              aria-current={option === platform ? "true" : undefined}
              onClick={(event) => {
                if (root.current) root.current.open = false;
                const disclosure =
                  event.currentTarget.closest<HTMLDetailsElement>(".d-toc-m");
                if (disclosure) disclosure.open = false;
              }}
            >
              <Icon name={option === "react" ? "react" : "code"} size={14} />
              <span>{option === "react" ? "React" : "HTML + JavaScript"}</span>
              {option === platform ? <Icon name="check" size={12} /> : null}
            </Link>
          );
        })}
      </div>
    </details>
  );
}
