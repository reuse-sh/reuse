import type { Library } from "@reuse-sh/catalog";
import { shadowLevels } from "@reuse-sh/shadows";
import { CardPatterns } from "../demos/shadows";
import { C, Install, Section, SingleCode, Stage, Text } from "./parts";

const importCss = `@import "@reuse-sh/shadows/styles.css";`;

const linkHtml = `<link rel="stylesheet" href="/node_modules/@reuse-sh/shadows/dist/styles.css" />`;

const startHtml = `<div class="re-card re-shadow-ring-md">
  Your content
</div>

<button class="re-shadow-xs">Order a proof</button>`;

const cardsHtml = `<div class="re-card re-card-code re-shadow-ring-sm">
  <pre><code>npm install @reuse-sh/shadows</code></pre>
  <button aria-label="Copy command">…</button>
</div>

<div class="re-card-frame">
  <div class="re-card re-card-action re-shadow-ring-xs">
    <div>
      <h3>Order a test print</h3>
      <p>A 20 × 15 cm proof of Coral sky on the same cotton paper.</p>
    </div>
    <button>Order a proof</button>
  </div>
</div>`;

const scaleHtml = `<button class="re-shadow-xs">A control</button>
<article class="re-shadow-ring-sm">A card</article>
<div class="re-shadow-ring-lg" role="menu">A menu</div>
<dialog class="re-shadow-ring-2xl">A dialog</dialog>`;

function HtmlExample({ code }: { code: string }) {
  return (
    <section className="d-ex-code" aria-label="HTML">
      <SingleCode code={code} lang="html" />
    </section>
  );
}

export function ShadowsStart({ library }: { library: Library }) {
  return (
    <>
      <Section title="Install">
        <Install library={library} />
      </Section>
      <Section title="Import the stylesheet">
        <Text>
          Import it once from your main stylesheet. A bundler also takes{" "}
          <C>import "@reuse-sh/shadows/styles.css"</C> in your entry file.
        </Text>
        <SingleCode code={importCss} lang="css" />
        <Text>Without a build step, link the file from the page.</Text>
        <SingleCode code={linkHtml} lang="html" />
      </Section>
      <Section title="Add a shadow">
        <Text>
          Put a level on any element. The ring variant replaces a border, so
          drop the one you had.
        </Text>
        <SingleCode code={startHtml} lang="html" />
      </Section>
    </>
  );
}

export function ShadowsCards() {
  return (
    <>
      <Stage>
        <div className="x-cards">
          <CardPatterns />
        </div>
      </Stage>
      <HtmlExample code={cardsHtml} />
    </>
  );
}

export function ShadowsScale() {
  return (
    <>
      {[
        ["re-shadow-*", "re-shadow-"],
        ["re-shadow-ring-*", "re-shadow-ring-"],
      ].map(([title, prefix]) => (
        <div key={title} className="x-scale">
          <h2 className="c-h3">
            <code className="d-inline">{title}</code>
          </h2>
          <Stage>
            <ul className="x-scale-list">
              {shadowLevels.map((level) => (
                <li key={level} className="x-scale-item">
                  <span className={`x-scale-tile ${prefix}${level}`} />
                  <code className="x-scale-name">{level}</code>
                </li>
              ))}
            </ul>
          </Stage>
        </div>
      ))}
      <HtmlExample code={scaleHtml} />
    </>
  );
}
