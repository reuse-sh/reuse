"use client";

import { CopyButton } from "@reuse-sh/interactions/react";
import { useDocFramework } from "../lib/framework-context";

export function CopyControl({
  value,
  label = "Copy code",
  text = false,
  className,
}: {
  value: string;
  label?: string;
  text?: boolean;
  className?: string;
}) {
  return (
    <CopyButton
      text={value}
      className={["c-copy", text ? "" : "c-copy-icon", className]
        .filter(Boolean)
        .join(" ")}
      aria-label={text ? undefined : label}
    >
      {text ? label : null}
    </CopyButton>
  );
}

/** The primary button that copies a prompt for a coding agent. */
export function PromptButton({
  prompt,
  className,
}: {
  prompt: string;
  className?: string;
}) {
  const framework = useDocFramework();
  const value = framework
    ? `${prompt} Use ${framework === "react" ? "React with Tailwind CSS" : "HTML, CSS and JavaScript"}.`
    : prompt;
  return (
    <CopyButton
      text={value}
      className={["c-btn c-prompt-btn", className].filter(Boolean).join(" ")}
    >
      Copy prompt for your agent
    </CopyButton>
  );
}
