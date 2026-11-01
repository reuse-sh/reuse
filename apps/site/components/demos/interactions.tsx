"use client";

import {
  HoldToConfirmButton,
  MovingHighlight,
} from "@reuse-sh/interactions/react";
import { useState } from "react";
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
            <Icon name="arrow" size={14} />
          </button>
        ))}
      </MovingHighlight>
      <p className="demo-hint">
        Point at a row or press Tab. Click to select one.
      </p>
    </div>
  );
}

export function HoldDemo() {
  const [confirmed, setConfirmed] = useState(false);
  return (
    <div className="interaction-stage">
      <div className="hold-example">
        <div className="small-document">
          <Icon name={confirmed ? "check" : "shadows"} size={28} />
        </div>
        <p>{confirmed ? "Draft removed." : "Remove this draft?"}</p>
        <HoldToConfirmButton
          holdMs={1200}
          onConfirm={() => setConfirmed(true)}
          disabled={confirmed}
          className="c-hold"
        >
          {confirmed ? "Confirmed" : "Hold to remove"}
        </HoldToConfirmButton>
        <span className="hold-feedback" role="status">
          {confirmed ? "Removed" : "Release early to cancel"}
        </span>
        {confirmed ? (
          <button
            type="button"
            className="text-button"
            onClick={() => setConfirmed(false)}
          >
            Try again
          </button>
        ) : null}
      </div>
    </div>
  );
}
