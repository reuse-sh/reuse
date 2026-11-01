import { notFound } from "next/navigation";
import { CodeBlock } from "../shell/code-block";
import { lightboxCode, lightboxStyles } from "./lightbox-styles";
import { C, CodePair, Keys, Section } from "./parts";

export function LightboxStylePage({ style }: { style: string }) {
  const options = lightboxStyles[style];
  if (!options) notFound();
  const code = lightboxCode(options);
  return (
    <>
      <div className="d-frame">
        <iframe
          title={`Lightbox preview, ${style} style`}
          src={`/lightbox/controls/${style}/frame`}
          loading="lazy"
        />
      </div>
      <Keys>
        A real lightbox, open inside the frame. Use <kbd>←</kbd>
        <kbd>→</kbd> to page and <kbd>Esc</kbd> to close it.
      </Keys>
      <section className="d-ex-code" aria-label="Code">
        <CodePair js={code.js} react={code.react} />
        <Section title={<C>lightbox-style.css</C>}>
          <CodeBlock tabs={{ code: code.css, lang: "css" }} />
        </Section>
        {code.chrome ? (
          <Section title={<C>lightbox-chrome.js</C>}>
            <CodeBlock tabs={{ code: code.chrome }} />
          </Section>
        ) : null}
      </section>
    </>
  );
}
