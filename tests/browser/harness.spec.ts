import { expect, type Page, test } from "@playwright/test";
import {
  countLayoutReads,
  ctrlWheel,
  mount,
  pinch,
  recordFrames,
  safariPinch,
  swipe,
} from "./harness";

type Seen = {
  type: string;
  id: number;
  kind: string;
  x: number;
  y: number;
  time: number;
  ctrl?: boolean;
  delta?: number;
  scale?: number;
};

async function recordingPad(page: Page) {
  await mount(
    page,
    `<div id="pad" style="position:fixed;inset:0;touch-action:none"></div>`,
  );
  await page.evaluate(() => {
    const seen: Seen[] = [];
    const pad = document.getElementById("pad") as HTMLElement;
    for (const type of ["pointerdown", "pointermove", "pointerup"])
      pad.addEventListener(type, (event) => {
        const pointer = event as PointerEvent;
        seen.push({
          type,
          id: pointer.pointerId,
          kind: pointer.pointerType,
          x: pointer.clientX,
          y: pointer.clientY,
          time: event.timeStamp,
        });
      });
    pad.addEventListener(
      "wheel",
      (event) => {
        event.preventDefault();
        seen.push({
          type: "wheel",
          id: 0,
          kind: "wheel",
          x: event.clientX,
          y: event.clientY,
          time: event.timeStamp,
          ctrl: event.ctrlKey,
          delta: event.deltaY,
        });
      },
      { passive: false },
    );
    for (const type of ["gesturestart", "gesturechange", "gestureend"])
      pad.addEventListener(type, (event) => {
        const gesture = event as Event & {
          scale: number;
          clientX: number;
          clientY: number;
        };
        seen.push({
          type,
          id: 0,
          kind: "gesture",
          x: gesture.clientX,
          y: gesture.clientY,
          time: event.timeStamp,
          scale: gesture.scale,
        });
      });
    Object.assign(window, { seen });
  });
  return () =>
    page.evaluate(() => (window as unknown as { seen: Seen[] }).seen);
}

test.describe("harness", { tag: ["@touch", "@desktop"] }, () => {
  test("swipe moves at the asked speed and holds before release", async ({
    page,
  }) => {
    const seen = await recordingPad(page);
    const touch = await page.evaluate(
      () => matchMedia("(pointer: coarse)").matches,
    );
    await swipe(
      page,
      { x: 300, y: 200 },
      { x: 60, y: 200 },
      {
        speed: 1,
        hold: 120,
      },
    );
    const events = await seen();
    const down = events.find((event) => event.type === "pointerdown");
    const moves = events.filter((event) => event.type === "pointermove");
    const up = events.find((event) => event.type === "pointerup");
    expect(down?.kind).toBe(touch ? "touch" : "mouse");
    expect(down?.x).toBeCloseTo(300, 0);
    expect(moves.at(-1)?.x).toBeCloseTo(60, 0);
    const travel = (moves.at(-1)?.time ?? 0) - (down?.time ?? 0);
    expect(240 / travel).toBeGreaterThan(0.5);
    expect(240 / travel).toBeLessThan(1.5);
    expect((up?.time ?? 0) - (moves.at(-1)?.time ?? 0)).toBeGreaterThan(100);
  });

  test("pinch moves two fingers apart around the center", async ({ page }) => {
    const seen = await recordingPad(page);
    test.skip(
      !(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)),
      "A desktop pinch is a trackpad, which ctrlWheel and safariPinch cover.",
    );
    await pinch(page, { x: 195, y: 300 }, { from: 100, to: 300 });
    const events = await seen();
    const ids = new Set(
      events.filter((event) => event.type === "pointerdown").map((e) => e.id),
    );
    expect(ids.size).toBe(2);
    const last = [...ids].map(
      (id) =>
        events.filter((e) => e.type === "pointermove" && e.id === id).at(-1)
          ?.x ?? 0,
    );
    expect(Math.abs(last[0] - last[1])).toBeCloseTo(300, 0);
  });

  test("ctrlWheel reports a wheel with ctrlKey", async ({ page }) => {
    const seen = await recordingPad(page);
    await ctrlWheel(page, { x: 200, y: 200 }, -40);
    const wheel = (await seen()).find((event) => event.type === "wheel");
    expect(wheel?.ctrl).toBe(true);
    expect(wheel?.delta).toBeLessThan(0);
  });

  test("safariPinch reports Safari's gesture events up to the scale", async ({
    page,
  }) => {
    const seen = await recordingPad(page);
    await safariPinch(page, { x: 200, y: 200 }, { scale: 2 });
    const events = await seen();
    expect(events[0].type).toBe("gesturestart");
    expect(events.at(-1)?.type).toBe("gestureend");
    expect(events.at(-1)?.scale).toBe(2);
  });

  test("countLayoutReads counts reads inside a pointer move listener only", async ({
    page,
  }) => {
    const reads = await countLayoutReads(page);
    await recordingPad(page);
    await page.evaluate(() => {
      const pad = document.getElementById("pad") as HTMLElement;
      pad.addEventListener("pointermove", () => pad.getBoundingClientRect());
      getComputedStyle(pad);
    });
    await swipe(page, { x: 300, y: 200 }, { x: 200, y: 200 });
    const { total, insideListener, eventsHandled } = await reads.read();
    expect(eventsHandled.pointermove).toBeGreaterThan(0);
    expect(insideListener.pointermove).toBe(eventsHandled.pointermove);
    expect(total).toBe(eventsHandled.pointermove + 1);
  });

  test("recordFrames records frame durations", async ({ page }) => {
    await mount(page, "");
    const recording = await recordFrames(page);
    await page.waitForTimeout(300);
    const { frames } = await recording.stop();
    expect(frames.length).toBeGreaterThan(5);
    expect(frames.every((frame) => frame > 0)).toBe(true);
  });
});
