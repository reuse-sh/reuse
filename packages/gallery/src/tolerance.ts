type Token = string | { value: number; unit: "px" | "%" | "" };

function tokenize(text: string): Token[] | undefined {
  const tokens: Token[] = [];
  const pattern =
    /\s*(?:(-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(px|%)?|([a-z-]+)\(|([(),*/])|([+-])(?=\s))/giy;
  let index = 0;
  while (index < text.length) {
    pattern.lastIndex = index;
    const match = pattern.exec(text);
    if (!match || match[0].length === 0) {
      return /^\s*$/.test(text.slice(index)) ? tokens : undefined;
    }
    index = pattern.lastIndex;
    if (match[1] !== undefined) {
      tokens.push({
        value: Number(match[1]),
        unit: (match[2]?.toLowerCase() ?? "") as "px" | "%" | "",
      });
    } else if (match[3] !== undefined) {
      tokens.push(`${match[3].toLowerCase()}(`);
    } else {
      tokens.push(match[4] ?? match[5]);
    }
  }
  return tokens;
}

/**
 * Evaluate a computed length-percentage: pixels, percentages of `base`, and
 * the calc(), min(), max() and clamp() a computed value can still hold.
 */
function evaluate(text: string, base: number): number | undefined {
  const tokens = tokenize(text);
  if (!tokens) return undefined;
  let position = 0;
  const peek = () => tokens[position];
  const fail = (): never => {
    throw new Error("unsupported");
  };
  const sum = (): number => {
    let total = product();
    while (peek() === "+" || peek() === "-") {
      const sign = tokens[position++];
      const next = product();
      total = sign === "+" ? total + next : total - next;
    }
    return total;
  };
  const product = (): number => {
    let total = factor();
    while (peek() === "*" || peek() === "/") {
      const operator = tokens[position++];
      const next = factor();
      total = operator === "*" ? total * next : total / next;
    }
    return total;
  };
  const list = () => {
    const values = [sum()];
    while (peek() === ",") {
      position++;
      values.push(sum());
    }
    if (tokens[position++] !== ")") fail();
    return values;
  };
  const factor = (): number => {
    const token = tokens[position++];
    if (token === undefined) return fail();
    if (typeof token === "object") {
      return token.unit === "%" ? (token.value / 100) * base : token.value;
    }
    if (token === "(" || token === "calc(") {
      const value = sum();
      if (tokens[position++] !== ")") fail();
      return value;
    }
    if (token === "min(") return Math.min(...list());
    if (token === "max(") return Math.max(...list());
    if (token === "clamp(") {
      const [low, value, high] = list();
      return Math.max(low, Math.min(value, high));
    }
    return fail();
  };
  try {
    const value = sum();
    return position === tokens.length && Number.isFinite(value)
      ? value
      : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Resolve a computed `--re-masonry-tolerance` to pixels the way grid lanes
 * resolve fit-tolerance: a negative length is invalid and falls back to
 * normal (1em), while a math function is clamped to zero.
 */
export function resolveTolerance(value: string, base: number, em: number) {
  const text = value.trim();
  if (text === "infinite") return Number.POSITIVE_INFINITY;
  if (text === "" || text === "normal") return em;
  const resolved = evaluate(text, base);
  if (resolved === undefined) return em;
  if (/^[a-z-]+\(/i.test(text)) return Math.max(0, resolved);
  return resolved < 0 ? em : resolved;
}
