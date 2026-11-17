import type { LightboxContent } from "./index.js";
import { playerOf } from "./video.js";

export function audio(): LightboxContent {
  return {
    type: "audio",
    mount(container, { item, signal, autoplay }) {
      const element = container.ownerDocument.createElement("audio");
      element.className = "re-lightbox-audio";
      element.controls = true;
      element.preload = "metadata";
      element.src = item.src ?? "";
      if (item.alt) element.setAttribute("aria-label", item.alt);
      container.append(element);
      return playerOf(element, autoplay, signal);
    },
  };
}
