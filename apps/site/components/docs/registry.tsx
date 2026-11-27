import { type Library, lightboxShareSlot } from "@reuse-sh/catalog";
import type { ReactNode } from "react";
import { Kbd } from "@/components/ui/typography";
import { CodeBlock } from "../shell/code-block";
import { DeviceCheck } from "./device-check";
import type { DocIconName } from "./doc-icon";
import { LightboxGesturesPage } from "./lightbox-gestures-page";
import { LightboxLooksPage } from "./lightbox-looks-page";
import { ApiTable, C, Keys, Principles, Section, Text } from "./parts";

const icons: Record<string, DocIconName[]> = {
  lightbox: [
    "touch",
    "resize",
    "layers",
    "zoom",
    "keyboard",
    "code",
    "touch",
    "chevrons",
    "layers",
    "resize",
    "feather",
    "zoom",
    "timer",
    "keyboard",
  ],
  carousel: [
    "touch",
    "cursor",
    "chevrons",
    "timer",
    "keyboard",
    "code",
    "code",
    "code",
    "chevrons",
    "cursor",
    "doc",
  ],
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
  "cursor-preview": [
    "doc",
    "cursor",
    "feather",
    "layers",
    "zoom",
    "minus",
    "timer",
    "resize",
    "touch",
    "keyboard",
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
  "justified-gallery": [
    "resize",
    "zoom",
    "doc",
    "feather",
    "chevrons",
    "minus",
    "code",
  ],
  masonry: ["feather", "layers", "resize", "keyboard", "minus", "code"],
  "demo-stage": [
    "cursor",
    "share",
    "keyboard",
    "feather",
    "chevrons",
    "timer",
    "resize",
    "minus",
    "keyboard",
    "touch",
    "doc",
    "code",
  ],
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
  if (slug === "cursor-preview")
    return (
      <Keys>
        Move down the list with a mouse or trackpad. On a touch screen each row
        shows its own picture.
      </Keys>
    );
  if (slug === "justified-gallery")
    return (
      <Keys>
        Resize the window. Rows scale with it and break again only when one
        leaves its height range.
      </Keys>
    );
  if (slug === "masonry")
    return (
      <Keys>
        Resize the window. The columns go from three to one, and the cards keep
        their reading order.
      </Keys>
    );
  if (slug === "demo-stage")
    return (
      <Keys>
        Point at the demo to try it yourself. Move away and it plays again from
        the start.
      </Keys>
    );
  return null;
}
export function docBody(
  library: Library,
  path: string,
  example?: ReactNode,
): ReactNode {
  if (path === "api" && library.slug === "lightbox")
    return (
      <>
        <ApiTable rows={library.api} />
        <Section title="A share button in a slot">
          <Text>
            Share is not built in. This <C>toolbarEnd</C> slot opens the system
            share sheet where <C>navigator.share</C> exists, and otherwise a
            menu with the photo's link and a copy button from{" "}
            <C>@reuse-sh/interactions</C>. While the menu is open,{" "}
            <C>aria-expanded</C> holds the slideshow.
          </Text>
          <CodeBlock
            tabs={{ code: lightboxShareSlot, lang: "ts" }}
            caption="Share slot"
            snippetId="lightbox-share-slot"
            codeRole="setup"
          />
        </Section>
      </>
    );
  if (path === "api") return <ApiTable rows={library.api} />;
  if (path === "looks" && library.slug === "lightbox")
    return <LightboxLooksPage />;
  if (path === "gestures" && library.slug === "lightbox")
    return <LightboxGesturesPage />;
  if (path === "examples/device-check" && library.slug === "lightbox")
    return <DeviceCheck />;
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
