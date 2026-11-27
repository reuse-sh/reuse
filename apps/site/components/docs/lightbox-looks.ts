import { photos } from "../../lib/photos";
import {
  lightboxCode,
  lightboxPreviewModule,
  lightboxStyleCss,
  lightboxStyles,
} from "./lightbox-styles";
import {
  lightboxPresets,
  lightboxThemeCode,
  lightboxThemePreview,
  lightboxThemes,
} from "./lightbox-themes";

export type LookGroup = "Themes" | "Layouts" | "Recipes";

export interface Look {
  id: string;
  name: string;
  group: LookGroup;
  lead: string;
}

const themeNames: Record<string, string> = {
  dark: "Dark",
  light: "Light",
  page: "Page",
  photos: "Photos",
};

const layouts: Record<keyof typeof lightboxStyles, [string, string]> = {
  classic: [
    "Classic",
    "What theme.css ships: side arrows, a counter in the corner, and the caption under the image.",
  ],
  filmstrip: [
    "Filmstrip",
    "Thumbnails along the bottom edge. The ring in the middle marks the open photo, and dragging the strip pages through them.",
  ],
  toolbar: [
    "Toolbar",
    "Paging, the counter and zoom in one floating toolbar, as in a photos app.",
  ],
  panel: [
    "Panel",
    "Caption and details in a side panel, which moves under the image on narrow screens.",
  ],
  immersive: [
    "Immersive",
    "A dark room for the image. The controls fade after two seconds and return on any movement.",
  ],
};

export const looks: Look[] = [
  ...Object.entries(lightboxThemes).map(([id, lead]) => ({
    id,
    name: themeNames[id] ?? id,
    group: "Themes" as const,
    lead,
  })),
  ...Object.entries(layouts).map(([id, [name, lead]]) => ({
    id,
    name,
    group: "Layouts" as const,
    lead,
  })),
  ...Object.entries(lightboxPresets).map(([id, preset]) => ({
    id,
    name: preset.name,
    group: "Recipes" as const,
    lead: preset.lead,
  })),
];

/** The published code of one look: a layout's full setup, or a theme's or recipe's. */
export function lookCode(id: string) {
  const style = lightboxStyles[id];
  if (style) return { kind: "layout" as const, ...lightboxCode(style) };
  return { kind: "theme" as const, ...lightboxThemeCode(id) };
}

/** What LightboxLaunch needs to open one look. */
export function lookPreview(id: string) {
  const style = lightboxStyles[id];
  if (!style) return lightboxThemePreview(id);
  return {
    items: photos.map((photo) => ({
      src: photo.src,
      previewSrc: photo.src,
      thumbnailSrc: photo.src,
      alt: photo.alt,
      caption: photo.caption,
      width: photo.width,
      height: photo.height,
    })),
    module: lightboxPreviewModule(style),
    css: lightboxStyleCss(style),
  };
}
