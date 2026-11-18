import { readFileSync } from "node:fs";
import { join } from "node:path";
import { photos } from "../../lib/photos";
import { iconData } from "../icons";

export const lightboxThemes = {
  dark: "The default. A near-black room with frosted controls.",
  light: "A pale room with white controls, for light pages.",
  page: "The room takes the page's own background from --re-lightbox-page, and the controls follow its text color.",
  photos:
    "A white room with light controls. Hide the controls and the room turns black, over 300ms.",
} as const;

export type LightboxTheme = keyof typeof lightboxThemes;

interface Preset {
  name: string;
  theme: LightboxTheme;
  lead: string;
  setup: string;
  css?: string;
  square?: boolean;
  extra?: (index: number) => Record<string, string>;
}

const places = [
  ["Monday, 4 March", "Harbor studio"],
  ["Monday, 4 March", "Harbor studio"],
  ["Saturday, 16 March", "North gallery"],
  ["Saturday, 16 March", "North gallery"],
  ["Friday, 5 April", "Print room"],
  ["Friday, 5 April", "Print room"],
  ["Sunday, 21 April", "Garden annex"],
  ["Sunday, 21 April", "Garden annex"],
] as const;

export const lightboxPresets: Record<string, Preset> = {
  "photos-app": {
    name: "Photos app",
    theme: "photos",
    lead: "The photos theme, the day and the place at the top in the toolbarStart slot, and thumbnails along the bottom.",
    extra: (index) => ({
      date: places[index % places.length][0],
      place: places[index % places.length][1],
    }),
    setup: `const lightbox = createLightbox({
  thumbnails: "bottom",
  controls: { counter: false },
  slots: {
    toolbarStart: ({ document }) => {
      const title = document.createElement("p");
      title.className = "photos-title";
      const date = document.createElement("strong");
      const place = document.createElement("span");
      title.append(date, place);
      return {
        node: title,
        update: (state) => {
          date.textContent = items[state.index]?.date ?? "";
          place.textContent = items[state.index]?.place ?? "";
        },
      };
    },
  },
});`,
    css: `.photos-title {
  display: grid;
  margin: 0;
  font-size: 12px;
  line-height: 16px;
}
.photos-title strong {
  font-size: 15px;
  font-weight: 600;
  line-height: 20px;
}`,
  },
  "social-feed": {
    name: "Social feed",
    theme: "light",
    square: true,
    lead: "Square photos, dots under the photo instead of a counter, no zoom, and a double tap that likes the photo with a heart.",
    setup: `const liked = new Set();
let showLiked = () => {};
const lightbox = createLightbox({
  doubleTapZoom: false,
  imageClick: "none",
  controls: { counter: false, zoom: false },
  renderContent: ({ container, index }) => {
    const heart = document.createElement("span");
    heart.className = "feed-heart";
    heart.setAttribute("aria-hidden", "true");
    heart.append(icons.heart());
    container.append(heart);
    let last = -Infinity;
    const onTap = (event) => {
      if (event.timeStamp - last > 300) {
        last = event.timeStamp;
        return;
      }
      last = -Infinity;
      liked.add(index);
      showLiked();
      heart.classList.remove("feed-heart-on");
      void heart.offsetWidth;
      heart.classList.add("feed-heart-on");
    };
    container.addEventListener("pointerup", onTap);
    return () => {
      container.removeEventListener("pointerup", onTap);
      heart.remove();
    };
  },
  slots: {
    footer: ({ document }) => {
      const row = document.createElement("div");
      row.className = "feed-footer";
      const like = document.createElement("button");
      like.type = "button";
      like.className = "re-lightbox-button feed-like";
      like.append(icons.heart());
      const dots = document.createElement("div");
      dots.className = "feed-dots";
      dots.setAttribute("aria-hidden", "true");
      row.append(like, dots);
      like.setAttribute("aria-label", "Like");
      let index = 0;
      showLiked = () => like.setAttribute("aria-pressed", String(liked.has(index)));
      like.addEventListener("click", () => {
        if (liked.has(index)) liked.delete(index);
        else liked.add(index);
        showLiked();
      });
      return {
        node: row,
        update: (state) => {
          index = state.index;
          showLiked();
          if (dots.childElementCount !== state.count)
            dots.replaceChildren(
              ...Array.from({ length: state.count }, () =>
                document.createElement("span"),
              ),
            );
          for (const [i, dot] of [...dots.children].entries())
            dot.toggleAttribute("data-current", i === index);
        },
      };
    },
  },
});`,
    css: `.feed-heart {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #fff;
  opacity: 0;
  pointer-events: none;
  filter: drop-shadow(0 4px 24px rgb(0 0 0 / 30%));
}
.feed-heart svg {
  width: 96px;
  height: 96px;
}
.feed-heart svg *,
.feed-like[aria-pressed="true"] svg * { fill: currentColor; }
.feed-heart-on {
  animation: feed-heart 900ms cubic-bezier(0.2, 0.9, 0.3, 1.2);
}
@keyframes feed-heart {
  0% { opacity: 0; scale: 0.4; }
  15% { opacity: 1; scale: 1.1; }
  30% { scale: 1; }
  80% { opacity: 1; }
  100% { opacity: 0; scale: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .feed-heart-on { animation-name: feed-heart-fade; }
  @keyframes feed-heart-fade {
    0%, 80% { opacity: 1; }
    100% { opacity: 0; }
  }
}
.feed-footer {
  display: flex;
  align-items: center;
  gap: 16px;
}
.feed-like[aria-pressed="true"] { color: #e0245e; }
.feed-dots {
  display: flex;
  gap: 6px;
}
.feed-dots > span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.25;
}
.feed-dots > [data-current] { opacity: 1; }`,
  },
  "cloud-library": {
    name: "Cloud library",
    theme: "dark",
    lead: "The dark theme with download, fullscreen and an info button at the top. Info opens the caption in a side panel.",
    setup: `const lightbox = createLightbox({
  caption: "side",
  className: "cloud-library",
  controls: { download: true, fullscreen: true },
  slots: {
    toolbarEnd: ({ document }) => {
      const info = document.createElement("button");
      info.type = "button";
      info.className = "re-lightbox-button";
      info.setAttribute("aria-label", "Info");
      info.setAttribute("aria-pressed", "false");
      info.append(icons.info());
      info.addEventListener("click", () => {
        const shown = info.closest(".re-lightbox").toggleAttribute("data-info");
        info.setAttribute("aria-pressed", String(shown));
        window.dispatchEvent(new Event("resize"));
      });
      return { node: info };
    },
  },
});`,
    css: `.cloud-library:not([data-info]) {
  --re-lightbox-aside-width: 0px;
  --re-lightbox-aside-height: 0px;
}
.cloud-library:not([data-info]) .re-lightbox-aside { display: none; }`,
  },
  minimal: {
    name: "Minimal",
    theme: "dark",
    lead: "Only a close button. Swipe, drag or press the arrow keys to move, and Escape to leave.",
    setup: `const lightbox = createLightbox({
  controls: { arrows: false, counter: false, zoom: false },
});`,
  },
};

function previewItems(preset?: Preset) {
  return photos.map((photo, index) => {
    const src = preset?.square
      ? `/images/marble-${photo.id}-1800x1800.webp`
      : photo.src;
    return {
      src,
      previewSrc: src,
      thumbnailSrc: src,
      alt: photo.alt,
      caption: photo.caption,
      width: preset?.square ? 1800 : photo.width,
      height: preset?.square ? 1800 : photo.height,
      ...preset?.extra?.(index),
    };
  });
}

const defaultSetup = `const lightbox = createLightbox({ thumbnails: "bottom" });`;

const pageColors = `.re-lightbox {
  --re-lightbox-page: var(--background);
  --re-lightbox-page-foreground: var(--foreground);
}`;

// A theme file styles every .re-lightbox, so a page with several previews scopes each copy
// to its own class.
const scoped = (css: string, scope: string) =>
  css.replace(/\.re-lightbox(?![-\w])/g, `.re-lightbox.${scope}`);

/** A theme or preset preview: its setup as an ES module, its items, and its scoped CSS. */
export function lightboxThemePreview(id: string) {
  const preset = lightboxPresets[id];
  const theme = preset?.theme ?? (id as LightboxTheme);
  if (!(theme in lightboxThemes)) return null;
  const scope = `re-preview-${id}`;
  const file = readFileSync(
    join(
      process.cwd(),
      "node_modules/@reuse-sh/lightbox/dist/themes",
      `${theme}.css`,
    ),
    "utf8",
  );
  const css = [file, theme === "page" ? pageColors : "", preset?.css ?? ""]
    .map((part) => scoped(part, scope))
    .join("\n");
  return {
    scope,
    css,
    items: previewItems(preset),
    module: `export default (createLightbox, icons, getItems) => {
  const items = getItems();
${(preset?.setup ?? defaultSetup).replace(/^/gm, "  ")}
  return lightbox;
};
`,
  };
}

const sample = (preset?: Preset) => {
  const fields = (index: number) =>
    preset?.extra
      ? Object.entries(preset.extra(index))
          .map(([key, value]) => `, ${key}: "${value}"`)
          .join("")
      : "";
  const file = (name: string) =>
    preset?.square ? `/photos/${name}-square.jpg` : `/photos/${name}.jpg`;
  return `const items = [
  { src: "${file("coast")}", alt: "A rocky coast", caption: "Coast"${fields(0)} },
  { src: "${file("forest")}", alt: "A path through a forest", caption: "Forest"${fields(2)} },
];`;
};

const strokeAttributes = new Set([
  "key",
  "stroke",
  "strokeLinecap",
  "strokeLinejoin",
  "strokeWidth",
]);

// The published setup draws the site's icons itself, so it runs without the site's icon module.
function inlineIcons(setup: string) {
  const names = [
    ...new Set(
      [...setup.matchAll(/\bicons\.(\w+)\(/g)].map((match) => match[1]),
    ),
  ] as (keyof typeof iconData)[];
  if (!names.length) return "";
  const markup = (name: keyof typeof iconData) =>
    iconData[name]
      .map(
        ([tag, attributes]) =>
          `<${tag} ${Object.entries(attributes)
            .filter(([key]) => !strokeAttributes.has(key))
            .map(([key, value]) => `${key}="${value}"`)
            .join(" ")}/>`,
      )
      .join("");
  return `
const icon = (markup) => () => {
  const template = document.createElement("template");
  template.innerHTML = \`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">\${markup}</svg>\`;
  return template.content.firstElementChild;
};
const icons = {
${names.map((name) => `  ${name}: icon('${markup(name)}'),`).join("\n")}
};
`;
}

/** The published setup for a theme or a preset, in plain JavaScript. */
export function lightboxThemeCode(id: string) {
  const preset = lightboxPresets[id];
  const theme = preset?.theme ?? id;
  const setup = preset?.setup ?? defaultSetup;
  const imports = `import { createLightbox } from "@reuse-sh/lightbox";
import "@reuse-sh/lightbox/base.css";
import "@reuse-sh/lightbox/theme.css";
import "@reuse-sh/lightbox/themes/${theme}.css";`;
  return {
    js: `${imports}

${sample(preset)}
${inlineIcons(setup)}${setup}

lightbox.open(items, 0);`,
    css: preset?.css ?? (theme === "page" ? pageColors : undefined),
  };
}
