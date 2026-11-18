import type { LightboxContent, LightboxMounted } from "./index.js";

export interface FrameOptions {
  /** Added as the iframe's sandbox attribute. */
  sandbox?: string;
}

// No top navigation and no popups for a page from another origin.
const CROSS_ORIGIN_SANDBOX =
  "allow-scripts allow-same-origin allow-forms allow-presentation";

export function frameOf(
  container: HTMLElement,
  src: string,
  title: string,
  sandbox: string | undefined,
  crossOrigin?: string,
) {
  const document = container.ownerDocument;
  const frame = document.createElement("iframe");
  frame.className = "re-lightbox-iframe";
  frame.allow = "autoplay; fullscreen; picture-in-picture";
  frame.referrerPolicy = "strict-origin-when-cross-origin";
  frame.loading = "lazy";
  frame.title = title;
  // Only web pages load: a javascript: URL would run in the host page.
  let url = "about:blank";
  if (src.trim())
    try {
      const parsed = new URL(src, document.baseURI);
      if (/^https?:$/.test(parsed.protocol)) url = parsed.href;
      if (parsed.origin !== document.location.origin) sandbox ??= crossOrigin;
    } catch {}
  if (sandbox != null) frame.setAttribute("sandbox", sandbox);
  frame.src = url;
  container.append(frame);
  return frame;
}

export function loaded(frame: HTMLIFrameElement, signal: AbortSignal) {
  return new Promise((resolve) =>
    frame.addEventListener("load", resolve, { once: true, signal }),
  );
}

// A page in a frame has no pause, so the viewer unmounts it when another slide is current.
export function iframe(options: FrameOptions = {}): LightboxContent {
  return {
    type: "iframe",
    mount(container, { item, signal }): LightboxMounted {
      const frame = frameOf(
        container,
        item.embed ?? item.src ?? "",
        item.alt ?? "",
        options.sandbox,
        CROSS_ORIGIN_SANDBOX,
      );
      return {
        interactive: true,
        ready: loaded(frame, signal),
        unmount: () => frame.remove(),
      };
    },
  };
}
