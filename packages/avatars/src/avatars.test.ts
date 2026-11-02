// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createAvatar,
  createAvatarGroup,
  enhanceAvatar,
  getCutoutMask,
  getInitials,
} from "./index.js";

const controllers: Array<{ destroy(): void }> = [];
const resizeInstances: Array<{
  callback: ResizeObserverCallback;
  disconnected: boolean;
}> = [];
function rect(
  node: Element,
  left: number,
  top: number,
  width: number,
  height: number,
) {
  Object.defineProperty(node, "getBoundingClientRect", {
    value: () => ({
      left,
      top,
      width,
      height,
      right: left + width,
      bottom: top + height,
      x: left,
      y: top,
      toJSON() {},
    }),
    configurable: true,
  });
}
function cutout(node: HTMLElement) {
  const clip = node.style.clipPath;
  const hole = clip.slice(clip.indexOf("Z") + 1);
  const n = hole.match(/-?[\d.]+/g)?.map(Number);
  if (!clip.startsWith("path(evenodd") || !n) return null;
  const x = n[0] - n[3];
  return { x, y: n[1], width: n[8] - x, height: n[17] - n[1], radius: n[3] };
}
beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      record: { callback: ResizeObserverCallback; disconnected: boolean };
      constructor(callback: ResizeObserverCallback) {
        this.record = { callback, disconnected: false };
        resizeInstances.push(this.record);
      }
      observe() {}
      unobserve() {}
      disconnect() {
        this.record.disconnected = true;
      }
    },
  );
});
afterEach(() => {
  for (const controller of controllers.splice(0)) controller.destroy();
  document.body.replaceChildren();
  resizeInstances.splice(0);
  vi.unstubAllGlobals();
});

describe("initials", () => {
  it.each([
    ["Ada Lovelace", "AL"],
    ["  Émile   Zola ", "ÉZ"],
    ["👩🏽‍💻 Alex", "👩🏽‍💻A"],
    ["e\u0301lodie", "E\u0301L"],
    ["李", "李"],
    ["", "?"],
  ])("preserves graphemes for %s", (name, result) => {
    expect(getInitials(name)).toBe(result);
  });
});

describe("avatar", () => {
  it("keeps initials beneath images and recovers after an image error", () => {
    const root = document.createElement("span");
    document.body.append(root);
    controllers.push(
      createAvatar(root, {
        name: "Ada Lovelace",
        src: "/portrait.webp",
        badge: { type: "dot", label: "Online" },
      }),
    );
    expect(root.getAttribute("aria-label")).toBe("Ada Lovelace, Online");
    expect(root.querySelector("[data-re-avatar-face]")?.textContent).toBe("AL");
    const image = root.querySelector("img");
    if (!image) throw new Error("Image is missing");
    expect(image.style.visibility).toBe("hidden");
    Object.defineProperty(image, "naturalWidth", { value: 128 });
    image.dispatchEvent(new Event("load"));
    expect(image.style.visibility).toBe("visible");
    image.dispatchEvent(new Event("error"));
    expect(image.style.visibility).toBe("hidden");
    expect(root.querySelector("[data-re-avatar-face]")?.textContent).toBe("AL");
  });
  it("cuts the full width of a three-digit pill with transparent SVG geometry", () => {
    document.body.innerHTML =
      '<span><span data-re-avatar-face>AL</span><span data-re-avatar-badge="count">128</span></span>';
    const root = document.body.firstElementChild as HTMLElement;
    const face = root.children[0] as HTMLElement;
    const badge = root.children[1] as HTMLElement;
    rect(face, 100, 100, 48, 48);
    rect(badge, 116, 130, 32, 18);
    const controller = enhanceAvatar(root);
    controllers.push(controller);
    expect(cutout(face)).toEqual({
      x: 14,
      y: 28,
      width: 36,
      height: 22,
      radius: 11,
    });
    rect(badge, 108, 130, 40, 18);
    controller.refresh();
    expect(cutout(face)).toEqual({
      x: 6,
      y: 28,
      width: 44,
      height: 22,
      radius: 11,
    });
    expect(face.style.backgroundColor).toBe("");
    controller.destroy();
    expect(face.hasAttribute("style")).toBe(false);
  });
  it("keeps zero-clearance badge cutouts aligned inside scaled avatars", () => {
    document.body.innerHTML =
      '<span style="--re-avatar-clearance: 0"><span data-re-avatar-face>AL</span><span data-re-avatar-badge="count">128</span></span>';
    const root = document.body.firstElementChild as HTMLElement;
    const face = root.children[0] as HTMLElement;
    const badge = root.children[1] as HTMLElement;
    rect(face, 100, 100, 96, 96);
    Object.defineProperty(face, "offsetWidth", { value: 48 });
    Object.defineProperty(face, "offsetHeight", { value: 48 });
    rect(badge, 150, 160, 64, 36);
    controllers.push(enhanceAvatar(root));
    expect(cutout(face)).toEqual({
      x: 25,
      y: 30,
      width: 32,
      height: 18,
      radius: 9,
    });
  });
  it("uses scaled geometry and restores native content, styles and listeners", () => {
    document.body.innerHTML =
      '<span style="color: red" class="host">Original</span>';
    const root = document.body.firstElementChild as HTMLElement;
    const controller = createAvatar(root, {
      name: "Example Person",
      size: 48,
      src: "/portrait.webp",
      badge: {
        type: "count",
        count: 128,
        label: "128 unread messages",
        corner: "top-right",
      },
    });
    controllers.push(controller);
    expect(
      root.querySelector('[data-re-avatar-badge="count"]')?.textContent,
    ).toBe("128");
    const image = root.querySelector("img");
    controller.destroy();
    expect(root.outerHTML).toBe(
      '<span style="color: red" class="host">Original</span>',
    );
    image?.dispatchEvent(new Event("load"));
    expect(root.textContent).toBe("Original");
    expect(resizeInstances.every((instance) => instance.disconnected)).toBe(
      true,
    );
  });
  it("accepts text and DOM icons without interpreting text as HTML", () => {
    const first = document.createElement("span");
    const second = document.createElement("span");
    document.body.append(first, second);
    controllers.push(
      createAvatar(first, {
        name: "Example Person",
        badge: { type: "icon", icon: "<svg onload=alert(1)>", label: "Admin" },
      }),
    );
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    controllers.push(
      createAvatar(second, {
        name: "Example Person",
        badge: { type: "icon", icon, label: "Admin" },
      }),
    );
    expect(first.querySelector("svg")).toBe(null);
    expect(first.querySelector("[data-re-avatar-badge]")?.textContent).toBe(
      "<svg onload=alert(1)>",
    );
    expect(second.querySelector("svg")).toBe(icon);
  });
  it("rejects invalid sizes and counters before changing a host", () => {
    const root = document.createElement("span");
    root.textContent = "Original";
    expect(() => createAvatar(root, { name: "Example", size: 0 })).toThrow(
      RangeError,
    );
    expect(() =>
      createAvatar(root, {
        name: "Example",
        badge: { type: "count", count: -1, label: "Unread" },
      }),
    ).toThrow(RangeError);
    expect(root.outerHTML).toBe("<span>Original</span>");
    expect(getCutoutMask(0, 10, [])).toBe("none");
    expect(() =>
      getCutoutMask(48, 48, [{ x: NaN, y: 0, width: 10, height: 10 }]),
    ).toThrow(RangeError);
  });
});

describe("avatar group", () => {
  it("removes the next avatar's circle rather than drawing a background ring", async () => {
    document.body.innerHTML =
      '<span style="color: red"><span data-re-avatar style="color: blue"></span><span data-re-avatar></span></span>';
    const root = document.body.firstElementChild as HTMLElement;
    const first = root.children[0] as HTMLElement;
    const second = root.children[1] as HTMLElement;
    rect(root, 0, 0, 84, 48);
    rect(first, 0, 0, 48, 48);
    rect(second, 36, 0, 48, 48);
    const controller = createAvatarGroup(root, { overlap: 12, clearance: 2 });
    controllers.push(controller);
    expect(root.style.getPropertyValue("--re-avatar-overlap")).toBe("12px");
    expect(cutout(first)).toEqual({
      x: 34,
      y: -2,
      width: 52,
      height: 52,
      radius: 26,
    });
    expect(second.style.clipPath).toBe("");
    second.remove();
    await Promise.resolve();
    expect(first.style.clipPath).toBe("");
    expect(second.hasAttribute("style")).toBe(false);
    controller.destroy();
    expect(root.getAttribute("style")).toBe("color: red");
    expect(first.getAttribute("style")).toBe("color: blue");
    expect(resizeInstances.every((instance) => instance.disconnected)).toBe(
      true,
    );
  });
  it("supports RTL geometry and clears cutouts for dynamically removed children", () => {
    document.body.innerHTML =
      '<span dir="rtl"><span data-re-avatar></span><span data-re-avatar></span></span>';
    const root = document.body.firstElementChild as HTMLElement;
    const first = root.children[0] as HTMLElement;
    const second = root.children[1] as HTMLElement;
    rect(first, 36, 0, 48, 48);
    rect(second, 0, 0, 48, 48);
    const controller = createAvatarGroup(root);
    controllers.push(controller);
    expect(cutout(first)).toMatchObject({
      x: -38,
      y: -2,
      width: 52,
      height: 52,
    });
    controller.destroy();
    expect(first.hasAttribute("style")).toBe(false);
    expect(second.hasAttribute("style")).toBe(false);
  });
});

describe("composed avatar cutouts", () => {
  it("cuts the badge from the face and the whole avatar, badge included, around the next one", () => {
    document.body.innerHTML =
      '<span><span data-re-avatar><span data-re-avatar-face>AL</span><span data-re-avatar-badge="count">128</span></span><span data-re-avatar><span data-re-avatar-face>SF</span></span></span>';
    const root = document.body.firstElementChild as HTMLElement;
    const first = root.children[0] as HTMLElement;
    const second = root.children[1] as HTMLElement;
    const face = first.children[0] as HTMLElement;
    const badge = first.children[1] as HTMLElement;
    rect(first, 0, 0, 48, 48);
    rect(second, 36, 0, 48, 48);
    rect(face, 0, 0, 48, 48);
    rect(second.children[0], 36, 0, 48, 48);
    rect(badge, 25, 32, 32, 18);
    controllers.push(enhanceAvatar(first));
    controllers.push(createAvatarGroup(root));
    expect(cutout(face)).toEqual({
      x: 23,
      y: 30,
      width: 36,
      height: 22,
      radius: 11,
    });
    expect(cutout(first)).toEqual({
      x: 34,
      y: -2,
      width: 52,
      height: 52,
      radius: 26,
    });
    expect(badge.style.clipPath).toBe("");
  });
  it.each(["badge", "group"] as const)(
    "restores the %s cutout without removing the other",
    (kind) => {
      document.body.innerHTML =
        '<span><span data-re-avatar><span data-re-avatar-face>AL</span><span data-re-avatar-badge="dot"></span></span><span data-re-avatar><span data-re-avatar-face>SF</span></span></span>';
      const root = document.body.firstElementChild as HTMLElement;
      const first = root.children[0] as HTMLElement;
      const second = root.children[1] as HTMLElement;
      const face = first.children[0] as HTMLElement;
      rect(first, 0, 0, 48, 48);
      rect(second, 36, 0, 48, 48);
      rect(face, 0, 0, 48, 48);
      rect(second.children[0], 36, 0, 48, 48);
      rect(first.children[1], 36, 36, 10, 10);
      const avatar = enhanceAvatar(first);
      const group = createAvatarGroup(root);
      controllers.push(avatar, group);
      const firstController = kind === "badge" ? avatar : group;
      const lastController = kind === "badge" ? group : avatar;
      const [removed, kept] = kind === "badge" ? [face, first] : [first, face];
      firstController.destroy();
      expect(cutout(kept)).not.toBeNull();
      expect(removed.style.clipPath).toBe("");
      lastController.destroy();
      expect(face.hasAttribute("style")).toBe(false);
      expect(first.hasAttribute("style")).toBe(false);
    },
  );
});
