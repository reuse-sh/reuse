"use client";
import { CursorPreview } from "@reuse-sh/interactions/react";
import "./effects.css";
import { type PhotoId, photo } from "@/lib/photos";

const groups = [
  [
    "Shop",
    [
      [
        "prints",
        "Prints",
        "Single sheets, signed on the back",
        "table-still-life",
      ],
      ["sets", "Gift sets", "Three sheets in a folded sleeve", "empty-room"],
      ["paper", "Paper", "The stock we pull every print on", "dunes"],
    ],
  ],
  [
    "Studio",
    [
      ["visit", "Visit", "Open on Saturdays from ten", "open-sea"],
      [
        "classes",
        "Classes",
        "Two hours, one tray, your own sheet",
        "cloud-peak",
      ],
      ["journal", "Journal", "Notes from the table", "lone-pine"],
    ],
  ],
] as const;

function Card({
  id,
  name,
  line,
  picture,
}: {
  id: string;
  name: string;
  line: string;
  picture: PhotoId;
}) {
  const { src, width, height } = photo(picture);
  return (
    <template
      id={`menu-card-${id}`}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: fixed synthetic markup, cloned by the preview.
      dangerouslySetInnerHTML={{
        __html: `<span class="re-preview-menu-card"><img src="${src}" alt="" width="${width}" height="${height}"><b>${name}</b><small>${line}</small></span>`,
      }}
    />
  );
}

export function PreviewMenu() {
  return (
    <>
      <CursorPreview
        offset={18}
        tilt={5}
        delay={90}
        previewClassName="re-preview-menu-popup"
      >
        <nav aria-label="Menu" className="re-preview-menu">
          {groups.map(([title, rows]) => (
            <div key={title}>
              <p>{title}</p>
              {rows.map(([id, name, line, picture]) => (
                <a
                  key={id}
                  href={`#${id}`}
                  id={id}
                  data-re-preview-template={`menu-card-${id}`}
                >
                  {/* biome-ignore lint/performance/noImgElement: standalone examples use native images. */}
                  <img
                    className="re-preview-menu-thumb"
                    src={photo(picture).src}
                    alt=""
                    width={photo(picture).width}
                    height={photo(picture).height}
                  />
                  <b>{name}</b>
                  <small>{line}</small>
                </a>
              ))}
            </div>
          ))}
        </nav>
      </CursorPreview>
      {groups.flatMap(([, rows]) =>
        rows.map(([id, name, line, picture]) => (
          <Card key={id} id={id} name={name} line={line} picture={picture} />
        )),
      )}
    </>
  );
}

export const Example = PreviewMenu;
