"use client";

import { findLibrary } from "@reuse-sh/catalog";
import {
  HoldToConfirmButton,
  MovingHighlight,
} from "@reuse-sh/interactions/react";
import { ThinkingDots } from "@reuse-sh/loaders/react";
import { type ReactNode, useEffect, useRef, useState } from "react";
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
    <article className="c-card">
      <div className="c-card-in">
        <div className="h-card-demo">{children}</div>
        <p className="h-card-cap">
          <b>{library?.name}</b>
          <span>{library?.description}</span>
        </p>
      </div>
    </article>
  );
}

function MenuDemo() {
  const [current, setCurrent] = useState(menu[0][1]);
  return (
    <MovingHighlight className="c-menu-card" role="group" aria-label="File">
      {menu.map(([icon, label, key]) => (
        <button
          type="button"
          aria-pressed={current === label}
          data-re-row=""
          data-current={current === label ? "" : undefined}
          key={label}
          onClick={() => setCurrent(label)}
        >
          <Icon name={icon} size={16} />
          <span>{label}</span>
          <kbd>{key}</kbd>
        </button>
      ))}
    </MovingHighlight>
  );
}

function HoldDemo() {
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <div className="c-hold-wrap">
      <HoldToConfirmButton
        className="c-hold"
        data-done={done ? "" : undefined}
        onConfirm={() => {
          setDone(true);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => setDone(false), 2400);
        }}
      >
        <Icon name="trash" size={16} />
        <HoldLabel
          labels={["Hold to delete", "Deleted"]}
          shown={done ? "Deleted" : "Hold to delete"}
        />
      </HoldToConfirmButton>
      <p className="c-hold-hint" aria-live="polite">
        {done ? "Restoring in a moment" : "Release early to cancel"}
      </p>
    </div>
  );
}

export function SmallDemos() {
  return (
    <div className="h-cards">
      <DemoCard slug="floating-tooltip">
        <MovingHighlight
          className="c-toolbar"
          role="group"
          aria-label="Photo actions"
        >
          {tools.map(([icon, label]) => (
            <button
              type="button"
              key={label}
              aria-label={label}
              data-re-row=""
              data-re-tooltip={label}
            >
              <Icon name={icon} size={18} />
            </button>
          ))}
        </MovingHighlight>
      </DemoCard>
      <DemoCard slug="moving-highlight">
        <MenuDemo />
      </DemoCard>
      <DemoCard slug="hold-to-confirm">
        <HoldDemo />
      </DemoCard>
      <DemoCard slug="loaders">
        <p className="h-load">
          <ThinkingDots size={26} label="Thinking" />
          <span aria-hidden="true">Thinking</span>
        </p>
      </DemoCard>
    </div>
  );
}
