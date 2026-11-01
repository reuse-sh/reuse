import { codeToTokens } from "@pierre/highlights";
import { githubLightDefault } from "@pierre/highlights/themes";

export type CodeLang = "ts" | "tsx" | "css" | "html" | "json" | "bash";

export interface CodeRun {
  text: string;
  color?: string;
}

export function highlight(code: string, lang: CodeLang): CodeRun[] {
  const { tokens, fg } = codeToTokens(code, {
    lang,
    theme: githubLightDefault,
  });
  const runs: CodeRun[] = [];
  const push = (text: string, color?: string) => {
    const last = runs.at(-1);
    if (last && last.color === color) last.text += text;
    else runs.push(color ? { text, color } : { text });
  };
  tokens.forEach((line, index) => {
    if (index > 0) push("\n");
    for (const { content, color } of line)
      push(content, color && color !== fg ? color : undefined);
  });
  return runs;
}
