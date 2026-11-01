import "./styles/home.css";
import Link from "next/link";
import { CopyPromptButton } from "../components/home/copy-prompt-button";
import { PhotoStrip } from "../components/home/photo-strip";
import { SmallDemos } from "../components/home/small-demos";
import { Icon, type IconName } from "../components/icons";

const features: [IconName, string, string][] = [
  [
    "code",
    "Any stack.",
    "A browser module binds to the markup you already have. React gets a hook; Vue, Svelte and plain pages call the module directly.",
  ],
  [
    "check",
    "Clean exits.",
    "destroy() removes every listener and puts back every style it touched, so a part can come and go with a route.",
  ],
  [
    "shadows",
    "Scoped styles.",
    "Classes start with reuse- and values live in --reuse- custom properties. Nothing reaches the rest of your page.",
  ],
  [
    "moving-highlight",
    "Keyboard first.",
    "Native dialogs, buttons and focus order. Every part works without a pointer and with a screen reader.",
  ],
  [
    "loaders",
    "Calm motion.",
    "Springs that keep their speed when you interrupt them, and no motion at all when the system asks for less.",
  ],
  [
    "book",
    "Written for agents.",
    "Each library ships a guide with the markup it expects, its options and the checks to run, so your agent gets it right the first time.",
  ],
];

export default function HomePage() {
  return (
    <main id="main">
      <section className="c-col h-open">
        <h1 className="c-display">Parts you stop writing twice</h1>
        <p className="h-prose">
          Reuse is a small set of interface parts: a lightbox, a carousel,
          tooltips, loaders and a few more. Each one is a plain browser module
          with a thin React wrapper, so the same part runs in React, Vue,
          Svelte, a WordPress theme or a static page.
        </p>
        <p className="h-prose">
          It is also a set of rules every part follows: native browser behavior
          first, styles scoped to reuse- classes, full cleanup on destroy,
          keyboard and reduced motion covered. Each library comes with a guide
          your coding agent reads before it writes code, so what it builds keeps
          those rules on any stack.
        </p>
        <div className="h-actions">
          <CopyPromptButton />
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
          Each card runs the real module. Point along the toolbar, move through
          the menu, press and hold.
        </p>
        <SmallDemos />
      </section>
      <section className="c-sec" aria-labelledby="h-carousel">
        <div className="c-col">
          <h2 className="c-h2" id="h-carousel">
            Carousel
          </h2>
          <p className="c-sub">
            Drag it with a mouse or scroll it with a trackpad. Every image opens
            in the lightbox.
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
          {features.map(([icon, title, text]) => (
            <li key={title}>
              <Icon name={icon} size={22} />
              <p>
                <b>{title}</b> {text}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
