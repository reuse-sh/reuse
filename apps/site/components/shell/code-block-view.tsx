"use client";

import { useFramework } from "../../lib/framework-context";
import { CopyControl } from "../copy-control";
import type { CodeRun } from "./highlight";

export interface HighlightedTab {
  label?: "JavaScript" | "React";
  code: string;
  runs: CodeRun[];
}

function Code({ runs }: { runs: CodeRun[] }) {
  return (
    <code>
      {runs.map((run, index) =>
        run.color ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: runs are derived from fixed text and never reorder.
          <span key={index} style={{ color: run.color }}>
            {run.text}
          </span>
        ) : (
          run.text
        ),
      )}
    </code>
  );
}

export function CodeBlockView({ list }: { list: HighlightedTab[] }) {
  const framework = useFramework();
  const active =
    list.find(
      (tab) => tab.label === (framework === "react" ? "React" : "JavaScript"),
    ) ?? list[0];
  return (
    <div className="c-code">
      <pre>
        <Code runs={active.runs} />
      </pre>
      <CopyControl value={active.code} className="c-code-float" />
    </div>
  );
}
