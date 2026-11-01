import { CodeBlockView } from "./code-block-view";
import { type CodeLang, highlight } from "./highlight";

export interface CodeTab {
  label?: "JavaScript" | "React";
  code: string;
  lang?: CodeLang;
}

export function CodeBlock({ tabs }: { tabs: CodeTab | CodeTab[] }) {
  const list = (Array.isArray(tabs) ? tabs : [tabs]).map(
    ({ label, code, lang = "ts" }) => ({
      label,
      code,
      runs: highlight(code, lang),
    }),
  );
  return <CodeBlockView list={list} />;
}
