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
  panel: style("Sides", "None", false, "Panel", "Light", false, false),
  immersive: style("Sides", "Corner", false, "Below", "Dark", true, false),
  toolbar: style("Toolbar", "Toolbar", false, "Below", "Light", false, true),
};

export const LIGHTBOX_STYLE_CLASS = "re-lightbox-style";

/** The look every lightbox on the site shares. A style adds only its differences on top. */
export const lightboxLookCss = [
  `.re-lightbox-style {
  --re-lightbox-pad: 16px;
  --re-lightbox-padding: 24px;
  --re-lightbox-inset: var(--re-lightbox-pad);
  --re-lightbox-gap: 8px;
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
  --re-lightbox-control-hover: #f4f4f4;
  --re-lightbox-placeholder: rgb(0 0 0 / 5%);
  --re-lightbox-press-scale: 0.95;
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
  transition: background-color 150ms ease, scale 160ms cubic-bezier(0.23, 1, 0.32, 1), opacity 300ms ease;
}
.re-lightbox-style .re-lightbox-button svg { width: 18px; height: 18px; }
.re-lightbox-style .re-lightbox-retry { box-shadow: var(--re-lightbox-ring); }
.re-lightbox-style .re-lightbox-button:hover { background: #f4f4f4; }
.re-lightbox-style .re-lightbox-button:disabled { opacity: 0.3; }
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
  `.re-lightbox-style .re-lightbox-prev,
.re-lightbox-style .re-lightbox-next { top: calc((100% - var(--re-lightbox-bottom)) / 2 - 20px); }
.re-lightbox-style .re-lightbox-prev { left: var(--re-lightbox-pad); }
.re-lightbox-style .re-lightbox-next { right: calc(var(--re-lightbox-side) + var(--re-lightbox-pad)); }`,
  `.re-lightbox-style .re-lightbox-counter {
  position: fixed;
  z-index: 2;
  top: var(--re-lightbox-pad);
  left: var(--re-lightbox-pad);
  display: flex;
  height: 40px;
  padding: 0 14px;
  align-items: center;
  border-radius: 999px;
  background: #fff;
  box-shadow: var(--re-lightbox-ring);
  font-weight: 500;
}`,
  `.re-lightbox-style { --re-lightbox-caption: 30px; }
.re-lightbox-style .re-lightbox-caption {
  order: 1;
  padding: 0;
  background: none;
  color: #4a4a4a;
  font-size: 14px;
  line-height: 20px;
}`,
  `.re-lightbox-style[data-thumbnails="bottom"] { --re-lightbox-strip: 64px; }
.re-lightbox-style[data-thumbnails="bottom"] .re-lightbox-thumbnails { order: 2; max-width: 100%; margin: 0; gap: 6px; padding: 5px 50%; scrollbar-width: none; }
.re-lightbox-style[data-thumbnails="bottom"] .re-lightbox-thumbnails::-webkit-scrollbar { display: none; }
.re-lightbox-style[data-thumbnails="bottom"] .re-lightbox-thumbnails button {
  flex: 0 0 60px;
  width: 60px;
  height: 44px;
  border: 0;
  border-radius: 8px;
  background: #e6e6e3;
  opacity: 0.45;
  transition: opacity 200ms ease;
}
.re-lightbox-style[data-thumbnails="bottom"] .re-lightbox-thumbnails button[aria-current="true"] { opacity: 1; }
.re-lightbox-style[data-thumbnails="bottom"] .re-lightbox-thumbnail-ring {
  border-radius: 8px;
  outline: 0;
  box-shadow: 0 0 0 2px var(--re-lightbox-background), 0 0 0 3.5px var(--re-lightbox-foreground);
}`,
  `@media (max-width: 559px) {
  .re-lightbox-style { --re-lightbox-pad: 12px; --re-lightbox-padding: 12px; }
}`,
  `@media (max-width: 559px) {
  .re-lightbox-style[data-thumbnails="bottom"] { --re-lightbox-strip: 56px; }
  .re-lightbox-style[data-thumbnails="bottom"] .re-lightbox-thumbnails button { flex-basis: 48px; width: 48px; height: 36px; }
}`,
  `@media (prefers-reduced-motion: reduce) {
  .re-lightbox-style, .re-lightbox-style * { transition-duration: 0ms !important; }
}`,
].join("\n\n");

const hasBar = (o: LightboxStyle) =>
  o.arrows === "Toolbar" || o.counter === "Toolbar";
const dark = (o: LightboxStyle) => o.backdrop === "Dark";

const rules: readonly (readonly [(o: LightboxStyle) => boolean, string])[] = [
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
    (o) => !o.zoomButton,
    ".re-lightbox-style .re-lightbox-zoom { display: none; }",
  ],
  [
    (o) => o.caption !== "Below",
    `.re-lightbox-style { --re-lightbox-caption: 0px; }
.re-lightbox-style .re-lightbox-caption { display: none; }`,
  ],
  [
    (o) => o.arrows === "Toolbar",
    `.re-lightbox-style .re-lightbox-stage > :is(.re-lightbox-prev, .re-lightbox-next) { display: none; }`,
  ],
  [
    (o) => o.counter === "Toolbar",
    ".re-lightbox-style .re-lightbox-toolbar-start > .re-lightbox-counter { display: none; }",
  ],
  [
    (o) => hasBar(o) && o.zoomButton,
    ".re-lightbox-style .re-lightbox-toolbar .re-lightbox-zoom { display: none; }",
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
.re-lightbox-style-toolbar .re-lightbox-counter { position: static; display: block; height: auto; min-width: 52px; padding: 0 6px; background: none; box-shadow: none; font-weight: 500; text-align: center; }
.re-lightbox-style-toolbar-divider { width: 1px; height: 20px; margin: 0 4px; background: rgb(0 0 0 / 10%); }`,
  ],
  [
    (o) => o.caption === "Panel",
    `.re-lightbox-style { --re-lightbox-side: 240px; --re-lightbox-aside-width: var(--re-lightbox-side); }
.re-lightbox-style .re-lightbox-aside {
  top: 0;
  right: 0;
  bottom: 0;
  left: auto;
  width: var(--re-lightbox-side);
  height: auto;
  background: #fff;
  box-shadow: -1px 0 0 rgb(0 0 0 / 6%);
  color: #1f1f1f;
}
.re-lightbox-style-panel {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: 72px 24px 24px;
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
  --re-lightbox-control-hover: rgb(255 255 255 / 14%);
  --re-lightbox-placeholder: rgb(255 255 255 / 6%);
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
    '.re-lightbox-style[data-thumbnails="bottom"] .re-lightbox-thumbnails button { background: #222; }',
  ],
  [
    (o) => dark(o) && hasBar(o),
    `.re-lightbox-style-toolbar { background: rgb(32 32 34 / 94%); box-shadow: 0 0 0 0.5px rgb(255 255 255 / 10%); }
.re-lightbox-style .re-lightbox-style-toolbar .re-lightbox-button:hover { background: rgb(255 255 255 / 10%); }
.re-lightbox-style-toolbar-divider { background: rgb(255 255 255 / 14%); }`,
  ],
  [
    (o) => dark(o) && o.caption === "Panel",
    `.re-lightbox-style .re-lightbox-aside { background: #151517; box-shadow: -1px 0 0 rgb(255 255 255 / 8%); color: #fff; }
.re-lightbox-style-panel-place { color: rgb(255 255 255 / 50%); }
.re-lightbox-style-panel-text { color: rgb(255 255 255 / 70%); }`,
  ],
  [
    (o) => o.caption === "Panel",
    `@media (max-width: 559px) {
  .re-lightbox-style { --re-lightbox-side: 0px; --re-lightbox-under: 120px; }
  .re-lightbox-style .re-lightbox-aside {
    top: auto;
    left: 0;
    width: auto;
    height: var(--re-lightbox-under);
    box-shadow: 0 -1px 0 rgb(0 0 0 / 6%);
  }
  .re-lightbox-style-panel { padding: 16px; }
  .re-lightbox-style-panel h2 { font-size: 16px; line-height: 22px; }
  .re-lightbox-style-panel-place { font-size: 13px; }
  .re-lightbox-style-panel-text { margin-top: 6px; font-size: 13px; line-height: 19px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
}`,
  ],
  [
    (o) => dark(o) && o.caption === "Panel",
    `@media (max-width: 559px) {
  .re-lightbox-style .re-lightbox-aside { box-shadow: 0 -1px 0 rgb(255 255 255 / 8%); }
}`,
  ],
];

/** What one style changes on top of lightboxLookCss, written against the re-lightbox-style class. */
export function lightboxStyleCss(options: LightboxStyle) {
  return rules
    .filter(([when]) => when(options))
    .map(([, css]) => css)
    .join("\n\n");
}

/**
 * The chrome module one style needs, as module source, or null when the package's
 * own controls and options are enough. chromeSlots(getItems, icons) returns the
 * slots option.
 */
export function lightboxChrome(options: LightboxStyle) {
  const bar = hasBar(options);
  const panel = options.caption === "Panel";
  if (!bar && !panel) return null;
  const modules: string[] = [];
  const slots: string[] = [];
  if (bar) {
    const order = [
      options.arrows === "Toolbar" && "prev",
      options.counter === "Toolbar" && "counter",
      options.arrows === "Toolbar" && "next",
    ].filter(Boolean);
    slots.push(`    footer: ({ lightbox, document, icon }) => {
      const button = (name, label, action) => {
        const element = document.createElement("button");
        element.type = "button";
        element.className = "re-lightbox-button";
        element.setAttribute("aria-label", label);
        element.append(icon(name));
        element.addEventListener("click", action);
        return element;
      };
      const bar = document.createElement("div");
      bar.className = "re-lightbox-style-toolbar";
      bar.setAttribute("role", "group");
      bar.setAttribute("aria-label", "Photo controls");${
        options.arrows === "Toolbar"
          ? `
      const prev = button("previous", "Previous image", () => lightbox.prev());
      const next = button("next", "Next image", () => lightbox.next());`
          : ""
      }${
        options.counter === "Toolbar"
          ? `
      const counter = document.createElement("span");
      counter.className = "re-lightbox-counter";`
          : ""
      }
      bar.append(${order.join(", ")});${
        options.zoomButton
          ? `
      const divider = document.createElement("span");
      divider.className = "re-lightbox-style-toolbar-divider";
      divider.setAttribute("aria-hidden", "true");
      const zoom = button("zoom", "Zoom in", () => lightbox.toggleZoom());
      bar.append(divider, zoom);`
          : ""
      }
      return {
        node: bar,
        update: (state) => {${
          options.arrows === "Toolbar"
            ? `
          prev.disabled = !state.canPrev;
          next.disabled = !state.canNext;`
            : ""
        }${
          options.counter === "Toolbar"
            ? `
          counter.textContent = \`\${state.index + 1} / \${state.count}\`;`
            : ""
        }${
          options.zoomButton
            ? `
          const zoomed = state.zoom.scale > 1;
          if (zoom.getAttribute("aria-pressed") !== String(zoomed))
            zoom.replaceChildren(icon(zoomed ? "zoomOut" : "zoom"));
          zoom.setAttribute("aria-label", zoomed ? "Zoom out" : "Zoom in");
          zoom.setAttribute("aria-pressed", String(zoomed));`
            : ""
        }
        },
      };
    },`);
  }
  if (panel)
    slots.push(`    aside: ({ document }) => {
      const panel = document.createElement("aside");
      panel.className = "re-lightbox-style-panel";
      const title = document.createElement("h2");
      const place = document.createElement("p");
      place.className = "re-lightbox-style-panel-place";
      const text = document.createElement("p");
      text.className = "re-lightbox-style-panel-text";
      panel.append(title, place, text);
      return {
        node: panel,
        update: (state) => {
          const item = getItems()[state.index];
          if (!item) return;
          title.textContent = item.caption ?? "";
          place.textContent = \`\${state.index + 1} of \${state.count}\`;
          text.textContent = \`\${item.alt}.\`;
        },
      };
    },`);
  if (slots.length)
    modules.push(`export function chromeSlots(getItems, icons = {}) {
  return {
${slots.join("\n")}
  };
}`);
  return modules.join("\n\n");
}

/** The style preview's setup as an ES module: its default export builds the lightbox. */
export function lightboxPreviewModule(options: LightboxStyle) {
  const chromeSource = lightboxChrome(options);
  const slots = chromeSource?.includes("chromeSlots") ?? false;
  return `${chromeSource ?? ""}

export default (createLightbox, icons, getItems) =>
  createLightbox({
    className: "${LIGHTBOX_STYLE_CLASS}",
    icons,
    thumbnails: ${options.thumbnails ? '"bottom"' : "false"},${options.autoHide ? "\n    autoHide: 2000," : ""}
    strings: { dialog: "Photos" },${slots ? "\n    slots: chromeSlots(getItems, icons)," : ""}
  });
`;
}

export function lightboxCode(options: LightboxStyle) {
  const chromeSource = lightboxChrome(options);
  const slots = chromeSource?.includes("chromeSlots") ?? false;
  const names = slots ? ["chromeSlots"] : [];
  const lines = (items: string) => [
    ...(options.thumbnails ? ['thumbnails: "bottom",'] : []),
    ...(options.autoHide ? ["autoHide: 2000,"] : []),
    `className: "${LIGHTBOX_STYLE_CLASS}",`,
    ...(slots ? [`slots: chromeSlots(${items}),`] : []),
  ];
  const body = (indent: string, items: string) =>
    lines(items)
      .map((line) => `${indent}${line}`)
      .join("\n");
  const imports = `import "@reuse-sh/lightbox/base.css";
import "@reuse-sh/lightbox/theme.css";
import "./lightbox-style.css";${names.length ? `\nimport { ${names.join(", ")} } from "./lightbox-chrome.js";` : ""}`;
  return {
    html: `<div data-gallery>
  <a href="/photos/coast.jpg">
    <img src="/photos/coast-small.jpg" data-lightbox-src="/photos/coast.jpg" alt="A rocky coast" data-lightbox-caption="Coast" width="400" height="300">
  </a>
  <a href="/photos/forest.jpg">
    <img src="/photos/forest-small.jpg" data-lightbox-src="/photos/forest.jpg" alt="A path through a forest" data-lightbox-caption="Forest" width="400" height="300">
  </a>
</div>`,
    js: `import { bindLightboxGallery, createLightbox, lightboxItemFromElement } from "@reuse-sh/lightbox";
${imports}

const gallery = document.querySelector("[data-gallery]");${
      options.thumbnails
        ? `
const item = (trigger) => {
  const found = lightboxItemFromElement(trigger);
  const image = trigger.querySelector("img");
  return found && { ...found, thumbnailSrc: image.currentSrc || image.src };
};`
        : "\nconst item = lightboxItemFromElement;"
    }${slots ? `\nconst items = () => [...gallery.querySelectorAll("a")].map(item);` : ""}
const lightbox = createLightbox({
${body("  ", "items")}
});
const unbind = bindLightboxGallery(gallery, lightbox, { item });`,
    react: `"use client";

import type { LightboxItem } from "@reuse-sh/lightbox";
import { useLightbox } from "@reuse-sh/lightbox/react";
import { useRef } from "react";
${imports}

const photos: LightboxItem[] = [
  { src: "/photos/coast.jpg", alt: "A rocky coast", caption: "Coast"${options.thumbnails ? ', thumbnailSrc: "/photos/coast.jpg"' : ""} },
  { src: "/photos/forest.jpg", alt: "A path through a forest", caption: "Forest"${options.thumbnails ? ', thumbnailSrc: "/photos/forest.jpg"' : ""} },
];

export function Gallery() {
  const lightbox = useLightbox({
${body("    ", "() => photos")}
  });
  const root = useRef<HTMLDivElement>(null);
  const open = (index: number) => {
    const images = root.current?.querySelectorAll<HTMLImageElement>("img");
    const items = photos.map((photo, i) => ({ ...photo, origin: images?.[i] }));
    lightbox.open(items, index);
  };
  return (
    <div ref={root} className="grid grid-cols-2 gap-3">
      {photos.map((photo, index) => (
        <a key={photo.src} href={photo.src} onClick={(event) => {
          if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          open(index);
        }}>
          <img className="h-auto w-full" src={photo.src} alt={photo.alt} width="400" height="300" />
        </a>
      ))}
    </div>
  );
}`,
    css: [lightboxLookCss, lightboxStyleCss(options)]
      .filter(Boolean)
      .join("\n\n"),
    chrome: chromeSource,
    cleanup: "unbind();\nlightbox.destroy();",
  };
}
