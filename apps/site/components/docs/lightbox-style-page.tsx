import { notFound } from "next/navigation";
import { FrameworkOnly } from "../../lib/framework-context";
import { photos } from "../../lib/photos";
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
        <FrameworkOnly value="html">
          <Section title={<C>index.html</C>}>
            <CodeBlock
              tabs={{
                lang: "html",
                code: `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>Lightbox gallery</title>\n<link rel="stylesheet" href="./lightbox-style.css">\n<script type="module" src="./main.js"></script>\n</head>\n<body>\n<main data-gallery style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px">\n${photos.map((photo) => `  <a href="https://reuse.sh${photo.src}"><img src="https://reuse.sh${photo.src}" alt="${photo.alt}" data-caption="${photo.caption}" width="${photo.width}" height="${photo.height}" style="display:block;width:100%;height:auto"></a>`).join("\n")}\n</main>\n</body>\n</html>`,
              }}
            />
          </Section>
        </FrameworkOnly>
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
