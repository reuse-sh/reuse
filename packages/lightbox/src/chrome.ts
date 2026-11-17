import type { Point } from "./geometry.js";

export type ChromeInput =
  | { type: "move"; point: Point; movement: Point }
  | { type: "idle" }
  | { type: "key" }
  | { type: "focus" }
  | { type: "tap" }
  | { type: "zoom" }
  | { type: "unzoom" }
  | { type: "pinch" }
  | { type: "touch" }
  | { type: "close" };

export interface ChromeModel {
  readonly chrome: "shown" | "hidden";
  readonly hiddenAt: Point | null;
  readonly pointer: Point | null;
  readonly lastPointerIsMouse: boolean;
  readonly timer: boolean;
  readonly closed: boolean;
}

export const SHOW_DISTANCE = 24;

export function initialChrome(lastPointerIsMouse: boolean): ChromeModel {
  return {
    chrome: "shown",
    hiddenAt: null,
    pointer: null,
    lastPointerIsMouse,
    timer: lastPointerIsMouse,
    closed: false,
  };
}

export function stepChrome(
  model: ChromeModel,
  input: ChromeInput,
  controlInUse: boolean,
): ChromeModel {
  if (model.closed) return model;
  const show = (from: ChromeModel): ChromeModel => ({
    ...from,
    chrome: "shown",
    hiddenAt: null,
    timer: from.lastPointerIsMouse,
  });
  const hide = (from: ChromeModel): ChromeModel =>
    controlInUse
      ? { ...from, timer: from.lastPointerIsMouse }
      : { ...from, chrome: "hidden", hiddenAt: from.pointer, timer: false };
  switch (input.type) {
    case "move": {
      const next = { ...model, pointer: input.point, lastPointerIsMouse: true };
      if (model.chrome === "shown") return { ...next, timer: true };
      const hiddenAt = model.hiddenAt ?? {
        x: input.point.x - input.movement.x,
        y: input.point.y - input.movement.y,
      };
      return Math.hypot(
        input.point.x - hiddenAt.x,
        input.point.y - hiddenAt.y,
      ) >= SHOW_DISTANCE
        ? show(next)
        : { ...next, hiddenAt };
    }
    case "idle":
      return model.chrome === "shown" ? hide(model) : model;
    case "key":
    case "focus":
    case "unzoom":
      return show(model);
    case "tap":
      return model.chrome === "shown" ? hide(model) : show(model);
    case "zoom":
    case "pinch":
      return model.chrome === "shown" ? hide(model) : model;
    case "touch":
      return { ...model, lastPointerIsMouse: false, timer: false };
    case "close":
      return { ...model, timer: false, closed: true };
  }
}
