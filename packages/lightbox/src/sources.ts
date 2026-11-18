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

export function largestSource(srcset: string | undefined, src: string) {
  let best: Candidate | undefined;
  for (const candidate of parseSrcset(srcset ?? ""))
    if (
      !best ||
      (candidate.width ?? 0) > (best.width ?? 0) ||
      (!candidate.width &&
        !best.width &&
        (candidate.density ?? 1) > (best.density ?? 1))
    )
      best = candidate;
  return best?.url ?? src;
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

/** What a file's format says about its pixels: an SVG and an alpha-capable raster can be see-through. */
export type MediaFormat = "svg" | "transparent" | "opaque";

const ALPHA = /^(?:png|apng|webp|avif|gif)$/;

function formatOfType(type: string): MediaFormat {
  const subtype = /^image\/([^;,\s]+)/i.exec(type)?.[1].toLowerCase();
  if (subtype === "svg+xml") return "svg";
  return subtype && ALPHA.test(subtype) ? "transparent" : "opaque";
}

const lookedUp = new Map<
  string,
  { format?: MediaFormat; lookup: Promise<MediaFormat> }
>();

/** The format by the URL alone; undefined for a blob: URL or a path without an extension until lookupFormat has read its type. */
export function formatOf(url: string, base: string): MediaFormat | undefined {
  if (/^data:/i.test(url)) return formatOfType(url.slice(5));
  const address = resolve(url, base);
  if (/^blob:/i.test(url)) return lookedUp.get(address)?.format;
  let extension: string | undefined;
  try {
    extension = /\.([^./]+)$/.exec(new URL(url, base).pathname)?.[1];
  } catch {}
  const name = extension?.toLowerCase();
  if (!name) return lookedUp.get(address)?.format;
  if (name === "svg") return "svg";
  return ALPHA.test(name) ? "transparent" : "opaque";
}

/** Reads the type once per URL: a blob: URL's Blob type, else the Content-Type of a HEAD request. */
export function lookupFormat(
  url: string,
  base: string,
  fetcher: (url: string, init?: RequestInit) => Promise<Response>,
): Promise<MediaFormat> {
  const known = formatOf(url, base);
  if (known) return Promise.resolve(known);
  const address = resolve(url, base);
  const cached = lookedUp.get(address);
  if (cached) return cached.lookup;
  // A blob: URL answers only GET.
  const type = /^blob:/i.test(url)
    ? fetcher(url)
        .then((response) => response.blob())
        .then((blob) => blob.type)
    : fetcher(url, { method: "HEAD" }).then(
        (response) => response.headers.get("content-type") ?? "",
      );
  const entry: { format?: MediaFormat; lookup: Promise<MediaFormat> } = {
    lookup: type
      .then(formatOfType, () => "opaque" as const)
      .then((format) => {
        entry.format = format;
        return format;
      }),
  };
  lookedUp.set(address, entry);
  return entry.lookup;
}

const PIXELS: Record<string, number> = {
  "": 1,
  px: 1,
  in: 96,
  cm: 96 / 2.54,
  mm: 96 / 25.4,
  pt: 96 / 72,
  pc: 16,
};

function absoluteLength(value: string | null) {
  const match =
    /^\s*(\d*\.?\d+(?:e[+-]?\d+)?)\s*(px|in|cm|mm|pt|pc)?\s*$/i.exec(
      value ?? "",
    );
  if (!match) return undefined;
  const length = Number(match[1]) * PIXELS[(match[2] ?? "").toLowerCase()];
  return length > 0 ? length : undefined;
}

/** The root's width and height in absolute units, else the viewBox's, which also completes one of them. */
export function parseSvgSize(text: string, parser: DOMParser) {
  const root = parser.parseFromString(text, "image/svg+xml").documentElement;
  if (root.localName !== "svg") return undefined;
  const width = absoluteLength(root.getAttribute("width"));
  const height = absoluteLength(root.getAttribute("height"));
  if (width && height) return { width, height };
  const box = (root.getAttribute("viewBox") ?? "")
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  if (box.length !== 4 || !(box[2] > 0) || !(box[3] > 0)) return undefined;
  const ratio = box[3] / box[2];
  if (width) return { width, height: width * ratio };
  if (height) return { width: height / ratio, height };
  return { width: box[2], height: box[3] };
}

/** Fetches the SVG text, which works for same-origin, CORS, data: and blob: URLs. */
export async function svgSize(
  url: string,
  fetcher: (url: string, init?: RequestInit) => Promise<Response>,
  parser: DOMParser,
) {
  const response = await fetcher(url);
  if (!response.ok) return undefined;
  return parseSvgSize(await response.text(), parser);
}
