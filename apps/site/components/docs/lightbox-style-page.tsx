import { findLibrary } from "@reuse-sh/catalog";
import { notFound } from "next/navigation";
import { FrameworkOnly } from "../../lib/framework-context";
import { photos } from "../../lib/photos";
import { CodeBlock } from "../shell/code-block";
import { Kbd } from "../ui/typography";
import { LightboxLaunch } from "./lightbox-launch";
import {
  lightboxCode,
  lightboxPreviewModule,
  lightboxStyleCss,
  lightboxStyles,
} from "./lightbox-styles";
import { C, CodePair, Install, Keys, Section, Text } from "./parts";

export function LightboxStylePage({ style }: { style: string }) {
  const options = lightboxStyles[style];
  const library = findLibrary("lightbox");
  if (!options || !library) notFound();
  const code = lightboxCode(options);
  return (
    <>
      <div className="space-y-4">
        <LightboxLaunch
          items={photos.map((photo) => ({
            src: photo.src,
            previewSrc: photo.src,
            thumbnailSrc: photo.src,
            alt: photo.alt,
            caption: photo.caption,
            width: photo.width,
            height: photo.height,
          }))}
          module={lightboxPreviewModule(options)}
          css={lightboxStyleCss(options)}
        />
        <Keys>
          Click an image, then <Kbd>←</Kbd> <Kbd>→</Kbd> to page and{" "}
          <Kbd>Esc</Kbd> to close.
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
              opens the full image the link points to, or{" "}
              <C>data-lightbox-src</C>, and preserves modified clicks. Import
              the stylesheets through your app’s bundler.
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
              Save this as <C>lightbox-chrome.js</C>. The setup above passes it
              to the lightbox. It{" "}
              {options.caption === "Panel"
                ? "fills the aside slot with a panel for the current image and a list of every image in the set"
                : "fills the footer slot with a toolbar of its own controls"}
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
                ? " The lightbox removes the slots when the dialog closes."
                : ""}
            </Text>
          </FrameworkOnly>
          <FrameworkOnly value="html">
            <Text>
              Run this when your view is removed to release the gallery
              listener, dialog and scroll lock.
              {code.chrome
                ? " The lightbox removes the slots when the dialog closes."
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
            The preview supplies the site’s icons through <C>icons</C> and uses
            responsive image padding. This integration uses the package’s
            built-in icons and default image padding. The control layout and
            helper are the same.
          </Text>
        </Section>
      </section>
    </>
  );
}
