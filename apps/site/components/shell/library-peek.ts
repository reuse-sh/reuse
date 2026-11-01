import { createAvatar, createAvatarGroup } from "@reuse-sh/avatars";
import { createThinkingDots } from "@reuse-sh/loaders";
import { type MenuSlug, menuLibrary } from "../../lib/menu";
import { photos } from "../../lib/photos";
import { iconNode } from "../icons";

const people = ["Mara Lind", "Jonas Weber", "Aiko Tanaka", "Lea Novak"];

type Child = Node | string;

function el(tag: string, className = "", ...children: Child[]) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.append(...children);
  return node;
}

function img(index: number, on = false) {
  const image = document.createElement("img");
  image.src = photos[index].src;
  image.alt = "";
  image.decoding = "async";
  if (on) image.setAttribute("data-on", "");
  return image;
}

function cursor() {
  return el("span", "pk-cursor", iconNode("cursor", 15));
}

function stage(slug: MenuSlug, cleanups: (() => void)[]) {
  switch (slug) {
    case "lightbox":
      return el(
        "div",
        "pk pk-lb",
        el("span", "pk-lb-photo", img(0)),
        el("span", "pk-lb-n", "1 / 6"),
        el("span", "pk-lb-x", iconNode("close", 10)),
        el("span", "pk-lb-thumbs", ...photos.map((_, i) => img(i, i === 0))),
      );
    case "carousel":
      return el(
        "div",
        "pk pk-car",
        el("span", "pk-car-track", ...[1, 4, 0, 5, 2, 3].map((i) => img(i))),
        el(
          "span",
          "pk-car-dots",
          ...[0, 1, 2, 3].map(() => document.createElement("i")),
        ),
      );
    case "annotations":
      return el(
        "div",
        "pk pk-ann",
        img(0),
        el("span", "pk-ann-region"),
        el("span", "pk-ann-label", "Boathouse"),
        el("span", "pk-ann-pin", "1"),
      );
    case "avatars": {
      const single = el("span");
      const group = el("div", "pk-av-group");
      const faces = people.map(() => el("span"));
      group.append(...faces);
      const controllers = [
        createAvatar(single, {
          name: people[0],
          src: photos[0].src,
          size: 44,
          badge: { type: "count", count: 3, label: "3 unread messages" },
        }),
        ...faces.map((face, i) =>
          createAvatar(face, {
            name: people[i],
            src: photos[i + 1].src,
            size: 30,
          }),
        ),
      ];
      const grouped = createAvatarGroup(group, { overlap: 8, clearance: 2 });
      cleanups.push(() => {
        grouped.destroy();
        for (const controller of controllers) controller.destroy();
      });
      return el("div", "pk pk-av", single, group);
    }
    case "floating-tooltip": {
      const tools = [
        ["zoom", "Zoom"],
        ["heart", "Favorite"],
        ["share", "Share"],
        ["trash", "Delete"],
      ] as const;
      const tip = el("span", "pk-tip-pop", tools[0][1]);
      const move = el("span", "pk-tip-move", cursor(), tip);
      const bar = el(
        "span",
        "pk-tip-bar",
        ...tools.map(([name]) => iconNode(name, 15)),
        move,
      );
      if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
        let index = 0;
        const arrive = () => {
          tip.textContent = tools[index][1];
        };
        move.addEventListener("transitionend", arrive);
        const step = setInterval(() => {
          if (!bar.isConnected) return;
          index = (index + 1) % tools.length;
          move.style.setProperty("--i", String(index));
        }, 1400);
        cleanups.push(() => {
          clearInterval(step);
          move.removeEventListener("transitionend", arrive);
        });
      }
      return el("div", "pk pk-tip", bar);
    }
    case "moving-highlight":
      return el(
        "div",
        "pk pk-hl",
        el(
          "span",
          "pk-hl-list",
          el("span", "pk-hl-fill"),
          ...["Inbox", "Drafts", "Sent", "Archive"].map((label) =>
            el("span", "", label),
          ),
          el("span", "pk-hl-move", cursor()),
        ),
      );
    case "hold-to-confirm":
      return el(
        "div",
        "pk pk-hold",
        el(
          "span",
          "pk-hold-btn",
          el("span", "pk-hold-fill"),
          iconNode("trash", 14),
          "Hold to delete",
        ),
      );
    case "loaders": {
      const canvas = document.createElement("canvas");
      const dots = createThinkingDots(canvas, { size: 48 });
      cleanups.push(() => dots.destroy());
      return el("div", "pk pk-load", canvas);
    }
    case "shadows":
      return el(
        "div",
        "pk pk-sh",
        ...["sm", "md", "xl"].map((level) =>
          el("span", `re-shadow-ring-${level}`),
        ),
      );
  }
}

export function createLibraryPeek() {
  const panes = new Map<MenuSlug, HTMLElement>();
  const cleanups: (() => void)[] = [];
  return {
    pane(slug: MenuSlug) {
      let pane = panes.get(slug);
      if (!pane) {
        const library = menuLibrary(slug);
        pane = el(
          "div",
          "c-peek-pane",
          stage(slug, cleanups),
          el(
            "p",
            "c-peek-foot",
            el("span", "", library.name),
            el("code", "", library.packageName),
          ),
        );
        pane.setAttribute("aria-hidden", "true");
        panes.set(slug, pane);
      }
      return pane;
    },
    destroy() {
      for (const cleanup of cleanups.splice(0)) cleanup();
      panes.clear();
    },
  };
}
