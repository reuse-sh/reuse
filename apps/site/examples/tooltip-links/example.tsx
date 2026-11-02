"use client";

import { FloatingTooltipGroup } from "@reuse-sh/interactions/react";
import "@reuse-sh/interactions/styles.css";

const cards = [
  [
    "Coral sky",
    "The first sheet pulled from the tray. Coral and sand over a cool blue.",
    "prints.example.com",
    "https://reuse.sh/images/marble-lake.svg",
  ],
  [
    "Mint and ember",
    "Pulled an hour later, after the orange had sunk to the bottom.",
    "prints.example.com",
    "https://reuse.sh/images/marble-mountains.svg",
  ],
  [
    "Lilac bloom",
    "The last sheet of the day, once the colors had softened.",
    "prints.example.com",
    "https://reuse.sh/images/marble-coast.svg",
  ],
];
function card(trigger: HTMLElement) {
  const index = Number(trigger.getAttribute("data-card"));
  const [title, description, detail, src] = cards[index];
  const root = document.createElement("span");
  root.style.cssText =
    "display:block;width:240px;max-width:calc(100vw - 36px);font:13px/1.5 system-ui,sans-serif";
  const image = document.createElement("img");
  image.src = src;
  image.alt = "";
  image.width = 240;
  image.height = 140;
  image.style.cssText =
    "display:block;width:100%;height:140px;object-fit:cover;border-radius:10px";
  const body = document.createElement("span");
  body.style.cssText = "display:grid;gap:4px;padding:10px";
  const heading = document.createElement("b");
  heading.textContent = title;
  const text = document.createElement("span");
  text.textContent = description;
  const small = document.createElement("small");
  small.textContent = detail;
  body.append(heading, text, small);
  root.append(image, body);
  return root;
}
export function Example() {
  return (
    <FloatingTooltipGroup
      className="mx-auto w-full max-w-[640px] p-4 text-[15px] leading-6 text-[#111] sm:p-8"
      content={card}
    >
      <article className="max-w-[460px]">
        <p className="mb-3 text-sm text-[#858585]">
          Print series · October 2026
        </p>
        <h2 className="mb-3 text-[21px] font-semibold">
          Three prints from one tray
        </h2>
        <p className="mb-4 text-[#5b5b5b]">
          The series opens with{" "}
          <a
            href="#links-note"
            className="underline underline-offset-4"
            data-card="0"
            data-re-tooltip="Coral sky"
          >
            Coral sky
          </a>
          , the first sheet we pulled.{" "}
          <a
            href="#links-note"
            className="underline underline-offset-4"
            data-card="1"
            data-re-tooltip="Mint and ember"
          >
            Mint and ember
          </a>{" "}
          came from the same water an hour later.{" "}
          <a
            href="#links-note"
            className="underline underline-offset-4"
            data-card="2"
            data-re-tooltip="Lilac bloom"
          >
            Lilac bloom
          </a>{" "}
          was the last, once the colors had softened.
        </p>
        <p className="mb-4 text-[#5b5b5b]" id="links-note">
          Point at a print name to see it.
        </p>
      </article>
    </FloatingTooltipGroup>
  );
}
