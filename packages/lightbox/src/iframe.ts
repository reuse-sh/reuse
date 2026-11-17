import type { LightboxContent, LightboxMounted } from "./index.js";

export interface FrameOptions {
  /** Added as the iframe's sandbox attribute. */
  sandbox?: string;
}

export function frameOf(
  container: HTMLElement,
  src: string,
  title: string,
  { sandbox }: FrameOptions,
) {
  const frame = container.ownerDocument.createElement("iframe");
  frame.className = "re-lightbox-iframe";
  frame.allow = "autoplay; fullscreen; picture-in-picture";
  frame.referrerPolicy = "strict-origin-when-cross-origin";
  frame.loading = "lazy";
  frame.title = title;
  if (sandbox !== undefined) frame.setAttribute("sandbox", sandbox);
  // Only web pages load: a javascript: URL would run in the host page.
  let url = "about:blank";
  try {
    const parsed = new URL(src, container.ownerDocument.baseURI);
    if (parsed.protocol === "https:" || parsed.protocol === "http:")
      url = parsed.href;
  } catch {}
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
        options,
      );
      return {
        interactive: true,
        ready: loaded(frame, signal),
        unmount: () => frame.remove(),
      };
    },
  };
}
