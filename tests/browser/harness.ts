import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import type { Page } from "@playwright/test";

const root = join(import.meta.dirname, "../..");
const types: Record<string, string> = {
  ".js": "text/javascript",
  ".css": "text/css",
};

// Serves the built packages at /modules/<package>/<file>, the way a plain page would load them.
export async function mount(
  page: Page,
  body: string,
  styles: string[] = [],
  origin = "http://reuse.test",
) {
  await page.route(`${origin}/**`, async (route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/") {
      await route.fulfill({
        contentType: "text/html",
        body: `<!doctype html><html><head><meta charset="utf-8">
<script type="importmap">{"imports":{
  "@reuse-sh/carousel":"/modules/carousel/index.js",
  "@reuse-sh/annotations":"/modules/annotations/index.js",
  "@reuse-sh/avatars":"/modules/avatars/index.js",
  "@reuse-sh/interactions":"/modules/interactions/index.js",
  "@reuse-sh/loaders":"/modules/loaders/index.js",
  "@reuse-sh/gradients":"/modules/gradients/index.js",
  "@reuse-sh/lightbox":"/modules/lightbox/index.js",
  "@reuse-sh/gallery":"/modules/gallery/index.js",
  "@reuse-sh/core/escape-html":"/modules/core/escape-html.js"
}}</script>
${styles.map((href) => `<link rel="stylesheet" href="/modules/${href}">`).join("")}
<style>body{margin:0}</style></head><body>${body}</body></html>`,
      });
      return;
    }
    const match = /^\/modules\/([a-z-]+)\/(.+)$/.exec(pathname);
    if (!match) return route.fulfill({ status: 404 });
    const file = normalize(join(root, "packages", match[1], "dist", match[2]));
    if (!file.startsWith(join(root, "packages")))
      return route.fulfill({ status: 404 });
    await route.fulfill({
      contentType: types[extname(file)] ?? "application/octet-stream",
      body: await readFile(file),
    });
  });
  await page.goto(`${origin}/`);
}

// Samples a numeric expression on every animation frame until it stays unchanged for `idle` ms.
export async function framesUntilIdle(
  page: Page,
  expression: string,
  idle = 300,
): Promise<number[]> {
  return page.evaluate(
    ([source, quiet]) =>
      new Promise<number[]>((resolve) => {
        const read = new Function(`return (${source})`) as () => number;
        const values: number[] = [];
        let changed = performance.now();
        const tick = () => {
          const value = read();
          if (values.at(-1) !== value) {
            values.push(value);
            changed = performance.now();
          }
          if (performance.now() - changed > quiet) resolve(values);
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
    [expression, idle] as const,
  );
}

export function photo(index: number) {
  const hue = (index * 47) % 360;
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="hsl(${hue} 60% 55%)"/></svg>`,
  )}`;
}

export type Point = { x: number; y: number };

// WebKit reports no maxTouchPoints under touch emulation, so ask for a coarse pointer instead.
async function hasTouch(page: Page) {
  return page.evaluate(() => matchMedia("(pointer: coarse)").matches);
}

function isChromium(page: Page) {
  return page.context().browser()?.browserType().name() === "chromium";
}

type TouchPhase = "start" | "move" | "end" | "cancel";

async function synthesizeTouches(
  page: Page,
  type: TouchPhase,
  points: Point[],
  time?: number,
) {
  await page.evaluate(
    ([phase, fingers, due]) => {
      // WebKit throws when a page captures a synthesized pointer, which a real finger never does.
      const capture = Element.prototype.setPointerCapture;
      if (!("synthesized" in capture))
        Element.prototype.setPointerCapture = Object.assign(
          function (this: Element, id: number) {
            try {
              capture.call(this, id);
            } catch {}
          },
          { synthesized: true },
        );
      const pointer = {
        start: "pointerdown",
        move: "pointermove",
        end: "pointerup",
        cancel: "pointercancel",
      }[phase];
      const touch = {
        start: "touchstart",
        move: "touchmove",
        end: "touchend",
        cancel: "touchcancel",
      }[phase];
      const target = document.elementFromPoint(fingers[0].x, fingers[0].y);
      if (!target) return;
      const stamped = <T extends Event>(event: T) => {
        if (due !== undefined)
          Object.defineProperty(event, "timeStamp", {
            value: due - performance.timeOrigin,
          });
        return event;
      };
      let touches: Touch[] = [];
      try {
        touches = fingers.map(
          (finger, identifier) =>
            new Touch({
              identifier,
              target,
              clientX: finger.x,
              clientY: finger.y,
            }),
        );
      } catch {
        // WebKit has no Touch constructor; its pages get the pointer events alone.
      }
      fingers.forEach((finger, index) => {
        target.dispatchEvent(
          stamped(
            new PointerEvent(pointer, {
              bubbles: true,
              cancelable: true,
              composed: true,
              pointerId: 100 + index,
              pointerType: "touch",
              isPrimary: index === 0,
              clientX: finger.x,
              clientY: finger.y,
              buttons: phase === "end" || phase === "cancel" ? 0 : 1,
            }),
          ),
        );
      });
      if (touches.length > 0)
        target.dispatchEvent(
          stamped(
            new TouchEvent(touch, {
              bubbles: true,
              cancelable: true,
              composed: true,
              touches: phase === "end" || phase === "cancel" ? [] : touches,
              targetTouches:
                phase === "end" || phase === "cancel" ? [] : touches,
              changedTouches: touches,
            }),
          ),
        );
    },
    [type, points, time] as const,
  );
}

// Steps follow the clock because some engines' input calls take longer than a frame.
async function* timeline(page: Page, duration: number) {
  yield 0;
  const start = Date.now();
  for (let share = 0; share < 1; ) {
    await page.waitForTimeout(16);
    share = Math.min(1, (Date.now() - start) / duration);
    yield share;
  }
}

// Only CDP touches are trusted, and browsers scroll natively only for trusted input.
async function touchPath(
  page: Page,
  duration: number,
  at: (share: number) => Point[],
  hold: number,
  last: "end" | "cancel" = "end",
) {
  const cdp = isChromium(page)
    ? await page.context().newCDPSession(page)
    : undefined;
  // A busy machine delivers input late, so each touch carries the time its point was due.
  const start = Date.now();
  const send = async (phase: TouchPhase, points: Point[], due: number) => {
    if (!cdp) return synthesizeTouches(page, phase, points, start + due);
    const type = {
      start: "touchStart",
      move: "touchMove",
      end: "touchEnd",
      cancel: "touchCancel",
    } as const;
    await cdp.send("Input.dispatchTouchEvent", {
      type: type[phase],
      timestamp: (start + due) / 1000,
      touchPoints:
        phase === "end" || phase === "cancel"
          ? []
          : points.map((point, id) => ({ ...point, id })),
    });
  };
  for await (const share of timeline(page, duration))
    await send(share === 0 ? "start" : "move", at(share), share * duration);
  if (hold > 0) await page.waitForTimeout(hold);
  await send(last, at(1), duration + hold);
  await cdp?.detach();
}

// Taps in one input session, so a double tap stays inside its time window.
export async function tap(
  page: Page,
  point: Point,
  { count = 1, gap = 60 }: { count?: number; gap?: number } = {},
) {
  const cdp = isChromium(page)
    ? await page.context().newCDPSession(page)
    : undefined;
  for (let index = 0; index < count; index++) {
    if (index > 0) await page.waitForTimeout(gap);
    for (const phase of ["start", "end"] as const) {
      if (!cdp) await synthesizeTouches(page, phase, [point]);
      else
        await cdp.send("Input.dispatchTouchEvent", {
          type: phase === "start" ? "touchStart" : "touchEnd",
          touchPoints: phase === "start" ? [{ ...point, id: 0 }] : [],
        });
    }
  }
  await cdp?.detach();
}

export async function swipe(
  page: Page,
  from: Point,
  to: Point,
  {
    speed = 1,
    hold = 0,
    cancel = false,
  }: { speed?: number; hold?: number; cancel?: boolean } = {},
) {
  const duration = Math.hypot(to.x - from.x, to.y - from.y) / speed;
  const at = (share: number): Point => ({
    x: from.x + (to.x - from.x) * share,
    y: from.y + (to.y - from.y) * share,
  });
  if (await hasTouch(page)) {
    await touchPath(
      page,
      duration,
      (share) => [at(share)],
      hold,
      cancel ? "cancel" : "end",
    );
    return;
  }
  for await (const share of timeline(page, duration)) {
    const point = at(share);
    await page.mouse.move(point.x, point.y);
    if (share === 0) await page.mouse.down();
  }
  if (hold > 0) await page.waitForTimeout(hold);
  await page.mouse.up();
}

export async function pinch(
  page: Page,
  center: Point,
  { from, to, duration = 160 }: { from: number; to: number; duration?: number },
) {
  await touchPath(
    page,
    duration,
    (share) => {
      const gap = from + (to - from) * share;
      return [
        { x: center.x - gap / 2, y: center.y },
        { x: center.x + gap / 2, y: center.y },
      ];
    },
    0,
  );
}

// Browsers report a trackpad pinch as a wheel event with ctrlKey set.
export async function ctrlWheel(page: Page, point: Point, deltaY: number) {
  if (await hasTouch(page)) {
    await page.evaluate(
      ([at, delta]) =>
        document.elementFromPoint(at.x, at.y)?.dispatchEvent(
          new WheelEvent("wheel", {
            bubbles: true,
            cancelable: true,
            ctrlKey: true,
            clientX: at.x,
            clientY: at.y,
            deltaY: delta,
          }),
        ),
      [point, deltaY] as const,
    );
    return;
  }
  await page.mouse.move(point.x, point.y);
  await page.keyboard.down("Control");
  await page.mouse.wheel(0, deltaY);
  await page.keyboard.up("Control");
}

// Safari reports a trackpad pinch as gesture events; plain events carry their fields here.
export async function safariPinch(
  page: Page,
  point: Point,
  { scale, steps = 10 }: { scale: number; steps?: number },
) {
  for (let step = 0; step <= steps + 1; step++) {
    const type =
      step === 0
        ? "gesturestart"
        : step > steps
          ? "gestureend"
          : "gesturechange";
    const current = 1 + ((scale - 1) * Math.min(step, steps)) / steps;
    await page.evaluate(
      ([name, at, value]) => {
        const event = new Event(name, { bubbles: true, cancelable: true });
        Object.defineProperties(event, {
          scale: { value },
          rotation: { value: 0 },
          clientX: { value: at.x },
          clientY: { value: at.y },
        });
        document.elementFromPoint(at.x, at.y)?.dispatchEvent(event);
      },
      [type, point, current] as const,
    );
    if (step <= steps) await page.waitForTimeout(16);
  }
}

export type LayoutReads = {
  total: number;
  insideListener: Record<string, number>;
  eventsHandled: Record<string, number>;
};

// Call before mount: it wraps listeners as the page adds them.
export async function countLayoutReads(page: Page) {
  await page.addInitScript(() => {
    const watched = new Set(["pointermove", "wheel", "scroll"]);
    const reads = {
      total: 0,
      insideListener: {} as Record<string, number>,
      eventsHandled: {} as Record<string, number>,
    };
    const seen = new WeakSet<Event>();
    let current: string | undefined;
    const counted = <T extends (...args: never[]) => unknown>(read: T) =>
      function (this: unknown, ...args: Parameters<T>) {
        reads.total++;
        if (current)
          reads.insideListener[current] =
            (reads.insideListener[current] ?? 0) + 1;
        return read.apply(this, args);
      };
    Element.prototype.getBoundingClientRect = counted(
      Element.prototype.getBoundingClientRect,
    );
    window.getComputedStyle = counted(window.getComputedStyle);
    const wrappers = new WeakMap<object, Map<string, EventListener>>();
    const wrapperOf = (
      type: string,
      listener: EventListenerOrEventListenerObject,
    ) => {
      const byType = wrappers.get(listener) ?? new Map<string, EventListener>();
      wrappers.set(listener, byType);
      let wrapper = byType.get(type);
      if (!wrapper) {
        wrapper = function (this: unknown, event: Event) {
          if (!seen.has(event)) {
            seen.add(event);
            reads.eventsHandled[type] = (reads.eventsHandled[type] ?? 0) + 1;
          }
          const outer = current;
          current = type;
          try {
            return typeof listener === "function"
              ? listener.call(this, event)
              : listener.handleEvent(event);
          } finally {
            current = outer;
          }
        };
        byType.set(type, wrapper);
      }
      return wrapper;
    };
    const add = EventTarget.prototype.addEventListener;
    const remove = EventTarget.prototype.removeEventListener;
    EventTarget.prototype.addEventListener = function (
      type,
      listener,
      options,
    ) {
      if (!listener || !watched.has(type))
        return add.call(this, type, listener, options);
      return add.call(this, type, wrapperOf(type, listener), options);
    };
    EventTarget.prototype.removeEventListener = function (
      type,
      listener,
      options,
    ) {
      if (!listener || !watched.has(type))
        return remove.call(this, type, listener, options);
      return remove.call(this, type, wrapperOf(type, listener), options);
    };
    Object.assign(window, { __layoutReads: reads });
  });
  return {
    read: () =>
      page.evaluate(() =>
        structuredClone(
          (window as unknown as { __layoutReads: LayoutReads }).__layoutReads,
        ),
      ),
  };
}

export async function recordFrames(page: Page) {
  await page.evaluate(() => {
    const record = {
      frames: [] as number[],
      longTasks: [] as number[],
      on: true,
    };
    let last: number | undefined;
    const tick = (time: number) => {
      if (last !== undefined) record.frames.push(time - last);
      last = time;
      if (record.on) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    if (PerformanceObserver.supportedEntryTypes.includes("longtask"))
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries())
          record.longTasks.push(entry.duration);
      }).observe({ type: "longtask" });
    Object.assign(window, { __frames: record });
  });
  return {
    stop: () =>
      page.evaluate(() => {
        const record = (
          window as unknown as {
            __frames: { frames: number[]; longTasks: number[]; on: boolean };
          }
        ).__frames;
        record.on = false;
        return { frames: record.frames, longTasks: record.longTasks };
      }),
  };
}

type TraceEvent = {
  name: string;
  ph: string;
  pid: number;
  tid: number;
  tdur?: number;
  args?: { name?: string };
};

// A busy runner stretches frames and tasks by wall time, so this reads the CPU time each
// task took on the page's main thread from a Chromium trace.
export async function traceMainThread(page: Page) {
  const browser = page.context().browser();
  if (!browser) throw new Error("Tracing needs a browser");
  await browser.startTracing(page, {
    categories: ["disabled-by-default-devtools.timeline"],
  });
  return {
    stop: async () => {
      const { traceEvents } = JSON.parse(
        (await browser.stopTracing()).toString(),
      ) as { traceEvents: TraceEvent[] };
      const main = new Set(
        traceEvents
          .filter(
            (event) =>
              event.name === "thread_name" &&
              event.args?.name === "CrRendererMain",
          )
          .map((event) => `${event.pid}:${event.tid}`),
      );
      return traceEvents.flatMap((event) =>
        event.ph === "X" &&
        event.name === "RunTask" &&
        event.tdur !== undefined &&
        main.has(`${event.pid}:${event.tid}`)
          ? [event.tdur / 1000]
          : [],
      );
    },
  };
}

// Call before mount, so the page's first frame already runs on the fixed interval.
export async function frameInterval(page: Page, interval: number) {
  await page.addInitScript((ms) => {
    const queue = new Map<number, FrameRequestCallback>();
    let id = 0;
    let pending = false;
    let next = performance.now() + ms;
    const flush = () => {
      pending = false;
      const time = performance.now();
      next = time + ms;
      const callbacks = [...queue.values()];
      queue.clear();
      for (const callback of callbacks) callback(time);
      if (queue.size > 0) schedule();
    };
    const schedule = () => {
      if (pending) return;
      pending = true;
      setTimeout(flush, Math.max(0, next - performance.now()));
    };
    window.requestAnimationFrame = (callback) => {
      queue.set(++id, callback);
      schedule();
      return id;
    };
    window.cancelAnimationFrame = (handle) => {
      queue.delete(handle);
    };
  }, interval);
}
