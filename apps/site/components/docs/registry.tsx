import type { Library } from "@reuse-sh/catalog";
import type { ReactNode } from "react";
import { AnnotationsDataFormat } from "./annotations-pages";
import { CarouselOverview } from "./carousel-pages";
import type { DocIconName } from "./doc-icon";
import { GradientsCurves } from "./gradients-pages";
import { LightboxMedia, LightboxOverview } from "./lightbox-pages";
import { LightboxStylePage } from "./lightbox-style-page";
import { ApiTable, OverviewActions, Principles } from "./parts";
import { TooltipOverview } from "./tooltip-pages";

const icons: Record<string, DocIconName[]> = {
  annotations: ["doc", "resize", "code", "layers", "share", "keyboard"],
  loaders: ["chevrons", "layers", "feather", "timer", "doc", "code"],
  shadows: ["layers", "feather", "resize", "code"],
  "easing-gradients": ["feather", "layers", "code", "chevrons", "minus", "doc"],
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

export function docBody(
  library: Library,
  path: string,
  example?: ReactNode,
): ReactNode {
  if (path === "api") return <ApiTable rows={library.api} />;
  if (path.startsWith("controls/") && library.slug === "lightbox")
    return <LightboxStylePage style={path.slice(9)} />;
  if (!path) {
    if (library.slug === "lightbox")
      return <LightboxOverview library={library} example={example} />;
    if (library.slug === "carousel")
      return <CarouselOverview library={library} example={example} />;
    if (library.slug === "floating-tooltip")
      return <TooltipOverview library={library} example={example} />;
    return (
      <>
        <OverviewActions library={library} />
        {example}
        <Principles
          rows={library.principles}
          icons={icons[library.slug] ?? []}
        />
      </>
    );
  }
  if (library.slug === "lightbox" && path === "guides/media")
    return <LightboxMedia />;
  if (library.slug === "annotations" && path === "guides/data-format")
    return <AnnotationsDataFormat />;
  if (library.slug === "easing-gradients" && path === "guides/easing-curves")
    return <GradientsCurves example={example} />;
  return null;
}
