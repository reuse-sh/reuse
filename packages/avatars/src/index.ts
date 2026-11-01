export type AvatarCorner = "top-right" | "bottom-right";
export type AvatarBadge =
  | { type: "dot"; label: string; corner?: AvatarCorner }
  | { type: "count"; count: number; label: string; corner?: AvatarCorner }
  | { type: "icon"; icon: string | Node; label: string; corner?: AvatarCorner };

export interface AvatarOptions {
  name: string;
  src?: string;
  size?: number;
  badge?: AvatarBadge;
}

export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/u).filter(Boolean);
  if (!words.length) return "?";
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  const graphemes = (word: string) =>
    Array.from(segmenter.segment(word), (segment) => segment.segment);
  if (words.length === 1)
    return graphemes(words[0]).slice(0, 2).join("").toLocaleUpperCase();
  return [graphemes(words[0])[0], graphemes(words[words.length - 1])[0]]
    .join("")
    .toLocaleUpperCase();
}

export interface Cutout {
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number;
}

export function getCutoutMask(
  width: number,
  height: number,
  cutouts: readonly Cutout[],
): string {
  if (![width, height].every((value) => Number.isFinite(value) && value > 0))
    return "none";
  const holes = cutouts
    .map((cutout) => {
      if (
        ![
          cutout.x,
          cutout.y,
          cutout.width,
          cutout.height,
          cutout.radius ?? 0,
        ].every(Number.isFinite) ||
        cutout.width <= 0 ||
        cutout.height <= 0
      )
        throw new RangeError("Cutout geometry must be finite and positive.");
      return `<rect x="${cutout.x}" y="${cutout.y}" width="${cutout.width}" height="${cutout.height}" rx="${cutout.radius ?? cutout.height / 2}" fill="black"/>`;
    })
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><mask id="cutout"><rect width="100%" height="100%" fill="white"/>${holes}</mask><rect width="100%" height="100%" fill="white" mask="url(#cutout)"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function createMaskSlot(element: HTMLElement, property: string) {
  const value = element.style.getPropertyValue(property);
  const priority = element.style.getPropertyPriority(property);
  const originalStyle = element.getAttribute("style");
  const originalCssText = element.style.cssText;
  return {
    set(mask: string) {
      element.style.setProperty(property, mask);
    },
    restore() {
      if (value) element.style.setProperty(property, value, priority);
      else element.style.removeProperty(property);
      if (originalStyle !== null && element.style.cssText === originalCssText)
        element.setAttribute("style", originalStyle);
      else if (!element.style.length) element.removeAttribute("style");
    },
  };
}

export function enhanceAvatar(root: HTMLElement) {
  const view = root.ownerDocument.defaultView;
  if (!view) throw new Error("The avatar must belong to a window.");
  const face = root.querySelector<HTMLElement>("[data-reuse-avatar-face]");
  const badge = root.querySelector<HTMLElement>("[data-reuse-avatar-badge]");
  const image = root.querySelector<HTMLImageElement>("img");
  const badgeMask = face
    ? createMaskSlot(face, "--reuse-avatar-badge-mask")
    : null;
  const originalImageStyle = image?.getAttribute("style") ?? null;
  let destroyed = false;
  const refresh = () => {
    if (destroyed) return;
    if (face && badge) {
      const box = face.getBoundingClientRect();
      const indicator = badge.getBoundingClientRect();
      const width = face.offsetWidth || box.width;
      const height = face.offsetHeight || box.height;
      const scaleX = box.width && width ? box.width / width : 1;
      const scaleY = box.height && height ? box.height / height : 1;
      const clearance = Number.parseFloat(
        view
          .getComputedStyle(root)
          .getPropertyValue("--reuse-avatar-clearance"),
      );
      const gap = Number.isFinite(clearance) && clearance >= 0 ? clearance : 2;
      const badgeWidth = indicator.width / scaleX;
      const badgeHeight = indicator.height / scaleY;
      const mask = getCutoutMask(width, height, [
        {
          x: (indicator.left - box.left) / scaleX - gap,
          y: (indicator.top - box.top) / scaleY - gap,
          width: badgeWidth + gap * 2,
          height: badgeHeight + gap * 2,
          radius: badgeHeight / 2 + gap,
        },
      ]);
      badgeMask?.set(mask);
    }
  };
  const load = () => {
    if (image)
      image.style.visibility = image.naturalWidth > 0 ? "visible" : "hidden";
  };
  const error = () => {
    if (image) image.style.visibility = "hidden";
  };
  if (image) {
    image.style.visibility = "hidden";
    image.addEventListener("load", load);
    image.addEventListener("error", error);
    if (image.complete) load();
  }
  const observer =
    typeof view.ResizeObserver === "function"
      ? new view.ResizeObserver(refresh)
      : null;
  observer?.observe(root);
  if (badge) observer?.observe(badge);
  view.addEventListener("resize", refresh);
  refresh();
  return {
    refresh,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      observer?.disconnect();
      view.removeEventListener("resize", refresh);
      image?.removeEventListener("load", load);
      image?.removeEventListener("error", error);
      badgeMask?.restore();
      if (image) {
        if (originalImageStyle === null) image.removeAttribute("style");
        else image.setAttribute("style", originalImageStyle);
      }
    },
  };
}

export function createAvatar(root: HTMLElement, options: AvatarOptions) {
  const { name, src, size = 40, badge } = options;
  if (!Number.isFinite(size) || size <= 0)
    throw new RangeError("Avatar size must be positive.");
  if (
    badge?.type === "count" &&
    (!Number.isSafeInteger(badge.count) || badge.count < 0)
  )
    throw new RangeError("Badge count must be a nonnegative safe integer.");
  const previous = {
    style: root.getAttribute("style"),
    class: root.getAttribute("class"),
    label: root.getAttribute("aria-label"),
    role: root.getAttribute("role"),
    slot: root.getAttribute("data-reuse-avatar"),
  };
  const children = Array.from(root.childNodes);
  root.replaceChildren();
  root.classList.add("reuse-avatar");
  root.setAttribute("data-reuse-avatar", "");
  root.setAttribute("role", "img");
  root.setAttribute(
    "aria-label",
    [name || "Unknown person", badge?.label].filter(Boolean).join(", "),
  );
  root.style.setProperty("--reuse-avatar-size", `${size}px`);
  const face = root.ownerDocument.createElement("span");
  face.className = "reuse-avatar-face";
  face.setAttribute("data-reuse-avatar-face", "");
  face.setAttribute("aria-hidden", "true");
  face.textContent = getInitials(name);
  if (src) {
    const image = root.ownerDocument.createElement("img");
    image.src = src;
    image.alt = "";
    image.decoding = "async";
    image.className = "reuse-avatar-image";
    face.append(image);
  }
  root.append(face);
  if (badge) {
    const indicator = root.ownerDocument.createElement("span");
    indicator.className = "reuse-avatar-badge";
    indicator.setAttribute("data-reuse-avatar-badge", badge.type);
    indicator.setAttribute("data-corner", badge.corner ?? "bottom-right");
    indicator.setAttribute("aria-hidden", "true");
    if (badge.type === "count") indicator.textContent = String(badge.count);
    if (badge.type === "icon") {
      if (typeof badge.icon === "string") indicator.textContent = badge.icon;
      else indicator.append(badge.icon);
    }
    root.append(indicator);
  }
  const controller = enhanceAvatar(root);
  let destroyed = false;
  return {
    refresh: controller.refresh,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      controller.destroy();
      root.replaceChildren(...children);
      for (const [attribute, value] of [
        ["style", previous.style],
        ["class", previous.class],
        ["aria-label", previous.label],
        ["role", previous.role],
        ["data-reuse-avatar", previous.slot],
      ] as const) {
        if (value === null) root.removeAttribute(attribute);
        else root.setAttribute(attribute, value);
      }
    },
  };
}

export interface AvatarGroupOptions {
  overlap?: number;
  clearance?: number;
}

export function createAvatarGroup(
  root: HTMLElement,
  options: AvatarGroupOptions = {},
) {
  const view = root.ownerDocument.defaultView;
  if (!view) throw new Error("The group must belong to a window.");
  const overlap = options.overlap ?? 12;
  const clearance = options.clearance ?? 2;
  if (
    ![overlap, clearance].every((value) => Number.isFinite(value) && value >= 0)
  )
    throw new RangeError("Group spacing must be nonnegative.");
  const previousStyle = root.getAttribute("style");
  const hadClass = root.classList.contains("reuse-avatar-group");
  const masks = new Map<HTMLElement, ReturnType<typeof createMaskSlot>>();
  root.classList.add("reuse-avatar-group");
  root.style.setProperty("--reuse-avatar-overlap", `${overlap}px`);
  let destroyed = false;
  const faceOf = (avatar: HTMLElement) =>
    avatar.querySelector<HTMLElement>("[data-reuse-avatar-face]") ?? avatar;
  const refresh = () => {
    if (destroyed) return;
    const avatars = Array.from(root.children).filter(
      (child): child is HTMLElement =>
        child instanceof view.HTMLElement &&
        child.hasAttribute("data-reuse-avatar"),
    );
    const faces = avatars.map(faceOf);
    for (const [face, mask] of masks)
      if (!faces.includes(face)) {
        mask.restore();
        masks.delete(face);
      }
    faces.forEach((face, index) => {
      let slot = masks.get(face);
      if (!slot) {
        slot = createMaskSlot(
          face,
          face.hasAttribute("data-reuse-avatar-face")
            ? "--reuse-avatar-group-mask"
            : "mask-image",
        );
        masks.set(face, slot);
      }
      slot.set("linear-gradient(black, black)");
      const next = faces[index + 1];
      if (!next) return;
      const box = face.getBoundingClientRect();
      const nextBox = next.getBoundingClientRect();
      const width = face.offsetWidth || box.width;
      const height = face.offsetHeight || box.height;
      const scaleX = box.width && width ? box.width / width : 1;
      const scaleY = box.height && height ? box.height / height : 1;
      const mask = getCutoutMask(width, height, [
        {
          x: (nextBox.left - box.left) / scaleX - clearance,
          y: (nextBox.top - box.top) / scaleY - clearance,
          width: nextBox.width / scaleX + 2 * clearance,
          height: nextBox.height / scaleY + 2 * clearance,
          radius:
            Math.min(nextBox.width / scaleX, nextBox.height / scaleY) / 2 +
            clearance,
        },
      ]);
      slot.set(mask);
    });
    for (const avatar of observed)
      if (!avatars.includes(avatar)) {
        resizeObserver?.unobserve(avatar);
        observed.delete(avatar);
      }
    for (const avatar of avatars)
      if (!observed.has(avatar)) {
        resizeObserver?.observe(avatar);
        observed.add(avatar);
      }
  };
  const observed = new Set<HTMLElement>();
  const resizeObserver =
    typeof view.ResizeObserver === "function"
      ? new view.ResizeObserver(refresh)
      : null;
  resizeObserver?.observe(root);
  const mutations = new view.MutationObserver(refresh);
  mutations.observe(root, { childList: true });
  view.addEventListener("resize", refresh);
  refresh();
  return {
    refresh,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      resizeObserver?.disconnect();
      mutations.disconnect();
      view.removeEventListener("resize", refresh);
      for (const mask of masks.values()) mask.restore();
      if (!hadClass) root.classList.remove("reuse-avatar-group");
      if (previousStyle === null) root.removeAttribute("style");
      else root.setAttribute("style", previousStyle);
    },
  };
}
