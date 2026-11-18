import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, type Page, test } from "@playwright/test";
import type { LightboxItem } from "/modules/lightbox/index.js";
import { mount, photo, swipe, tap } from "./harness";

type Lightbox = {
  next(): void;
  prev(): void;
  close(): Promise<void>;
  getState(): { index: number; chrome: string };
};
type Window = globalThis.Window & typeof globalThis & { lightbox: Lightbox };

// A stand-in for the YouTube player that keeps its state the way the iframe API reports it.
const youtubeStub = `<!doctype html><script>
window.playerState = -1; window.commands = [];
const reply = () => parent.postMessage(JSON.stringify({ event: "infoDelivery", info: { playerState } }), "*");
addEventListener("message", (event) => {
  const data = JSON.parse(event.data);
  if (data.event === "command") {
    commands.push(data.func);
    if (data.func === "playVideo") playerState = 1;
    if (data.func === "pauseVideo") playerState = 2;
  }
  reply();
});
</script>`;

async function setup(
  page: Page,
  items: string,
  options: Record<string, unknown> = {},
  start = 0,
  frame: { sandbox?: string } = {},
) {
  await page.route("https://www.youtube-nocookie.com/**", (route) =>
    route.fulfill({ contentType: "text/html", body: youtubeStub }),
  );
  await mount(
    page,
    '<meta name="viewport" content="width=device-width, initial-scale=1"><button id="open">Open</button>',
    ["lightbox/base.css", "lightbox/theme.css"],
  );
  await page.evaluate(
    async ([list, extra, index, image, frameOptions]) => {
      const { createLightbox } = await import("/modules/lightbox/index.js");
      const { video } = await import("/modules/lightbox/video.js");
      const { embed } = await import("/modules/lightbox/embed.js");
      const { iframe } = await import("/modules/lightbox/iframe.js");
      const providers = [
        {
          name: "videos",
          pattern: /^https:\/\/videos\.test\/(\w+)/,
          url: (match: RegExpExecArray) =>
            `https://player.videos.test/${match[1]}`,
        },
      ];
      // A short WebM recorded from a canvas, so the page needs no media file.
      const recorded = async () => {
        const canvas = document.createElement("canvas");
        canvas.width = 320;
        canvas.height = 180;
        const context = canvas.getContext("2d");
        const recorder = new MediaRecorder(canvas.captureStream(30));
        const chunks: Blob[] = [];
        recorder.ondataavailable = (event) => chunks.push(event.data);
        let hue = 0;
        const paint = setInterval(() => {
          if (!context) return;
          hue += 20;
          context.fillStyle = `hsl(${hue} 60% 50%)`;
          context.fillRect(0, 0, 320, 180);
        }, 33);
        recorder.start();
        await new Promise((resolve) => setTimeout(resolve, 3000));
        recorder.stop();
        await new Promise((resolve) => {
          recorder.onstop = resolve;
        });
        clearInterval(paint);
        return URL.createObjectURL(new Blob(chunks, { type: "video/webm" }));
      };
      const kinds: Record<string, () => Promise<LightboxItem>> = {
        photo: async () => ({ src: image, width: 1200, height: 800 }),
        web: async () => ({
          src: "https://cdn.test/photo.svg",
          width: 1200,
          height: 800,
        }),
        video: async () => ({
          type: "video",
          src: await recorded(),
        }),
        still: async () => ({ type: "video", src: "/missing.webm" }),
        slow: async () => ({ type: "video", src: "/slow.webm" }),
        youtube: async () => ({
          type: "embed",
          src: "https://www.youtube.com/watch?v=abc123&t=1m30s",
        }),
        script: async () => ({ type: "embed", src: "java\tscript:alert(1)" }),
        empty: async () => ({ type: "embed", src: "" }),
        shorts: async () => ({
          type: "embed",
          src: "https://www.youtube.com/shorts/abc123",
        }),
        unknown: async () => ({
          type: "embed",
          src: "https://evil.test/page",
        }),
        page: async () => ({ type: "iframe", src: "https://evil.test/page" }),
        local: async () => ({ type: "iframe", src: "/quick-view" }),
        registered: async () => ({
          type: "embed",
          src: "https://videos.test/abc123",
        }),
        frameScript: async () => ({
          type: "iframe",
          src: "java\tscript:alert(1)",
        }),
        frameShout: async () => ({
          type: "iframe",
          src: "JAVASCRIPT:alert(1)",
        }),
      };
      const items = await Promise.all(
        list.split(",").map((kind) => kinds[kind]()),
      );
      const lightbox = createLightbox({
        history: false,
        content: [
          video(),
          embed({ ...frameOptions, providers }),
          iframe(frameOptions),
        ],
        ...extra,
      });
      Object.assign(window, { lightbox });
      document
        .getElementById("open")
        ?.addEventListener("click", () => lightbox.open(items, index));
    },
    [items, options, start, photo(1), frame] as const,
  );
  await page.click("#open");
  await page.waitForTimeout(600);
}

const youtube = (page: Page) => {
  const frame = page
    .frames()
    .find((candidate) => candidate.url().includes("youtube-nocookie"));
  if (!frame) throw new Error("No player");
  return frame.evaluate(() => ({
    state: (window as unknown as { playerState: number }).playerState,
    commands: (window as unknown as { commands: string[] }).commands,
  }));
};

const step = (page: Page, direction: "next" | "prev") =>
  page.evaluate((name) => (window as Window).lightbox[name](), direction);

test("leaving a YouTube slide pauses it through the player API, and coming back does not start it again", async ({
  page,
}) => {
  await setup(page, "photo,youtube,photo");
  await step(page, "next");
  await expect.poll(async () => (await youtube(page)).state).toBe(1);
  const passed = await youtube(page);
  expect(
    passed.commands.filter((command) => command === "playVideo"),
  ).toHaveLength(1);
  await step(page, "next");
  await expect.poll(async () => (await youtube(page)).state).toBe(2);
  await step(page, "prev");
  await page.waitForTimeout(1500);
  const back = await youtube(page);
  expect(back.state).toBe(2);
  expect(
    back.commands.filter((command) => command === "playVideo"),
  ).toHaveLength(1);
});

test("the embed carries the link's own parameters and uses youtube-nocookie", async ({
  page,
}) => {
  await setup(page, "youtube");
  const src = await page
    .locator(".re-lightbox-media iframe")
    .getAttribute("src");
  const url = new URL(src ?? "");
  expect(url.origin).toBe("https://www.youtube-nocookie.com");
  expect(url.pathname).toBe("/embed/abc123");
  expect(url.searchParams.get("start")).toBe("90");
  expect(url.searchParams.get("enablejsapi")).toBe("1");
  const frame = page.locator(".re-lightbox-media iframe");
  await expect(frame).toHaveAttribute(
    "allow",
    "autoplay; fullscreen; picture-in-picture",
  );
  await expect(frame).toHaveAttribute(
    "referrerpolicy",
    "strict-origin-when-cross-origin",
  );
  await expect(frame).toHaveAttribute("loading", "lazy");
  await expect(frame).toHaveAttribute("sandbox", sandbox);
});

test("a frame loads only web pages: a script URL or an empty one stays blank", async ({
  page,
}) => {
  await setup(page, "script,empty,frameScript,frameShout", { preload: 2 }, 1);
  await expect(page.locator(".re-lightbox-media iframe")).toHaveCount(4);
  expect(
    await page
      .locator(".re-lightbox-media iframe")
      .evaluateAll((frames) =>
        frames.map((frame) => frame.getAttribute("src")),
      ),
  ).toEqual(["about:blank", "about:blank", "about:blank", "about:blank"]);
});

// A page that tries to take over the tab that frames it.
const takeover = `<!doctype html><button id="go" style="width:100%;height:100%">Continue</button><script>
document.getElementById("go").onclick = () => { top.location.href = "https://evil.test/phish"; };
</script>`;

// Popups keep the frame's sandbox, so a popup cannot navigate the tab either.
const sandbox =
  "allow-scripts allow-same-origin allow-forms allow-presentation allow-popups";

// A page that opens a popup, and the popup tries to take over the tab behind the frame.
const popupTakeover = `<!doctype html><button id="go" style="width:100%;height:100%">Continue</button><script>
document.getElementById("go").onclick = () => { open("https://evil.test/popup"); };
</script>`;
const popup = `<!doctype html><script>
try { opener.top.location.href = "https://evil.test/phish"; } catch {}
document.title = "tried";
</script>`;

const frameOf = (page: Page) =>
  page.locator(".re-lightbox-media iframe").evaluate((frame) => ({
    src: frame.getAttribute("src"),
    sandbox: frame.getAttribute("sandbox"),
  }));

test("embed plays only known providers: an unknown page stays blank", async ({
  page,
}) => {
  await page.route("https://evil.test/**", (route) =>
    route.fulfill({ contentType: "text/html", body: takeover }),
  );
  await setup(page, "unknown");
  expect(await frameOf(page)).toEqual({ src: "about:blank", sandbox: null });
});

test("an iframe sandboxes a page from another origin, so a click inside cannot navigate the tab", async ({
  page,
}) => {
  await page.route("https://evil.test/**", (route) =>
    route.fulfill({ contentType: "text/html", body: takeover }),
  );
  await setup(page, "page");
  expect(await frameOf(page)).toEqual({
    src: "https://evil.test/page",
    sandbox,
  });
  await page.frameLocator(".re-lightbox-media iframe").locator("#go").click();
  await page.waitForTimeout(500);
  expect(page.url()).toBe("http://reuse.test/");
});

test("a popup from a sandboxed frame keeps the sandbox, so it cannot navigate the tab @desktop", async ({
  page,
}) => {
  await page.route("https://evil.test/page", (route) =>
    route.fulfill({ contentType: "text/html", body: popupTakeover }),
  );
  await page
    .context()
    .route("https://evil.test/popup", (route) =>
      route.fulfill({ contentType: "text/html", body: popup }),
    );
  await page
    .context()
    .route("https://evil.test/phish", (route) =>
      route.fulfill({ contentType: "text/html", body: "Phish" }),
    );
  await setup(page, "page");
  const opened = page.context().waitForEvent("page");
  await page.frameLocator(".re-lightbox-media iframe").locator("#go").click();
  const tab = await opened;
  await expect(tab).toHaveTitle("tried");
  await page.waitForTimeout(500);
  expect(page.url()).toBe("http://reuse.test/");
});

test("a provider passed to embed() is sandboxed too, so a click inside cannot navigate the tab", async ({
  page,
}) => {
  await page.route("https://player.videos.test/**", (route) =>
    route.fulfill({ contentType: "text/html", body: takeover }),
  );
  await setup(page, "registered");
  expect(await frameOf(page)).toEqual({
    src: "https://player.videos.test/abc123",
    sandbox,
  });
  await page.frameLocator(".re-lightbox-media iframe").locator("#go").click();
  await page.waitForTimeout(500);
  expect(page.url()).toBe("http://reuse.test/");
});

test("an iframe leaves a same-origin page unsandboxed, and the sandbox option wins", async ({
  page,
}) => {
  await setup(page, "local");
  expect(await frameOf(page)).toEqual({
    src: "http://reuse.test/quick-view",
    sandbox: null,
  });
  await setup(page, "local,page,registered", { preload: 2 }, 0, {
    sandbox: "allow-scripts",
  });
  expect(
    await page
      .locator(".re-lightbox-media iframe")
      .evaluateAll((frames) =>
        frames.map((frame) => frame.getAttribute("sandbox")),
      ),
  ).toEqual(["allow-scripts", "allow-scripts", "allow-scripts"]);
});

test("a Shorts link opens at 9:16", async ({ page }) => {
  await setup(page, "shorts");
  const box = await page
    .locator('.re-lightbox-slide[aria-hidden="false"] .re-lightbox-frame')
    .boundingBox();
  if (!box) throw new Error("No frame");
  expect(box.width / box.height).toBeCloseTo(9 / 16, 2);
  expect(box.height).toBeGreaterThan(600);
});

test("closing during a playing video pauses it at once and removes it", async ({
  page,
}) => {
  await setup(page, "video");
  await expect
    .poll(() => page.evaluate(() => document.querySelector("video")?.paused))
    .toBe(false);
  const paused = await page.evaluate(() => {
    const video = document.querySelector("video");
    void (window as Window).lightbox.close();
    return video?.paused;
  });
  expect(paused).toBe(true);
  await expect(page.locator("video")).toHaveCount(0);
});

test("leaving a video before its first frame neither unmutes nor plays it", async ({
  page,
}) => {
  await page.route("http://reuse.test/slow.webm", () => {});
  await setup(page, "photo,slow,photo", {}, 0);
  await step(page, "next");
  await page.waitForTimeout(100);
  await step(page, "next");
  await page.waitForTimeout(500);
  expect(
    await page.evaluate(() => {
      const video = document.querySelector("video");
      return { paused: video?.paused, muted: video?.muted };
    }),
  ).toEqual({ paused: true, muted: false });
});

const watchChanges = (page: Page) =>
  page.evaluate(() => {
    const changes: number[] = [];
    (
      window as unknown as {
        lightbox: {
          on(type: string, listener: (event: { index: number }) => void): void;
        };
      }
    ).lightbox.on("change", (event) => changes.push(event.index));
    Object.assign(window, { changes });
  });

const changes = (page: Page) =>
  page.evaluate(() => (window as unknown as { changes: number[] }).changes);

test("a slideshow holds while the video plays and goes on once it pauses", async ({
  page,
}) => {
  await setup(page, "video,photo,photo", {
    controls: { slideshow: true },
    slideshow: { interval: 300 },
  });
  await expect
    .poll(() => page.evaluate(() => document.querySelector("video")?.paused))
    .toBe(false);
  await watchChanges(page);
  await page.mouse.move(500, 350);
  await page
    .locator(".re-lightbox-slideshow")
    .evaluate((button: HTMLElement) => button.click());
  await page.waitForTimeout(900);
  expect(await changes(page)).toEqual([]);
  await page.evaluate(() => document.querySelector("video")?.pause());
  await expect.poll(() => changes(page)).toEqual([1]);
});

test("a slideshow moves on as soon as the video ends", async ({ page }) => {
  await setup(page, "video,photo,photo", {
    controls: { slideshow: true },
    slideshow: { interval: 20_000 },
  });
  await expect
    .poll(() => page.evaluate(() => document.querySelector("video")?.paused))
    .toBe(false);
  await watchChanges(page);
  await page.mouse.move(500, 350);
  await page
    .locator(".re-lightbox-slideshow")
    .evaluate((button: HTMLElement) => button.click());
  const sinceEnd = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let ended = Number.NaN;
        document.addEventListener(
          "ended",
          () => {
            ended = performance.now();
          },
          { capture: true, once: true },
        );
        (
          window as unknown as {
            lightbox: { on(type: string, listener: () => void): void };
          }
        ).lightbox.on("change", () => resolve(performance.now() - ended));
      }),
  );
  expect(sinceEnd).toBeLessThan(500);
  expect(await changes(page)).toEqual([1]);
});

test("a slideshow paused by a playing video goes on with the time it had left", async ({
  page,
}) => {
  await setup(page, "video,photo,photo", {
    controls: { slideshow: true },
    slideshow: { interval: 1200 },
  });
  await expect
    .poll(() => page.evaluate(() => document.querySelector("video")?.paused))
    .toBe(false);
  await page.evaluate(() => document.querySelector("video")?.pause());
  await watchChanges(page);
  await page.mouse.move(500, 350);
  await page
    .locator(".re-lightbox-slideshow")
    .evaluate((button: HTMLElement) => button.click());
  await page.waitForTimeout(800);
  await page.evaluate(() => document.querySelector("video")?.play());
  await page.waitForTimeout(1500);
  expect(await changes(page)).toEqual([]);
  const sincePause = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        const paused = performance.now();
        (
          window as unknown as {
            lightbox: { on(type: string, listener: () => void): void };
          }
        ).lightbox.on("change", () => resolve(performance.now() - paused));
        document.querySelector("video")?.pause();
      }),
  );
  expect(sincePause).toBeGreaterThan(200);
  expect(sincePause).toBeLessThan(800);
});

test("a slideshow holds on an embed until the visitor pages", async ({
  page,
}) => {
  await setup(page, "youtube,photo,photo", {
    controls: { slideshow: true },
    slideshow: { interval: 300 },
  });
  await watchChanges(page);
  await page.mouse.move(500, 350);
  await page
    .locator(".re-lightbox-slideshow")
    .evaluate((button: HTMLElement) => button.click());
  await page.waitForTimeout(900);
  expect(await changes(page)).toEqual([]);
  await step(page, "next");
  await expect.poll(() => changes(page)).toEqual([1, 2]);
});

test("with autoplayMedia off the video waits for a press", async ({ page }) => {
  await setup(page, "video", { autoplayMedia: false });
  await page.waitForTimeout(800);
  expect(
    await page.evaluate(() => document.querySelector("video")?.paused),
  ).toBe(true);
});

test("a media slide hides zoom and download", async ({ page }) => {
  await page.route("https://cdn.test/photo.svg", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: decodeURIComponent(photo(1).split(",")[1]),
    }),
  );
  await setup(page, "web,still", { controls: { download: true } });
  await expect(page.locator(".re-lightbox-zoom")).toBeVisible();
  await expect(page.locator(".re-lightbox-download")).toBeVisible();
  await step(page, "next");
  await expect(page.locator(".re-lightbox-zoom")).toBeHidden();
  await expect(page.locator(".re-lightbox-download")).toBeHidden();
});

test("the core build carries no YouTube or video code", async () => {
  const core = await readFile(
    join(
      import.meta.dirname,
      "../../packages/lightbox/dist/browser/lightbox.js",
    ),
    "utf8",
  );
  expect(core).not.toMatch(/youtube/i);
  expect(core).not.toMatch(/createElement\(["'`]video["'`]\)/);
});

test.describe("touch @touch", () => {
  test("a swipe from the left 20px leaves the video, while one over the player does not page", async ({
    page,
    browserName,
  }) => {
    // WebKit does not scroll natively for synthesized touches.
    test.skip(browserName === "webkit", "needs native touch scrolling");
    await setup(page, "photo,still,photo", {}, 1);
    await swipe(page, { x: 200, y: 420 }, { x: 380, y: 420 }, { speed: 1 });
    await page.waitForTimeout(700);
    expect(
      await page.evaluate(() => (window as Window).lightbox.getState().index),
    ).toBe(1);
    await swipe(page, { x: 20, y: 420 }, { x: 300, y: 420 }, { speed: 1 });
    await expect
      .poll(() =>
        page.evaluate(() => (window as Window).lightbox.getState().index),
      )
      .toBe(0);
  });

  test("a tap on the player leaves the controls as they are", async ({
    page,
  }) => {
    await setup(page, "still");
    await tap(page, { x: 195, y: 422 });
    await page.waitForTimeout(500);
    expect(
      await page.evaluate(() => (window as Window).lightbox.getState().chrome),
    ).toBe("shown");
  });
});

test("a carousel inside an HTML slide keeps the carousel's own gap and slide width", async ({
  page,
}) => {
  await mount(page, "", [
    "lightbox/base.css",
    "lightbox/theme.css",
    "carousel/styles.css",
  ]);
  const layout = await page.evaluate(async () => {
    const { createLightbox } = await import("/modules/lightbox/index.js");
    const { html } = await import("/modules/lightbox/html.js");
    const { createCarousel } = await import("/modules/carousel/index.js");
    const strip = document.createElement("div");
    strip.style.width = "400px";
    for (let i = 0; i < 3; i++)
      strip.append(
        Object.assign(document.createElement("div"), {
          textContent: String(i),
        }),
      );
    const lightbox = createLightbox({ history: false, content: [html()] });
    lightbox.open([{ type: "html", html: () => strip }]);
    createCarousel(strip);
    const [first, second] = [...strip.children] as HTMLElement[];
    return {
      width: first.offsetWidth,
      gap: second.offsetLeft - first.offsetLeft - first.offsetWidth,
    };
  });
  expect(layout).toEqual({ width: 400, gap: 16 });
});
