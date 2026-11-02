/**
 * Lightbox control styles. The package draws its own buttons, counter, caption and
 * thumbnails; each style rearranges and restyles them with page CSS on the
 * re-lightbox-style class, plus a small chrome script for the styles that move parts.
 * The preview frame (lightbox-frame.ts) runs exactly the CSS and chrome shown on the page.
 */
import { photos } from "../../lib/photos";

export interface LightboxStyle {
  arrows: "Sides" | "Toolbar" | "None";
  counter: "Corner" | "Toolbar" | "None";
  thumbnails: boolean;
  caption: "Below" | "Panel" | "None";
  backdrop: "Light" | "Dark";
  autoHide: boolean;
  zoomButton: boolean;
}

const style = (
  arrows: LightboxStyle["arrows"],
  counter: LightboxStyle["counter"],
  thumbnails: boolean,
  caption: LightboxStyle["caption"],
  backdrop: LightboxStyle["backdrop"],
  autoHide: boolean,
  zoomButton: boolean,
): LightboxStyle => ({
  arrows,
  counter,
  thumbnails,
  caption,
  backdrop,
  autoHide,
  zoomButton,
});

export const lightboxStyles: Record<string, LightboxStyle> = {
  minimal: style("None", "None", false, "None", "Light", false, false),
  classic: style("Sides", "Corner", false, "Below", "Light", false, true),
  filmstrip: style("Sides", "None", true, "None", "Light", false, true),
  panel: style("Sides", "Corner", false, "Panel", "Light", false, false),
  immersive: style("Sides", "Corner", false, "Below", "Dark", true, false),
  toolbar: style("Toolbar", "Toolbar", false, "Below", "Light", false, true),
};

export const LIGHTBOX_STYLE_CLASS = "re-lightbox-style";

const hasBar = (o: LightboxStyle) =>
  o.arrows === "Toolbar" || o.counter === "Toolbar";
const dark = (o: LightboxStyle) => o.backdrop === "Dark";
const always = () => true;

const rules: readonly (readonly [(o: LightboxStyle) => boolean, string])[] = [
  [
    always,
    `.re-lightbox-style {
  --re-lightbox-pad: 16px;
  --re-lightbox-side: 0px;
  --re-lightbox-caption: 0px;
  --re-lightbox-strip: 0px;
  --re-lightbox-bar: 0px;
  --re-lightbox-under: 0px;
  --re-lightbox-bottom: calc(var(--re-lightbox-caption) + var(--re-lightbox-strip) + var(--re-lightbox-bar) + var(--re-lightbox-under));
  --re-lightbox-ring: 0 0 0 0.5px rgb(0 0 0 / 10%), 0 1px 2px rgb(0 0 0 / 6%), 0 2px 6px rgb(0 0 0 / 4%);
  --re-lightbox-background: #fcfcfc;
  --re-lightbox-foreground: #1f1f1f;
  --re-lightbox-control: #fff;
}
.re-lightbox-style *, .re-lightbox-style *::before, .re-lightbox-style *::after { box-sizing: border-box; }
.re-lightbox-style .re-lightbox-viewport {
  width: calc(100% - var(--re-lightbox-side));
  height: calc(100% - var(--re-lightbox-bottom));
}
.re-lightbox-style .re-lightbox-button {
  width: 40px;
  height: 40px;
  padding: 0;
  color: inherit;
  box-shadow: var(--re-lightbox-ring);
  backdrop-filter: none;
  transition: background-color 150ms ease, transform 160ms cubic-bezier(0.23, 1, 0.32, 1), opacity 300ms ease;
}
.re-lightbox-style .re-lightbox-button svg { width: 18px; height: 18px; }
.re-lightbox-style .re-lightbox-button:hover { background: #f4f4f4; }
.re-lightbox-style .re-lightbox-button:active:not(:disabled) { transform: scale(0.95); }
.re-lightbox-style .re-lightbox-button:disabled { opacity: 0.3; }
.re-lightbox-style .re-lightbox-close, .re-lightbox-style .re-lightbox-zoom { top: var(--re-lightbox-pad); }
.re-lightbox-style .re-lightbox-close { right: var(--re-lightbox-pad); }
.re-lightbox-style .re-lightbox-zoom { right: calc(var(--re-lightbox-pad) + 48px); }
.re-lightbox-style .re-lightbox-footer {
  right: calc(var(--re-lightbox-side) + var(--re-lightbox-pad));
  bottom: calc(var(--re-lightbox-under) + var(--re-lightbox-pad));
  left: var(--re-lightbox-pad);
  gap: 10px;
}
.re-lightbox-style .re-lightbox-counter {
  padding: 0;
  background: none;
  backdrop-filter: none;
  font-size: 13px;
}`,
  ],
  [
    (o) => o.arrows === "Sides",
    `.re-lightbox-style .re-lightbox-prev,
.re-lightbox-style .re-lightbox-next { top: calc((100% - var(--re-lightbox-bottom)) / 2 - 20px); }
.re-lightbox-style .re-lightbox-prev { left: var(--re-lightbox-pad); }
.re-lightbox-style .re-lightbox-next { right: calc(var(--re-lightbox-side) + var(--re-lightbox-pad)); }`,
  ],
  [
    (o) => o.arrows === "None",
    `.re-lightbox-style .re-lightbox-prev,
.re-lightbox-style .re-lightbox-next { display: none; }`,
  ],
  [
    (o) => o.counter === "None",
    ".re-lightbox-style .re-lightbox-counter { display: none; }",
  ],
  [
    (o) => o.counter === "Corner",
    `.re-lightbox-style .re-lightbox-counter {
  position: fixed;
  z-index: 2;
  top: var(--re-lightbox-pad);
  left: var(--re-lightbox-pad);
  display: grid;
  height: 40px;
  padding: 0 14px;
  place-items: center;
  border-radius: 999px;
  background: #fff;
  box-shadow: var(--re-lightbox-ring);
  font-weight: 500;
}`,
  ],
  [
    (o) => !o.zoomButton,
    ".re-lightbox-style .re-lightbox-zoom { display: none; }",
  ],
  [
    (o) => o.caption === "Below",
    `.re-lightbox-style { --re-lightbox-caption: 30px; }
.re-lightbox-style .re-lightbox-caption {
  order: 1;
  padding: 0;
  background: none;
  color: #4a4a4a;
  font-size: 14px;
  line-height: 20px;
}`,
  ],
  [
    (o) => o.caption !== "Below",
    ".re-lightbox-style .re-lightbox-caption { display: none; }",
  ],
  [
    (o) => o.thumbnails,
    `.re-lightbox-style { --re-lightbox-strip: 64px; }
.re-lightbox-style .re-lightbox-thumbnails { order: 2; max-width: 100%; gap: 6px; padding: 5px; scrollbar-width: none; }
.re-lightbox-style .re-lightbox-thumbnails::-webkit-scrollbar { display: none; }
.re-lightbox-style .re-lightbox-thumbnails button {
  flex: 0 0 60px;
  width: 60px;
  height: 44px;
  border: 0;
  border-radius: 8px;
  background: #e6e6e3;
  opacity: 0.45;
  transition: opacity 200ms ease, box-shadow 200ms ease;
}
.re-lightbox-style .re-lightbox-thumbnails button[aria-current="true"] {
  opacity: 1;
  box-shadow: 0 0 0 2px var(--re-lightbox-background), 0 0 0 3.5px var(--re-lightbox-foreground);
}`,
  ],
  [
    hasBar,
    `.re-lightbox-style { --re-lightbox-bar: 58px; }
.re-lightbox-style-toolbar {
  order: 3;
  display: flex;
  align-items: center;
  gap: 2px;
  height: 48px;
  padding: 4px;
  border-radius: 999px;
  background: #fff;
  box-shadow: 0 0 0 0.5px rgb(0 0 0 / 10%), 0 2px 4px rgb(0 0 0 / 5%), 0 8px 24px rgb(0 0 0 / 7%);
  pointer-events: auto;
}
.re-lightbox-style-toolbar .re-lightbox-button { position: static; box-shadow: none; background: transparent; }
.re-lightbox-style-toolbar .re-lightbox-button:hover { background: rgb(0 0 0 / 5%); }
.re-lightbox-style-toolbar .re-lightbox-counter { min-width: 52px; padding: 0 6px; font-weight: 500; text-align: center; }
.re-lightbox-style-toolbar-divider { width: 1px; height: 20px; margin: 0 4px; background: rgb(0 0 0 / 10%); }`,
  ],
  [
    (o) => o.caption === "Panel",
    `.re-lightbox-style { --re-lightbox-side: 240px; }
.re-lightbox-style-panel {
  position: absolute;
  z-index: 1;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  width: var(--re-lightbox-side);
  padding: 72px 24px 24px;
  background: #fff;
  box-shadow: -1px 0 0 rgb(0 0 0 / 6%);
  color: #1f1f1f;
}
.re-lightbox-style-panel :where(h2, p) { margin: 0; }
.re-lightbox-style-panel h2 { font-size: 19px; font-weight: 560; line-height: 26px; letter-spacing: -0.01em; }
.re-lightbox-style-panel-place { margin-top: 2px; color: #8a8a8a; font-size: 13.5px; line-height: 20px; }
.re-lightbox-style-panel-text { margin-top: 16px; color: #4a4a4a; font-size: 13.5px; line-height: 21px; }`,
  ],
  [
    dark,
    `.re-lightbox-style {
  --re-lightbox-ring: none;
  --re-lightbox-background: #09090a;
  --re-lightbox-foreground: #fff;
  --re-lightbox-control: rgb(255 255 255 / 8%);
}
.re-lightbox-style .re-lightbox-button:hover { background: rgb(255 255 255 / 14%); }`,
  ],
  [
    (o) => dark(o) && o.caption === "Below",
    ".re-lightbox-style .re-lightbox-caption { color: rgb(255 255 255 / 72%); }",
  ],
  [
    (o) => dark(o) && o.counter === "Corner",
    `.re-lightbox-style .re-lightbox-counter {
  height: auto;
  padding: 0;
  top: calc(var(--re-lightbox-pad) + 12px);
  left: calc(var(--re-lightbox-pad) + 4px);
  background: none;
  color: rgb(255 255 255 / 60%);
  font-family: ui-monospace, monospace;
  font-size: 12px;
  font-weight: 400;
}`,
  ],
  [
    (o) => dark(o) && o.thumbnails,
    ".re-lightbox-style .re-lightbox-thumbnails button { background: #222; }",
  ],
  [
    (o) => dark(o) && hasBar(o),
    `.re-lightbox-style-toolbar { background: rgb(32 32 34 / 94%); box-shadow: 0 0 0 0.5px rgb(255 255 255 / 10%); }
.re-lightbox-style .re-lightbox-style-toolbar .re-lightbox-button:hover { background: rgb(255 255 255 / 10%); }
.re-lightbox-style-toolbar-divider { background: rgb(255 255 255 / 14%); }`,
  ],
  [
    (o) => dark(o) && o.caption === "Panel",
    `.re-lightbox-style-panel { background: #151517; box-shadow: -1px 0 0 rgb(255 255 255 / 8%); color: #fff; }
.re-lightbox-style-panel-place { color: rgb(255 255 255 / 50%); }
.re-lightbox-style-panel-text { color: rgb(255 255 255 / 70%); }`,
  ],
  [
    (o) => o.autoHide,
    `.re-lightbox-style :is(.re-lightbox-button, .re-lightbox-counter, .re-lightbox-caption, .re-lightbox-thumbnails, .re-lightbox-style-toolbar) {
  transition: opacity 400ms ease, background-color 150ms ease, transform 160ms cubic-bezier(0.23, 1, 0.32, 1);
}
.re-lightbox-style[data-idle], .re-lightbox-style[data-idle] .re-lightbox-frame { cursor: none; }
.re-lightbox-style[data-idle] :is(.re-lightbox-button, .re-lightbox-counter, .re-lightbox-caption, .re-lightbox-thumbnails, .re-lightbox-style-toolbar) {
  opacity: 0;
  transition-duration: 700ms;
}`,
  ],
  [
    always,
    `@media (max-width: 559px) {
  .re-lightbox-style { --re-lightbox-pad: 12px; }
}`,
  ],
  [
    (o) => o.thumbnails,
    `@media (max-width: 559px) {
  .re-lightbox-style { --re-lightbox-strip: 56px; }
  .re-lightbox-style .re-lightbox-thumbnails button { flex-basis: 48px; width: 48px; height: 36px; }
}`,
  ],
  [
    (o) => o.caption === "Panel",
    `@media (max-width: 559px) {
  .re-lightbox-style { --re-lightbox-side: 0px; --re-lightbox-under: 112px; }
  .re-lightbox-style-panel {
    top: auto;
    left: 0;
    width: auto;
    height: var(--re-lightbox-under);
    padding: 16px;
    box-shadow: 0 -1px 0 rgb(0 0 0 / 6%);
  }
  .re-lightbox-style-panel h2 { font-size: 16px; line-height: 22px; }
  .re-lightbox-style-panel-place { font-size: 13px; }
  .re-lightbox-style-panel-text { margin-top: 6px; font-size: 13px; line-height: 19px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
}`,
  ],
  [
    (o) => dark(o) && o.caption === "Panel",
    `@media (max-width: 559px) {
  .re-lightbox-style-panel { box-shadow: 0 -1px 0 rgb(255 255 255 / 8%); }
}`,
  ],
  [
    always,
    `@media (prefers-reduced-motion: reduce) {
  .re-lightbox-style, .re-lightbox-style * { transition-duration: 0ms !important; }
}`,
  ],
];

/** The page CSS one style needs, written against the re-lightbox-style class. */
export function lightboxStyleCss(options: LightboxStyle) {
  return rules
    .filter(([when]) => when(options))
    .map(([, css]) => css)
    .join("\n\n");
}

/**
 * The chrome script one style needs, as module source, or null when the package's
 * own layout is enough. addChrome(lightbox, items) runs right after lightbox.open().
 */
export function lightboxChrome(options: LightboxStyle) {
  const bar = hasBar(options);
  const panel = options.caption === "Panel";
  const strip = options.thumbnails;
  const idle = options.autoHide;
  if (!bar && !panel && !strip && !idle) return null;
  const parts: string[] = [];
  if (bar) {
    const order = [
      options.arrows === "Toolbar" && `part("prev")`,
      options.counter === "Toolbar" && `part("counter")`,
      options.arrows === "Toolbar" && `part("next")`,
    ].filter(Boolean);
    parts.push(`  const bar = document.createElement("div");
  bar.className = "re-lightbox-style-toolbar";
  bar.setAttribute("role", "group");
  bar.setAttribute("aria-label", "Photo controls");
  bar.append(${order.join(", ")});${
    options.zoomButton
      ? `
  const divider = document.createElement("span");
  divider.className = "re-lightbox-style-toolbar-divider";
  divider.setAttribute("aria-hidden", "true");
  bar.append(divider, part("zoom"));`
      : ""
  }
  part("footer").append(bar);`);
  }
  if (panel)
    parts.push(`  const panel = document.createElement("aside");
  panel.className = "re-lightbox-style-panel";
  panel.innerHTML = \`<h2></h2><p class="re-lightbox-style-panel-place"></p><p class="re-lightbox-style-panel-text"></p>\`;
  dialog.append(panel);
  const [title, place, text] = panel.children;
  syncs.push((state) => {
    const item = items[state.index];
    title.textContent = item.caption;
    place.textContent = \`\${state.index + 1} of \${state.count}\`;
    text.textContent = \`\${item.alt}.\`;
  });`);
  if (strip)
    parts.push(`  const strip = part("thumbnails");
  let shown = -1;
  syncs.push((state) => {
    const thumb = strip.children[state.index];
    if (!thumb || state.index === shown || strip.scrollWidth <= strip.clientWidth) return;
    const left = thumb.offsetLeft - (strip.clientWidth - thumb.offsetWidth) / 2;
    strip.scrollTo({ left: Math.max(0, left), behavior: shown < 0 ? "instant" : "smooth" });
    shown = state.index;
  });`);
  if (idle)
    parts.push(`  let timer = 0;
  const wake = () => {
    dialog.removeAttribute("data-idle");
    clearTimeout(timer);
    timer = setTimeout(() => dialog.setAttribute("data-idle", ""), 2000);
  };
  const types = ["pointermove", "pointerdown", "keydown", "wheel"];
  for (const type of types) dialog.addEventListener(type, wake, { passive: true });
  wake();
  cleanups.push(() => clearTimeout(timer));`);
  return `export function addChrome(lightbox, items) {
  const dialog = document.querySelector("dialog.re-lightbox-style");
  const part = (name) => dialog.querySelector(\`.re-lightbox-\${name}\`);
  const syncs = [];
  const cleanups = [];

${parts.join("\n\n")}

  const sync = (state) => syncs.forEach((fn) => fn(state));
  sync(lightbox.getState());
  const stop = lightbox.subscribe((state) => {
    if (state.isOpen) sync(state);
    else if (!state.isClosing) {
      stop();
      cleanups.forEach((fn) => fn());
    }
  });
}`;
}

export function lightboxCode(options: LightboxStyle) {
  const chromeSource = lightboxChrome(options);
  const chrome = chromeSource !== null;
  const lines = [
    ...(options.thumbnails ? ["thumbnails: true,"] : []),
    `className: "${LIGHTBOX_STYLE_CLASS}",`,
  ];
  const body = (indent: string) =>
    lines.map((line) => `${indent}${line}`).join("\n");
  const imports = `import "@reuse-sh/lightbox/styles.css";
import "./lightbox-style.css";${chrome ? `\nimport { addChrome } from "./lightbox-chrome.js";` : ""}`;
  const data = JSON.stringify(
    photos.map((photo) => ({ ...photo, src: `https://reuse.sh${photo.src}` })),
    null,
    2,
  );
  const fixtures = `const defaultPhotos = ${data};`;
  return {
    js: `import { bindLightboxGallery, lightboxItemFromImage } from "@reuse-sh/lightbox";
${imports}

const gallery = document.querySelector("[data-gallery]");
const getItem = (image) => ({
  ...lightboxItemFromImage(image, image.closest("a").href),
  caption: image.dataset.caption,
});
const lightbox = bindLightboxGallery(gallery, {
${body("  ")}
  getItem,
});${
      chrome
        ? `
const items = [...gallery.querySelectorAll("img")].map(getItem);
let opened = false;
const stop = lightbox.subscribe((state) => {
  if (state.isOpen && !opened) addChrome(lightbox, items);
  opened = state.isOpen;
});`
        : ""
    }

window.addEventListener("pagehide", function cleanup(event) {
  if (event.persisted) return;${chrome ? "\n  stop();" : ""}
  lightbox.destroy();
  window.removeEventListener("pagehide", cleanup);
});`,
    react: `import { useLightbox } from "@reuse-sh/lightbox/react";
import { useRef } from "react";
${imports}

${fixtures}

export function Gallery({ photos = defaultPhotos } = {}) {
  const lightbox = useLightbox({
${body("    ")}
  });
  const root = useRef<HTMLDivElement>(null);
  const open = (index: number) => {
    const images = root.current?.querySelectorAll<HTMLImageElement>("img");
    const items = photos.map((photo, i) => ({ ...photo, origin: images?.[i] }));
    lightbox.open(items, index);${chrome ? "\n    addChrome(lightbox, items);" : ""}
  };
  return (
    <div ref={root} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {photos.map((photo, index) => (
        <a key={photo.src} href={photo.src} className="block overflow-hidden rounded-xl" onClick={(event) => {
          if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          open(index);
        }}>
          <img className="h-auto w-full" src={photo.src} alt={photo.alt} />
        </a>
      ))}
    </div>
  );
}`,
    css: lightboxStyleCss(options),
    chrome: chromeSource,
  };
}
