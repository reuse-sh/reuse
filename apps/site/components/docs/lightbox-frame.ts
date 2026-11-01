import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon";
import ZoomInAreaIcon from "@hugeicons/core-free-icons/ZoomInAreaIcon";
import { photos } from "../../lib/photos";
import { arrowPaths } from "../lucide-arrows";
import { type LightboxStyle, lightboxClassName } from "./lightbox-styles";

type IconData = readonly (readonly [string, Record<string, string>])[];

const svgAttributes =
  'width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"';

function hugeicon(data: IconData) {
  const parts = data.map(
    ([tag, attributes]) =>
      `<${tag} ${Object.entries(attributes)
        .filter(([key]) => key !== "key")
        .map(
          ([key, value]) =>
            `${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}="${value}"`,
        )
        .join(" ")}/>`,
  );
  return `<svg ${svgAttributes}>${parts.join("")}</svg>`;
}

const arrow = (path: string) =>
  `<svg ${svgAttributes} stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`;

const icons = {
  close: hugeicon(Cancel01Icon as IconData),
  prev: arrow(arrowPaths.left[0]),
  next: arrow(arrowPaths.right[0]),
  zoom: hugeicon(ZoomInAreaIcon as IconData),
};

const css = `
@font-face { font-family: Geist; src: url("/fonts/geist.woff2") format("woff2"); font-weight: 100 900; font-display: swap; }

    html, body { height: 100%; }
    html, body { background: #f6f6f5; }
    body { display: grid; place-items: center; overflow: hidden; }
    .f-again {
      display: inline-flex;
      align-items: center;
      height: 36px;
      padding: 0 15px;
      border: 0;
      border-radius: 10px;
      background: #fff;
      box-shadow: 0 0 0 1px rgb(0 0 0 / 7%), 0 1px 2px rgb(0 0 0 / 6%), 0 2px 6px rgb(0 0 0 / 4%);
      color: #111;
      font: 520 14px/1 Geist, ui-sans-serif, system-ui, sans-serif;
      cursor: pointer;
      transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1), background-color 150ms ease;
    }
    .f-again:hover { background: #fafafa; }
    .f-again:active { transform: scale(0.97); }
    .f-again:focus-visible { outline: 2px solid #111; outline-offset: 2px; }
    .f-again[hidden] { display: none; }

    /* Shared chrome */
    .f-lb {
      --f-pad: 16px;
      --f-side: 0px;
      --f-cap: 0px;
      --f-strip: 0px;
      --f-bar: 0px;
      --f-under: 0px;
      --f-bottom: calc(var(--f-cap) + var(--f-strip) + var(--f-bar) + var(--f-under));
      --f-ring: 0 0 0 0.5px rgb(0 0 0 / 10%), 0 1px 2px rgb(0 0 0 / 6%), 0 2px 6px rgb(0 0 0 / 4%);
      --reuse-lightbox-background: #fcfcfc;
      --reuse-lightbox-foreground: #1f1f1f;
      --reuse-lightbox-control: #fff;
      font-family: Geist, ui-sans-serif, system-ui, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .f-lb *, .f-lb *::before, .f-lb *::after { box-sizing: border-box; }
    .f-lb .reuse-lightbox-viewport {
      width: calc(100% - var(--f-side));
      height: calc(100% - var(--f-bottom));
    }
    .f-lb .reuse-lightbox-button {
      width: 40px;
      height: 40px;
      padding: 0;
      color: inherit;
      box-shadow: var(--f-ring);
      backdrop-filter: none;
      transition: background-color 150ms ease, transform 160ms cubic-bezier(0.23, 1, 0.32, 1), opacity 300ms ease;
    }
    .f-lb .reuse-lightbox-button svg { width: 18px; height: 18px; }
    .f-lb .reuse-lightbox-button:hover { background: #f4f4f4; }
    .f-lb .reuse-lightbox-button:active:not(:disabled) { transform: scale(0.95); }
    .f-lb .reuse-lightbox-button:disabled { opacity: 0.3; }
    .f-lb .reuse-lightbox-close, .f-lb .reuse-lightbox-zoom { top: var(--f-pad); }
    .f-lb .reuse-lightbox-close { right: var(--f-pad); }
    .f-lb .reuse-lightbox-zoom { right: calc(var(--f-pad) + 48px); }
    .f-lb .reuse-lightbox-footer {
      right: calc(var(--f-side) + var(--f-pad));
      bottom: calc(var(--f-under) + var(--f-pad));
      left: var(--f-pad);
      gap: 10px;
    }
    .f-lb .reuse-lightbox-counter {
      padding: 0;
      background: none;
      backdrop-filter: none;
      font-size: 13px;
    }
    .f-lb .reuse-lightbox-caption {
      order: 1;
      padding: 0;
      background: none;
      color: #4a4a4a;
      font-size: 14px;
      line-height: 20px;
    }
    .f-lb .reuse-lightbox-thumbnails { order: 2; }
    .f-lb .f-toolbar { order: 3; }

    /* Arrows */
    .f-lb.arrows-sides .reuse-lightbox-prev,
    .f-lb.arrows-sides .reuse-lightbox-next { top: calc((100% - var(--f-bottom)) / 2 - 20px); }
    .f-lb.arrows-sides .reuse-lightbox-prev { left: var(--f-pad); }
    .f-lb.arrows-sides .reuse-lightbox-next { right: calc(var(--f-side) + var(--f-pad)); }
    .f-lb.arrows-none .reuse-lightbox-prev,
    .f-lb.arrows-none .reuse-lightbox-next { display: none; }

    /* Counter */
    .f-lb.counter-none .reuse-lightbox-counter { display: none; }
    .f-lb.counter-corner .reuse-lightbox-counter {
      position: fixed;
      z-index: 2;
      top: var(--f-pad);
      left: var(--f-pad);
      display: grid;
      height: 40px;
      padding: 0 14px;
      place-items: center;
      border-radius: 999px;
      background: #fff;
      box-shadow: var(--f-ring);
      font-weight: 500;
    }

    /* Zoom button */
    .f-lb:not(.zoom-button) .reuse-lightbox-zoom { display: none; }

    /* Caption */
    .f-lb.caption-below { --f-cap: 30px; }
    .f-lb:not(.caption-below) .reuse-lightbox-caption { display: none; }

    /* Thumbnails */
    .f-lb.f-thumbs { --f-strip: 64px; }
    .f-lb .reuse-lightbox-thumbnails { max-width: 100%; gap: 6px; padding: 5px; scrollbar-width: none; }
    .f-lb .reuse-lightbox-thumbnails::-webkit-scrollbar { display: none; }
    .f-lb .reuse-lightbox-thumbnails button {
      flex: 0 0 60px;
      width: 60px;
      height: 44px;
      border: 0;
      border-radius: 8px;
      background: #e6e6e3;
      opacity: 0.45;
      transition: opacity 200ms ease, box-shadow 200ms ease;
    }
    .f-lb .reuse-lightbox-thumbnails button:hover { opacity: 0.8; }
    .f-lb .reuse-lightbox-thumbnails button[aria-current="true"] {
      opacity: 1;
      box-shadow: 0 0 0 2px var(--reuse-lightbox-background), 0 0 0 3.5px var(--reuse-lightbox-foreground);
    }

    /* Toolbar */
    .f-lb.f-has-bar { --f-bar: 58px; }
    .f-toolbar {
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
    .f-toolbar .reuse-lightbox-button { position: static; box-shadow: none; background: transparent; }
    .f-toolbar .reuse-lightbox-button:hover { background: rgb(0 0 0 / 5%); }
    .f-toolbar .reuse-lightbox-counter { min-width: 52px; padding: 0 6px; font-weight: 500; text-align: center; }
    .f-toolbar-divider { width: 1px; height: 20px; margin: 0 4px; background: rgb(0 0 0 / 10%); }

    /* Panel */
    .f-lb.caption-panel { --f-side: 240px; }
    .f-panel {
      position: absolute;
      z-index: 1;
      top: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      width: var(--f-side);
      padding: 72px 24px 24px;
      background: #fff;
      box-shadow: -1px 0 0 rgb(0 0 0 / 6%);
      color: #1f1f1f;
    }
    .f-panel :where(h2, p) { margin: 0; }
    .f-panel h2 { font-size: 19px; font-weight: 560; line-height: 26px; letter-spacing: -0.01em; }
    .f-panel-place { margin-top: 2px; color: #8a8a8a; font-size: 13.5px; line-height: 20px; }
    .f-panel-text { margin-top: 16px; color: #4a4a4a; font-size: 13.5px; line-height: 21px; }

    /* Dark */
    .f-lb.backdrop-dark {
      --f-ring: none;
      --reuse-lightbox-background: #09090a;
      --reuse-lightbox-foreground: #fff;
      --reuse-lightbox-control: rgb(255 255 255 / 8%);
    }
    .f-lb.backdrop-dark .reuse-lightbox-button:hover { background: rgb(255 255 255 / 14%); }
    .f-lb.backdrop-dark .reuse-lightbox-caption { color: rgb(255 255 255 / 72%); }
    .f-lb.backdrop-dark.counter-corner .reuse-lightbox-counter {
      height: auto;
      padding: 0;
      top: calc(var(--f-pad) + 12px);
      left: calc(var(--f-pad) + 4px);
      background: none;
      color: rgb(255 255 255 / 60%);
      font-family: ui-monospace, monospace;
      font-size: 12px;
      font-weight: 400;
    }
    .f-lb.backdrop-dark .reuse-lightbox-thumbnails button { background: #222; }
    .f-lb.backdrop-dark .f-toolbar { background: rgb(32 32 34 / 94%); box-shadow: 0 0 0 0.5px rgb(255 255 255 / 10%); }
    .f-lb.backdrop-dark .f-toolbar .reuse-lightbox-button:hover { background: rgb(255 255 255 / 10%); }
    .f-lb.backdrop-dark .f-toolbar-divider { background: rgb(255 255 255 / 14%); }
    .f-lb.backdrop-dark .f-panel { background: #151517; box-shadow: -1px 0 0 rgb(255 255 255 / 8%); color: #fff; }
    .f-lb.backdrop-dark .f-panel-place { color: rgb(255 255 255 / 50%); }
    .f-lb.backdrop-dark .f-panel-text { color: rgb(255 255 255 / 70%); }

    /* Hide when idle */
    .f-lb.hide-idle :is(.reuse-lightbox-button, .reuse-lightbox-counter, .reuse-lightbox-caption, .reuse-lightbox-thumbnails, .f-toolbar) {
      transition: opacity 400ms ease, background-color 150ms ease, transform 160ms cubic-bezier(0.23, 1, 0.32, 1);
    }
    .f-lb.hide-idle[data-idle], .f-lb.hide-idle[data-idle] .reuse-lightbox-frame { cursor: none; }
    .f-lb.hide-idle[data-idle] :is(.reuse-lightbox-button, .reuse-lightbox-counter, .reuse-lightbox-caption, .reuse-lightbox-thumbnails, .f-toolbar) {
      opacity: 0;
      transition-duration: 700ms;
    }

    @media (max-width: 559px) {
      .f-lb { --f-pad: 12px; }
      .f-lb .reuse-lightbox-thumbnails button { flex-basis: 48px; width: 48px; height: 36px; }
      .f-lb.f-thumbs { --f-strip: 56px; }
      .f-lb.caption-panel { --f-side: 0px; --f-under: 112px; }
      .f-panel {
        top: auto;
        left: 0;
        width: auto;
        height: var(--f-under);
        padding: 16px;
        box-shadow: 0 -1px 0 rgb(0 0 0 / 6%);
      }
      .f-panel h2 { font-size: 16px; line-height: 22px; }
      .f-panel-place { font-size: 13px; }
      .f-panel-text { margin-top: 6px; font-size: 13px; line-height: 19px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      .f-lb.backdrop-dark .f-panel { box-shadow: 0 -1px 0 rgb(255 255 255 / 8%); }
    }
    @media (prefers-reduced-motion: reduce) {
      .f-lb, .f-lb * { transition-duration: 0ms !important; }
    }
  `;

const script = `

    import { createLightbox } from "@reuse-sh/lightbox";

    const { options, className, photos, icons } = JSON.parse(document.getElementById("frame-data").textContent);
    const again = document.querySelector(".f-again");
    const items = photos.map((photo) => ({
      src: photo.src,
      previewSrc: photo.src,
      thumbnailSrc: photo.src,
      alt: photo.alt,
      caption: photo.caption,
      width: photo.width,
      height: photo.height,
    }));

    function svg(name) {
      const template = document.createElement("template");
      template.innerHTML = icons[name];
      return template.content.firstElementChild;
    }
    const ICONS = { close: () => svg("close"), prev: () => svg("prev"), next: () => svg("next"), zoom: () => svg("zoom") };

    let index = 0;
    let lightbox = null;
    let unsubscribe = null;
    let chrome = null;

    function element(tag, className) {
      const node = document.createElement(tag);
      node.className = className;
      return node;
    }

    // Moves the library's own parts into this page's chrome. Returns { sync(state), cleanup() }.
    function buildChrome(dialog) {
      const part = (name) => dialog.querySelector(\`.reuse-lightbox-\${name}\`);
      const cleanups = [];
      const syncs = [];
      if (options.arrows === "Toolbar" || options.counter === "Toolbar") {
        const bar = element("div", "f-toolbar");
        bar.setAttribute("role", "group");
        bar.setAttribute("aria-label", "Photo controls");
        if (options.arrows === "Toolbar") bar.append(part("prev"));
        if (options.counter === "Toolbar") bar.append(part("counter"));
        if (options.arrows === "Toolbar") bar.append(part("next"));
        if (options.zoomButton) {
          const divider = element("span", "f-toolbar-divider");
          divider.setAttribute("aria-hidden", "true");
          bar.append(divider, part("zoom"));
        }
        part("footer").append(bar);
      }
      if (options.caption === "Panel") {
        const panel = element("aside", "f-panel");
        panel.innerHTML = \`<h2></h2><p class="f-panel-place"></p><p class="f-panel-text"></p>\`;
        dialog.append(panel);
        const [title, place, text] = panel.children;
        syncs.push((state) => {
          const photo = photos[state.index];
          title.textContent = photo.caption;
          place.textContent = \`\${state.index + 1} of \${photos.length}\`;
          text.textContent = \`\${photo.alt}.\`;
        });
      }
      const strip = part("thumbnails");
      if (strip) {
        let shown = -1;
        syncs.push((state) => {
          const thumb = strip.children[state.index];
          if (!thumb || state.index === shown || strip.scrollWidth <= strip.clientWidth) return;
          const left = thumb.offsetLeft - (strip.clientWidth - thumb.offsetWidth) / 2;
          strip.scrollTo({ left: Math.max(0, left), behavior: shown < 0 ? "instant" : "smooth" });
          shown = state.index;
        });
      }
      if (options.autoHide) {
        let timer = 0;
        const wake = () => {
          dialog.removeAttribute("data-idle");
          clearTimeout(timer);
          timer = setTimeout(() => dialog.setAttribute("data-idle", ""), 2000);
        };
        const types = ["pointermove", "pointerdown", "keydown", "wheel"];
        for (const type of types) dialog.addEventListener(type, wake, { passive: true });
        wake();
        cleanups.push(() => {
          clearTimeout(timer);
          for (const type of types) dialog.removeEventListener(type, wake);
        });
      }
      return {
        sync: (state) => syncs.forEach((fn) => fn(state)),
        cleanup: () => cleanups.forEach((fn) => fn()),
      };
    }

    function teardown() {
      unsubscribe?.();
      chrome?.cleanup();
      lightbox?.destroy();
      unsubscribe = chrome = lightbox = null;
    }

    function onState(state) {
      if (state.isOpen) {
        index = state.index;
        chrome?.sync(state);
      } else if (!state.isClosing) {
        teardown();
        again.hidden = false;
        if (document.hasFocus()) again.focus({ preventScroll: true });
      }
    }

    // showModal() focuses the close button even in an unfocused same-origin frame, so focus goes back to the parent.
    function withoutFocus(fn) {
      const host = window.frameElement;
      if (!host || document.hasFocus()) return fn();
      const previous = host.ownerDocument.activeElement;
      try {
        return fn();
      } finally {
        if (previous && previous !== host && previous !== host.ownerDocument.body) previous.focus({ preventScroll: true });
        else host.blur();
      }
    }

    function render({ animate = false } = {}) {
      teardown();
      again.hidden = true;
      const extra = [options.thumbnails && "f-thumbs", (options.arrows === "Toolbar" || options.counter === "Toolbar") && "f-has-bar"];
      lightbox = createLightbox({
        className: ["f-lb", className, ...extra].filter(Boolean).join(" "),
        icons: ICONS,
        thumbnails: options.thumbnails,
        label: "Photos",
        padding: window.innerWidth < 560 ? 12 : 24,
      });
      unsubscribe = lightbox.subscribe(onState);
      withoutFocus(() => lightbox.open(items, index));
      const dialog = document.querySelector("dialog.f-lb");
      if (!animate) for (const animation of dialog.getAnimations({ subtree: true })) animation.finish();
      chrome = buildChrome(dialog);
      chrome.sync(lightbox.getState());
    }

    again.addEventListener("click", () => render({ animate: true }));

    render();
  `;

/** A standalone page that opens a real lightbox in one control style, for an iframe preview. */
export function lightboxFrame(options: LightboxStyle) {
  const data = JSON.stringify({
    options,
    className: lightboxClassName(options),
    photos,
    icons,
  }).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Lightbox preview</title>
<link rel="stylesheet" href="/modules/lightbox/styles.css">
<script type="importmap">{"imports":{"@reuse-sh/carousel":"/modules/carousel/index.js","@reuse-sh/lightbox":"/modules/lightbox/index.js"}}</script>
<style>${css}</style>
</head>
<body>
<button type="button" class="f-again" hidden>Open again</button>
<script type="application/json" id="frame-data">${data}</script>
<script type="module">${script}</script>
</body>
</html>
`;
}
