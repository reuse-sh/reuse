import type { LightboxContent } from "./index.js";

// The slide takes a Node from item.html(); a string is never parsed as markup.
export function html(): LightboxContent {
  return {
    type: "html",
    mount(container, { item }) {
      const box = container.ownerDocument.createElement("div");
      box.className = "re-lightbox-html";
      const node = item.html?.();
      if (node) box.append(node);
      container.append(box);
      return { interactive: true, unmount: () => box.remove() };
    },
  };
}
