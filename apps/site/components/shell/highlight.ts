export type CodeLang = "js" | "bash" | "text";

export interface Token {
  kind: "plain" | "kw" | "str" | "comment" | "fn" | "tag" | "num";
  text: string;
}

const JS =
  /(\/\/[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(<\/?[A-Za-z][\w.]*|\/?>)|\b(import|from|export|function|const|let|return|await|async|new|if|else)\b|\b(true|false|null|undefined)\b|\b(\d+(?:\.\d+)?)\b|([A-Za-z_$][\w$]*)(?=\s*\()/g;

function js(code: string) {
  const tokens: Token[] = [];
  let last = 0;
  for (const match of code.matchAll(JS)) {
    const [text, comment, string, tag, keyword, literal, number] = match;
    if (match.index > last)
      tokens.push({ kind: "plain", text: code.slice(last, match.index) });
    tokens.push({
      kind: comment
        ? "comment"
        : string
          ? "str"
          : tag
            ? "tag"
            : keyword
              ? "kw"
              : literal || number
                ? "num"
                : "fn",
      text,
    });
    last = match.index + text.length;
  }
  if (last < code.length)
    tokens.push({ kind: "plain", text: code.slice(last) });
  return tokens;
}

function bash(code: string) {
  return code.split("\n").flatMap((line, index): Token[] => {
    const [command, ...rest] = line.split(" ");
    return [
      ...(index > 0 ? [{ kind: "plain", text: "\n" } as const] : []),
      { kind: "fn", text: command },
      ...rest.map(
        (part): Token => ({
          kind: part.startsWith("@") ? "str" : "plain",
          text: ` ${part}`,
        }),
      ),
    ];
  });
}

export function tokenize(code: string, lang: CodeLang = "js"): Token[] {
  if (lang === "bash") return bash(code);
  if (lang === "text") return [{ kind: "plain", text: code }];
  return js(code);
}
