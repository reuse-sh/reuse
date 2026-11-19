import type { LightboxOptions } from "@reuse-sh/lightbox";
import { LIGHTBOX_STYLE_CLASS } from "./docs/lightbox-styles";
import { lightboxIcons } from "./icons";

/** The icons and class every lightbox on the site opens with; lightboxLookCss styles the class. */
export const siteLightbox = {
  icons: lightboxIcons,
  className: LIGHTBOX_STYLE_CLASS,
} satisfies LightboxOptions;
