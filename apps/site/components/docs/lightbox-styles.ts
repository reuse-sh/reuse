/**
 * Lightbox control styles. The package draws its own buttons, counter, caption and
 * thumbnails; each style rearranges and restyles them with page CSS on the
 * lightbox-style class, plus a small chrome script for the styles that move parts.
 * The preview frame (lightbox-frame.ts) runs exactly the CSS and chrome shown on the page.
 */
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

export const LIGHTBOX_STYLE_CLASS = "lightbox-style";

const hasBar = (o: LightboxStyle) =>
  o.arrows === "Toolbar" || o.counter === "Toolbar";
const dark = (o: LightboxStyle) => o.backdrop === "Dark";
const always = () => true;

const rules: readonly (readonly [(o: LightboxStyle) => boolean, string])[] = [
  [
    always,
    `.lightbox-style {
  --lightbox-pad: 16px;
  --lightbox-side: 0px;
  --lightbox-caption: 0px;
  --lightbox-strip: 0px;
  --lightbox-bar: 0px;
  --lightbox-under: 0px;
  --lightbox-bottom: calc(var(--lightbox-caption) + var(--lightbox-strip) + var(--lightbox-bar) + var(--lightbox-under));
  --lightbox-ring: 0 0 0 0.5px rgb(0 0 0 / 10%), 0 1px 2px rgb(0 0 0 / 6%), 0 2px 6px rgb(0 0 0 / 4%);
  --reuse-lightbox-background: #fcfcfc;
  --reuse-lightbox-foreground: #1f1f1f;
  --reuse-lightbox-control: #fff;
}
.lightbox-style *, .lightbox-style *::before, .lightbox-style *::after { box-sizing: border-box; }
.lightbox-style .reuse-lightbox-viewport {
  width: calc(100% - var(--lightbox-side));
  height: calc(100% - var(--lightbox-bottom));
}
.lightbox-style .reuse-lightbox-button {
  width: 40px;
  height: 40px;
  padding: 0;
  color: inherit;
  box-shadow: var(--lightbox-ring);
  backdrop-filter: none;
  transition: background-color 150ms ease, transform 160ms cubic-bezier(0.23, 1, 0.32, 1), opacity 300ms ease;
}
.lightbox-style .reuse-lightbox-button svg { width: 18px; height: 18px; }
.lightbox-style .reuse-lightbox-button:hover { background: #f4f4f4; }
.lightbox-style .reuse-lightbox-button:active:not(:disabled) { transform: scale(0.95); }
.lightbox-style .reuse-lightbox-button:disabled { opacity: 0.3; }
.lightbox-style .reuse-lightbox-close, .lightbox-style .reuse-lightbox-zoom { top: var(--lightbox-pad); }
.lightbox-style .reuse-lightbox-close { right: var(--lightbox-pad); }
.lightbox-style .reuse-lightbox-zoom { right: calc(var(--lightbox-pad) + 48px); }
.lightbox-style .reuse-lightbox-footer {
  right: calc(var(--lightbox-side) + var(--lightbox-pad));
  bottom: calc(var(--lightbox-under) + var(--lightbox-pad));
  left: var(--lightbox-pad);
  gap: 10px;
}
.lightbox-style .reuse-lightbox-counter {
  padding: 0;
  background: none;
  backdrop-filter: none;
  font-size: 13px;
}`,
  ],
  [
    (o) => o.arrows === "Sides",
    `.lightbox-style .reuse-lightbox-prev,
.lightbox-style .reuse-lightbox-next { top: calc((100% - var(--lightbox-bottom)) / 2 - 20px); }
.lightbox-style .reuse-lightbox-prev { left: var(--lightbox-pad); }
.lightbox-style .reuse-lightbox-next { right: calc(var(--lightbox-side) + var(--lightbox-pad)); }`,
  ],
  [
    (o) => o.arrows === "None",
    `.lightbox-style .reuse-lightbox-prev,
.lightbox-style .reuse-lightbox-next { display: none; }`,
  ],
  [
    (o) => o.counter === "None",
    ".lightbox-style .reuse-lightbox-counter { display: none; }",
  ],
  [
    (o) => o.counter === "Corner",
    `.lightbox-style .reuse-lightbox-counter {
  position: fixed;
  z-index: 2;
  top: var(--lightbox-pad);
  left: var(--lightbox-pad);
  display: grid;
  height: 40px;
  padding: 0 14px;
  place-items: center;
  border-radius: 999px;
  background: #fff;
  box-shadow: var(--lightbox-ring);
  font-weight: 500;
}`,
  ],
  [
    (o) => !o.zoomButton,
    ".lightbox-style .reuse-lightbox-zoom { display: none; }",
  ],
  [
    (o) => o.caption === "Below",
    `.lightbox-style { --lightbox-caption: 30px; }
.lightbox-style .reuse-lightbox-caption {
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
    ".lightbox-style .reuse-lightbox-caption { display: none; }",
  ],
  [
    (o) => o.thumbnails,
    `.lightbox-style { --lightbox-strip: 64px; }
.lightbox-style .reuse-lightbox-thumbnails { order: 2; max-width: 100%; gap: 6px; padding: 5px; scrollbar-width: none; }
.lightbox-style .reuse-lightbox-thumbnails::-webkit-scrollbar { display: none; }
.lightbox-style .reuse-lightbox-thumbnails button {
  flex: 0 0 60px;
  width: 60px;
  height: 44px;
  border: 0;
  border-radius: 8px;
  background: #e6e6e3;
  opacity: 0.45;
  transition: opacity 200ms ease, box-shadow 200ms ease;
}
.lightbox-style .reuse-lightbox-thumbnails button:hover { opacity: 0.8; }
.lightbox-style .reuse-lightbox-thumbnails button[aria-current="true"] {
  opacity: 1;
  box-shadow: 0 0 0 2px var(--reuse-lightbox-background), 0 0 0 3.5px var(--reuse-lightbox-foreground);
}`,
  ],
  [
    hasBar,
    `.lightbox-style { --lightbox-bar: 58px; }
.lightbox-style-toolbar {
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
.lightbox-style-toolbar .reuse-lightbox-button { position: static; box-shadow: none; background: transparent; }
.lightbox-style-toolbar .reuse-lightbox-button:hover { background: rgb(0 0 0 / 5%); }
.lightbox-style-toolbar .reuse-lightbox-counter { min-width: 52px; padding: 0 6px; font-weight: 500; text-align: center; }
.lightbox-style-toolbar-divider { width: 1px; height: 20px; margin: 0 4px; background: rgb(0 0 0 / 10%); }`,
  ],
  [
    (o) => o.caption === "Panel",
    `.lightbox-style { --lightbox-side: 240px; }
.lightbox-style-panel {
  position: absolute;
  z-index: 1;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  width: var(--lightbox-side);
  padding: 72px 24px 24px;
  background: #fff;
  box-shadow: -1px 0 0 rgb(0 0 0 / 6%);
  color: #1f1f1f;
}
.lightbox-style-panel :where(h2, p) { margin: 0; }
.lightbox-style-panel h2 { font-size: 19px; font-weight: 560; line-height: 26px; letter-spacing: -0.01em; }
.lightbox-style-panel-place { margin-top: 2px; color: #8a8a8a; font-size: 13.5px; line-height: 20px; }
.lightbox-style-panel-text { margin-top: 16px; color: #4a4a4a; font-size: 13.5px; line-height: 21px; }`,
  ],
  [
    dark,
    `.lightbox-style {
  --lightbox-ring: none;
  --reuse-lightbox-background: #09090a;
  --reuse-lightbox-foreground: #fff;
  --reuse-lightbox-control: rgb(255 255 255 / 8%);
}
.lightbox-style .reuse-lightbox-button:hover { background: rgb(255 255 255 / 14%); }`,
  ],
  [
    (o) => dark(o) && o.caption === "Below",
    ".lightbox-style .reuse-lightbox-caption { color: rgb(255 255 255 / 72%); }",
  ],
  [
    (o) => dark(o) && o.counter === "Corner",
    `.lightbox-style .reuse-lightbox-counter {
  height: auto;
  padding: 0;
  top: calc(var(--lightbox-pad) + 12px);
  left: calc(var(--lightbox-pad) + 4px);
  background: none;
  color: rgb(255 255 255 / 60%);
  font-family: ui-monospace, monospace;
  font-size: 12px;
  font-weight: 400;
}`,
  ],
  [
    (o) => dark(o) && o.thumbnails,
    ".lightbox-style .reuse-lightbox-thumbnails button { background: #222; }",
  ],
  [
    (o) => dark(o) && hasBar(o),
    `.lightbox-style-toolbar { background: rgb(32 32 34 / 94%); box-shadow: 0 0 0 0.5px rgb(255 255 255 / 10%); }
.lightbox-style .lightbox-style-toolbar .reuse-lightbox-button:hover { background: rgb(255 255 255 / 10%); }
.lightbox-style-toolbar-divider { background: rgb(255 255 255 / 14%); }`,
  ],
  [
    (o) => dark(o) && o.caption === "Panel",
    `.lightbox-style-panel { background: #151517; box-shadow: -1px 0 0 rgb(255 255 255 / 8%); color: #fff; }
.lightbox-style-panel-place { color: rgb(255 255 255 / 50%); }
.lightbox-style-panel-text { color: rgb(255 255 255 / 70%); }`,
  ],
  [
    (o) => o.autoHide,
    `.lightbox-style :is(.reuse-lightbox-button, .reuse-lightbox-counter, .reuse-lightbox-caption, .reuse-lightbox-thumbnails, .lightbox-style-toolbar) {
  transition: opacity 400ms ease, background-color 150ms ease, transform 160ms cubic-bezier(0.23, 1, 0.32, 1);
}
.lightbox-style[data-idle], .lightbox-style[data-idle] .reuse-lightbox-frame { cursor: none; }
.lightbox-style[data-idle] :is(.reuse-lightbox-button, .reuse-lightbox-counter, .reuse-lightbox-caption, .reuse-lightbox-thumbnails, .lightbox-style-toolbar) {
  opacity: 0;
  transition-duration: 700ms;
}`,
  ],
  [
    always,
    `@media (max-width: 559px) {
  .lightbox-style { --lightbox-pad: 12px; }
}`,
  ],
  [
    (o) => o.thumbnails,
    `@media (max-width: 559px) {
  .lightbox-style { --lightbox-strip: 56px; }
  .lightbox-style .reuse-lightbox-thumbnails button { flex-basis: 48px; width: 48px; height: 36px; }
}`,
  ],
  [
    (o) => o.caption === "Panel",
    `@media (max-width: 559px) {
  .lightbox-style { --lightbox-side: 0px; --lightbox-under: 112px; }
  .lightbox-style-panel {
    top: auto;
    left: 0;
    width: auto;
    height: var(--lightbox-under);
    padding: 16px;
    box-shadow: 0 -1px 0 rgb(0 0 0 / 6%);
  }
  .lightbox-style-panel h2 { font-size: 16px; line-height: 22px; }
  .lightbox-style-panel-place { font-size: 13px; }
  .lightbox-style-panel-text { margin-top: 6px; font-size: 13px; line-height: 19px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
}`,
  ],
  [
    (o) => dark(o) && o.caption === "Panel",
    `@media (max-width: 559px) {
  .lightbox-style-panel { box-shadow: 0 -1px 0 rgb(255 255 255 / 8%); }
}`,
  ],
  [
    always,
    `@media (prefers-reduced-motion: reduce) {
  .lightbox-style, .lightbox-style * { transition-duration: 0ms !important; }
}`,
  ],
];

/** The page CSS one style needs, written against the lightbox-style class. */
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
  bar.className = "lightbox-style-toolbar";
  bar.setAttribute("role", "group");
  bar.setAttribute("aria-label", "Photo controls");
  bar.append(${order.join(", ")});${
    options.zoomButton
      ? `
  const divider = document.createElement("span");
  divider.className = "lightbox-style-toolbar-divider";
  divider.setAttribute("aria-hidden", "true");
  bar.append(divider, part("zoom"));`
      : ""
  }
  part("footer").append(bar);`);
  }
  if (panel)
    parts.push(`  const panel = document.createElement("aside");
  panel.className = "lightbox-style-panel";
  panel.innerHTML = \`<h2></h2><p class="lightbox-style-panel-place"></p><p class="lightbox-style-panel-text"></p>\`;
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
  const dialog = document.querySelector("dialog.lightbox-style");
  const part = (name) => dialog.querySelector(\`.reuse-lightbox-\${name}\`);
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
  return {
    js: `import { createLightbox } from "@reuse-sh/lightbox";
${imports}

const lightbox = createLightbox({
${body("  ")}
});

lightbox.open(photos, 0);${chrome ? "\naddChrome(lightbox, photos);" : ""}`,
    react: `import { useLightbox } from "@reuse-sh/lightbox/react";
import { useRef } from "react";
${imports}

export function Gallery({ photos }) {
  const lightbox = useLightbox({
${body("    ")}
  });
  const root = useRef(null);
  const open = (index) => {
    const images = root.current.querySelectorAll("img");
    const items = photos.map((photo, i) => ({ ...photo, origin: images[i] }));
    lightbox.open(items, index);${chrome ? "\n    addChrome(lightbox, items);" : ""}
  };
  return (
    <div ref={root}>
      {photos.map((photo, index) => (
        <button key={photo.src} onClick={() => open(index)}>
          <img src={photo.src} alt={photo.alt} />
        </button>
      ))}
    </div>
  );
}`,
    css: lightboxStyleCss(options),
    chrome: chromeSource,
  };
}
