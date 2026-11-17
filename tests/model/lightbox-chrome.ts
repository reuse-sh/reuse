import {
  type ChromeInput,
  initialChrome,
  stepChrome,
} from "../../packages/lightbox/src/chrome.js";
import type { World } from "./explore.js";

export function lightboxChrome(): World {
  let model = initialChrome(true);
  let focused = false;
  let hovered = false;
  let x = 0;
  const send = (input: ChromeInput) => {
    const hides =
      input.type === "idle" ||
      input.type === "tap" ||
      input.type === "zoom" ||
      input.type === "pinch";
    model = stepChrome(model, input, hides && (focused || hovered));
  };
  const moveBy = (distance: number) => {
    x += distance;
    send({
      type: "move",
      point: { x, y: 0 },
      movement: { x: distance, y: 0 },
    });
  };
  return {
    steps: {
      "mouse moves 20px": () => moveBy(20),
      "mouse moves 30px": () => moveBy(30),
      timer: () => {
        if (model.timer) send({ type: "idle" });
      },
      key: () => send({ type: "key" }),
      "focus inside": () => {
        focused = true;
        send({ type: "focus" });
      },
      "focus leaves": () => {
        focused = false;
      },
      "hover a control": () => {
        hovered = true;
      },
      "leave the control": () => {
        hovered = false;
      },
      tap: () => send({ type: "tap" }),
      touch: () => send({ type: "touch" }),
      zoom: () => send({ type: "zoom" }),
      unzoom: () => send({ type: "unzoom" }),
      pinch: () => send({ type: "pinch" }),
      close: () => send({ type: "close" }),
    },
    checks: {
      "a focused control is never hidden": () =>
        model.closed || !focused || model.chrome === "shown",
      "no timer runs after close": () => !model.closed || !model.timer,
      "hidden controls run no hide timer": () =>
        model.chrome === "shown" || !model.timer,
    },
    fingerprint: () =>
      JSON.stringify({
        ...model,
        pointer: null,
        hiddenAt: model.hiddenAt ? x - model.hiddenAt.x : null,
        focused,
        hovered,
      }),
  };
}
