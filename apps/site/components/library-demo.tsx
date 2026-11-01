import { AnnotationsDemo } from "./demos/annotations";
import { AvatarsDemo } from "./demos/avatars";
import { CopyDemo } from "./demos/copy";
import { GradientsDemo } from "./demos/gradients";
import { HighlightDemo, HoldDemo } from "./demos/interactions";
import { LoadersDemo } from "./demos/loaders";
import { ShadowsDemo } from "./demos/shadows";

export function LibraryDemo({ slug }: { slug: string }) {
  switch (slug) {
    case "annotations":
      return <AnnotationsDemo />;
    case "loaders":
      return <LoadersDemo />;
    case "shadows":
      return <ShadowsDemo />;
    case "moving-highlight":
      return <HighlightDemo />;
    case "hold-to-confirm":
      return <HoldDemo />;
    case "avatars":
      return <AvatarsDemo />;
    case "easing-gradients":
      return <GradientsDemo />;
    case "copy-button":
      return <CopyDemo />;
    default:
      return null;
  }
}
