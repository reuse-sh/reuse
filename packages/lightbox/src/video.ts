import type { LightboxContent, LightboxMounted } from "./index.js";

// A player starts by itself only the first time it is current, so a return leaves it as it was.
export function playerOf(
  media: HTMLMediaElement,
  autoplay: boolean,
  signal: AbortSignal,
): LightboxMounted {
  let pending = autoplay;
  media.addEventListener("play", () => (pending = false), { signal });
  return {
    interactive: true,
    ready: new Promise((resolve) => {
      media.addEventListener("loadeddata", resolve, { once: true, signal });
      media.addEventListener("error", resolve, { once: true, signal });
    }),
    pause: () => media.pause(),
    resume() {
      if (!pending) return;
      pending = false;
      // A browser that refuses sound may still play muted.
      media
        .play()
        .catch(() => {
          media.muted = true;
          return media.play();
        })
        .catch(() => {});
    },
    unmount() {
      media.pause();
      media.removeAttribute("src");
      media.load();
      media.remove();
    },
  };
}

export function video(): LightboxContent {
  return {
    type: "video",
    mount(container, { item, signal, autoplay }) {
      const element = container.ownerDocument.createElement("video");
      element.className = "re-lightbox-video";
      element.controls = true;
      element.playsInline = true;
      element.preload = "metadata";
      const poster = item.video?.poster || item.previewSrc;
      if (poster) element.poster = poster;
      element.src = item.video?.src ?? item.src ?? "";
      if (item.alt) element.setAttribute("aria-label", item.alt);
      container.append(element);
      return playerOf(element, autoplay, signal);
    },
  };
}
