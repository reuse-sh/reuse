import {
  type Annotation,
  createAnnotatedImage,
  createAnnotationEditor,
} from "@reuse-sh/annotations";
import { createAvatar, createAvatarGroup } from "@reuse-sh/avatars";
import { createCarousel } from "@reuse-sh/carousel";
import { createJustifiedGallery, createMasonry } from "@reuse-sh/gallery";
import { easingGradient } from "@reuse-sh/gradients";
import {
  createCopyButton,
  createFloatingTooltip,
  createHoldToConfirm,
  createMovingHighlight,
} from "@reuse-sh/interactions";
import { createThinkingDots } from "@reuse-sh/loaders";
import {
  createStage,
  isStageEvent,
  type StageAct,
  type StageOptions,
} from "@reuse-sh/stage";
import { type MenuSlug, menuLibrary } from "../../lib/menu";
import { type Photo, photo, photos } from "../../lib/photos";
import { iconNode } from "../icons";
import { nativeArrow } from "../lucide-arrows";
import { buttonVariants } from "../ui/button";

const WIDTH = 240;
const HEIGHT = 148;

type Child = Node | string;

function el(tag: string, className = "", ...children: Child[]) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.append(...children);
  return node;
}

function target<T extends HTMLElement>(node: T, name: string) {
  node.dataset.stageTarget = name;
  return node;
}

const portraits = [
  photo("quiet-stair"),
  photo("green-sprig"),
  photo("white-court"),
  photo("yellow-bloom"),
  photo("garden-wall"),
  photo("glass-tower"),
  photo("rock-edge"),
];
const pick = (list: Photo[], index: number) => list[index % list.length];

function img(source: Photo) {
  const image = document.createElement("img");
  image.src = source.src;
  image.srcset = source.srcSet ?? "";
  image.sizes = "240px";
  image.alt = "";
  image.decoding = "async";
  image.draggable = false;
  return image;
}

function arrow(name: "left" | "right", size: number) {
  const svg = nativeArrow(name);
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  return svg;
}

/** Everything a scene needs besides the stage itself. */
interface Scene
  extends Pick<StageOptions, "label" | "script" | "reset" | "still" | "rest"> {
  root: HTMLElement;
  cleanup?: () => void;
}

/** Runs setup once, the first time the scene is laid out on screen. */
function once(setup: () => void) {
  let done = false;
  return () => {
    if (done) return;
    done = true;
    setup();
  };
}

function settle(...nodes: Element[]) {
  for (const node of nodes)
    for (const animation of node.getAnimations({ subtree: true }))
      animation.cancel();
}

function lightbox(): Scene {
  const tiles = photos
    .slice(0, 6)
    .map((_, i) =>
      target(el("span", "pk-lb-tile", img(pick(photos, i))), `tile-${i}`),
    );
  const photo = el("span", "pk-lb-photo", img(pick(photos, 1)));
  const incoming = el(
    "span",
    "pk-lb-photo pk-lb-incoming",
    img(pick(photos, 2)),
  );
  const count = el("span", "pk-lb-count", "2 / 6");
  const close = target(
    el("span", "pk-lb-close", iconNode("close", 11)),
    "close",
  );
  const next = target(el("span", "pk-lb-next", arrow("right", 13)), "next");
  const view = el("div", "pk-lb-view", photo, incoming, count, close, next);
  const root = el("div", "pk pk-lb", el("div", "pk-lb-grid", ...tiles), view);
  const fit = { left: 38, top: 13, width: 164, height: 123 };
  const box = (node: Element) => {
    const outer = root.getBoundingClientRect();
    const rect = node.getBoundingClientRect();
    return {
      left: rect.left - outer.left,
      top: rect.top - outer.top,
      width: rect.width,
      height: rect.height,
    };
  };
  const px = (rect: typeof fit, radius: number) => ({
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    borderRadius: `${radius}px`,
  });
  const fly = { duration: 440, easing: "cubic-bezier(0.2, 0, 0, 1)" };
  const page = { duration: 420, easing: "cubic-bezier(0.25, 0.8, 0.25, 1)" };
  const reset = () => {
    settle(view);
    root.removeAttribute("data-open");
    root.removeAttribute("data-photo");
    for (const tile of tiles) tile.style.visibility = "";
    count.textContent = "2 / 6";
  };
  return {
    root,
    label:
      "A thumbnail opens into a full view, pages to the next photo and closes back to its tile.",
    rest: { x: 206, y: 132 },
    reset,
    still() {
      reset();
      tiles[1].style.visibility = "hidden";
      root.setAttribute("data-open", "");
      root.setAttribute("data-photo", "");
    },
    async script(act: StageAct) {
      await act.click("tile-1");
      tiles[1].style.visibility = "hidden";
      root.setAttribute("data-open", "");
      root.setAttribute("data-photo", "");
      await photo.animate([px(box(tiles[1]), 6), px(fit, 4)], fly).finished;
      await act.wait(500);
      await act.click("next");
      tiles[1].style.visibility = "";
      tiles[2].style.visibility = "hidden";
      count.textContent = "3 / 6";
      incoming.animate(
        [{ transform: "translateX(240px)" }, { transform: "translateX(0)" }],
        { ...page, fill: "forwards" },
      );
      await photo.animate(
        [{ transform: "translateX(0)" }, { transform: "translateX(-240px)" }],
        { ...page, fill: "forwards" },
      ).finished;
      await act.wait(650);
      await act.click("close");
      root.removeAttribute("data-open");
      await incoming.animate([px(fit, 4), px(box(tiles[2]), 6)], {
        ...fly,
        duration: 380,
        fill: "forwards",
      }).finished;
      reset();
      await act.wait(300);
    },
  };
}

function carousel(): Scene {
  const order = [1, 4, 0, 5, 2];
  const viewport = el(
    "div",
    "pk-car-track",
    ...order.map((i) => el("div", "pk-car-slide", img(pick(photos, i)))),
  );
  const dots = order.map(() => el("i"));
  const prev = target(el("button", "pk-car-arrow", arrow("left", 13)), "prev");
  const next = target(el("button", "pk-car-arrow", arrow("right", 13)), "next");
  const root = el(
    "div",
    "pk pk-car",
    viewport,
    el("div", "pk-car-bar", el("span", "pk-car-dots", ...dots), prev, next),
  );
  let instance: ReturnType<typeof createCarousel> | undefined;
  let unsubscribe = () => {};
  const paint = (current: number) => {
    for (const [i, dot] of dots.entries())
      dot.toggleAttribute("data-on", i === current);
  };
  const ensure = once(() => {
    instance = createCarousel(viewport, { align: "start" });
    unsubscribe = instance.subscribe((state) => paint(state.index));
    prev.addEventListener("click", () => instance?.prev());
    next.addEventListener("click", () => instance?.next());
  });
  const reset = () => {
    ensure();
    instance?.goTo(0, "instant");
    paint(0);
  };
  return {
    root,
    label: "A strip of photos glides to the next slide and back.",
    rest: { x: 150, y: 140 },
    reset,
    async script(act) {
      await act.click("next");
      await act.wait(850);
      await act.click("next");
      await act.wait(1000);
      await act.click("prev");
      await act.wait(700);
      await act.click("prev");
      await act.wait(700);
    },
    cleanup() {
      unsubscribe();
      instance?.destroy();
    },
  };
}

function annotations(): Scene {
  const canvas = el("div", "pk-ann-canvas");
  const root = el("div", "pk pk-ann", canvas);
  const base = {
    src: photos[2].src,
    alt: "",
    width: photos[2].width,
    height: photos[2].height,
  };
  let marks: Annotation[] = [];
  let image: ReturnType<typeof createAnnotatedImage> | undefined;
  let editor: ReturnType<typeof createAnnotationEditor> | undefined;
  const publish = (next: Annotation[]) => {
    marks = next;
    image?.update({ ...base, annotations: next });
    editor?.setAnnotations(next);
  };
  const ensure = once(() => {
    image = createAnnotatedImage(canvas, { ...base, annotations: [] });
    editor = createAnnotationEditor(canvas, {
      annotations: [],
      tool: "area",
      onChange: publish,
      onPreview: (next) =>
        image?.update({ ...base, annotations: next ?? marks }),
    });
  });
  const reset = () => {
    ensure();
    root.removeAttribute("data-clearing");
    publish([]);
    editor?.setTool("area");
  };
  const label = "Crop line";
  return {
    root,
    label:
      "A pointer draws a labelled area on a photo, then an arrow toward it.",
    rest: { x: 214, y: 136 },
    reset,
    still() {
      reset();
      editor?.setTool("select");
      publish([
        { kind: "area", box: [20, 24, 36, 40], label },
        { kind: "arrow", line: [84, 78, 60, 58] },
      ]);
    },
    async script(act) {
      await act.press({ x: 52, y: 42 });
      await act.move({ x: 136, y: 98 }, { duration: 720 });
      await act.release();
      for (let end = 1; end <= label.length; end++) {
        const [area, ...rest] = marks;
        if (area?.kind !== "area") break;
        publish([{ ...area, label: label.slice(0, end) }, ...rest]);
        await act.wait(55);
      }
      await act.wait(450);
      editor?.setTool("arrow");
      await act.press({ x: 206, y: 124 });
      await act.move({ x: 146, y: 100 }, { duration: 560 });
      await act.release();
      editor?.setTool("select");
      await act.wait(1500);
      root.setAttribute("data-clearing", "");
      await act.wait(320);
      publish([]);
      root.removeAttribute("data-clearing");
      editor?.setTool("area");
    },
    cleanup() {
      editor?.destroy();
      image?.destroy();
    },
  };
}

/** A box the cursor resizes by its right edge, so the layout inside it reflows. */
function resizable(
  box: HTMLElement,
  wide: number,
  narrow: number,
  refresh: () => void,
) {
  const grip = target(el("span", "pk-grip"), "grip");
  const root = el(
    "div",
    "pk pk-resize",
    el("div", "pk-resize-frame", box),
    grip,
  );
  let dragging = false;
  const set = (width: number) => {
    root.style.setProperty("--pk-box", `${Math.round(width)}px`);
    refresh();
  };
  grip.addEventListener("pointerdown", () => {
    dragging = true;
  });
  root.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const left = box.getBoundingClientRect().left;
    set(Math.min(wide, Math.max(narrow, event.clientX - left - 6)));
  });
  root.addEventListener("pointerup", () => {
    dragging = false;
  });
  return {
    root,
    reset() {
      dragging = false;
      set(wide);
    },
    async script(act: StageAct) {
      const y = HEIGHT / 2;
      await act.press("grip");
      await act.move({ x: narrow + 16, y: y + 6 }, { duration: 1000 });
      await act.wait(650);
      await act.move({ x: wide + 16, y }, { duration: 900 });
      await act.release();
      await act.wait(400);
    },
  };
}

function justified(): Scene {
  const pictures = [
    photo("blue-ridges"),
    photo("white-court"),
    photo("dunes"),
    photo("monstera"),
    photo("steel-wave"),
    photo("snow-walk"),
    photo("sailboat"),
    photo("shoreline"),
  ];
  const box = el(
    "div",
    "pk-jg",
    ...pictures.map((picture) => {
      const image = img(picture);
      image.width = picture.width;
      image.height = picture.height;
      return image;
    }),
  );
  let gallery: ReturnType<typeof createJustifiedGallery> | undefined;
  const frame = resizable(box, 208, 128, () => gallery?.refresh());
  const ensure = once(() => {
    gallery = createJustifiedGallery(box, { maxRows: 3 });
  });
  return {
    root: frame.root,
    label:
      "Photo rows rebalance to fill the width as the frame narrows and widens.",
    rest: { x: 226, y: 132 },
    reset() {
      ensure();
      frame.reset();
    },
    script: frame.script,
    cleanup: () => gallery?.destroy(),
  };
}

function masonry(): Scene {
  const heights = [44, 30, 56, 36, 48, 28, 40, 52, 34];
  const box = el(
    "div",
    "pk-mas",
    ...heights.map((height, i) => {
      const card = el("span", "pk-mas-card", img(pick(portraits, i + 2)));
      card.style.height = `${height}px`;
      return card;
    }),
  );
  let instance: ReturnType<typeof createMasonry> | undefined;
  const frame = resizable(box, 208, 128, () => instance?.refresh());
  const ensure = once(() => {
    instance = createMasonry(box);
  });
  return {
    root: frame.root,
    label: "Cards repack from three columns into two as the frame narrows.",
    rest: { x: 226, y: 132 },
    reset() {
      ensure();
      frame.reset();
    },
    script: frame.script,
    cleanup: () => instance?.destroy(),
  };
}

const people = ["Mara Lind", "Jonas Weber", "Aiko Tanaka", "Lea Novak"];

function avatars(): Scene {
  const group = el("div", "pk-av-group");
  const add = target(el("button", "pk-av-add", iconNode("add", 13)), "add");
  const root = el(
    "div",
    "pk pk-av",
    el(
      "div",
      "pk-av-card",
      el(
        "span",
        "pk-av-head",
        el("b", "", "Design review"),
        el("small", "", "Today, 14:00"),
      ),
      el("span", "pk-av-row", group, add),
    ),
  );
  const controllers: { destroy(): void }[] = [];
  let guest: { node: HTMLElement; destroy(): void } | undefined;
  const avatar = (i: number) => {
    const node = el("span");
    const controller = createAvatar(node, {
      name: people[i],
      src: `/images/marble-${["mountains", "coast", "forest", "night"][i]}.webp`,
      size: 30,
      badge:
        i === 0
          ? { type: "dot", label: "Online", corner: "bottom-right" }
          : undefined,
    });
    return { node, destroy: () => controller.destroy() };
  };
  const face = (i: number) => {
    const made = avatar(i);
    controllers.push(made);
    return made.node;
  };
  const ensure = once(() => {
    group.append(face(2), face(1), face(0));
    controllers.push(createAvatarGroup(group, { overlap: 9, clearance: 2 }));
  });
  const leave = () => {
    guest?.destroy();
    guest?.node.remove();
    guest = undefined;
  };
  return {
    root,
    label:
      "A fourth person joins an overlapping avatar group, and the group cuts room for them.",
    rest: { x: 196, y: 124 },
    reset() {
      ensure();
      leave();
    },
    async script(act) {
      await act.click("add");
      guest = avatar(3);
      const { node } = guest;
      node.classList.add("pk-av-join");
      await act.run(() => group.prepend(node));
      await act.wait(1400);
      await act.move({ x: 120, y: 120 });
      await act.wait(300);
      await node.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 220,
        fill: "forwards",
      }).finished;
      leave();
      await act.wait(400);
    },
    cleanup() {
      leave();
      for (const controller of controllers.splice(0).reverse())
        controller.destroy();
    },
  };
}

function tooltip(): Scene {
  const tools = [
    ["zoom", "Zoom", "zoom"],
    ["heart", "Favorite", "heart"],
    ["share", "Share", "share"],
    ["trash", "Delete", "trash"],
  ] as const;
  const bar = el(
    "div",
    "pk-tip-bar",
    ...tools.map(([icon, text, name]) => {
      const button = target(
        el("button", "pk-tip-btn", iconNode(icon, 16)),
        name,
      );
      button.dataset.tip = text;
      return button;
    }),
  );
  const root = el("div", "pk pk-tip", bar);
  let instance: ReturnType<typeof createFloatingTooltip> | undefined;
  const ensure = once(() => {
    instance = createFloatingTooltip(bar, {
      selector: "[data-tip]",
      content: (trigger) => trigger.dataset.tip ?? null,
      delay: 60,
      className: "f-tip",
    });
  });
  return {
    root,
    label:
      "A pointer moves along a toolbar, and one tooltip slides from button to button.",
    rest: { x: 196, y: 128 },
    reset: ensure,
    async script(act) {
      await act.move("zoom");
      await act.wait(700);
      await act.move("heart");
      await act.wait(420);
      await act.move("share");
      await act.wait(420);
      await act.move("trash");
      await act.wait(900);
    },
    cleanup: () => instance?.destroy(),
  };
}

function highlight(): Scene {
  const labels = ["Inbox", "Drafts", "Sent", "Archive"];
  const list = el(
    "div",
    "pk-hl-list moving-highlight",
    ...labels.map((label) => {
      const row = target(el("span", "pk-hl-row", label), label);
      row.dataset.reRow = "";
      return row;
    }),
  );
  const root = el("div", "pk pk-hl", list);
  let instance: ReturnType<typeof createMovingHighlight> | undefined;
  const ensure = once(() => {
    instance = createMovingHighlight(list);
  });
  return {
    root,
    label: "A highlight slides under each row the pointer reaches.",
    rest: { x: 204, y: 128 },
    reset: ensure,
    async script(act) {
      for (const label of labels) {
        await act.move(label);
        await act.wait(360);
      }
      await act.move("Drafts");
      await act.wait(700);
    },
    cleanup: () => instance?.destroy(),
  };
}

function hold(): Scene {
  const button = target(
    el(
      "button",
      `${buttonVariants({ variant: "destructive", size: "sm" })} pk-hold-btn`,
      iconNode("trash", 14),
      el(
        "span",
        "pk-hold-label",
        el("span", "", "Hold to delete"),
        el("span", "", "Deleted"),
      ),
    ) as HTMLButtonElement,
    "hold",
  );
  const root = el("div", "pk pk-hold", button);
  let instance: ReturnType<typeof createHoldToConfirm> | undefined;
  const ensure = once(() => {
    instance = createHoldToConfirm(button, {
      holdMs: 1100,
      resetMs: 1500,
      onConfirm: () => {},
    });
  });
  return {
    root,
    label:
      "A pointer lets go of a hold early and the fill drains, then holds to the end and the button confirms.",
    rest: { x: 186, y: 122 },
    reset() {
      ensure();
      instance?.cancel();
      instance?.reset();
    },
    async script(act) {
      await act.press("hold");
      await act.wait(480);
      await act.release();
      await act.wait(650);
      await act.press();
      await act.wait(1260);
      await act.release();
      await act.wait(1700);
    },
    cleanup: () => instance?.destroy(),
  };
}

function copy(): Scene {
  const button = target(
    el("button", "pk-copy-btn") as HTMLButtonElement,
    "copy",
  );
  const row = el(
    "div",
    "pk-copy-code",
    el("code", "", "npm i @reuse-sh/interactions"),
    button,
  );
  const root = el("div", "pk pk-copy", row);
  let timer: number | undefined;
  let instance: ReturnType<typeof createCopyButton> | undefined;
  const idle = () => {
    window.clearTimeout(timer);
    button.setAttribute("data-state", "idle");
  };
  const showCopiedWithoutClipboard = (event: MouseEvent) => {
    if (!isStageEvent(event)) return;
    event.stopPropagation();
    idle();
    button.setAttribute("data-state", "copied");
    timer = window.setTimeout(idle, 1500);
  };
  const ensure = once(() => {
    instance = createCopyButton(button, {
      text: "npm i @reuse-sh/interactions",
    });
    row.addEventListener("click", showCopiedWithoutClipboard, true);
  });
  return {
    root,
    label: "A pointer clicks a copy button, and its icon turns into a check.",
    rest: { x: 168, y: 120 },
    reset() {
      ensure();
      idle();
    },
    async script(act) {
      await act.click("copy");
      await act.move({ x: 214, y: 96 });
      await act.wait(1500);
    },
    cleanup() {
      idle();
      instance?.destroy();
    },
  };
}

function loaders(): Scene {
  const canvas = document.createElement("canvas");
  const question = el("span", "pk-ld-ask");
  const answer = el(
    "span",
    "pk-ld-answer",
    el("span", "pk-ld-dots", canvas),
    el("span", "pk-ld-reply", "Three days, one ferry, no rush."),
  );
  const field = target(el("input", "pk-ld-input") as HTMLInputElement, "field");
  field.placeholder = "Ask anything";
  field.readOnly = true;
  const send = target(el("button", "pk-ld-send", iconNode("send", 13)), "send");
  const root = el(
    "div",
    "pk pk-ld",
    el("div", "pk-ld-thread", question, answer),
    el("div", "pk-ld-bar", field, send),
  );
  let dots: ReturnType<typeof createThinkingDots> | undefined;
  const ensure = once(() => {
    dots = createThinkingDots(canvas, { size: 22 });
  });
  const reset = () => {
    ensure();
    field.value = "";
    root.removeAttribute("data-step");
  };
  return {
    root,
    label:
      "A question is sent, a dot loader thinks, and the answer replaces it.",
    rest: { x: 196, y: 92 },
    reset,
    still() {
      reset();
      question.textContent = "Plan a weekend trip";
      root.setAttribute("data-step", "thinking");
    },
    async script(act) {
      await act.move("field");
      await act.type("field", "Plan a weekend trip");
      await act.wait(200);
      await act.click("send");
      question.textContent = field.value;
      field.value = "";
      root.setAttribute("data-step", "thinking");
      await act.move({ x: 200, y: 96 });
      await act.wait(2300);
      root.setAttribute("data-step", "answer");
      await act.wait(1800);
      root.setAttribute("data-step", "clear");
      await act.wait(300);
    },
    cleanup: () => dots?.destroy(),
  };
}

function shadows(): Scene {
  const card = target(
    el(
      "span",
      "pk-sh-card re-shadow-ring-sm",
      img(pick(photos, 5)),
      el("span", "pk-sh-lines", el("i"), el("i")),
    ),
    "card",
  );
  const root = el("div", "pk pk-sh", card);
  const drop = () => {
    card.classList.replace("re-shadow-ring-xl", "re-shadow-ring-sm");
    card.removeAttribute("data-lifted");
  };
  return {
    root,
    label:
      "A pointer picks up a card, its shadow deepens, and it settles back down.",
    rest: { x: 204, y: 130 },
    reset: drop,
    async script(act) {
      await act.press("card");
      card.classList.replace("re-shadow-ring-sm", "re-shadow-ring-xl");
      card.setAttribute("data-lifted", "");
      await act.wait(900);
      await act.release();
      drop();
      await act.wait(900);
    },
  };
}

function gradients(): Scene {
  const scrim = (eased: boolean) => {
    const layer = el("span", eased ? "pk-gr-scrim pk-gr-eased" : "pk-gr-scrim");
    layer.style.backgroundImage = eased
      ? easingGradient({
          to: "rgb(0 0 0 / 0.8)",
          easing: "ease-in-out-sine",
          direction: "to bottom",
        })
      : "linear-gradient(to bottom, transparent, rgb(0 0 0 / 0.8))";
    return layer;
  };
  const handle = target(el("span", "pk-gr-handle"), "split");
  const photo = el(
    "div",
    "pk-gr-photo",
    img(pick(photos, 4)),
    scrim(false),
    scrim(true),
    el("span", "pk-gr-tag", "Linear"),
    el("span", "pk-gr-tag pk-gr-tag-eased", "Eased"),
    el("b", "", photos[4].caption),
    el("span", "pk-gr-split", handle),
  );
  const root = el("div", "pk pk-gr", photo);
  let dragging = false;
  const split = (x: number) => photo.style.setProperty("--pk-split", `${x}px`);
  handle.addEventListener("pointerdown", () => {
    dragging = true;
  });
  root.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const box = photo.getBoundingClientRect();
    split(Math.min(box.width - 18, Math.max(18, event.clientX - box.left)));
  });
  root.addEventListener("pointerup", () => {
    dragging = false;
  });
  const reset = () => {
    dragging = false;
    split(108);
  };
  return {
    root,
    label:
      "A divider slides across a photo's dark fade: a linear ramp shows a hard edge, the eased one does not.",
    rest: { x: 168, y: 138 },
    reset,
    async script(act) {
      await act.press("split");
      await act.move({ x: 46, y: 74 }, { duration: 900 });
      await act.wait(700);
      await act.move({ x: 196, y: 70 }, { duration: 1300 });
      await act.wait(700);
      await act.move({ x: 120, y: 74 }, { duration: 800 });
      await act.release();
      await act.wait(400);
    },
  };
}

function cursorPreview(): Scene {
  const names = portraits.slice(0, 3).map((picture) => picture.caption);
  const rows = names.map((name, i) =>
    target(
      el(
        "span",
        "pk-cp-row",
        el("small", "", String(i + 1).padStart(2, "0")),
        el("b", "", name),
      ),
      `row-${i}`,
    ),
  );
  const pictures = names.map((_, i) => img(pick(portraits, i)));
  const photo = el("span", "pk-cp-photo", ...pictures);
  const list = el("div", "pk-cp-list", ...rows);
  const root = el("div", "pk pk-cp", list, photo);
  let lastX = 0;
  const place = (event: PointerEvent) => {
    const box = root.getBoundingClientRect();
    const scale = box.width / WIDTH || 1;
    const x = (event.clientX - box.left) / scale;
    const y = (event.clientY - box.top) / scale;
    const lean = Math.max(-8, Math.min(8, (x - lastX) * 0.5));
    lastX = x;
    photo.style.translate = `${x + 12}px ${y - 20}px`;
    photo.style.rotate = `${lean}deg`;
  };
  const show = (event: PointerEvent) => {
    const row = (event.target as Element).closest(".pk-cp-row");
    if (!(row instanceof HTMLElement)) return;
    const index = rows.indexOf(row);
    for (const [i, picture] of pictures.entries())
      picture.toggleAttribute("data-on", i === index);
    if (!root.hasAttribute("data-open")) {
      photo.style.transition = "none";
      place(event);
      void photo.offsetWidth;
      photo.style.transition = "";
    }
    root.setAttribute("data-open", "");
  };
  list.addEventListener("pointerover", show);
  root.addEventListener("pointermove", place);
  list.addEventListener("pointerleave", () =>
    root.removeAttribute("data-open"),
  );
  const reset = () => {
    root.removeAttribute("data-open");
    for (const picture of pictures) picture.removeAttribute("data-on");
  };
  return {
    root,
    label:
      "A pointer moves down a list, and a picture of each row rides beside it and swaps as it goes.",
    rest: { x: 206, y: 136 },
    reset,
    async script(act) {
      await act.move("row-0");
      await act.wait(700);
      await act.move("row-1", { duration: 520 });
      await act.wait(600);
      await act.move("row-2", { duration: 520 });
      await act.wait(800);
      await act.move({ x: 206, y: 136 });
      await act.wait(500);
    },
  };
}

function demoStage(): Scene {
  const share = target(
    el("button", "pk-ds-share", iconNode("share", 12), "Share"),
    "share",
  );
  const label = el("span", "", "Copy link");
  const link = target(
    el("button", "pk-ds-link", iconNode("link", 12), label),
    "link",
  );
  const root = el(
    "div",
    "pk pk-ds",
    el(
      "div",
      "pk-ds-card re-shadow-ring-sm",
      el("span", "pk-ds-bar", el("b", "", "Moodboard"), share),
      el(
        "span",
        "pk-ds-body",
        img(photo("monstera")),
        img(photo("white-grid")),
        img(photo("cube-and-squash")),
      ),
    ),
    el("div", "pk-ds-pop re-shadow-ring-lg", link),
  );
  const reset = () => {
    root.removeAttribute("data-open");
    link.removeAttribute("data-done");
    label.textContent = "Copy link";
  };
  return {
    root,
    label: "A scripted pointer opens a share menu and copies a link.",
    rest: { x: 70, y: 132 },
    reset,
    async script(act) {
      await act.click("share");
      root.setAttribute("data-open", "");
      await act.wait(450);
      await act.click("link");
      link.setAttribute("data-done", "");
      label.textContent = "Link copied";
      await act.move({ x: 120, y: 132 });
      await act.wait(1100);
      await act.click("share");
      reset();
      await act.wait(400);
    },
  };
}

const scenes: Record<MenuSlug, () => Scene> = {
  lightbox,
  carousel,
  annotations,
  "justified-gallery": justified,
  masonry,
  avatars,
  "floating-tooltip": tooltip,
  "moving-highlight": highlight,
  "hold-to-confirm": hold,
  "copy-button": copy,
  loaders,
  shadows,
  "easing-gradients": gradients,
  "cursor-preview": cursorPreview,
  "demo-stage": demoStage,
};

export function createLibraryPeek() {
  const panes = new Map<MenuSlug, HTMLElement>();
  const cleanups: (() => void)[] = [];
  return {
    pane(slug: MenuSlug) {
      let pane = panes.get(slug);
      if (!pane) {
        const library = menuLibrary(slug);
        const scene = scenes[slug]();
        const stage = createStage(scene.root, {
          width: WIDTH,
          height: HEIGHT,
          label: scene.label,
          script: scene.script,
          reset: scene.reset,
          still: scene.still,
          rest: scene.rest,
          delay: 250,
        });
        cleanups.push(() => {
          stage.destroy();
          scene.cleanup?.();
        });
        pane = el(
          "div",
          "w-60 font-sans tracking-tight",
          scene.root,
          el(
            "p",
            "grid px-1.5 pt-2 pb-1 text-caption whitespace-nowrap",
            el("span", "font-medium", library.name),
            el(
              "code",
              "font-mono text-caption text-subtle-foreground",
              library.packageName,
            ),
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
