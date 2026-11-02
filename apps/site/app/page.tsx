import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Heading, Text } from "@/components/ui/typography";
import { SiteFrame } from "../components/site-frame";
import { type DocSearch, frameworkFrom } from "../lib/framework";
import "./styles/home.css";
import { collectionPrinciples } from "@reuse-sh/catalog";
import { PromptButton } from "../components/copy-control";
import { DocLink as Link } from "../components/docs/doc-link";
import { PhotoStrip } from "../components/home/photo-strip";
import { SmallDemos } from "../components/home/small-demos";
import { Icon, type IconName } from "../components/icons";
import { agentPrompt } from "../lib/prompt";

const icons: IconName[] = [
  "terminal",
  "check",
  "shadows",
  "moving-highlight",
  "loaders",
  "book",
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<DocSearch>;
}) {
  const framework = frameworkFrom((await searchParams).framework);
  return (
    <SiteFrame framework={framework}>
      <main id="main">
        <Container className="pt-16 sm:pt-32">
          <Heading variant="display" className="max-w-prose max-sm:text-4xl">
            Parts you stop writing twice
          </Heading>
          <Text className="mt-5 max-w-xl text-base leading-7 first-of-type:mt-7">
            Reuse is a set of interface parts we use across many products: a
            lightbox, a carousel, tooltips, loaders and a few more. What carries
            from one product to the next is not the code, but the rules behind
            it.
          </Text>
          <Text className="mt-5 max-w-xl text-base leading-7 first-of-type:mt-7">
            Every part comes with a short list of principles: how it scrolls,
            where focus goes, what it cleans up, how it moves. The code is one
            way to keep them. Your coding agent reads them before it builds, so
            the part behaves the same in React, Vue, plain JavaScript or
            anything else.
          </Text>
          <div className="mt-9 flex flex-wrap items-center gap-2">
            <PromptButton prompt={agentPrompt} />
            <Link
              className={buttonVariants({ variant: "ghost" })}
              href="/lightbox"
            >
              Start with Lightbox
            </Link>
          </div>
        </Container>
        <section
          className="mx-auto mt-section w-page"
          aria-labelledby="h-small"
        >
          <Heading id="h-small">The small ones</Heading>
          <Text className="mt-1.5 max-w-xl">
            Each card runs the real module. Point along the toolbar, move
            through the menu, press and hold.
          </Text>
          <SmallDemos />
        </section>
        <section className="mt-section" aria-labelledby="h-carousel">
          <div className="mx-auto w-page">
            <Heading id="h-carousel">Carousel</Heading>
            <Text className="mt-1.5 max-w-xl">
              Drag it with a mouse or scroll it with a trackpad. Every image
              opens in the lightbox.
            </Text>
          </div>
          <PhotoStrip />
        </section>
        <section
          className="mx-auto mt-section w-page"
          aria-labelledby="h-rules"
        >
          <Heading id="h-rules">The rules every part follows</Heading>
          <Text className="mt-1.5 max-w-xl">
            They are why a part written once keeps working in the next project,
            whatever it runs on.
          </Text>
          <ul className="mt-10 grid gap-x-8 gap-y-9 sm:grid-cols-2 md:grid-cols-3">
            {collectionPrinciples.map(([title, text], index) => (
              <li key={title}>
                <Icon
                  name={icons[index] ?? "code"}
                  size={22}
                  className="mb-3.5 text-foreground"
                />
                <Text className="text-ui leading-6">
                  <b>{title}.</b> {text}
                </Text>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </SiteFrame>
  );
}
