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

export default function ToolsPage() {
  return (
    <main id="main" className="c-col h-page">
      <h1 className="c-h1">Tools we trust</h1>
      <p className="h-lead">
        Reuse covers a few parts. For the rest of an interface we reach for
        these. Each one does its job well and leaves the look to you.
      </p>
      {toolGroups.map((group) => (
        <section key={group} aria-labelledby={groupId(group)}>
          <h2 className="c-h2 h-trust-h" id={groupId(group)}>
            {group}
          </h2>
          <MovingHighlight className="h-trust">
            {tools
              .filter((tool) => tool.group === group)
              .map((tool) => (
                <a
                  key={tool.name}
                  className="h-trust-row"
                  data-re-row=""
                  href={tool.url}
                  rel="noopener"
                >
                  <span className="h-trust-name">{tool.name}</span>
                  <span className="h-trust-reason">{tool.reason}</span>
                  <span className="h-trust-link">
                    {host(tool.url)}
                    <Icon name="arrow" size={13} />
                  </span>
                </a>
              ))}
          </MovingHighlight>
        </section>
      ))}
    </main>
  );
}
