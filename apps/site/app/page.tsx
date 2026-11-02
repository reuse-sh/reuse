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
        <section className="c-col h-open pt-[128px]">
          <h1 className="c-display">Parts you stop writing twice</h1>
          <p className="h-prose max-w-[580px] mt-[18px] text-[16px] leading-[27px] text-[color:var(--prose)] text-pretty">
            Reuse is a set of interface parts we use across many products: a
            lightbox, a carousel, tooltips, loaders and a few more. What carries
            from one product to the next is not the code, but the rules behind
            it.
          </p>
          <p className="h-prose max-w-[580px] mt-[18px] text-[16px] leading-[27px] text-[color:var(--prose)] text-pretty">
            Every part comes with a short list of principles: how it scrolls,
            where focus goes, what it cleans up, how it moves. The code is one
            way to keep them. Your coding agent reads them before it builds, so
            the part behaves the same in React, Vue, plain JavaScript or
            anything else.
          </p>
          <div className="h-actions flex flex-wrap items-center gap-[8px] mt-[36px]">
            <PromptButton prompt={agentPrompt} />
            <Link className="c-btn-quiet" href="/lightbox">
              Start with Lightbox
            </Link>
          </div>
        </section>
        <section className="c-col c-sec" aria-labelledby="h-small">
          <h2 className="c-h2" id="h-small">
            The small ones
          </h2>
          <p className="c-sub">
            Each card runs the real module. Point along the toolbar, move
            through the menu, press and hold.
          </p>
          <SmallDemos />
        </section>
        <section className="c-sec" aria-labelledby="h-carousel">
          <div className="c-col">
            <h2 className="c-h2" id="h-carousel">
              Carousel
            </h2>
            <p className="c-sub">
              Drag it with a mouse or scroll it with a trackpad. Every image
              opens in the lightbox.
            </p>
          </div>
          <PhotoStrip />
        </section>
        <section className="c-col c-sec" aria-labelledby="h-rules">
          <h2 className="c-h2" id="h-rules">
            The rules every part follows
          </h2>
          <p className="c-sub">
            They are why a part written once keeps working in the next project,
            whatever it runs on.
          </p>
          <ul className="c-feats c-feats-3 h-feats">
            {collectionPrinciples.map(([title, text], index) => (
              <li key={title}>
                <Icon name={icons[index] ?? "code"} size={22} />
                <p>
                  <b>{title}.</b> {text}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </SiteFrame>
  );
}
