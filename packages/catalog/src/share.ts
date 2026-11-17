/** A Share button for the lightbox's toolbarEnd slot: the system share sheet, else a menu with the link and a copy button. */
export const lightboxShareSlot = `import { createLightbox } from "@reuse-sh/lightbox";
import { createCopyButton } from "@reuse-sh/interactions";
import "@reuse-sh/interactions/styles.css";

const lightbox = createLightbox({
  slots: {
    toolbarEnd: ({ document }) => {
      let link = location.href;
      const root = document.createElement("div");
      root.className = "share";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "re-lightbox-button";
      button.textContent = "Share";
      button.setAttribute("aria-expanded", "false");
      const menu = document.createElement("div");
      menu.className = "share-menu";
      menu.hidden = true;
      const field = document.createElement("input");
      field.readOnly = true;
      field.setAttribute("aria-label", "Link to this photo");
      const copy = document.createElement("button");
      copy.type = "button";
      copy.textContent = "Copy link";
      menu.append(field, copy);
      root.append(button, menu);
      const copyButton = createCopyButton(copy, { getText: () => link });
      const toggle = (open) => {
        menu.hidden = !open;
        button.setAttribute("aria-expanded", String(open));
      };
      button.addEventListener("click", async () => {
        if (navigator.share) {
          try {
            await navigator.share({ url: link });
          } catch {}
          return;
        }
        toggle(menu.hidden);
        if (!menu.hidden) field.select();
      });
      return {
        node: root,
        update: (state) => {
          const photo = new URL(location.href);
          photo.hash = \`photo-\${state.index + 1}\`;
          link = photo.href;
          field.value = link;
          if (!state.isOpen) toggle(false);
        },
        destroy: () => copyButton.destroy(),
      };
    },
  },
});`;
