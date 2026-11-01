import { AnnotationsDemo } from "./demos/annotations";
import { AvatarsDemo } from "./demos/avatars";
import { HighlightDemo, HoldDemo, TooltipDemo } from "./demos/interactions";
import { LoadersDemo } from "./demos/loaders";
import { CarouselDemo, GalleryDemo } from "./demos/media";
import { CardPatterns, ShadowsDemo } from "./demos/shadows";

export function LibraryDemo({
  slug,
  examples = false,
}: {
  slug: string;
  examples?: boolean;
}) {
  switch (slug) {
    case "lightbox":
      return <GalleryDemo />;
    case "carousel":
      return <CarouselDemo autoplay={examples} />;
    case "annotations":
      return <AnnotationsDemo editable={examples} />;
    case "loaders":
      return <LoadersDemo gallery={examples} />;
    case "shadows":
      return examples ? <CardPatterns /> : <ShadowsDemo />;
    case "floating-tooltip":
      return <TooltipDemo />;
    case "moving-highlight":
      return <HighlightDemo />;
    case "hold-to-confirm":
      return <HoldDemo />;
    case "avatars":
      return <AvatarsDemo />;
    default:
      return null;
  }
}
