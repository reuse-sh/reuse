import { findLibrary } from "@reuse-sh/catalog";
import { notFound } from "next/navigation";
import { FrameworkOnly } from "../../lib/framework-context";
import { CodeBlock } from "../shell/code-block";
import { Card, CardContent } from "../ui/card";
import { Kbd } from "../ui/typography";
import { lightboxCode, lightboxStyles } from "./lightbox-styles";
import { C, CodePair, Install, Keys, Section, Text } from "./parts";

export function LightboxStylePage({ style }: { style: string }) {
  const options = lightboxStyles[style];
  const library = findLibrary("lightbox");
  if (!options || !library) notFound();
  const code = lightboxCode(options);
  return (
    <>
      <div className="space-y-4">
        <Card>
          <CardContent padding="none" className="overflow-hidden rounded-panel">
            <iframe
              className="block aspect-portrait w-full border-0 md:aspect-lightbox"
              title={`Lightbox preview, ${style} style`}
              src={`/lightbox/controls/${style}/frame`}
              loading="lazy"
            />
          </CardContent>
        </Card>
        <Keys>
          A real lightbox, open inside the frame. Use <Kbd>←</Kbd> <Kbd>→</Kbd>{" "}
          to page and <Kbd>Esc</Kbd> to close it.
        </Keys>
      </div>
      <section className="space-y-10" aria-label="Usage">
        <Install library={library} />
        <FrameworkOnly value="html">
          <Section title="Add the gallery markup">
            <Text>
              Keep image links so the gallery works without JavaScript. Set{" "}
              <C>data-lightbox-src</C> to the full image and replace the sample
              paths with your own photos.
            </Text>
            <CodeBlock
              tabs={{ lang: "html", code: code.html }}
              caption="Gallery markup"
              snippetId={`lightbox-${style}-markup`}
              codeRole="usage"
            />
          </Section>
        </FrameworkOnly>
        <Section title="Use the style">
          <FrameworkOnly value="react">
            <Text>
              Open the images with <C>useLightbox</C>. Keep each image inside a
              link for the no-JavaScript fallback and pass its element as{" "}
              <C>origin</C> for the opening animation. Replace the sample paths
              with your own photos.
            </Text>
          </FrameworkOnly>
          <FrameworkOnly value="html">
            <Text>
              Run this after the gallery exists. <C>bindLightboxGallery</C>{" "}
              reads the full image from <C>data-lightbox-src</C> and preserves
              modified clicks. Import the stylesheets through your app’s
              bundler.
            </Text>
          </FrameworkOnly>
          <CodePair
            js={code.js}
            react={code.react}
            snippetId={`lightbox-${style}-setup`}
            codeRole="setup"
          />
        </Section>
        <Section title="Style the controls">
          <Text>
            Save this as <C>lightbox-style.css</C> and import it after the
            package stylesheet. It scopes the selected layout to{" "}
            <C>re-lightbox-style</C>.
          </Text>
          <CodeBlock
            tabs={{ code: code.css, lang: "css" }}
            caption="lightbox-style.css"
            snippetId={`lightbox-${style}-styles`}
            codeRole="setup"
          />
        </Section>
        {code.chrome ? (
          <Section title="Add the control layout helper">
            <Text>
              Save this as <C>lightbox-chrome.js</C>. The setup above calls it
              after each opening. It{" "}
              {options.thumbnails
                ? "keeps the active thumbnail in view"
                : options.caption === "Panel"
                  ? "updates the side panel when the image changes"
                  : options.autoHide
                    ? "hides idle controls and reveals them on input"
                    : "moves the package controls into a toolbar"}
              .
            </Text>
            <CodeBlock
              tabs={{ code: code.chrome, lang: "ts" }}
              caption="lightbox-chrome.js"
              snippetId={`lightbox-${style}-chrome`}
              codeRole="setup"
            />
          </Section>
        ) : null}
        <Section title="Lifecycle and integration">
          <FrameworkOnly value="react">
            <Text>
              <C>useLightbox</C> destroys its controller when the component
              unmounts.
              {code.chrome
                ? " The helper unsubscribes when the dialog closes or the controller is destroyed."
                : ""}
            </Text>
          </FrameworkOnly>
          <FrameworkOnly value="html">
            <Text>
              Run this when your view is removed to release the gallery
              listener, dialog and scroll lock.
              {code.chrome
                ? " The helper releases its own subscription when the dialog closes or the controller is destroyed."
                : ""}
            </Text>
            <CodeBlock
              tabs={{ code: code.cleanup, lang: "ts" }}
              caption="View cleanup"
              snippetId={`lightbox-${style}-cleanup`}
              codeRole="cleanup"
            />
          </FrameworkOnly>
          <Text>
            The preview supplies SVG icons through <C>icons</C> and uses
            responsive image padding. This integration uses the package’s text
            controls and default image padding. The control layout and helper
            are the same.
          </Text>
        </Section>
      </section>
    </>
  );
}
