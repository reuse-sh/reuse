import { libraries } from "@reuse-sh/catalog";
import { MovingHighlight } from "@reuse-sh/interactions/react";
import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { Heading, Text } from "@/components/ui/typography";
import { PromptButton } from "../../components/copy-control";
import { Icon, type IconName } from "../../components/icons";
import { SiteFrame } from "../../components/site-frame";
import { type DocSearch, frameworkFrom } from "../../lib/framework";
import { agentPrompt } from "../../lib/prompt";

export const metadata: Metadata = { title: "Agent guides" };

const steps = [
  [
    "Try it on the site.",
    "Each library page opens with the working part and its principles. You see the rules at work before anyone writes code.",
  ],
  [
    "Hand your agent the guide.",
    "Paste the prompt or a guide link. The guide starts with the principles your agent must keep, then the markup, the options and the cleanup.",
  ],
  [
    "Check that it kept them.",
    "Every guide ends with checks for keyboard, narrow screens, reduced motion and teardown. Ask your agent to run them and show you that each principle still holds.",
  ],
];

export default async function AgentGuidesPage({
  searchParams,
}: {
  searchParams: Promise<DocSearch>;
}) {
  const framework = frameworkFrom((await searchParams).framework);
  return (
    <SiteFrame framework={framework}>
      <main id="main" className="mx-auto w-page pt-7 sm:pt-14">
        <Heading variant="page">Agent guides</Heading>
        <Text
          variant="lead"
          className="mt-2.5 max-w-prose text-muted-foreground"
        >
          Every library has a guide written for coding agents. It opens with the
          library's principles, and your agent must keep them on any framework.
          Give it the link and say where the part should go.
        </Text>
        <div className="mt-9 flex flex-wrap items-center gap-2">
          <PromptButton prompt={agentPrompt} />
        </div>
        <ol className="mt-10 grid gap-3 md:grid-cols-3">
          {steps.map(([title, text], index) => (
            <li key={title}>
              <Card className="h-full">
                <CardContent padding="compact" className="px-5 pt-4.5 pb-5">
                  <span className="mb-3.5 grid size-6 place-items-center rounded-full bg-card text-caption font-medium tabular-nums shadow-control md:mb-20">
                    {index + 1}
                  </span>
                  <Text className="text-ui leading-6">
                    <b className="block">{title}</b> {text}
                  </Text>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
        <Heading className="mt-16">Guides</Heading>
        <MovingHighlight className="moving-highlight -mx-3 mt-3.5 grid">
          {libraries.map((library) => (
            <a
              key={library.slug}
              className="group flex min-h-11 flex-wrap items-center gap-x-3.5 rounded-control px-3 py-2.5 focus-visible:-outline-offset-2"
              data-re-row=""
              href={`/${library.slug}/guide.md`}
            >
              <Icon
                name={library.slug as IconName}
                size={18}
                className="shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
              />
              <span className="flex-1 font-medium sm:w-42 sm:flex-none">
                {library.name}
              </span>
              <code className="w-full overflow-hidden pl-8 text-ellipsis whitespace-nowrap font-mono text-code text-muted-foreground sm:w-auto sm:flex-1 sm:pl-0">
                /{library.slug}/guide.md
              </code>
            </a>
          ))}
        </MovingHighlight>
        <Text className="mt-4">
          The index of every guide is at{" "}
          <a
            className="text-foreground underline decoration-border underline-offset-4 hover:decoration-current"
            href="/llms.txt"
          >
            /llms.txt
          </a>
          .
        </Text>
      </main>
    </SiteFrame>
  );
}
