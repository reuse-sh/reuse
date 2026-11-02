import { createFloatingTooltip } from "@reuse-sh/interactions";

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
function card(trigger) {
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
const controller = createFloatingTooltip(
  document.querySelector(".re-example"),
  {
    content: card,
  },
);
window.addEventListener("pagehide", function cleanup(event) {
  if (event.persisted) return;
  controller.destroy();
  window.removeEventListener("pagehide", cleanup);
});
