"use client";

import { createMovingHighlight } from "@reuse-sh/interactions";
import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import type { Framework } from "../../lib/framework";
import { Icon } from "../icons";

interface ChooserProps {
  framework: Framework;
  pathname: string;
  view?: "code";
  file?: string;
}

function Menu({ framework, pathname, view, file }: ChooserProps) {
  const root = useRef<HTMLDetailsElement>(null);
  const options = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    const list = options.current;
    if (!list) return;
    const highlight = createMovingHighlight(list, {
      selectedSelector: '[aria-current="true"]',
    });
    const outside = (event: PointerEvent) => {
      const details = root.current;
      if (
        details &&
        event.target instanceof Node &&
        !details.contains(event.target)
      )
        details.open = false;
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !root.current?.open) return;
      root.current.open = false;
      root.current.querySelector("summary")?.focus();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", onEscape);
    return () => {
      highlight.destroy();
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);
  const href = (option: Framework) => {
    const query = new URLSearchParams({ framework: option });
    if (view) query.set("view", view);
    if (file) query.set("file", file);
    return `${pathname}?${query}`;
  };
  return (
    <details ref={root} className="re-framework">
      <summary aria-controls={id}>
        <Icon name={framework === "react" ? "react" : "code"} size={14} />
        <span>{framework === "react" ? "React" : "HTML + JavaScript"}</span>
        <Icon name="down" size={12} className="re-framework-chevron" />
      </summary>
      <div ref={options} id={id} className="re-framework-options">
        {(["react", "html"] as const).map((option) => (
          <Link
            key={option}
            data-re-row
            href={href(option)}
            scroll={false}
            aria-current={framework === option ? "true" : undefined}
            onClick={(event) => {
              if (root.current) root.current.open = false;
              const mobile =
                event.currentTarget.closest<HTMLDetailsElement>(".d-toc-m");
              if (mobile) mobile.open = false;
            }}
          >
            <Icon name={option === "react" ? "react" : "code"} size={14} />
            <span>{option === "react" ? "React" : "HTML + JavaScript"}</span>
            {framework === option ? <Icon name="check" size={12} /> : null}
          </Link>
        ))}
      </div>
    </details>
  );
}

export function FrameworkChooser(props: ChooserProps) {
  return <Menu key={`${props.framework}:${props.pathname}`} {...props} />;
}
