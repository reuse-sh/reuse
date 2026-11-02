import type { Library } from "@reuse-sh/catalog";
import type { ReactNode } from "react";
import { Kbd } from "@/components/ui/typography";
import type { DocIconName } from "./doc-icon";
import { LightboxStylePage } from "./lightbox-style-page";
import { ApiTable, Keys, Principles } from "./parts";

const icons: Record<string, DocIconName[]> = {
  lightbox: ["touch", "resize", "layers", "zoom", "keyboard", "code"],
  carousel: ["touch", "cursor", "chevrons", "timer", "keyboard", "code"],
  annotations: ["doc", "resize", "code", "layers", "share", "keyboard"],
  loaders: ["chevrons", "layers", "feather", "timer", "doc", "code"],
  shadows: ["layers", "feather", "resize", "code"],
  "easing-gradients": ["feather", "layers", "code", "chevrons", "minus", "doc"],
  "floating-tooltip": [
    "layers",
    "cursor",
    "keyboard",
    "touch",
    "doc",
    "resize",
  ],
  "copy-button": ["timer", "resize", "doc", "share", "keyboard", "layers"],
  "moving-highlight": [
    "resize",
    "keyboard",
    "layers",
    "chevrons",
    "cursor",
    "minus",
  ],
  "hold-to-confirm": ["timer", "minus", "keyboard", "cursor", "code", "layers"],
  avatars: ["feather", "doc", "plus", "code", "resize", "layers"],
};
function Hint({ slug }: { slug: string }) {
  if (slug === "carousel")
    return (
      <Keys>
        Drag with a mouse, swipe, or focus the strip and use <Kbd>←</Kbd>{" "}
        <Kbd>→</Kbd>. Images open in the lightbox.
      </Keys>
    );
  if (slug === "lightbox")
    return (
      <Keys>
        Click an image, then <Kbd>←</Kbd> <Kbd>→</Kbd> to page, <Kbd>+</Kbd>{" "}
        <Kbd>−</Kbd> to zoom, <Kbd>Esc</Kbd> to close.
      </Keys>
    );
  if (slug === "floating-tooltip")
    return (
      <Keys>
        Move along the toolbar, or use <Kbd>Tab</Kbd> to reach it and{" "}
        <Kbd>Esc</Kbd> to hide the hint.
      </Keys>
    );
  return null;
}
export function docBody(
  library: Library,
  path: string,
  example?: ReactNode,
): ReactNode {
  if (path === "api") return <ApiTable rows={library.api} />;
  if (path.startsWith("controls/") && library.slug === "lightbox")
    return <LightboxStylePage style={path.slice(9)} />;
  if (!path)
    return (
      <>
        <div className="space-y-3">
          {example}
          <Hint slug={library.slug} />
        </div>
        <Principles
          rows={library.principles}
          icons={icons[library.slug] ?? []}
        />
      </>
    );
  return null;
}
