import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon";
import ZoomInAreaIcon from "@hugeicons/core-free-icons/ZoomInAreaIcon";
import { photos } from "../../lib/photos";
import { arrowPaths } from "../lucide-arrows";
import { buttonVariants } from "../ui/button";
import {
  LIGHTBOX_STYLE_CLASS,
  type LightboxStyle,
  lightboxChrome,
  lightboxStyleCss,
} from "./lightbox-styles";

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

const script = (chrome: string | null) => `

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

${chrome ?? ""}

    function teardown() {
      unsubscribe?.();
      lightbox?.destroy();
      unsubscribe = lightbox = null;
    }

    function onState(state) {
      if (state.isOpen) {
        index = state.index;
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
      lightbox = createLightbox({
        className,
        icons: ICONS,
        thumbnails: options.thumbnails,
        label: "Photos",
        padding: window.innerWidth < 560 ? 12 : 24,
      });
      withoutFocus(() => lightbox.open(items, index));
      const dialog = document.querySelector("dialog.${LIGHTBOX_STYLE_CLASS}");
      if (!animate) for (const animation of dialog.getAnimations({ subtree: true })) animation.finish();
      ${chrome ? "addChrome(lightbox, items);" : ""}
      unsubscribe = lightbox.subscribe(onState);
    }

    again.addEventListener("click", () => render({ animate: true }));

    render();
    document.querySelector(".f-fallback").style.display = "none";
  `;

/** A standalone page that opens a real lightbox in one control style, for an iframe preview. */
export function lightboxFrame(options: LightboxStyle) {
  const data = JSON.stringify({
    options,
    className: LIGHTBOX_STYLE_CLASS,
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
<link rel="stylesheet" href="/styles/site.css">
<script type="importmap">{"imports":{"@reuse-sh/carousel":"/modules/carousel/index.js","@reuse-sh/lightbox":"/modules/lightbox/index.js"}}</script>
<style>${lightboxStyleCss(options)}</style>
</head>
<body class="grid h-screen min-h-0 place-items-center overflow-hidden bg-secondary font-sans text-ui">
<main class="f-fallback grid max-h-full w-full grid-cols-2 gap-3 overflow-auto p-4">${photos.map((photo) => `<a href="${photo.src}"><img src="${photo.src}" alt="${photo.alt}" width="${photo.width}" height="${photo.height}" class="block h-auto w-full"></a>`).join("")}</main>
<button type="button" class="f-again ${buttonVariants({ variant: "surface", size: "default" })}" hidden>Open again</button>
<script type="application/json" id="frame-data">${data}</script>
<script type="module">${script(lightboxChrome(options))}</script>
</body>
</html>
`;
}
