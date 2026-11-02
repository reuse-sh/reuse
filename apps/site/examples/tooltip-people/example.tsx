"use client";

import { FloatingTooltipGroup } from "@reuse-sh/interactions/react";
import "@reuse-sh/interactions/styles.css";

const cards = [
  [
    "Mara Lind",
    "Print editor",
    "09:42 in Lisbon",
    "https://reuse.sh/images/marble-lake.svg",
  ],
  [
    "Jonas Weber",
    "Producer",
    "10:42 in Berlin",
    "https://reuse.sh/images/marble-mountains.svg",
  ],
  [
    "Aiko Tanaka",
    "Writer",
    "16:42 in Taipei",
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
      <div className="mb-6 flex gap-3">
        {/* biome-ignore lint/performance/noImgElement: this portable recipe also runs outside Next.js. */}
        <img
          className="size-9 shrink-0 rounded-full object-cover"
          src="https://reuse.sh/images/marble-lake.svg"
          alt=""
        />
        <p>
          <button
            type="button"
            className="font-semibold"
            data-card="0"
            data-re-tooltip="Mara Lind"
          >
            Mara Lind
          </button>{" "}
          The second crop of Coral sky reads better. Can we try it as the cover?
        </p>
      </div>
      <div className="mb-6 flex gap-3">
        {/* biome-ignore lint/performance/noImgElement: this portable recipe also runs outside Next.js. */}
        <img
          className="size-9 shrink-0 rounded-full object-cover"
          src="https://reuse.sh/images/marble-mountains.svg"
          alt=""
        />
        <p>
          <button
            type="button"
            className="font-semibold"
            data-card="1"
            data-re-tooltip="Jonas Weber"
          >
            Jonas Weber
          </button>{" "}
          Works for me. The print run closes on Friday, so we have until
          Thursday night.
        </p>
      </div>
      <div className="mb-6 flex gap-3">
        {/* biome-ignore lint/performance/noImgElement: this portable recipe also runs outside Next.js. */}
        <img
          className="size-9 shrink-0 rounded-full object-cover"
          src="https://reuse.sh/images/marble-coast.svg"
          alt=""
        />
        <p>
          <button
            type="button"
            className="font-semibold"
            data-card="2"
            data-re-tooltip="Aiko Tanaka"
          >
            Aiko Tanaka
          </button>{" "}
          I'll trim the caption to one line so it sits under the photo.
        </p>
      </div>
    </FloatingTooltipGroup>
  );
}
