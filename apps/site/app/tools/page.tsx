import { SiteFrame } from "../../components/site-frame";
import { type DocSearch, frameworkFrom } from "../../lib/framework";
import "../styles/home.css";
import { toolGroups, tools } from "@reuse-sh/catalog";
import { MovingHighlight } from "@reuse-sh/interactions/react";
import type { Metadata } from "next";
import { Icon } from "../../components/icons";

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
      <main id="main" className="c-col h-page pt-[56px]">
        <h1 className="c-h1">Tools we trust</h1>
        <p className="h-lead max-w-[600px] mt-[10px] text-[17px] leading-[27px] text-[color:var(--prose)] text-pretty">
          Reuse covers a few parts. For the rest of an interface we reach for
          these. Each one does its job well and leaves the look to you.
        </p>
        {toolGroups.map((group) => (
          <section key={group} aria-labelledby={groupId(group)}>
            <h2 className="c-h2 h-trust-h mt-[56px]" id={groupId(group)}>
              {group}
            </h2>
            <MovingHighlight className="h-trust">
              {tools
                .filter((tool) => tool.group === group)
                .map((tool) => (
                  <a
                    key={tool.name}
                    className="h-trust-row grid [grid-template-columns:168px_minmax(0,_1fr)_auto] items-baseline [gap:4px_20px] p-[12px] rounded-[10px]"
                    data-re-row=""
                    href={tool.url}
                    rel="noopener"
                  >
                    <span className="h-trust-name font-[540]">{tool.name}</span>
                    <span className="h-trust-reason text-[color:var(--prose)] text-[14.5px] leading-[23px] text-pretty">
                      {tool.reason}
                    </span>
                    <span className="h-trust-link inline-flex items-center gap-[3px] text-[color:var(--mute)] text-[13px] whitespace-nowrap [transition:color_150ms_ease]">
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
