import { AnnotationsDemo } from "./demos/annotations";
import { AvatarsDemo } from "./demos/avatars";
import { HighlightDemo, HoldDemo } from "./demos/interactions";
import { LoadersDemo } from "./demos/loaders";
import { CardPatterns, ShadowsDemo } from "./demos/shadows";

export function LibraryDemo({
  slug,
  examples = false,
}: {
  slug: string;
  examples?: boolean;
}) {
  switch (slug) {
    case "annotations":
      return <AnnotationsDemo editable={examples} />;
    case "loaders":
      return <LoadersDemo gallery={examples} />;
    case "shadows":
      return examples ? <CardPatterns /> : <ShadowsDemo />;
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
