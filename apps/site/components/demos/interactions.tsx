"use client";

import {
  HoldToConfirmButton,
  MovingHighlight,
} from "@reuse-sh/interactions/react";
import { useEffect, useRef, useState } from "react";
import { HoldLabel } from "../hold-label";
import { Icon, type IconName } from "../icons";

export function HighlightDemo() {
  const [selected, setSelected] = useState("Overview");
  return (
    <div className="interaction-stage">
      <MovingHighlight className="highlight-menu">
        {[
          { label: "Overview", icon: "book" },
          { label: "Image library", icon: "lightbox" },
          { label: "Annotations", icon: "annotations" },
          { label: "Team", icon: "avatars" },
        ].map((item) => (
          <button
            type="button"
            data-re-row=""
            aria-pressed={selected === item.label}
            data-current={selected === item.label ? "" : undefined}
            key={item.label}
            onClick={() => setSelected(item.label)}
          >
            <Icon name={item.icon as IconName} />
            <span>{item.label}</span>
          </button>
        ))}
      </MovingHighlight>
    </div>
  );
}

export function HoldDemo() {
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <div className="interaction-stage">
      <HoldToConfirmButton
        className="c-hold"
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
      <span className="sr-only" role="status">
        {done ? "Deleted" : ""}
      </span>
    </div>
  );
}
