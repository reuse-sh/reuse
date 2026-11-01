import type { Library } from "@reuse-sh/catalog";
import type { ReactNode } from "react";
import { snippets } from "../../lib/guides";
import { LibraryDemo } from "../library-demo";
import {
  CarouselControlsGuide,
  CarouselEditorial,
  CarouselOverview,
  CarouselProductStrip,
  CarouselStart,
} from "./carousel-pages";
import type { DocIconName } from "./doc-icon";
import {
  LightboxChat,
  LightboxJournal,
  LightboxMedia,
  LightboxOverview,
  LightboxProduct,
  LightboxStart,
} from "./lightbox-pages";
import { LightboxStylePage } from "./lightbox-style-page";
import {
  AgentCard,
  ApiTable,
  CodePair,
  Features,
  Install,
  OverviewActions,
  Section,
  Text,
} from "./parts";
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
  shadows: ["layers", "feather", "code", "doc"],
  "moving-highlight": ["cursor", "keyboard", "resize", "chevrons"],
  "hold-to-confirm": ["touch", "keyboard", "timer", "cursor"],
  avatars: ["layers", "doc", "touch", "feather"],
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
          The browser module works on its own. In React, the wrapper creates the
          same controller on mount and destroys it on unmount.
        </Text>
        <CodePair js={code.native} react={code.react} />
      </Section>
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
