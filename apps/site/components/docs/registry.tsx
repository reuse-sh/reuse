import type { Library } from "@reuse-sh/catalog";
import type { ReactNode } from "react";
import { snippets } from "../../lib/guides";
import { LoadersDemo } from "../demos/loaders";
import { LibraryDemo } from "../library-demo";
import {
  AnnotationsDataFormat,
  AnnotationsEditor,
  AnnotationsReviewNotes,
} from "./annotations-pages";
import { AvatarsGroups, AvatarsTeam } from "./avatars-pages";
import { basicCode } from "./basic-code";
import {
  CarouselControlsGuide,
  CarouselEditorial,
  CarouselOverview,
  CarouselProductStrip,
  CarouselStart,
} from "./carousel-pages";
import type { DocIconName } from "./doc-icon";
import { FileMenu, HighlightTabs, NavigationList } from "./highlight-islands";
import { DeleteFile, SettingsRow } from "./hold-islands";
import {
  LightboxChat,
  LightboxJournal,
  LightboxMedia,
  LightboxOverview,
  LightboxProduct,
  LightboxStart,
} from "./lightbox-pages";
import { LightboxStylePage } from "./lightbox-style-page";
import { ChatReply } from "./loaders-islands";
import {
  AgentCard,
  ApiTable,
  CodePair,
  ExampleCode,
  Features,
  Install,
  OverviewActions,
  Section,
  Text,
} from "./parts";
import {
  ShadowsCards,
  ShadowsFadeEdge,
  ShadowsScale,
  ShadowsStart,
} from "./shadows-pages";
import {
  TooltipLinks,
  TooltipOverview,
  TooltipPeople,
  TooltipShortcuts,
  TooltipStart,
} from "./tooltip-pages";

type Body = (library: Library) => ReactNode;

const basicIcons: Record<string, DocIconName[]> = {
  annotations: ["layers", "resize", "doc", "keyboard"],
  loaders: ["layers", "chevrons", "code", "timer"],
  shadows: ["layers", "feather", "code", "chevrons"],
  "moving-highlight": ["cursor", "layers", "resize", "chevrons"],
  "hold-to-confirm": ["touch", "cursor", "timer", "keyboard"],
  avatars: ["feather", "plus", "layers", "doc"],
};

function BasicOverview({ library }: { library: Library }) {
  return (
    <>
      <OverviewActions library={library} />
      <div className="d-demo">
        <LibraryDemo slug={library.slug} />
      </div>
      <Features
        rows={library.features}
        icons={basicIcons[library.slug] ?? []}
        columns={4}
      />
    </>
  );
}

function BasicStart({ library }: { library: Library }) {
  const code = snippets[library.slug];
  return (
    <>
      <Section title="Install">
        <Install library={library} />
      </Section>
      <Section title="Use it">
        <Text>
          The browser module works without a framework. In React, the component
          creates the same controller when it mounts and destroys it when it
          unmounts.
        </Text>
        <CodePair js={code.native} react={code.react} />
      </Section>
    </>
  );
}

/** A live example followed by its code. */
function example(demo: ReactNode, code: keyof typeof basicCode) {
  const [js, react] = basicCode[code];
  return () => (
    <>
      {demo}
      <ExampleCode js={js} react={react} />
    </>
  );
}

const shared: Record<string, Body> = {
  api: (library) => <ApiTable rows={library.api} />,
  agent: (library) => <AgentCard library={library} />,
};

const bodies: Record<string, Record<string, Body>> = {
  lightbox: {
    "": (library) => <LightboxOverview library={library} />,
    "getting-started": (library) => <LightboxStart library={library} />,
    "examples/product": () => <LightboxProduct />,
    "examples/chat": () => <LightboxChat />,
    "examples/journal": () => <LightboxJournal />,
    "guides/media": () => <LightboxMedia />,
  },
  carousel: {
    "": (library) => <CarouselOverview library={library} />,
    "getting-started": (library) => <CarouselStart library={library} />,
    "examples/product-strip": () => <CarouselProductStrip />,
    "examples/editorial": () => <CarouselEditorial />,
    "guides/controls": () => <CarouselControlsGuide />,
  },
  "floating-tooltip": {
    "": (library) => <TooltipOverview library={library} />,
    "getting-started": (library) => <TooltipStart library={library} />,
    "examples/shortcuts": () => <TooltipShortcuts />,
    "examples/links": () => <TooltipLinks />,
    "examples/people": () => <TooltipPeople />,
  },
  annotations: {
    "examples/review-notes": () => <AnnotationsReviewNotes />,
    "examples/editor": () => <AnnotationsEditor />,
    "guides/data-format": () => <AnnotationsDataFormat />,
  },
  avatars: {
    "examples/team": () => <AvatarsTeam />,
    "examples/groups": () => <AvatarsGroups />,
  },
  loaders: {
    "examples/chat-reply": example(<ChatReply />, "chatReply"),
    "examples/figures": example(<LoadersDemo gallery />, "figures"),
  },
  shadows: {
    "getting-started": (library) => <ShadowsStart library={library} />,
    "examples/cards": () => <ShadowsCards />,
    "examples/scale": () => <ShadowsScale />,
    "guides/fade-edge": () => <ShadowsFadeEdge />,
  },
  "moving-highlight": {
    "examples/menu": example(<FileMenu />, "menu"),
    "examples/navigation": example(<NavigationList />, "navigation"),
    "examples/tabs": example(<HighlightTabs />, "tabs"),
  },
  "hold-to-confirm": {
    "examples/delete-file": example(<DeleteFile />, "deleteFile"),
    "examples/settings": example(<SettingsRow />, "settings"),
  },
};

const basic: Record<string, Body> = {
  "": (library) => <BasicOverview library={library} />,
  "getting-started": (library) => <BasicStart library={library} />,
};

/** The body of one documentation page, or null when the site has none for it. */
export function docBody(library: Library, path: string): ReactNode {
  if (path.startsWith("controls/") && library.slug === "lightbox")
    return <LightboxStylePage style={path.slice("controls/".length)} />;
  const body =
    bodies[library.slug]?.[path] ?? shared[path] ?? basic[path] ?? null;
  return body ? body(library) : null;
}
