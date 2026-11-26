"use client";
import { CursorPreview } from "@reuse-sh/interactions/react";
import "./effects.css";

const groups = [
  [
    "Shop",
    [
      ["prints", "Prints", "Single sheets, signed on the back", "lake"],
      ["sets", "Gift sets", "Three sheets in a folded sleeve", "woods"],
      ["paper", "Paper", "The stock we pull every print on", "dune"],
    ],
  ],
  [
    "Studio",
    [
      ["visit", "Visit", "Open on Saturdays from ten", "meadow"],
      ["classes", "Classes", "Two hours, one tray, your own sheet", "coast"],
      ["journal", "Journal", "Notes from the table", "forest"],
    ],
  ],
] as const;

function Card({ id, name, line, photo }: Record<string, string>) {
  return (
    <template
      id={`menu-card-${id}`}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: fixed synthetic markup, cloned by the preview.
      dangerouslySetInnerHTML={{
        __html: `<span class="re-preview-menu-card"><img src="/images/marble-${photo}-2250x1500.webp" alt="" width="2250" height="1500"><b>${name}</b><small>${line}</small></span>`,
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
              {rows.map(([id, name, line]) => (
                <a
                  key={id}
                  href={`#${id}`}
                  id={id}
                  data-re-preview-template={`menu-card-${id}`}
                >
                  <b>{name}</b>
                  <small>{line}</small>
                </a>
              ))}
            </div>
          ))}
        </nav>
      </CursorPreview>
      {groups.flatMap(([, rows]) =>
        rows.map(([id, name, line, photo]) => (
          <Card key={id} id={id} name={name} line={line} photo={photo} />
        )),
      )}
    </>
  );
}

export const Example = PreviewMenu;
