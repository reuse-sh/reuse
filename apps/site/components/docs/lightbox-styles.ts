export interface LightboxStyle {
  arrows: "Sides" | "Toolbar";
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
  classic: style("Sides", "Corner", false, "Below", "Light", false, true),
  filmstrip: style("Sides", "None", true, "None", "Light", false, true),
  toolbar: style("Toolbar", "Toolbar", false, "Below", "Light", false, true),
  panel: style("Sides", "None", false, "Panel", "Light", false, false),
  immersive: style("Sides", "Corner", false, "Below", "Dark", true, false),
};

export const LIGHTBOX_STYLE_CLASS = "re-lightbox-style";

const hasBar = (o: LightboxStyle) =>
  o.arrows === "Toolbar" || o.counter === "Toolbar";
const dark = (o: LightboxStyle) => o.backdrop === "Dark";

const rules: readonly (readonly [(o: LightboxStyle) => boolean, string])[] = [
  [
    (o) => o.counter === "None",
    ".re-lightbox-style .re-lightbox-counter { display: none; }",
  ],
  [
    (o) => !o.zoomButton,
    `.re-lightbox-style:not([data-zoomed="true"]) .re-lightbox-zoom { display: none; }
.re-lightbox-style[data-zoomed="true"] .re-lightbox-zoom { transition-delay: 0s, 0s, 300ms; }
@starting-style { .re-lightbox-style[data-zoomed="true"] .re-lightbox-zoom { opacity: 0; } }`,
  ],
  [
    (o) => o.caption !== "Below",
    `.re-lightbox-style { --re-lightbox-caption-room: 0px; }
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
    `.re-lightbox-style:not([data-zoomed="true"]) .re-lightbox-toolbar .re-lightbox-zoom { display: none; }
.re-lightbox-style[data-zoomed="true"] .re-lightbox-toolbar .re-lightbox-zoom { transition-delay: 0s, 0s, 300ms; }
@starting-style { .re-lightbox-style[data-zoomed="true"] .re-lightbox-toolbar .re-lightbox-zoom { opacity: 0; } }`,
  ],
  [
    hasBar,
    `.re-lightbox-style {
  --re-lightbox-bottom-room: calc(var(--re-lightbox-caption-room) + var(--re-lightbox-strip-room) + 58px);
}
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
.re-lightbox-style-toolbar .re-lightbox-counter:not([hidden]) { position: static; display: block; height: auto; min-width: 52px; padding: 0 6px; background: none; box-shadow: none; font-weight: 500; text-align: center; }
.re-lightbox-style-toolbar-divider { width: 1px; height: 20px; margin: 0 4px; background: rgb(0 0 0 / 10%); }`,
  ],
  [
    (o) => o.caption === "Panel",
    `.re-lightbox-style {
  --re-lightbox-panel-width: 320px;
  --re-lightbox-panel-inset: 12px;
  --re-lightbox-aside-width: calc(var(--re-lightbox-panel-width) + var(--re-lightbox-panel-inset));
  --re-lightbox-panel-background: #fff;
  --re-lightbox-panel-foreground: #1f1f1f;
  --re-lightbox-panel-muted: #5f5f5f;
  --re-lightbox-panel-subtle: #757575;
  --re-lightbox-panel-ring: 0 0 0 0.5px rgb(0 0 0 / 8%), 0 2px 4px rgb(0 0 0 / 4%), 0 12px 32px rgb(0 0 0 / 8%);
  --re-lightbox-panel-hover: rgb(0 0 0 / 4%);
  --re-lightbox-panel-current: rgb(0 0 0 / 6%);
}
.re-lightbox-style .re-lightbox-close { margin: 4px 4px 0 0; background: transparent; box-shadow: none; }
.re-lightbox-style .re-lightbox-close:hover { background: var(--re-lightbox-panel-hover); }
.re-lightbox-style .re-lightbox-aside {
  top: var(--re-lightbox-panel-inset);
  right: var(--re-lightbox-panel-inset);
  bottom: var(--re-lightbox-panel-inset);
  left: auto;
  width: var(--re-lightbox-panel-width);
  height: auto;
  border-radius: 18px;
  background: var(--re-lightbox-panel-background);
  box-shadow: var(--re-lightbox-panel-ring);
  color: var(--re-lightbox-panel-foreground);
  overscroll-behavior: contain;
  scroll-padding-top: 56px;
}
.re-lightbox-style-panel {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: 0 24px 24px;
}
.re-lightbox-style-panel :where(h2, p, ol) { margin: 0; padding: 0; }
.re-lightbox-style-panel [hidden] { display: none; }
.re-lightbox-style-panel-count {
  position: sticky;
  z-index: 1;
  top: 0;
  display: flex;
  align-items: center;
  height: 56px;
  margin: 0 -24px;
  padding: 0 24px;
  background: var(--re-lightbox-panel-background);
  color: var(--re-lightbox-panel-subtle);
  font-size: 13px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}
.re-lightbox-style .re-lightbox-style-panel-count > .re-lightbox-counter:not([hidden]) {
  position: static;
  display: inline;
  height: auto;
  padding: 0;
  border-radius: 0;
  background: none;
  box-shadow: none;
  font-size: inherit;
  font-weight: inherit;
}
.re-lightbox-style-panel-summary { margin-top: 12px; overflow: clip; }
.re-lightbox-style-panel h2 {
  font-size: 20px;
  font-weight: 600;
  line-height: 28px;
  letter-spacing: -0.015em;
  overflow-wrap: anywhere;
  text-wrap: balance;
}
.re-lightbox-style-panel-text {
  margin-top: 8px;
  color: var(--re-lightbox-panel-muted);
  font-size: 14px;
  line-height: 22px;
  overflow-wrap: anywhere;
  text-wrap: pretty;
}
.re-lightbox-style-panel-toggle { display: none; }
.re-lightbox-style-panel-label { margin: 28px 0 8px; color: var(--re-lightbox-panel-subtle); font-size: 13px; font-weight: 500; }
.re-lightbox-style-panel-list { display: grid; gap: 2px; margin: 0 -8px; list-style: none; }
.re-lightbox-style-panel-list button {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 6px 8px;
  border: 0;
  border-radius: 10px;
  background: none;
  color: var(--re-lightbox-panel-muted);
  font: inherit;
  font-size: 14px;
  line-height: 20px;
  text-align: start;
  cursor: pointer;
  transition: background-color 150ms ease;
}
.re-lightbox-style-panel-list button:hover { background: var(--re-lightbox-panel-hover); }
.re-lightbox-style-panel-list button[aria-current="true"] { background: var(--re-lightbox-panel-current); color: var(--re-lightbox-panel-foreground); font-weight: 500; }
.re-lightbox-style-panel :is(.re-lightbox-style-panel-list button, .re-lightbox-style-panel-toggle):focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
.re-lightbox-style-panel-thumbnail { flex: none; width: 48px; height: 36px; border-radius: 6px; background: var(--re-lightbox-panel-hover); object-fit: cover; }
.re-lightbox-style-panel-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }`,
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
  position: relative;
  top: 12px;
  inset-inline-start: 4px;
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
    `.re-lightbox-style {
  --re-lightbox-panel-background: #161618;
  --re-lightbox-panel-foreground: #fff;
  --re-lightbox-panel-muted: rgb(255 255 255 / 64%);
  --re-lightbox-panel-subtle: rgb(255 255 255 / 48%);
  --re-lightbox-panel-ring: 0 0 0 0.5px rgb(255 255 255 / 10%), 0 12px 32px rgb(0 0 0 / 30%);
  --re-lightbox-panel-hover: rgb(255 255 255 / 7%);
  --re-lightbox-panel-current: rgb(255 255 255 / 11%);
}`,
  ],
  [
    (o) => o.caption === "Panel",
    `@media (max-width: 719.98px) {
  .re-lightbox-style {
    --re-lightbox-aside-width: 0px;
    --re-lightbox-panel-inset: 8px;
    --re-lightbox-panel-sheet: calc(72px + env(safe-area-inset-bottom));
    --re-lightbox-bottom-room: calc(var(--re-lightbox-panel-sheet) + var(--re-lightbox-panel-inset));
  }
  .re-lightbox-style .re-lightbox-close { margin: 0; }
  .re-lightbox-style .re-lightbox-aside {
    top: auto;
    left: var(--re-lightbox-panel-inset);
    width: auto;
    max-height: var(--re-lightbox-panel-sheet);
    overflow: hidden;
    scroll-padding-top: 0;
    transition: max-height 320ms var(--re-lightbox-ease, ease);
  }
  .re-lightbox-style .re-lightbox-aside:has([data-open]) { max-height: 72%; overflow: auto; }
  .re-lightbox-style-panel {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: center;
    column-gap: 12px;
    min-height: 0;
    padding: 14px 16px max(14px, env(safe-area-inset-bottom));
  }
  .re-lightbox-style-panel-summary { display: contents; }
  .re-lightbox-style-panel h2 { grid-area: 1 / 1; overflow: hidden; font-size: 16px; line-height: 22px; text-overflow: ellipsis; white-space: nowrap; }
  .re-lightbox-style-panel[data-open] h2 { white-space: normal; }
  .re-lightbox-style-panel-count { position: static; grid-area: 1 / 2; height: auto; margin: 0; padding: 0; background: none; }
  .re-lightbox-style-panel-toggle:not([hidden]) {
    display: inline-flex;
    grid-area: 1 / 3;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    margin: -9px -10px -9px -8px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: none;
    color: inherit;
    cursor: pointer;
  }
  .re-lightbox-style-panel-toggle::before { content: ""; width: 8px; height: 8px; margin-top: 4px; border-top: 1.5px solid; border-left: 1.5px solid; rotate: 45deg; transition: rotate 240ms ease, margin 240ms ease; }
  .re-lightbox-style-panel[data-open] .re-lightbox-style-panel-toggle::before { margin-top: -4px; rotate: 225deg; }
  .re-lightbox-style-panel-toggle:hover { background: var(--re-lightbox-panel-hover); }
  .re-lightbox-style-panel-text, .re-lightbox-style-panel-label, .re-lightbox-style-panel-list { grid-column: 1 / -1; }
  .re-lightbox-style-panel-text { margin-top: 2px; font-size: 13px; line-height: 19px; }
  .re-lightbox-style-panel:not([data-open]) .re-lightbox-style-panel-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .re-lightbox-style-panel:not([data-open]) :is(.re-lightbox-style-panel-label, .re-lightbox-style-panel-list) { visibility: hidden; transition: visibility 0s 320ms; }
  .re-lightbox-style-panel-label { margin-top: 16px; }
}`,
  ],
];

const reducedMotion = `@media (prefers-reduced-motion: reduce) {
  .re-lightbox-style, .re-lightbox-style * { transition-duration: 0ms !important; }
}`;

/** What one style changes on top of the package's theme.css, written against the re-lightbox-style class. */
export function lightboxStyleCss(options: LightboxStyle) {
  const css = rules.filter(([when]) => when(options)).map(([, rule]) => rule);
  return css.length ? [...css, reducedMotion].join("\n\n") : "";
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
    slots.push(`    footer: ({ lightbox, document, icon${
      options.counter === "Toolbar" ? ", counter: createCounter" : ""
    } }) => {
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
      const counter = createCounter();`
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
          prev.hidden = state.count < 2;
          next.hidden = state.count < 2;
          prev.disabled = !state.canPrev;
          next.disabled = !state.canNext;`
            : ""
        }${
          options.zoomButton
            ? `
          divider.hidden = state.count < 2;`
            : ""
        }
        },
      };
    },`);
  }
  if (panel)
    slots.push(`    aside: ({ lightbox, document, counter }) => {
      const view = document.defaultView;
      const element = (tag, className, text) => {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text) node.textContent = text;
        return node;
      };
      const panel = element("aside", "re-lightbox-style-panel");
      const count = element("p", "re-lightbox-style-panel-count");
      count.append(counter());
      const summary = element("div", "re-lightbox-style-panel-summary");
      const title = element("h2");
      const text = element("p", "re-lightbox-style-panel-text");
      summary.append(title, text);
      const toggle = element("button", "re-lightbox-style-panel-toggle");
      toggle.type = "button";
      toggle.setAttribute("aria-label", "All photos");
      const label = element("p", "re-lightbox-style-panel-label", "All photos");
      const list = element("ol", "re-lightbox-style-panel-list");
      panel.append(count, summary, toggle, label, list);

      const narrow = view.matchMedia("(max-width: 719.98px)");
      const reduced = view.matchMedia("(prefers-reduced-motion: reduce)");
      const expand = (open) => {
        toggle.setAttribute("aria-expanded", String(open));
        panel.toggleAttribute("data-open", open);
        if (open) return;
        if (panel.parentElement) panel.parentElement.scrollTop = 0;
        if (list.contains(document.activeElement)) toggle.focus({ preventScroll: true });
      };
      expand(false);
      toggle.addEventListener("click", () => expand(!panel.hasAttribute("data-open")));
      const collapse = () => expand(false);
      narrow.addEventListener("change", collapse);

      let rows = [];
      let listed = "";
      const renderList = (items) => {
        const key = items.map((item) => item.src).join("\\n");
        if (key === listed) return;
        listed = key;
        rows = items.map((item, index) => {
          const row = element("button");
          row.type = "button";
          const thumbnail = item.thumbnailSrc || item.previewSrc;
          const image = element(thumbnail ? "img" : "span", "re-lightbox-style-panel-thumbnail");
          if (thumbnail) {
            image.src = thumbnail;
            image.alt = "";
            image.loading = "lazy";
          }
          row.append(image, element("span", "re-lightbox-style-panel-name", item.caption ?? ""));
          row.addEventListener("click", () => {
            lightbox.goTo(index);
            if (narrow.matches) expand(false);
          });
          element("li").append(row);
          return row;
        });
        list.replaceChildren(...rows.map((row) => row.parentElement));
      };

      const fading = [title, text];
      let shown = "";
      let index = 0;
      let heading = 1;
      let next;
      let fadeOut;
      let fadeIn = [];
      let resize;
      const fill = (state) => {
        const item = state.item;
        title.textContent = item?.caption ?? "";
        text.textContent = item?.alt ? \`\${item.alt}.\` : "";
      };
      const duration = () => {
        const value = view.getComputedStyle(panel).getPropertyValue("--re-lightbox-fade-duration").trim();
        const number = Number.parseFloat(value) || 0;
        return value.endsWith("s") && !value.endsWith("ms") ? number * 1000 : number;
      };
      const swap = () => {
        const before = summary.offsetHeight;
        resize?.cancel();
        fill(next);
        const time = duration() * 0.55;
        const after = summary.offsetHeight;
        fadeIn = fading.map((node) =>
          node.animate(
            [
              { opacity: 0, translate: \`0 \${heading * 0.4}em\` },
              { opacity: 1, translate: "none" },
            ],
            { duration: time, easing: "ease-out" },
          ),
        );
        if (before !== after && view.getComputedStyle(summary).display !== "contents")
          resize = summary.animate([{ height: \`\${before}px\` }, { height: \`\${after}px\` }], {
            duration: time,
            easing: view.getComputedStyle(panel).getPropertyValue("--re-lightbox-ease").trim() || "ease",
          });
        for (const animation of fadeOut) animation.cancel();
        fadeOut = undefined;
      };
      const show = (state) => {
        const key = \`\${state.index}/\${state.count}/\${state.item?.src}\`;
        if (key === shown) return;
        const first = !shown;
        shown = key;
        heading = state.index < index ? -1 : 1;
        index = state.index;
        next = state;
        if (fadeOut) return;
        const time = duration();
        if (first || reduced.matches || time <= 0) {
          for (const animation of fadeIn) animation.cancel();
          return fill(state);
        }
        const running = fadeIn.some((animation) => animation.playState === "running");
        const from = running ? Number(view.getComputedStyle(title).opacity) : 1;
        const moved = fading.map((node) => (running ? view.getComputedStyle(node).translate : "none"));
        for (const animation of fadeIn) animation.cancel();
        fadeOut = fading.map((node, at) =>
          node.animate([{ opacity: from, translate: moved[at] }, { opacity: 0, translate: \`0 \${heading * -0.4}em\` }], {
            duration: time * 0.45 * from,
            easing: "ease-in",
            fill: "forwards",
          }),
        );
        fadeOut[0].onfinish = swap;
      };

      return {
        node: panel,
        destroy: () => narrow.removeEventListener("change", collapse),
        update: (state) => {
          const single = state.count < 2;
          toggle.hidden = single;
          label.hidden = single;
          list.hidden = single;
          renderList(getItems().filter(Boolean));
          rows.forEach((row, index) => {
            const current = index === state.index;
            if (current === (row.getAttribute("aria-current") === "true")) return;
            if (!current) return row.removeAttribute("aria-current");
            row.setAttribute("aria-current", "true");
            if (!narrow.matches || panel.hasAttribute("data-open")) row.scrollIntoView({ block: "nearest" });
          });
          show(state);
        },
      };
    },`);
  if (slots.length)
    modules.push(`export function chromeSlots(getItems) {
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
    thumbnails: ${options.thumbnails ? '"bottom"' : "false"},${options.autoHide ? "\n    autoHide: 2000," : ""}
    strings: { dialog: "Photos" },${slots ? "\n    slots: chromeSlots(getItems)," : ""}
  });
`;
}

export function lightboxCode(options: LightboxStyle) {
  const css = lightboxStyleCss(options);
  const thumbnailed = options.thumbnails || options.caption === "Panel";
  const chromeSource = lightboxChrome(options);
  const slots = chromeSource?.includes("chromeSlots") ?? false;
  const names = slots ? ["chromeSlots"] : [];
  const lines = (items: string) => [
    ...(options.thumbnails ? ['thumbnails: "bottom",'] : []),
    ...(options.autoHide ? ["autoHide: 2000,"] : []),
    ...(css ? [`className: "${LIGHTBOX_STYLE_CLASS}",`] : []),
    ...(slots ? [`slots: chromeSlots(${items}),`] : []),
  ];
  const call = (indent: string, items: string) =>
    lines(items).length
      ? `({\n${lines(items)
          .map((line) => `${indent}${line}`)
          .join("\n")}\n${indent.slice(2)}})`
      : "()";
  const imports = `import "@reuse-sh/lightbox/base.css";
import "@reuse-sh/lightbox/theme.css";${css ? '\nimport "./lightbox-style.css";' : ""}${names.length ? `\nimport { ${names.join(", ")} } from "./lightbox-chrome.js";` : ""}`;
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
const lightbox = createLightbox${call("  ", "items")};
const unbind = bindLightboxGallery(gallery, lightbox, { item });`,
    react: `"use client";

import type { LightboxItem } from "@reuse-sh/lightbox";
import { useLightbox } from "@reuse-sh/lightbox/react";
import { useRef } from "react";
${imports}

const photos: LightboxItem[] = [
  { src: "/photos/coast.jpg", alt: "A rocky coast", caption: "Coast"${thumbnailed ? ', thumbnailSrc: "/photos/coast.jpg"' : ""} },
  { src: "/photos/forest.jpg", alt: "A path through a forest", caption: "Forest"${thumbnailed ? ', thumbnailSrc: "/photos/forest.jpg"' : ""} },
];

export function Gallery() {
  const lightbox = useLightbox${call("    ", "() => photos")};
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
    css,
    chrome: chromeSource,
    cleanup: "unbind();\nlightbox.destroy();",
  };
}
