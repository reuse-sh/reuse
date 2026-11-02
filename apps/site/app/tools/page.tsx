import { toolGroups, tools } from "@reuse-sh/catalog";
import { MovingHighlight } from "@reuse-sh/interactions/react";
import type { Metadata } from "next";
import { Heading, Text } from "@/components/ui/typography";
import { Icon } from "../../components/icons";
import { SiteFrame } from "../../components/site-frame";
import { type DocSearch, frameworkFrom } from "../../lib/framework";

export const metadata: Metadata = {
  title: "Tools we trust",
  description:
    "The interface tools we use beside Reuse: icons, components, motion and code highlighting.",
};

const host = (url: string) => new URL(url).host;
const groupId = (group: string) =>
  `tools-${group.toLowerCase().replaceAll(" ", "-")}`;

export default async function ToolsPage({
  searchParams,
}: {
  searchParams: Promise<DocSearch>;
}) {
  const framework = frameworkFrom((await searchParams).framework);
  return (
    <SiteFrame framework={framework}>
      <main id="main" className="mx-auto w-page pt-7 sm:pt-14">
        <Heading variant="page">Tools we trust</Heading>
        <Text
          variant="lead"
          className="mt-2.5 max-w-prose text-muted-foreground"
        >
          Reuse covers a few parts. For the rest of an interface we reach for
          these. Each one does its job well and leaves the look to you.
        </Text>
        {toolGroups.map((group) => (
          <section key={group} aria-labelledby={groupId(group)}>
            <Heading className="mt-14" id={groupId(group)}>
              {group}
            </Heading>
            <MovingHighlight className="moving-highlight -mx-3 mt-2.5 grid">
              {tools
                .filter((tool) => tool.group === group)
                .map((tool) => (
                  <a
                    key={tool.name}
                    className="group grid grid-cols-2 items-baseline gap-x-5 gap-y-1 rounded-control p-3 focus-visible:-outline-offset-2 sm:flex"
                    data-re-row=""
                    href={tool.url}
                    rel="noopener"
                  >
                    <span className="font-medium sm:w-42 sm:shrink-0">
                      {tool.name}
                    </span>
                    <span className="col-span-2 row-start-2 text-body text-pretty text-muted-foreground sm:row-start-auto sm:flex-1">
                      {tool.reason}
                    </span>
                    <span className="col-start-2 row-start-1 inline-flex items-center justify-self-end gap-1 text-label whitespace-nowrap text-subtle-foreground transition-colors group-hover:text-foreground sm:col-start-auto sm:row-start-auto sm:shrink-0">
                      {host(tool.url)}
                      <Icon name="arrow" size={13} />
                    </span>
                  </a>
                ))}
            </MovingHighlight>
          </section>
        ))}
      </main>
    </SiteFrame>
  );
}
