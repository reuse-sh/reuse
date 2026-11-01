/**
 * Lightbox control styles. The package draws its own buttons, counter, caption and
 * thumbnails; each style rearranges and restyles them with page CSS on a class the
 * lightbox receives through its className option (see lightbox-frame.ts).
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

export function lightboxClassName(options: LightboxStyle) {
  return [
    "lightbox",
    `arrows-${options.arrows.toLowerCase()}`,
    `counter-${options.counter.toLowerCase()}`,
    `caption-${options.caption.toLowerCase()}`,
    `backdrop-${options.backdrop.toLowerCase()}`,
    options.autoHide && "hide-idle",
    options.zoomButton && "zoom-button",
  ]
    .filter(Boolean)
    .join(" ");
}

export function lightboxCode(options: LightboxStyle) {
  const lines = [
    ...(options.thumbnails ? ["thumbnails: true,"] : []),
    `className: "${lightboxClassName(options)}",`,
  ];
  const body = (indent: string) =>
    lines.map((line) => `${indent}${line}`).join("\n");
  return {
    js: `import { createLightbox } from "@reuse-sh/lightbox";
import "@reuse-sh/lightbox/styles.css";

const lightbox = createLightbox({
${body("  ")}
});

lightbox.open(photos, 0);`,
    react: `import { useLightbox } from "@reuse-sh/lightbox/react";
import "@reuse-sh/lightbox/styles.css";

export function Gallery({ photos }) {
  const lightbox = useLightbox({
${body("    ")}
  });
  return photos.map((photo, index) => (
    <button key={photo.src} onClick={() => lightbox.open(photos, index)}>
      <img src={photo.src} alt={photo.alt} />
    </button>
  ));
}`,
  };
}
