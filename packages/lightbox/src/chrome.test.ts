import { describe, expect, it } from "vitest";
import { explore } from "../../../tests/model/explore.js";
import { lightboxChrome } from "../../../tests/model/lightbox-chrome.js";
import {
  type ChromeInput,
  type ChromeModel,
  initialChrome,
  stepChrome,
} from "./chrome.js";

const move = (x: number, y = 0, movement = { x: 0, y: 0 }): ChromeInput => ({
  type: "move",
  point: { x, y },
  movement,
});

function run(model: ChromeModel, inputs: ChromeInput[], inUse = false) {
  return inputs.reduce(
    (current, input) => stepChrome(current, input, inUse),
    model,
  );
}

describe("chrome machine", () => {
  it("hides a still mouse's controls when the timer fires and shows them only past 24px", () => {
    const hidden = run(initialChrome(true), [move(500, 300), { type: "idle" }]);
    expect(hidden).toMatchObject({ chrome: "hidden", timer: false });
    expect(run(hidden, [move(520, 300)]).chrome).toBe("hidden");
    const shown = run(hidden, [move(530, 300)]);
    expect(shown).toMatchObject({ chrome: "shown", timer: true });
  });

  it("measures the first move after an unseen hide from where that move started", () => {
    const hidden = run(initialChrome(true), [{ type: "idle" }]);
    expect(run(hidden, [move(520, 0, { x: 20, y: 0 })]).chrome).toBe("hidden");
    expect(run(hidden, [move(530, 0, { x: 30, y: 0 })]).chrome).toBe("shown");
  });

  it("keeps the controls and re-arms the timer while a control is in use", () => {
    const held = stepChrome(initialChrome(true), { type: "idle" }, true);
    expect(held).toMatchObject({ chrome: "shown", timer: true });
    expect(stepChrome(held, { type: "zoom" }, true).chrome).toBe("shown");
    expect(stepChrome(held, { type: "tap" }, true).chrome).toBe("shown");
  });

  it("toggles on a tap without a timer, hides on zoom and pinch, and shows on unzoom and keys", () => {
    const touch = run(initialChrome(true), [{ type: "touch" }]);
    expect(touch.timer).toBe(false);
    const tapped = run(touch, [{ type: "tap" }]);
    expect(tapped).toMatchObject({ chrome: "hidden", timer: false });
    expect(run(tapped, [{ type: "tap" }])).toMatchObject({
      chrome: "shown",
      timer: false,
    });
    expect(run(touch, [{ type: "zoom" }]).chrome).toBe("hidden");
    expect(run(touch, [{ type: "pinch" }]).chrome).toBe("hidden");
    expect(run(touch, [{ type: "zoom" }, { type: "unzoom" }]).chrome).toBe(
      "shown",
    );
    expect(run(touch, [{ type: "zoom" }, { type: "key" }]).chrome).toBe(
      "shown",
    );
  });

  it("stops the timer and ignores input once closed", () => {
    const closed = run(initialChrome(true), [{ type: "close" }]);
    expect(closed.timer).toBe(false);
    expect(run(closed, [move(0), move(100), { type: "key" }])).toBe(closed);
  });

  it("never hides a focused control and runs no timer after close, under every order of five events", async () => {
    const verdict = await explore(lightboxChrome, 5);
    expect(
      verdict.ok ? "holds" : `${verdict.broke}: ${verdict.path.join(" → ")}`,
    ).toBe("holds");
  });
});
