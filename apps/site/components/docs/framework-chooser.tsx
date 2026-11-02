"use client";
import { createMovingHighlight } from "@reuse-sh/interactions";
import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import { MenuSurface } from "@/components/ui/surfaces";
import type { Framework } from "../../lib/framework";
import { Icon } from "../icons";

interface ChooserProps {
  framework: Framework;
  pathname: string;
}
function Menu({ framework, pathname }: ChooserProps) {
  const root = useRef<HTMLDetailsElement>(null);
  const options = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    if (!options.current) return;
    const highlight = createMovingHighlight(options.current, {
      selectedSelector: '[aria-current="true"]',
      className: "rounded-control bg-accent",
    });
    const outside = (event: PointerEvent) => {
      if (
        root.current &&
        event.target instanceof Node &&
        !root.current.contains(event.target)
      )
        root.current.open = false;
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && root.current?.open) {
        root.current.open = false;
        root.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", onEscape);
    return () => {
      highlight.destroy();
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);
  return (
    <details ref={root} className="re-framework relative mb-5">
      <summary
        aria-controls={id}
        className="flex min-h-7 w-fit max-w-full cursor-pointer list-none items-center gap-2 text-foreground [&::-webkit-details-marker]:hidden"
      >
        <Icon
          name={framework === "react" ? "react" : "code"}
          className="size-3.5"
        />
        <span>{framework === "react" ? "React" : "HTML + JavaScript"}</span>
        <Icon name="down" className="ml-1 size-3 text-sidebar-foreground" />
      </summary>
      <MenuSurface
        ref={options}
        id={id}
        className="absolute top-full -left-2 z-20 mt-1.5 min-w-48 rounded-xl p-1.5"
      >
        {(["react", "html"] as const).map((option) => (
          <Link
            key={option}
            data-re-row
            href={`${pathname}?framework=${option}`}
            scroll={false}
            aria-current={framework === option ? "true" : undefined}
            className="flex min-h-8 items-center gap-2 whitespace-nowrap rounded-control px-2 py-1 text-muted-foreground aria-[current=true]:text-foreground"
            onClick={(event) => {
              if (root.current) root.current.open = false;
              const mobile = event.currentTarget.closest<HTMLDetailsElement>(
                '[data-slot="docs-disclosure"]',
              );
              if (mobile) mobile.open = false;
            }}
          >
            <Icon
              name={option === "react" ? "react" : "code"}
              className="size-3.5"
            />
            <span>{option === "react" ? "React" : "HTML + JavaScript"}</span>
            {framework === option ? (
              <Icon name="check" className="ml-auto size-3" />
            ) : null}
          </Link>
        ))}
      </MenuSurface>
    </details>
  );
}
export function FrameworkChooser(props: ChooserProps) {
  return <Menu key={`${props.framework}:${props.pathname}`} {...props} />;
}
