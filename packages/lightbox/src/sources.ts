export type Candidate = { url: string; width?: number; density?: number };

// The HTML candidate parser: a URL runs to whitespace, and a comma inside parentheses belongs to
// the descriptor.
export function parseSrcset(value: string): Candidate[] {
  const candidates: Candidate[] = [];
  let at = 0;
  while (at < value.length) {
    while (at < value.length && /[\s,]/.test(value[at])) at++;
    if (at >= value.length) break;
    let start = at;
    while (at < value.length && !/\s/.test(value[at])) at++;
    let url = value.slice(start, at);
    let descriptor = "";
    if (url.endsWith(",")) url = url.replace(/,+$/, "");
    else {
      start = at;
      let depth = 0;
      while (at < value.length && (value[at] !== "," || depth > 0)) {
        if (value[at] === "(") depth++;
        else if (value[at] === ")") depth--;
        at++;
      }
      descriptor = value.slice(start, at).trim();
      at++;
    }
    const width = /(?:^|\s)(\d+)w(?:\s|$)/.exec(descriptor);
    const density = /(?:^|\s)(\d*\.?\d+(?:e[+-]?\d+)?)x(?:\s|$)/i.exec(
      descriptor,
    );
    candidates.push(
      width
        ? { url, width: Number(width[1]) }
        : { url, density: density ? Number(density[1]) : 1 },
    );
  }
  return candidates;
}

function resolve(url: string, base: string) {
  try {
    return new URL(url, base).href;
  } catch {
    return url;
  }
}

/** The widest file a w-descriptor srcset offers, which a zoom can still fetch. */
export function largestWidth(srcset: string | undefined) {
  let largest: number | undefined;
  for (const { width } of parseSrcset(srcset ?? ""))
    if (width && (!largest || width > largest)) largest = width;
  return largest;
}

/** The file's own pixel width: a srcset makes naturalWidth a density-corrected size. */
export function fileWidth(
  image: HTMLImageElement,
  srcset: string | undefined,
  base: string,
) {
  const current = image.currentSrc || image.src;
  const candidate = parseSrcset(srcset ?? "").find(
    (entry) => resolve(entry.url, base) === current,
  );
  if (candidate?.width) return candidate.width;
  return image.naturalWidth * (candidate?.density ?? 1);
}

export function isImageFile(url: string, base: string) {
  try {
    return /\.(?:jpe?g|png|gif|webp|avif|svg)$/i.test(
      new URL(url, base).pathname,
    );
  } catch {
    return false;
  }
}
