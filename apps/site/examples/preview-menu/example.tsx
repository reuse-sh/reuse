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
        "Dunes under an open sky, signed on the back",
        "dunes",
      ],
      [
        "sets",
        "Gift sets",
        "A yellow bloom in a glass vase, ready to give",
        "yellow-bloom",
      ],
      [
        "still-lifes",
        "Still lifes",
        "Fruit and a vase on a white cloth",
        "table-still-life",
      ],
    ],
  ],
  [
    "Studio",
    [
      [
        "visit",
        "Visit",
        "Open on Saturdays, with a sofa to sit on",
        "grey-lounge",
      ],
      [
        "classes",
        "Classes",
        "Two hours in the bright workroom, chair included",
        "empty-room",
      ],
      [
        "journal",
        "Journal",
        "Notes from a winter walk past a lone pine",
        "lone-pine",
      ],
    ],
  ],
] as const;

const focus: Partial<Record<PhotoId, string>> = { "yellow-bloom": "50% 25%" };

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
  const position = focus[picture];
  return (
    <template
      id={`menu-card-${id}`}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: fixed synthetic markup, cloned by the preview.
      dangerouslySetInnerHTML={{
        __html: `<span class="re-preview-menu-card"><img src="${src}" alt="" width="${width}" height="${height}"${position ? ` style="object-position: ${position}"` : ""}><b>${name}</b><small>${line}</small></span>`,
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
                    style={{ objectPosition: focus[picture] }}
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
