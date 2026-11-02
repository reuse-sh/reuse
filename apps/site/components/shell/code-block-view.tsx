"use client";

import { CodeContent, CodeSurface } from "@/components/ui/code-block";
import { useFramework } from "../../lib/framework-context";
import { CopyControl } from "../copy-control";
import type { CodeLang, CodeRun } from "./highlight";

export interface HighlightedTab {
  label?: "JavaScript" | "React";
  code: string;
  lang: CodeLang;
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

export function CodeBlockView({
  list,
  caption,
  snippetId,
  codeRole,
}: {
  list: HighlightedTab[];
  caption?: string;
  snippetId?: string;
  codeRole?: string;
}) {
  const framework = useFramework();
  const active =
    list.find(
      (tab) => tab.label === (framework === "react" ? "React" : "JavaScript"),
    ) ?? list[0];
  return (
    <CodeSurface
      label={
        caption ??
        active.label ??
        {
          ts: "JavaScript",
          tsx: "React",
          css: "CSS",
          html: "HTML",
          json: "JSON",
          bash: "Terminal",
        }[active.lang]
      }
      data-snippet-id={snippetId}
      data-code-role={codeRole}
      action={<CopyControl value={active.code} />}
    >
      <CodeContent>
        <Code runs={active.runs} />
      </CodeContent>
    </CodeSurface>
  );
}
