import { notFound } from "next/navigation";
import { lightboxCode, lightboxStyles } from "./lightbox-styles";
import { CodePair, Keys } from "./parts";

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
      </section>
    </>
  );
}
