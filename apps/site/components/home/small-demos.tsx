"use client";

import { findLibrary } from "@reuse-sh/catalog";
import { MovingHighlight } from "@reuse-sh/interactions/react";
import { ThinkingDots } from "@reuse-sh/loaders/react";
import { type ReactNode, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HoldButton } from "@/components/ui/hold-button";
import { MenuSurface, Toolbar } from "@/components/ui/surfaces";
import { cn } from "@/lib/utils";
import { HoldLabel } from "../hold-label";
import { Icon, type IconName } from "../icons";

const tools: [IconName, string][] = [
  ["zoom", "Zoom in"],
  ["heart", "Add to favorites"],
  ["share", "Share"],
  ["trash", "Move to trash"],
];

const menu: [IconName, string, string][] = [
  ["zoom", "Preview", "Space"],
  ["share", "Share", "⌘S"],
  ["copy", "Duplicate", "⌘D"],
  ["trash", "Move to trash", "⌫"],
];

function DemoCard({ slug, children }: { slug: string; children: ReactNode }) {
  const library = findLibrary(slug);
  return (
    <article>
      <Card className="h-full">
        <CardContent padding="none" className="flex flex-col">
          <div className="grid min-h-40 flex-1 place-items-center p-6 sm:min-h-46">
            {children}
          </div>
          <p className="px-5 pb-4.5 text-ui">
            <b className="block">{library?.name}</b>
            <span className="block text-pretty text-muted-foreground">
              {library?.description}
            </span>
          </p>
        </CardContent>
      </Card>
    </article>
  );
}

function MenuDemo() {
  const [current, setCurrent] = useState(menu[0][1]);
  return (
    <MenuSurface className="w-58 max-w-full rounded-xl p-1 shadow-raised">
      <MovingHighlight
        className="moving-highlight grid gap-px"
        role="group"
        aria-label="File"
      >
        {menu.map(([icon, label, key]) => (
          <button
            type="button"
            className="flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-left text-ui focus-visible:-outline-offset-2"
            aria-pressed={current === label}
            data-re-row=""
            data-current={current === label ? "" : undefined}
            key={label}
            onClick={() => setCurrent(label)}
          >
            <Icon name={icon} size={16} className="text-muted-foreground" />
            <span>{label}</span>
            <kbd className="ml-auto font-sans text-caption font-normal text-subtle-foreground">
              {key}
            </kbd>
          </button>
        ))}
      </MovingHighlight>
    </MenuSurface>
  );
}

function HoldDemo() {
  const [done, setDone] = useState(false);
  return (
    <div className="grid justify-items-center gap-3">
      <HoldButton
        className="transition-transform ease-ui active:scale-97 data-confirmed:scale-100"
        resetMs={2400}
        onConfirm={() => setDone(true)}
        onReset={() => setDone(false)}
      >
        <Icon name="trash" size={16} />
        <HoldLabel
          labels={["Hold to delete", "Deleted"]}
          shown={done ? "Deleted" : "Hold to delete"}
        />
      </HoldButton>
      <span className="sr-only" role="status">
        {done ? "Deleted" : ""}
      </span>
    </div>
  );
}

export function SmallDemos() {
  return (
    <div className="mt-7 grid gap-3 sm:grid-cols-2">
      <DemoCard slug="floating-tooltip">
        <Toolbar>
          <MovingHighlight
            className="moving-highlight flex gap-0.5"
            role="group"
            aria-label="Photo actions"
          >
            {tools.map(([icon, label]) => (
              <button
                type="button"
                key={label}
                aria-label={label}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "rounded-lg text-muted-foreground hover:bg-transparent hover:text-foreground active:scale-95 focus-visible:-outline-offset-2",
                )}
                data-re-row=""
                data-re-tooltip={label}
              >
                <Icon name={icon} size={18} />
              </button>
            ))}
          </MovingHighlight>
        </Toolbar>
      </DemoCard>
      <DemoCard slug="moving-highlight">
        <MenuDemo />
      </DemoCard>
      <DemoCard slug="hold-to-confirm">
        <HoldDemo />
      </DemoCard>
      <DemoCard slug="loaders">
        <p className="m-0 flex items-center gap-2 text-foreground">
          <ThinkingDots size={26} label="Thinking" />
          <span aria-hidden="true" className="text-body text-muted-foreground">
            Thinking
          </span>
        </p>
      </DemoCard>
    </div>
  );
}
